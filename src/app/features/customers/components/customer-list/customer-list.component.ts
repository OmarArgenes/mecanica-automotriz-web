import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Customer } from '../../models/customer.model';

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

  getVehicleLabel(customer: Customer): string {
    if (!customer.vehicles.length) {
      return 'Sin vehículo registrado';
    }

    const vehicle = customer.vehicles[0];
    return `${vehicle.plateNumber} · ${vehicle.brand} ${vehicle.model}`;
  }

  requestEdit(customer: Customer): void {
    this.editRequested.emit(customer);
  }

  requestDelete(customer: Customer): void {
    this.deleteRequested.emit(customer);
  }
}
