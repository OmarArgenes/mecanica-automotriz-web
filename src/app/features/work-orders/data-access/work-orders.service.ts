import { Injectable, signal } from '@angular/core';

import { WorkOrder, WorkOrderChargeItem } from '../models/work-order.model';

@Injectable({
  providedIn: 'root',
})
export class WorkOrdersService {
  private readonly workOrdersSignal = signal<WorkOrder[]>([
    {
      id: '1',
      orderNumber: 'OT-0001',
      customerName: 'Juan Pérez',
      customerPhone: '70707070',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Corolla',
      plateNumber: '123ABC',
      receptionDate: '2026-05-12',
      mechanicName: 'Carlos Mamani',
      problemDescription:
        'El cliente reporta ruido en la parte delantera del vehículo y solicita una revisión general.',
      workDescription:
        'Diagnóstico inicial, revisión de suspensión, revisión de frenos y cambio de aceite.',
      chargeItems: [],
      totalAmount: 0,
      status: 'pending',
    },
    {
      id: '2',
      orderNumber: 'OT-0002',
      customerName: 'María López',
      customerPhone: '76451230',
      vehicleBrand: 'Nissan',
      vehicleModel: 'March',
      plateNumber: '789XYZ',
      receptionDate: '2026-05-12',
      mechanicName: 'Luis Rojas',
      problemDescription:
        'El vehículo presenta vibración al momento de frenar.',
      workDescription:
        'Revisión de discos, pastillas de freno y sistema hidráulico.',
      chargeItems: [],
      totalAmount: 0,
      status: 'pending',
    },
    {
      id: '3',
      orderNumber: 'OT-0003',
      customerName: 'Carlos Rojas',
      customerPhone: '72223344',
      vehicleBrand: 'Ford',
      vehicleModel: 'Ranger',
      plateNumber: '456DEF',
      receptionDate: '2026-05-10',
      completedDate: '2026-05-11',
      mechanicName: 'Miguel Vargas',
      problemDescription: 'Mantenimiento preventivo solicitado por el cliente.',
      workDescription:
        'Cambio de aceite, limpieza de inyectores, revisión de frenos y control general.',
      chargeItems: [
        {
          id: 'charge-1',
          description: 'Cambio de aceite',
          quantity: 1,
          amount: 180,
          subtotal: 180,
        },
        {
          id: 'charge-2',
          description: 'Limpieza de inyectores',
          quantity: 1,
          amount: 260,
          subtotal: 260,
        },
        {
          id: 'charge-3',
          description: 'Revisión de frenos',
          quantity: 1,
          amount: 180,
          subtotal: 180,
        },
      ],
      totalAmount: 620,
      status: 'completed',
    },
  ]);

  readonly workOrders = this.workOrdersSignal.asReadonly();

  finishWorkOrder(orderId: string): void {
    const today = new Date().toISOString().split('T')[0];

    this.workOrdersSignal.update((orders) =>
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'completed',
              completedDate: today,
            }
          : order,
      ),
    );
  }

  getWorkOrderById(orderId: string): WorkOrder | undefined {
    return this.workOrdersSignal().find((order) => order.id === orderId);
  }

  updateWorkOrderDetails(
    orderId: string,
    workDescription: string,
    totalAmount: number,
    chargeItems: WorkOrderChargeItem[] = [],
  ): void {
    this.workOrdersSignal.update((orders) =>
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              workDescription,
              totalAmount,
              chargeItems: chargeItems.map((item) => ({ ...item })),
            }
          : order,
      ),
    );
  }
}
