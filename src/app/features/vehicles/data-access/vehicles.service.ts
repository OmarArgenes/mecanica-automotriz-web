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

  createVehicle(formValue: VehicleFormValue): void {
    this.customersService.addVehicleToCustomer(formValue.customerId, {
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

  updateVehicle(vehicleId: string, formValue: VehicleFormValue): void {
    const currentVehicle = this.findVehicleOwner(vehicleId);

    if (!currentVehicle) {
      return;
    }

    if (currentVehicle.customerId === formValue.customerId) {
      this.customersService.updateVehicleForCustomer(
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

    this.customersService.deleteVehicleFromCustomer(
      currentVehicle.customerId,
      vehicleId,
    );

    this.customersService.addVehicleToCustomer(formValue.customerId, {
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

  deleteVehicle(vehicleId: string): void {
    const currentVehicle = this.findVehicleOwner(vehicleId);

    if (!currentVehicle) {
      return;
    }

    this.customersService.deleteVehicleFromCustomer(
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
