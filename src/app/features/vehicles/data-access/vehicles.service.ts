import { Injectable, computed, inject } from '@angular/core';

import { CustomersService } from '../../customers/data-access/customers.service';
import { VehicleFormValue, VehicleListItem } from '../models/vehicle.model';

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

    if (currentVehicle.customerId === formValue.customerId) {
      await this.customersService.updateVehicleForCustomer(
        currentVehicle.customerId,
        vehicleId,
        {
          id: vehicleId,
          plateNumber: formValue.plateNumber,
          brand: formValue.brand,
          model: formValue.model,
          year: formValue.year ?? null,
          color: formValue.color,
          vin: formValue.vin,
          mileage: formValue.mileage ?? null,
          observations: formValue.observations,
        },
      );

      return;
    }

    await this.customersService.deleteVehicleFromCustomer(
      currentVehicle.customerId,
      vehicleId,
    );

    await this.customersService.addVehicleToCustomer(formValue.customerId, {
      id: vehicleId,
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
}
