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

  async finishOrder(order: WorkOrder): Promise<void> {
    const chargeItems = order.chargeItems ?? [];

    if (chargeItems.length === 0) {
      window.alert(
        'Debes registrar al menos un detalle de cobro antes de finalizar la orden.',
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas finalizar la orden ${order.orderNumber}? Esta orden pasará a la lista de finalizados con un total de Bs ${order.totalAmount}.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.workOrdersService.updateWorkOrderDetails(
        order.id,
        order.workDescription,
        order.totalAmount,
        chargeItems,
      );

      await this.workOrdersService.finishWorkOrder(order.id);
      this.closeModal();
    } catch (error) {
      console.error(error);
      window.alert('No se pudo finalizar la orden. Intenta nuevamente.');
    }
  }

  async printOrder(order: WorkOrder): Promise<void> {
    const chargeItems = order.chargeItems ?? [];

    try {
      await this.workOrdersService.updateWorkOrderDetails(
        order.id,
        order.workDescription,
        order.totalAmount,
        chargeItems,
      );

      const updatedOrder = this.workOrdersService.getWorkOrderById(
        order.id,
      ) ?? {
        ...order,
        chargeItems,
      };

      this.printDocumentsService.printWorkOrder({
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,

        customer: {
          name: updatedOrder.customerName,
          phone: updatedOrder.customerPhone,
        },

        vehicle: {
          brand: updatedOrder.vehicleBrand,
          model: updatedOrder.vehicleModel,
          plateNumber: updatedOrder.plateNumber,
        },

        dates: {
          receptionDate: updatedOrder.receptionDate,
          completedDate: updatedOrder.completedDate,
        },

        mechanicName: updatedOrder.mechanicName,
        problemDescription: updatedOrder.problemDescription,
        workDescription: updatedOrder.workDescription,
        chargeItems: updatedOrder.chargeItems,
        totalAmount: updatedOrder.totalAmount,
      });
    } catch (error) {
      console.error(error);
      window.alert('No se pudo preparar la impresión de la orden.');
    }
  }
}
