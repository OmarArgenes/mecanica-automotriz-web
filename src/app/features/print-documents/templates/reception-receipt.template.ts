import { ReceptionPrintDocument } from '../models/reception-print-document.model';

export function buildReceptionReceiptTemplate(
  document: ReceptionPrintDocument,
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Constancia ${safe(document.receptionCode)}</title>
        ${buildPrintStyles()}
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
              <strong>CONSTANCIA DE RECEPCIÓN</strong>
              <span>${safe(document.receptionCode)}</span>
              <em>Vehículo recibido</em>
            </div>
          </header>

          ${sectionTitle('Datos del cliente')}
          ${dataGrid([
            ['Cliente', document.customer.fullName],
            ['Teléfono / WhatsApp', document.customer.phone],
            ['CI / NIT', document.customer.document],
            ['Dirección', document.customer.address],
          ])}

          ${sectionTitle('Datos del vehículo')}
          ${dataGrid([
            ['Placa', document.vehicle.plate],
            ['Marca', document.vehicle.brand],
            ['Modelo', document.vehicle.model],
            ['Año', document.vehicle.year],
            ['Color', document.vehicle.color],
            ['Kilometraje', document.vehicle.mileage],
            ['Combustible', document.vehicle.fuelType],
            ['Orden generada', document.orderCode],
          ])}

          ${sectionTitle('Ingreso al taller')}
          ${dataGrid([
            ['Fecha', document.intake.date],
            ['Hora', document.intake.time],
            ['Cómo llega', document.intake.arrivalMethod],
            ['Estado de llegada', document.intake.arrivalState],
            ['Mecánico asignado', document.intake.mechanicName],
          ])}

          ${textBlock('Problemas reportados por el cliente', document.intake.reportedProblems)}
     
          <section class="signature-grid">
            <div>Firma recepción</div>
            <div>Firma cliente</div>
          </section>

          <p class="legal-note">
            El cliente declara que los datos registrados corresponden al estado inicial del vehículo al momento de su ingreso al taller.
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

function buildPrintStyles(): string {
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
  height: 27.94cm;
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
  height: 13.97cm;
  padding: 6mm;
  overflow: hidden;
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
        color: #075985;
        background: #e0f2fe;
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

function display(value: string | number | undefined): string {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue ? safe(normalizedValue) : '—';
}

function safe(value: string | number | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
