import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Customer, CustomerVehicleSummary } from '../../models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent {
  @Input({ required: true }) customers: Customer[] = [];

  @Output() editRequested = new EventEmitter<Customer>();
  @Output() deleteRequested = new EventEmitter<Customer>();

  private readonly visibleVehiclesLimit = 2;

  getVehicleCountLabel(customer: Customer): string {
    const totalVehicles = customer.vehicles.length;

    if (totalVehicles === 0) {
      return 'Sin vehículos registrados';
    }

    if (totalVehicles === 1) {
      return '1 vehículo registrado';
    }

    return `${totalVehicles} vehículos registrados`;
  }

  getVisibleVehicles(customer: Customer): CustomerVehicleSummary[] {
    return customer.vehicles.slice(0, this.visibleVehiclesLimit);
  }

  getRemainingVehicleCount(customer: Customer): number {
    return Math.max(customer.vehicles.length - this.visibleVehiclesLimit, 0);
  }

  getVehicleLabel(vehicle: CustomerVehicleSummary): string {
    const brandModel = `${vehicle.brand} ${vehicle.model}`.trim();

    if (!brandModel) {
      return 'Vehículo sin detalle';
    }

    return brandModel;
  }

  trackByVehicleId(_: number, vehicle: CustomerVehicleSummary): string {
    return vehicle.id;
  }

  requestEdit(customer: Customer): void {
    this.editRequested.emit(customer);
  }

  requestDelete(customer: Customer): void {
    this.deleteRequested.emit(customer);
  }
}
