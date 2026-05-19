import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkOrder } from '../../../work-orders/models/work-order.model';
import { WorkOrdersService } from '../../../work-orders/data-access/work-orders.service';

import { PartsRequestsService } from '../../data-access/parts-requests.service';
import {
  PartRequest,
  PartRequestFormValue,
} from '../../models/part-request.model';

import { PendingWorkOrdersListComponent } from '../../components/pending-work-orders-list/pending-work-orders-list.component';
import { SelectedWorkOrderPanelComponent } from '../../components/selected-work-order-panel/selected-work-order-panel.component';
import { PartRequestFormModalComponent } from '../../components/part-request-form-modal/part-request-form-modal.component';
import { PartRequestHistoryComponent } from '../../components/part-request-history/part-request-history.component';
import { PrintDocumentsService } from '../../../print-documents/data-access/print-documents.service';
@Component({
  selector: 'app-parts-requests-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PendingWorkOrdersListComponent,
    SelectedWorkOrderPanelComponent,
    PartRequestFormModalComponent,
    PartRequestHistoryComponent,
  ],
  templateUrl: './parts-requests-home.component.html',
  styleUrl: './parts-requests-home.component.scss',
})
export class PartsRequestsHomeComponent {
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly partsRequestsService = inject(PartsRequestsService);
  private readonly printDocumentsService = inject(PrintDocumentsService);
  readonly selectedWorkOrderId = signal<string | null>(null);
  readonly isRequestModalOpen = signal(false);

  readonly pendingOrders = computed(() =>
    this.workOrdersService
      .workOrders()
      .filter((order) => order.status === 'pending'),
  );

  readonly selectedOrder = computed<WorkOrder | null>(() => {
    const selectedId = this.selectedWorkOrderId();
    const pendingOrders = this.pendingOrders();

    if (selectedId) {
      return (
        pendingOrders.find((order) => order.id === selectedId) ??
        pendingOrders[0] ??
        null
      );
    }

    return pendingOrders[0] ?? null;
  });

  readonly selectedOrderRequests = computed(() => {
    const order = this.selectedOrder();

    if (!order) {
      return [];
    }

    return this.partsRequestsService.getRequestsByWorkOrder(order.id);
  });

  readonly totalRequests = computed(
    () => this.partsRequestsService.partRequests().length,
  );

  readonly totalWorkshopProvided = computed(
    () =>
      this.partsRequestsService
        .partRequests()
        .filter((request) => request.workshopProvidesParts).length,
  );

  selectOrder(order: WorkOrder): void {
    this.selectedWorkOrderId.set(order.id);
  }

  openRequestModal(): void {
    if (!this.selectedOrder()) {
      return;
    }

    this.isRequestModalOpen.set(true);
  }

  closeRequestModal(): void {
    this.isRequestModalOpen.set(false);
  }

  async savePartRequest(formValue: PartRequestFormValue): Promise<void> {
    const order = this.selectedOrder();

    if (!order) {
      return;
    }

    try {
      await this.partsRequestsService.createPartRequest(
        order,
        formValue.workshopProvidesParts,
        formValue.parts,
      );

      this.closeRequestModal();
    } catch (error) {
      console.error(error);
      window.alert(
        'No se pudo guardar la solicitud de repuestos. Intenta nuevamente.',
      );
    }
  }

  printPartRequest(request: PartRequest): void {
    this.printDocumentsService.printPartRequest({
      requestNumber: request.requestNumber,
      orderNumber: request.orderNumber,

      customer: {
        name: request.customerName,
        phone: request.customerPhone,
      },

      vehicle: {
        brand: request.vehicleBrand,
        model: request.vehicleModel,
        plateNumber: request.plateNumber,
      },

      requestedAt: request.requestedAt,
      workshopProvidesParts: request.workshopProvidesParts,

      parts: request.parts.map((part) => ({
        name: part.name,
        quantity: part.quantity,
      })),
    });
  }
}
