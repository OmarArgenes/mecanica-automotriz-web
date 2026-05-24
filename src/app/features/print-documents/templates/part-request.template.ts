import { PartRequestPrintDocument } from '../models/part-request-print-document.model';

export function buildPartRequestTemplate(
  document: PartRequestPrintDocument,
): string {
  const providerLabel = document.workshopProvidesParts
    ? 'El taller proveerá los repuestos solicitados'
    : 'El cliente / responsable proveerá los repuestos solicitados';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Solicitud ${safe(document.requestNumber)}</title>
        ${buildPrintStyles()}
      </head>

      <body>
        <main class="print-document">
          <header class="document-header">
           <div class="company-info">
  <h1>Z-CANEDO TECNOLOGÍA AUTOMOTRIZ</h1>
  <p>Diagnóstico, servicio y reparación automotriz</p>
  <p>
    <strong>Tel.:</strong> 4281133 ·
    <strong>Cel.:</strong> 72222827 ·
    <strong>Responsable:</strong> Rubén Zelaya
  </p>
  <p><strong>Email:</strong> zcanedo3@hotmail.com</p>
  <p>
    <strong>Dirección:</strong> Calle F. Veracini entre Calle M. E, Norberto
    Galdo Ballivian y, Cochabamba, Bolivia
  </p>
</div>

<div class="logo-box">
  <img src="/images/caned-logo.png" alt="Z-CANEDO Tecnología Automotriz" />
</div>

            <div class="document-meta">
              <strong>SOLICITUD DE REPUESTOS</strong>
              <span>${safe(document.requestNumber)}</span>
              <em>${safe(document.orderNumber)}</em>
            </div>
          </header>

          ${sectionTitle('Datos del cliente')}
          ${dataGrid([
            ['Cliente', document.customer.name],
            ['Teléfono / WhatsApp', document.customer.phone],
            ['Fecha de solicitud', document.requestedAt],
            ['Orden de trabajo', document.orderNumber],
          ])}

          ${sectionTitle('Datos del vehículo')}
          ${dataGrid([
            ['Marca', document.vehicle.brand],
            ['Modelo', document.vehicle.model],
            ['Placa', document.vehicle.plateNumber],
            ['Solicitud', document.requestNumber],
          ])}

          <section class="provider-box">
            <span>Condición de provisión</span>
            <strong>${safe(providerLabel)}</strong>
          </section>

          ${sectionTitle('Repuestos solicitados')}
          <section class="parts-table">
            <div class="parts-header">
              <span>N°</span>
              <span>Repuesto solicitado</span>
              <span>Cantidad</span>
            </div>

            ${document.parts
              .map(
                (part, index) => `
                  <div class="parts-row">
                    <span>${index + 1}</span>
                    <strong>${display(part.name)}</strong>
                    <span>${display(part.quantity)}</span>
                  </div>
                `,
              )
              .join('')}
          </section>

          <section class="signature-grid">
            <div>Firma cliente</div>
            <div>Firma responsable</div>
          </section>

          <p class="legal-note">
            Este documento respalda la solicitud de repuestos vinculada a la orden de trabajo indicada.
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

function buildPrintStyles(): string {
  return `
    <style>
      * {
        box-sizing: border-box;
      }

@page {
  size: letter portrait;
  margin: 8mm;
}

html,
body {
  width: auto;
  min-height: auto;
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
  width: 100%;
  max-width: 19.2cm;
  min-height: 13.8cm;
  height: auto;
  margin: 0 auto;
  padding: 0;
  background: #ffffff;
}

 .document-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 155px 185px;
  align-items: center;
  gap: 12px;
  padding: 8px 0 10px;
  border-bottom: 2px solid #001b4e;
}

.company-info {
  min-width: 0;
}

.company-info h1 {
  margin: 0;
  color: #001b4e;
  font-size: 13.5px;
  line-height: 1.1;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.company-info p {
  margin: 2px 0 0;
  color: #4b5563;
  font-size: 7.8px;
  line-height: 1.25;
}

.company-info strong {
  color: #001b4e;
  font-weight: 900;
}

.logo-box img {
  max-width: 250px;
  max-height: 75px;
    border-radius: 10px;
  object-fit: contain;
}


      .company-info strong {
        color: #001b4e;
        font-weight: 900;
      }

    
      .document-meta {
  text-align: right;
  align-self: stretch;
  display: grid;
  align-content: center;
  justify-items: end;
  padding: 8px 10px;
  border-radius: 14px;

}

.document-meta strong {
  display: block;
  max-width: 120px;
  color: #001b4e;
  font-size: 9px;
  line-height: 1.15;
  font-weight: 900;
  text-transform: uppercase;
}

.document-meta span {
  display: block;
  margin-top: 5px;
  color: #001b4e;
  font-size: 15px;
  line-height: 1;
  font-weight: 900;
}

.document-meta em {
  display: inline-block;
  margin-top: 7px;
  padding: 4px 8px;
  border-radius: 999px;
  color: #075985;
  background: #e0f2fe;
  font-size: 7.5px;
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
  grid-template-columns: repeat(2, 1fr);
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

      .provider-box {
        margin-top: 7px;
        padding: 7px 9px;
        border: 1px solid #fecdd3;
        border-radius: 8px;
        background: #fff5f6;
      }

      .provider-box span {
        display: block;
        margin-bottom: 3px;
        color: #d0061b;
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .provider-box strong {
        color: #001b4e;
        font-size: 10px;
        font-weight: 900;
      }

      .parts-table {
        border: 1px solid #d7dde8;
        border-radius: 8px;
        overflow: hidden;
      }

      .parts-header,
      .parts-row {
        display: grid;
        grid-template-columns: 40px 1fr 90px;
        gap: 0;
        align-items: center;
      }

      .parts-header {
        background: #001b4e;
        color: #ffffff;
      }

      .parts-header span {
        padding: 6px 7px;
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .parts-row {
        border-top: 1px solid #d7dde8;
        background: #ffffff;
      }

      .parts-row:nth-child(odd) {
        background: #f8fafc;
      }

      .parts-row span,
      .parts-row strong {
        padding: 6px 7px;
        color: #111827;
        font-size: 9px;
        line-height: 1.25;
      }

      .parts-row span:first-child,
      .parts-row span:last-child {
        text-align: center;
        font-weight: 900;
      }

      .parts-row strong {
        font-weight: 800;
      }

.document-header,
.data-item,
.provider-box,
.signature-grid,
.legal-note {
  break-inside: avoid;
  page-break-inside: avoid;
}

.parts-table {
  page-break-inside: auto;
  break-inside: auto;
}

    .signature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 90px;
  margin-top: 36px;
}

   .signature-grid div {
  padding-top: 9px;
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
