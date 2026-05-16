import { Injectable, signal } from '@angular/core';

import {
  Customer,
  CustomerFormValue,
  CustomerVehicleFormValue,
  CustomerVehicleSummary,
} from '../models/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly customersSignal = signal<Customer[]>([
    {
      id: '1',
      fullName: 'Juan Pérez',
      documentNumber: '7845123',
      phone: '70707070',
      whatsapp: '70707070',
      email: 'juan.perez@email.com',
      address: 'Av. Blanco Galindo, Cochabamba',
      registeredAt: '2026-05-12',
      vehicles: [
        {
          id: 'v1',
          plateNumber: '123ABC',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2018,
          color: 'Blanco',
          mileage: 85000,
          observations: 'Vehículo registrado para mantenimiento general.',
        },
        {
          id: 'v2',
          plateNumber: '456DEF',
          brand: 'Suzuki',
          model: 'Vitara',
          year: 2020,
          color: 'Negro',
          mileage: 52000,
          observations: 'Segundo vehículo registrado para el mismo cliente.',
        },
      ],
    },
    {
      id: '2',
      fullName: 'María López',
      documentNumber: '6589741',
      phone: '76451230',
      whatsapp: '76451230',
      email: 'maria.lopez@email.com',
      address: 'Zona Cala Cala, Cochabamba',
      registeredAt: '2026-05-12',
      vehicles: [
        {
          id: 'v3',
          plateNumber: '789XYZ',
          brand: 'Nissan',
          model: 'March',
          year: 2020,
          color: 'Gris',
          mileage: 43000,
          observations: 'Cliente reportó vibración al frenar.',
        },
      ],
    },
    {
      id: '3',
      fullName: 'Carlos Rojas',
      documentNumber: '5124789',
      phone: '72223344',
      whatsapp: '72223344',
      address: 'Quillacollo, Cochabamba',
      registeredAt: '2026-05-10',
      vehicles: [
        {
          id: 'v4',
          plateNumber: '321GHT',
          brand: 'Ford',
          model: 'Ranger',
          year: 2019,
          color: 'Negro',
          mileage: 99000,
          observations: 'Camioneta registrada para control preventivo.',
        },
      ],
    },
  ]);

  readonly customers = this.customersSignal.asReadonly();

  createCustomer(formValue: CustomerFormValue): void {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      fullName: formValue.fullName.trim(),
      documentNumber: formValue.documentNumber.trim(),
      phone: formValue.phone.trim(),
      whatsapp: formValue.whatsapp?.trim(),
      email: formValue.email?.trim(),
      address: formValue.address?.trim(),
      registeredAt: this.getTodayDate(),
      vehicles: this.buildVehicleSummaries(formValue),
    };

    this.customersSignal.update((customers) => [newCustomer, ...customers]);
  }

  updateCustomer(customerId: string, formValue: CustomerFormValue): void {
    this.customersSignal.update((customers) =>
      customers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              fullName: formValue.fullName.trim(),
              documentNumber: formValue.documentNumber.trim(),
              phone: formValue.phone.trim(),
              whatsapp: formValue.whatsapp?.trim(),
              email: formValue.email?.trim(),
              address: formValue.address?.trim(),
              vehicles: this.buildVehicleSummaries(
                formValue,
                customer.vehicles,
              ),
            }
          : customer,
      ),
    );
  }

  deleteCustomer(customerId: string): void {
    this.customersSignal.update((customers) =>
      customers.filter((customer) => customer.id !== customerId),
    );
  }

  addVehicleToCustomer(
    customerId: string,
    vehicleValue: CustomerVehicleFormValue,
  ): void {
    const newVehicle = this.buildVehicleSummary(vehicleValue);

    this.customersSignal.update((customers) =>
      customers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              vehicles: [...customer.vehicles, newVehicle],
            }
          : customer,
      ),
    );
  }

  updateVehicleForCustomer(
    customerId: string,
    vehicleId: string,
    vehicleValue: CustomerVehicleFormValue,
  ): void {
    this.customersSignal.update((customers) =>
      customers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              vehicles: customer.vehicles.map((vehicle) =>
                vehicle.id === vehicleId
                  ? this.buildVehicleSummary({
                      ...vehicleValue,
                      id: vehicleId,
                    })
                  : vehicle,
              ),
            }
          : customer,
      ),
    );
  }

  deleteVehicleFromCustomer(customerId: string, vehicleId: string): void {
    this.customersSignal.update((customers) =>
      customers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              vehicles: customer.vehicles.filter(
                (vehicle) => vehicle.id !== vehicleId,
              ),
            }
          : customer,
      ),
    );
  }

  private buildVehicleSummaries(
    formValue: CustomerFormValue,
    currentVehicles: CustomerVehicleSummary[] = [],
  ): CustomerVehicleSummary[] {
    if (formValue.vehicles?.length) {
      return formValue.vehicles
        .map((vehicle, index) =>
          this.buildVehicleSummary(vehicle, currentVehicles[index]),
        )
        .filter(
          (vehicle) =>
            vehicle.plateNumber !== 'Sin placa' ||
            vehicle.brand !== 'Sin marca' ||
            vehicle.model !== 'Sin modelo',
        );
    }

    const legacyVehicle = this.buildLegacyVehicleFromCurrentForm(
      formValue,
      currentVehicles,
    );

    return legacyVehicle ? [legacyVehicle] : currentVehicles;
  }

  private buildLegacyVehicleFromCurrentForm(
    formValue: CustomerFormValue,
    currentVehicles: CustomerVehicleSummary[],
  ): CustomerVehicleSummary | null {
    const plateNumber = formValue.vehiclePlateNumber?.trim();
    const brand = formValue.vehicleBrand?.trim();
    const model = formValue.vehicleModel?.trim();

    if (!plateNumber && !brand && !model) {
      return currentVehicles[0] ?? null;
    }

    return {
      id: currentVehicles[0]?.id ?? crypto.randomUUID(),
      plateNumber: this.normalizePlate(plateNumber || 'Sin placa'),
      brand: brand || 'Sin marca',
      model: model || 'Sin modelo',
      year: currentVehicles[0]?.year ?? null,
      color: currentVehicles[0]?.color ?? '',
      vin: currentVehicles[0]?.vin ?? '',
      mileage: currentVehicles[0]?.mileage ?? null,
      observations: currentVehicles[0]?.observations ?? '',
    };
  }

  private buildVehicleSummary(
    vehicleValue: CustomerVehicleFormValue,
    currentVehicle?: CustomerVehicleSummary,
  ): CustomerVehicleSummary {
    return {
      id: vehicleValue.id ?? currentVehicle?.id ?? crypto.randomUUID(),
      plateNumber: this.normalizePlate(vehicleValue.plateNumber || 'Sin placa'),
      brand: vehicleValue.brand?.trim() || 'Sin marca',
      model: vehicleValue.model?.trim() || 'Sin modelo',
      year: vehicleValue.year ?? currentVehicle?.year ?? null,
      color: vehicleValue.color?.trim() || '',
      vin: vehicleValue.vin?.trim() || '',
      mileage: vehicleValue.mileage ?? currentVehicle?.mileage ?? null,
      observations: vehicleValue.observations?.trim() || '',
    };
  }

  private normalizePlate(plateNumber: string): string {
    return plateNumber.trim().toUpperCase();
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
