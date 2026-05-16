import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { VehicleListItem } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss',
})
export class VehicleListComponent {
  @Input({ required: true }) vehicles: VehicleListItem[] = [];

  @Output() editRequested = new EventEmitter<VehicleListItem>();
  @Output() deleteRequested = new EventEmitter<VehicleListItem>();

  getYearColorLabel(vehicle: VehicleListItem): string {
    const details = [
      vehicle.year ? String(vehicle.year) : '',
      vehicle.color?.trim() ?? '',
    ].filter(Boolean);

    return details.length ? details.join(' · ') : 'Sin año/color registrado';
  }

  requestEdit(vehicle: VehicleListItem): void {
    this.editRequested.emit(vehicle);
  }

  requestDelete(vehicle: VehicleListItem): void {
    this.deleteRequested.emit(vehicle);
  }

  trackByVehicleId(_: number, vehicle: VehicleListItem): string {
    return vehicle.id;
  }
}
