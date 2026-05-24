import { Injectable, computed, inject } from '@angular/core';

import { CustomersService } from '../../customers/data-access/customers.service';
import { VehicleFormValue, VehicleListItem } from '../models/vehicle.model';
import { supabase } from '../../../core/supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  private readonly customersService = inject(CustomersService);

  readonly vehicles = computed<VehicleListItem[]>(() =>
    this.customersService.customers().flatMap((customer) =>
      customer.vehicles.map((vehicle) => ({
        ...vehicle,
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        customerDocument: customer.documentNumber,
        registeredAt: customer.registeredAt,
      })),
    ),
  );

  async createVehicle(formValue: VehicleFormValue): Promise<void> {
    await this.customersService.addVehicleToCustomer(formValue.customerId, {
      plateNumber: formValue.plateNumber,
      brand: formValue.brand,
      model: formValue.model,
      year: formValue.year ?? null,
      color: formValue.color,
      vin: formValue.vin,
      mileage: formValue.mileage ?? null,
      observations: formValue.observations,
    });
  }

  async updateVehicle(
    vehicleId: string,
    formValue: VehicleFormValue,
  ): Promise<void> {
    const currentVehicle = this.findVehicleOwner(vehicleId);

    if (!currentVehicle) {
      throw new Error('No se encontró el vehículo seleccionado.');
    }

    const { error } = await supabase
      .from('vehicles')
      .update({
        customer_id: formValue.customerId,
        plate_number: this.normalizePlate(formValue.plateNumber),
        brand: formValue.brand?.trim() || 'Sin marca',
        model: formValue.model?.trim() || 'Sin modelo',
        year: formValue.year ?? null,
        color: formValue.color?.trim() || null,
        vin: formValue.vin?.trim() || null,
        mileage: formValue.mileage ?? null,
        observations: formValue.observations?.trim() || null,
      })
      .eq('id', vehicleId);

    if (error) {
      throw new Error(error.message);
    }

    await this.syncVehicleSnapshots(vehicleId, formValue);
    await this.customersService.loadCustomers();
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    const currentVehicle = this.findVehicleOwner(vehicleId);

    if (!currentVehicle) {
      throw new Error('No se encontró el vehículo seleccionado.');
    }

    await this.customersService.deleteVehicleFromCustomer(
      currentVehicle.customerId,
      vehicleId,
    );
  }

  private async syncVehicleSnapshots(
    vehicleId: string,
    formValue: VehicleFormValue,
  ): Promise<void> {
    const plateNumber = this.normalizePlate(formValue.plateNumber);
    const brand = formValue.brand?.trim() || 'Sin marca';
    const model = formValue.model?.trim() || 'Sin modelo';

    const { error: workOrdersError } = await supabase
      .from('work_orders')
      .update({
        vehicle_plate_snapshot: plateNumber,
        vehicle_brand_snapshot: brand,
        vehicle_model_snapshot: model,
      })
      .eq('vehicle_id', vehicleId);

    if (workOrdersError) {
      throw new Error(workOrdersError.message);
    }

    const { error: intakesError } = await supabase
      .from('vehicle_intakes')
      .update({
        vehicle_plate_snapshot: plateNumber,
        vehicle_brand_snapshot: brand,
        vehicle_model_snapshot: model,
        vehicle_year_snapshot: formValue.year ?? null,
        vehicle_color_snapshot: formValue.color?.trim() || null,
        vehicle_mileage_snapshot: formValue.mileage ?? null,
      })
      .eq('vehicle_id', vehicleId);

    if (intakesError) {
      throw new Error(intakesError.message);
    }

    const { error: partsRequestsError } = await supabase
      .from('parts_requests')
      .update({
        vehicle_plate_snapshot: plateNumber,
        vehicle_brand_snapshot: brand,
        vehicle_model_snapshot: model,
      })
      .eq('vehicle_id', vehicleId);

    if (partsRequestsError) {
      throw new Error(partsRequestsError.message);
    }
  }

  private findVehicleOwner(
    vehicleId: string,
  ): { customerId: string; vehicleId: string } | null {
    for (const customer of this.customersService.customers()) {
      const vehicleExists = customer.vehicles.some(
        (vehicle) => vehicle.id === vehicleId,
      );

      if (vehicleExists) {
        return {
          customerId: customer.id,
          vehicleId,
        };
      }
    }

    return null;
  }

  private normalizePlate(plateNumber?: string): string {
    const value = plateNumber?.trim().toUpperCase();

    if (value) {
      return value;
    }

    return `SIN-PLACA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
