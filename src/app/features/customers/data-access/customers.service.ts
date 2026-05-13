import { Injectable, signal } from '@angular/core';

import {
  Customer,
  CustomerFormValue,
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
          id: 'v2',
          plateNumber: '789XYZ',
          brand: 'Nissan',
          model: 'March',
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
          id: 'v3',
          plateNumber: '456DEF',
          brand: 'Ford',
          model: 'Ranger',
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
      registeredAt: new Date().toISOString().split('T')[0],
      vehicles: this.buildVehicleSummary(formValue),
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
              vehicles: this.buildVehicleSummary(formValue, customer.vehicles),
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

  private buildVehicleSummary(
    formValue: CustomerFormValue,
    currentVehicles: CustomerVehicleSummary[] = [],
  ): CustomerVehicleSummary[] {
    const plateNumber = formValue.vehiclePlateNumber?.trim();
    const brand = formValue.vehicleBrand?.trim();
    const model = formValue.vehicleModel?.trim();

    if (!plateNumber && !brand && !model) {
      return currentVehicles;
    }

    return [
      {
        id: currentVehicles[0]?.id ?? crypto.randomUUID(),
        plateNumber: plateNumber || 'Sin placa',
        brand: brand || 'Sin marca',
        model: model || 'Sin modelo',
      },
    ];
  }
}
