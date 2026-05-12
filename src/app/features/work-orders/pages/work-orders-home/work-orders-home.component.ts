import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkOrder } from '../../models/work-order.model';
import { WorkOrdersService } from '../../data-access/work-orders.service';
import { WorkOrderListComponent } from '../../components/work-order-list/work-order-list.component';
import { WorkOrderDetailModalComponent } from '../../components/work-order-detail-modal/work-order-detail-modal.component';
import { PrintDocumentsService } from '../../../print-documents/data-access/print-documents.service';

@Component({
  selector: 'app-work-orders-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    WorkOrderListComponent,
    WorkOrderDetailModalComponent,
  ],
  templateUrl: './work-orders-home.component.html',
  styleUrl: './work-orders-home.component.scss',
})
export class WorkOrdersHomeComponent {
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly printDocumentsService = inject(PrintDocumentsService);

  readonly selectedOrder = signal<WorkOrder | null>(null);

  readonly pendingOrders = computed(() =>
    this.workOrdersService
      .workOrders()
      .filter((order) => order.status === 'pending'),
  );

  readonly completedOrders = computed(() =>
    this.workOrdersService
      .workOrders()
      .filter((order) => order.status === 'completed'),
  );

  readonly totalOrders = computed(
    () => this.workOrdersService.workOrders().length,
  );

  readonly totalPending = computed(() => this.pendingOrders().length);
  readonly totalCompleted = computed(() => this.completedOrders().length);

  openOrder(order: WorkOrder): void {
    this.selectedOrder.set(order);
  }

  closeModal(): void {
    this.selectedOrder.set(null);
  }

  finishOrder(order: WorkOrder): void {
    const confirmed = window.confirm(
      `¿Deseas finalizar la orden ${order.orderNumber}? Esta orden pasará a la lista de finalizados.`,
    );

    if (!confirmed) {
      return;
    }

    this.workOrdersService.updateWorkOrderDetails(
      order.id,
      order.workDescription,
      order.totalAmount,
    );

    this.workOrdersService.finishWorkOrder(order.id);
    this.closeModal();
  }

  printOrder(order: WorkOrder): void {
    this.workOrdersService.updateWorkOrderDetails(
      order.id,
      order.workDescription,
      order.totalAmount,
    );

    this.printDocumentsService.printWorkOrder({
      orderNumber: order.orderNumber,
      status: order.status,

      customer: {
        name: order.customerName,
        phone: order.customerPhone,
      },

      vehicle: {
        brand: order.vehicleBrand,
        model: order.vehicleModel,
        plateNumber: order.plateNumber,
      },

      dates: {
        receptionDate: order.receptionDate,
        completedDate: order.completedDate,
      },

      mechanicName: order.mechanicName,
      problemDescription: order.problemDescription,
      workDescription: order.workDescription,
      totalAmount: order.totalAmount,
    });
  }
}
