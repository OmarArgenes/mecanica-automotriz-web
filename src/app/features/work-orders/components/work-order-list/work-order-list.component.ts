import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorkOrder, WorkOrderStatus } from '../../models/work-order.model';
import {
  formatDateAndTime,
  formatTimestamp,
} from '../../../../shared/utils/date-time-format.util';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-order-list.component.html',
  styleUrl: './work-order-list.component.scss',
})
export class WorkOrderListComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() emptyMessage = 'No hay órdenes disponibles.';
  @Input() statusType: WorkOrderStatus = 'pending';
  @Input() orders: WorkOrder[] = [];

  @Output() orderSelected = new EventEmitter<WorkOrder>();
  @Output() printRequested = new EventEmitter<WorkOrder>();
  @Output() deleteRequested = new EventEmitter<WorkOrder>();
  @Output() finishRequested = new EventEmitter<WorkOrder>();
  @Output() reopenRequested = new EventEmitter<WorkOrder>();

  searchTerm = '';

  get filteredOrders(): WorkOrder[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.orders;
    }

    return this.orders.filter((order) => {
      const vehicleName =
        `${order.vehicleBrand} ${order.vehicleModel}`.toLowerCase();

      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerPhone.toLowerCase().includes(term) ||
        vehicleName.includes(term) ||
        order.plateNumber.toLowerCase().includes(term) ||
        order.mechanicName.toLowerCase().includes(term)
      );
    });
  }
  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('es-BO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  formatReceptionDateTime(order: WorkOrder): string {
    return formatDateAndTime(order.receptionDate, order.receptionTime);
  }

  formatCompletedDateTime(order: WorkOrder): string {
    return formatTimestamp(order.completedAt, order.completedDate);
  }

  get isPendingList(): boolean {
    return this.statusType === 'pending';
  }

  selectOrder(order: WorkOrder): void {
    this.orderSelected.emit(order);
  }

  printOrder(order: WorkOrder): void {
    this.printRequested.emit(order);
  }

  deleteOrder(order: WorkOrder): void {
    this.deleteRequested.emit(order);
  }

  finishOrder(order: WorkOrder): void {
    this.finishRequested.emit(order);
  }

  reopenOrder(order: WorkOrder): void {
    this.reopenRequested.emit(order);
  }

  trackByOrderId(_: number, order: WorkOrder): string {
    return order.id;
  }
}
