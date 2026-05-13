import { Injectable, signal } from '@angular/core';

import { Vehicle, VehicleFormValue } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  private readonly vehiclesSignal = signal<Vehicle[]>([
    {
      id: '1',
      plateNumber: '123ABC',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2018,
      color: 'Blanco',
      vin: 'JTDBR32E123456789',
      customerName: 'Juan Pérez',
      customerPhone: '70707070',
      observations: 'Vehículo registrado para mantenimiento general.',
      registeredAt: '2026-05-12',
    },
    {
      id: '2',
      plateNumber: '789XYZ',
      brand: 'Nissan',
      model: 'March',
      year: 2020,
      color: 'Gris',
      vin: '',
      customerName: 'María López',
      customerPhone: '76451230',
      observations: 'Cliente reportó vibración al frenar.',
      registeredAt: '2026-05-12',
    },
    {
      id: '3',
      plateNumber: '456DEF',
      brand: 'Ford',
      model: 'Ranger',
      year: 2019,
      color: 'Negro',
      vin: '',
      customerName: 'Carlos Rojas',
      customerPhone: '72223344',
      observations: 'Camioneta registrada para control preventivo.',
      registeredAt: '2026-05-10',
    },
  ]);

  readonly vehicles = this.vehiclesSignal.asReadonly();

  createVehicle(formValue: VehicleFormValue): void {
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      plateNumber: this.normalizePlate(formValue.plateNumber),
      brand: formValue.brand.trim(),
      model: formValue.model.trim(),
      year: formValue.year ?? null,
      color: formValue.color?.trim(),
      vin: formValue.vin?.trim(),
      customerName: formValue.customerName.trim(),
      customerPhone: formValue.customerPhone.trim(),
      observations: formValue.observations?.trim(),
      registeredAt: new Date().toISOString().split('T')[0],
    };

    this.vehiclesSignal.update((vehicles) => [newVehicle, ...vehicles]);
  }

  updateVehicle(vehicleId: string, formValue: VehicleFormValue): void {
    this.vehiclesSignal.update((vehicles) =>
      vehicles.map((vehicle) =>
        vehicle.id === vehicleId
          ? {
              ...vehicle,
              plateNumber: this.normalizePlate(formValue.plateNumber),
              brand: formValue.brand.trim(),
              model: formValue.model.trim(),
              year: formValue.year ?? null,
              color: formValue.color?.trim(),
              vin: formValue.vin?.trim(),
              customerName: formValue.customerName.trim(),
              customerPhone: formValue.customerPhone.trim(),
              observations: formValue.observations?.trim(),
            }
          : vehicle,
      ),
    );
  }

  deleteVehicle(vehicleId: string): void {
    this.vehiclesSignal.update((vehicles) =>
      vehicles.filter((vehicle) => vehicle.id !== vehicleId),
    );
  }

  private normalizePlate(plateNumber: string): string {
    return plateNumber.trim().toUpperCase();
  }
}
