import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkOrder } from '../../models/work-order.model';
import { WorkOrdersService } from '../../data-access/work-orders.service';
import { WorkOrderListComponent } from '../../components/work-order-list/work-order-list.component';
import { WorkOrderDetailModalComponent } from '../../components/work-order-detail-modal/work-order-detail-modal.component';

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

    const printWindow = window.open('', '_blank', 'width=950,height=750');

    if (!printWindow) {
      return;
    }

    const statusLabel = order.status === 'pending' ? 'Pendiente' : 'Finalizada';
    const completedDate = order.completedDate ?? '-';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Orden ${this.escapeHtml(order.orderNumber)}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 36px;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              background: #ffffff;
            }

            .document {
              max-width: 850px;
              margin: 0 auto;
            }

            .topbar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
              padding-bottom: 18px;
              border-bottom: 3px solid #267BBF;
              margin-bottom: 24px;
            }

            .brand h1 {
              margin: 0;
              font-size: 26px;
              color: #267BBF;
              letter-spacing: -0.5px;
            }

            .brand p {
              margin: 6px 0 0;
              color: #6b7280;
              font-size: 13px;
            }

            .order-number {
              text-align: right;
            }

            .order-number strong {
              display: block;
              font-size: 22px;
              color: #111827;
            }

            .status {
              display: inline-block;
              margin-top: 8px;
              padding: 7px 14px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 700;
              background: ${order.status === 'pending' ? '#fff7ed' : '#ecfdf5'};
              color: ${order.status === 'pending' ? '#c2410c' : '#047857'};
            }

            .section-title {
              margin: 26px 0 12px;
              font-size: 15px;
              font-weight: 800;
              text-transform: uppercase;
              color: #374151;
              letter-spacing: 0.4px;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }

            .box {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 14px;
              background: #fbfdff;
            }

            .box span {
              display: block;
              margin-bottom: 5px;
              font-size: 11px;
              font-weight: 700;
              color: #6b7280;
              text-transform: uppercase;
            }

            .box strong {
              font-size: 15px;
              color: #111827;
            }

            .description {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 16px;
              line-height: 1.6;
              color: #374151;
              background: #ffffff;
            }

            .total {
              margin-top: 26px;
              padding-top: 18px;
              border-top: 1px solid #e5e7eb;
              text-align: right;
              font-size: 24px;
              font-weight: 800;
              color: #111827;
            }

            .signature-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 48px;
              margin-top: 60px;
            }

            .signature {
              text-align: center;
              font-size: 13px;
              color: #374151;
            }

            .signature::before {
              content: '';
              display: block;
              height: 1px;
              background: #9ca3af;
              margin-bottom: 8px;
            }

            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>
          <main class="document">
            <header class="topbar">
              <div class="brand">
                <h1>Mecánica Automotriz</h1>
                <p>Orden de trabajo generada desde el sistema</p>
              </div>

              <div class="order-number">
                <strong>${this.escapeHtml(order.orderNumber)}</strong>
                <span class="status">${statusLabel}</span>
              </div>
            </header>

            <h2 class="section-title">Datos del cliente</h2>
            <section class="grid">
              <div class="box">
                <span>Cliente</span>
                <strong>${this.escapeHtml(order.customerName)}</strong>
              </div>

              <div class="box">
                <span>Teléfono</span>
                <strong>${this.escapeHtml(order.customerPhone)}</strong>
              </div>
            </section>

            <h2 class="section-title">Datos del vehículo</h2>
            <section class="grid">
              <div class="box">
                <span>Marca</span>
                <strong>${this.escapeHtml(order.vehicleBrand)}</strong>
              </div>

              <div class="box">
                <span>Modelo</span>
                <strong>${this.escapeHtml(order.vehicleModel)}</strong>
              </div>

              <div class="box">
                <span>Placa</span>
                <strong>${this.escapeHtml(order.plateNumber)}</strong>
              </div>

              <div class="box">
                <span>Mecánico asignado</span>
                <strong>${this.escapeHtml(order.mechanicName)}</strong>
              </div>
            </section>

            <h2 class="section-title">Fechas</h2>
            <section class="grid">
              <div class="box">
                <span>Fecha de recepción</span>
                <strong>${this.escapeHtml(order.receptionDate)}</strong>
              </div>

              <div class="box">
                <span>Fecha de finalización</span>
                <strong>${this.escapeHtml(completedDate)}</strong>
              </div>
            </section>

            <h2 class="section-title">Problema reportado</h2>
            <section class="description">
              ${this.escapeHtml(order.problemDescription)}
            </section>

            <h2 class="section-title">Trabajo realizado / solicitado</h2>
            <section class="description">
              ${this.escapeHtml(order.workDescription)}
            </section>

            <div class="total">
              Total: Bs ${this.escapeHtml(order.totalAmount)}
            </div>

            <section class="signature-grid">
              <div class="signature">Firma del cliente</div>
              <div class="signature">Firma del responsable</div>
            </section>
          </main>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  private escapeHtml(value: string | number | undefined): string {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
