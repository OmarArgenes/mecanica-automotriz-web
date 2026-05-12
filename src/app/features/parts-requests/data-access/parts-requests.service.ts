import { Injectable, signal } from '@angular/core';

import { WorkOrder } from '../../work-orders/models/work-order.model';
import { PartRequest, PartRequestItem } from '../models/part-request.model';

@Injectable({
  providedIn: 'root',
})
export class PartsRequestsService {
  private readonly partRequestsSignal = signal<PartRequest[]>([]);

  readonly partRequests = this.partRequestsSignal.asReadonly();

  createPartRequest(
    workOrder: WorkOrder,
    workshopProvidesParts: boolean,
    parts: PartRequestItem[],
  ): void {
    const currentRequests = this.partRequestsSignal();
    const nextNumber = currentRequests.length + 1;

    const newRequest: PartRequest = {
      id: crypto.randomUUID(),
      requestNumber: `SR-${String(nextNumber).padStart(4, '0')}`,

      workOrderId: workOrder.id,
      orderNumber: workOrder.orderNumber,

      customerName: workOrder.customerName,
      customerPhone: workOrder.customerPhone,

      vehicleBrand: workOrder.vehicleBrand,
      vehicleModel: workOrder.vehicleModel,
      plateNumber: workOrder.plateNumber,

      requestedAt: new Date().toISOString().split('T')[0],
      workshopProvidesParts,

      parts,
    };

    this.partRequestsSignal.update((requests) => [newRequest, ...requests]);
  }

  getRequestsByWorkOrder(workOrderId: string): PartRequest[] {
    return this.partRequestsSignal().filter(
      (request) => request.workOrderId === workOrderId,
    );
  }
}
