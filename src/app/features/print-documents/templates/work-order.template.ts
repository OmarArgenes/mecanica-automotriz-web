import { WorkOrderPrintDocument } from '../models/work-order-print-document.model';
import {
  formatDateAndTime,
  formatTimestamp,
} from '../../../shared/utils/date-time-format.util';

export function buildWorkOrderTemplate(
  document: WorkOrderPrintDocument,
): string {
  const isCompleted = document.status === 'completed';

  const documentTitle = isCompleted
    ? 'ORDEN DE TRABAJO FINALIZADA'
    : 'ORDEN DE TRABAJO PENDIENTE';

  const statusLabel = isCompleted ? 'Finalizada' : 'Pendiente';

  const totalLabel = isCompleted ? 'Total final' : 'Total registrado';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Orden ${safe(document.orderNumber)}</title>
        ${buildPrintStyles(isCompleted)}
      </head>

      <body>
        <main class="print-document">
          <header class="document-header">
            <div class="logo-box">
              <img src="/images/caned-logo.png" alt="CANED Tecnología Automotriz" />
            </div>

            <div class="company-info">
              <h1>CANEDO Tecnología Automotriz</h1>
              <p>Diagnóstico, servicio y reparación automotriz</p>
              <p><strong>Tel.:</strong> 4281133 · <strong>Cel.:</strong> 72222827 · <strong>Responsable:</strong> Rubén Zelaya</p>
              <p><strong>Email:</strong> zcanedo3@hotmai.com</p>
              <p><strong>Dirección:</strong> Calle F. Veracini entre Calle M. E, Norberto Galdo Ballivian y, Cochabamba, Bolivia</p>
            </div>

            <div class="document-meta">
              <strong>${safe(documentTitle)}</strong>
              <span>${safe(document.orderNumber)}</span>
              <em>${safe(statusLabel)}</em>
            </div>
          </header>

          ${sectionTitle('Datos del cliente')}
          ${dataGrid([
            ['Cliente', document.customer.name],
            ['Teléfono / WhatsApp', document.customer.phone],
          ])}

          ${sectionTitle('Datos del vehículo')}
          ${dataGrid([
            ['Marca', document.vehicle.brand],
            ['Modelo', document.vehicle.model],
            ['Placa', document.vehicle.plateNumber],
            ['Mecánico asignado', document.mechanicName],
          ])}
${dataGrid([
  [
    'Fecha y hora de recepción',
    formatDateAndTime(
      document.dates.receptionDate,
      document.dates.receptionTime,
    ),
  ],
  [
    'Fecha y hora de finalización',
    formatTimestamp(document.dates.completedAt, document.dates.completedDate),
  ],
])}

          ${textBlock('Problema reportado', document.problemDescription)}
         
          ${chargeDetailTable(document)}

          <section class="total-box">
            <span>${safe(totalLabel)}</span>
            <strong>Bs ${displayMoney(document.totalAmount)}</strong>
          </section>

          <section class="signature-grid">
            <div>Firma cliente</div>
            <div>Firma responsable</div>
          </section>

          <p class="legal-note">
            Este documento respalda el seguimiento operativo de la orden de trabajo dentro del taller.
            Verifique los datos antes de firmar.
          </p>
        </main>

        <script>
          window.addEventListener('load', function () {
            setTimeout(function () {
              window.print();
            }, 300);
          });
        </script>
      </body>
    </html>
  `;
}

function buildPrintStyles(isCompleted: boolean): string {
  const statusTextColor = isCompleted ? '#047857' : '#9a3412';
  const statusBackground = isCompleted ? '#d1fae5' : '#ffedd5';

  return `
    <style>
      * {
        box-sizing: border-box;
      }

      @page {
        size: letter portrait;
        margin: 0;
      }

      html,
      body {
        width: 21.59cm;
        min-height: 27.94cm;
        margin: 0;
        padding: 0;
      }

      body {
        color: #111827;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .print-document {
        width: 21.59cm;
        min-height: 13.97cm;
        padding: 6mm;
        background: #ffffff;
      }

      .document-header {
        display: grid;
        grid-template-columns: 140px 1fr 170px;
        align-items: center;
        gap: 14px;
        padding-bottom: 8px;
        border-bottom: 2px solid #001b4e;
      }

      .logo-box {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo-box img {
        max-width: 132px;
        max-height: 58px;
        object-fit: contain;
      }

      .company-info h1 {
        margin: 0;
        color: #001b4e;
        font-size: 16px;
        line-height: 1.1;
        font-weight: 900;
        text-transform: uppercase;
      }

      .company-info p {
        margin: 2px 0 0;
        color: #4b5563;
        font-size: 8.2px;
        line-height: 1.25;
      }

      .company-info strong {
        color: #001b4e;
        font-weight: 900;
      }

      .document-meta {
        text-align: right;
      }

      .document-meta strong {
        display: block;
        color: #001b4e;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
      }

      .document-meta span {
        display: block;
        margin-top: 4px;
        color: #111827;
        font-size: 16px;
        font-weight: 900;
      }

      .document-meta em {
        display: inline-block;
        margin-top: 5px;
        padding: 4px 9px;
        border-radius: 999px;
        color: ${statusTextColor};
        background: ${statusBackground};
        font-size: 8px;
        font-style: normal;
        font-weight: 900;
      }

      .section-title {
        margin: 9px 0 5px;
        color: #001b4e;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .data-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
      }

      .data-item {
        min-height: 34px;
        padding: 5px 7px;
        border: 1px solid #d7dde8;
        border-radius: 7px;
        background: #f8fafc;
      }

      .data-item span {
        display: block;
        margin-bottom: 2px;
        color: #6b7280;
        font-size: 7.5px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .data-item strong {
        display: block;
        color: #111827;
        font-size: 9.5px;
        line-height: 1.2;
        font-weight: 800;
        word-break: break-word;
      }

      .text-block {
        margin-top: 6px;
        padding: 7px 9px;
        border: 1px solid #d7dde8;
        border-radius: 8px;
        background: #ffffff;
      }

      .text-block span {
        display: block;
        margin-bottom: 3px;
        color: #001b4e;
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .text-block p {
        margin: 0;
        color: #374151;
        font-size: 9.2px;
        line-height: 1.35;
      }

      .charge-table {
        width: 100%;
        margin-top: 6px;
        border-collapse: collapse;
        border: 1px solid #d7dde8;
        border-radius: 8px;
        overflow: hidden;
      }

      .charge-table th,
      .charge-table td {
        padding: 5px 7px;
        border-bottom: 1px solid #d7dde8;
        color: #111827;
        font-size: 8.4px;
        line-height: 1.25;
        text-align: left;
        vertical-align: top;
      }

      .charge-table th {
        background: #eef6ff;
        color: #001b4e;
        font-size: 7.6px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .charge-table tr:last-child td {
        border-bottom: none;
      }

      .charge-table .number-column {
        width: 28px;
        text-align: center;
      }

      .charge-table .quantity-column {
        width: 58px;
        text-align: center;
      }

      .charge-table .money-column {
        width: 82px;
        text-align: right;
        font-weight: 900;
      }

      .total-box {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
        padding-top: 7px;
        border-top: 1px solid #d7dde8;
      }

      .total-box span {
        color: #6b7280;
        font-size: 8.5px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .total-box strong {
        color: #001b4e;
        font-size: 16px;
        font-weight: 900;
      }

      .signature-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 70px;
        margin-top: 20px;
      }

      .signature-grid div {
        padding-top: 7px;
        border-top: 1px solid #111827;
        text-align: center;
        color: #374151;
        font-size: 9px;
        font-weight: 800;
      }

      .legal-note {
        margin: 7px 0 0;
        color: #6b7280;
        font-size: 7.5px;
        line-height: 1.25;
        text-align: center;
      }
    </style>
  `;
}

function sectionTitle(title: string): string {
  return `<h2 class="section-title">${safe(title)}</h2>`;
}

function dataGrid(items: Array<[string, string | number | undefined]>): string {
  return `
    <section class="data-grid">
      ${items
        .map(
          ([label, value]) => `
            <div class="data-item">
              <span>${safe(label)}</span>
              <strong>${display(value)}</strong>
            </div>
          `,
        )
        .join('')}
    </section>
  `;
}

function textBlock(label: string, value: string | number | undefined): string {
  return `
    <section class="text-block">
      <span>${safe(label)}</span>
      <p>${display(value)}</p>
    </section>
  `;
}

function chargeDetailTable(document: WorkOrderPrintDocument): string {
  const chargeItems = document.chargeItems ?? [];

  if (chargeItems.length === 0) {
    return `
      ${sectionTitle('Detalle de cobro final')}
      <table class="charge-table">
        <tbody>
          <tr>
            <td>Sin detalle de cobro registrado.</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  return `
    ${sectionTitle('Detalle de cobro final')}
    <table class="charge-table">
      <thead>
        <tr>
          <th class="number-column">N°</th>
          <th>Detalle</th>
          <th class="quantity-column">Cant.</th>
          <th class="money-column">Monto</th>
          <th class="money-column">Subtotal</th>
        </tr>
      </thead>

      <tbody>
        ${chargeItems
          .map(
            (item, index) => `
              <tr>
                <td class="number-column">${index + 1}</td>
                <td>${safe(item.description)}</td>
                <td class="quantity-column">${display(item.quantity)}</td>
                <td class="money-column">Bs ${displayMoney(item.amount)}</td>
                <td class="money-column">Bs ${displayMoney(item.subtotal)}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function display(value: string | number | undefined): string {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue ? safe(normalizedValue) : '—';
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return '—';
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

function displayMoney(value: string | number | undefined): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  return numericValue.toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function safe(value: string | number | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
