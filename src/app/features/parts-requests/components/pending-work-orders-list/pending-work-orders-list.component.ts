import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorkOrder } from '../../../work-orders/models/work-order.model';

@Component({
  selector: 'app-pending-work-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-work-orders-list.component.html',
  styleUrl: './pending-work-orders-list.component.scss',
})
export class PendingWorkOrdersListComponent {
  @Input() orders: WorkOrder[] = [];
  @Input() selectedOrderId: string | null = null;

  @Output() orderSelected = new EventEmitter<WorkOrder>();

  searchTerm = '';

  get filteredOrders(): WorkOrder[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.orders;
    }

    return this.orders.filter((order) => {
      const vehicle =
        `${order.vehicleBrand} ${order.vehicleModel}`.toLowerCase();

      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerPhone.toLowerCase().includes(term) ||
        order.plateNumber.toLowerCase().includes(term) ||
        vehicle.includes(term)
      );
    });
  }

  selectOrder(order: WorkOrder): void {
    this.orderSelected.emit(order);
  }

  trackByOrderId(_: number, order: WorkOrder): string {
    return order.id;
  }
}
