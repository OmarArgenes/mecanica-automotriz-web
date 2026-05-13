import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Vehicle } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss',
})
export class VehicleListComponent {
  @Input({ required: true }) vehicles: Vehicle[] = [];

  @Output() editRequested = new EventEmitter<Vehicle>();
  @Output() deleteRequested = new EventEmitter<Vehicle>();

  getVehicleLabel(vehicle: Vehicle): string {
    return `${vehicle.brand} ${vehicle.model}`;
  }

  getYearColorLabel(vehicle: Vehicle): string {
    const year = vehicle.year ? String(vehicle.year) : 'Sin año';
    const color = vehicle.color?.trim() || 'Sin color';

    return `${year} · ${color}`;
  }

  getVinLabel(vehicle: Vehicle): string {
    return vehicle.vin?.trim() || 'Sin VIN registrado';
  }

  requestEdit(vehicle: Vehicle): void {
    this.editRequested.emit(vehicle);
  }

  requestDelete(vehicle: Vehicle): void {
    this.deleteRequested.emit(vehicle);
  }
}
