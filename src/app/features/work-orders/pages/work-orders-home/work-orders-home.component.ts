import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkOrder } from '../../models/work-order.model';
import { WorkOrdersService } from '../../data-access/work-orders.service';
import { WorkOrderListComponent } from '../../components/work-order-list/work-order-list.component';
import { WorkOrderDetailModalComponent } from '../../components/work-order-detail-modal/work-order-detail-modal.component';
import { PrintDocumentsService } from '../../../print-documents/data-access/print-documents.service';

type WorkOrderModalMode = 'view' | 'edit';

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
  readonly modalMode = signal<WorkOrderModalMode>('view');
  readonly recentlyFinishedOrderId = signal<string | null>(null);

  readonly pendingOrders = computed(() =>
    this.sortPendingOrders(
      this.workOrdersService
        .workOrders()
        .filter((order) => order.status === 'pending'),
    ),
  );

  readonly completedOrders = computed(() =>
    this.sortCompletedOrders(
      this.workOrdersService
        .workOrders()
        .filter((order) => order.status === 'completed'),
    ),
  );

  readonly totalOrders = computed(
    () => this.workOrdersService.workOrders().length,
  );

  readonly totalPending = computed(() => this.pendingOrders().length);
  readonly totalCompleted = computed(() => this.completedOrders().length);

  openOrder(order: WorkOrder): void {
    this.modalMode.set('view');
    this.selectedOrder.set(order);
  }

  editOrder(order: WorkOrder): void {
    this.modalMode.set('edit');
    this.selectedOrder.set(order);
  }

  closeModal(): void {
    this.selectedOrder.set(null);
    this.modalMode.set('view');
  }

  async saveOrder(order: WorkOrder): Promise<void> {
    try {
      await this.workOrdersService.updateWorkOrderDetails(
        order.id,
        order.workDescription,
        order.totalAmount,
        order.chargeItems ?? [],
      );

      this.closeModal();
    } catch (error) {
      console.error(error);
      window.alert('No se pudo guardar la orden. Intenta nuevamente.');
    }
  }

  async deleteOrder(order: WorkOrder): Promise<void> {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la orden pendiente ${order.orderNumber}? Esta acción también eliminará sus cobros y solicitudes de repuestos relacionadas.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.workOrdersService.deleteWorkOrder(order.id);
    } catch (error) {
      console.error(error);
      window.alert('No se pudo eliminar la orden. Intenta nuevamente.');
    }
  }

  async reopenOrder(order: WorkOrder): Promise<void> {
    const confirmed = window.confirm(
      `¿Deseas anular la finalización de la orden ${order.orderNumber}? La orden volverá a la lista de pendientes.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.workOrdersService.reopenWorkOrder(order.id);
    } catch (error) {
      console.error(error);
      window.alert('No se pudo anular la orden. Intenta nuevamente.');
    }
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
      this.recentlyFinishedOrderId.set(order.id);
      this.closeModal();
    } catch (error) {
      console.error(error);
      window.alert('No se pudo finalizar la orden. Intenta nuevamente.');
    }
  }

  async printOrder(order: WorkOrder): Promise<void> {
    try {
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
          receptionTime: order.receptionTime,
          completedDate: order.completedDate,
          completedAt: order.completedAt,
        },

        mechanicName: order.mechanicName,
        problemDescription: order.problemDescription,
        workDescription: order.workDescription,
        chargeItems: order.chargeItems ?? [],
        totalAmount: order.totalAmount,
      });
    } catch (error) {
      console.error(error);
      window.alert('No se pudo preparar la impresión de la orden.');
    }
  }

  private sortPendingOrders(orders: WorkOrder[]): WorkOrder[] {
    return [...orders].sort((a, b) => {
      return (
        this.compareDateDesc(a.receptionDate, b.receptionDate) ||
        this.compareOrderNumberDesc(a.orderNumber, b.orderNumber)
      );
    });
  }

  private sortCompletedOrders(orders: WorkOrder[]): WorkOrder[] {
    return [...orders].sort((a, b) => {
      return (
        this.compareDateDesc(
          a.completedAt ?? a.completedDate ?? a.receptionDate,
          b.completedAt ?? b.completedDate ?? b.receptionDate,
        ) || this.compareOrderNumberDesc(a.orderNumber, b.orderNumber)
      );
    });
  }
  private compareDateDesc(dateA: string, dateB: string): number {
    return this.getDateTime(dateB) - this.getDateTime(dateA);
  }

  private compareOrderNumberDesc(orderA: string, orderB: string): number {
    return this.getOrderNumberValue(orderB) - this.getOrderNumberValue(orderA);
  }

  private getDateTime(value: string): number {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  private getOrderNumberValue(orderNumber: string): number {
    const numericValue = orderNumber.replace(/\D/g, '');
    return Number(numericValue || 0);
  }
}
