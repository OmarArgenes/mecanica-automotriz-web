import { ReceptionPrintDocument } from '../models/reception-print-document.model';

export function buildReceptionReceiptTemplate(
  document: ReceptionPrintDocument,
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Constancia ${safe(document.orderCode)}</title>
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
              <span>${safe(document.orderCode)}</span>
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
  ['Conductor', document.intake.driverName],
  ['Mecánico asignado', document.intake.mechanicName],
])}

${sectionTitle('Estado visual e inventario')}
${dataGrid([
  ['Estado visual', vehicleConditionSummary(document)],
  ['Combustible', document.inspection.fuelLevel],
  ['Llanta delantera derecha', document.inspection.tireCondition.frontRight],
  ['Llanta delantera izquierda', document.inspection.tireCondition.frontLeft],
  ['Llanta trasera derecha', document.inspection.tireCondition.rearRight],
  ['Llanta trasera izquierda', document.inspection.tireCondition.rearLeft],
])}

${textBlock('Inventario recibido', inventorySummary(document))}
${textBlock('Observaciones de inventario', document.inspection.inventoryObservations)}

${textBlock('Problemas reportados por el cliente', document.intake.reportedProblems)}

${authorizationNote()}

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
  size: letter landscape;
  margin: 0;
}

html,
body {
  width: 27.94cm;
  min-height: 21.59cm;
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
  width: 27.94cm;
  min-height: 21.59cm;
  padding: 7mm 8mm;
  background: #ffffff;
}
     .document-header {
  display: grid;
  grid-template-columns: 185px 1fr 190px;
  align-items: center;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #001b4e;
}

      .logo-box {
        display: flex;
        align-items: center;
        justify-content: center;
      }

  .logo-box img {
  max-width: 175px;
  max-height: 78px;
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

      .authorization-note {
  margin-top: 8px;
  padding: 7px 9px;
  border: 1px solid #d7dde8;
  border-left: 4px solid #001b4e;
  border-radius: 8px;
  background: #f8fafc;
}

.authorization-note p {
  margin: 0 0 3px;
  color: #374151;
  font-size: 8.4px;
  line-height: 1.28;
}

.authorization-note p:last-child {
  margin-bottom: 0;
}

.authorization-note strong {
  color: #001b4e;
  font-weight: 900;
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 90px;
  margin-top: 34px;
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

function authorizationNote(): string {
  return `
    <section class="authorization-note">
      <p>
        <strong>Autorización de trabajo:</strong>
        El cliente autoriza a Z-CANEDO a realizar los trabajos indicados en el detalle y a utilizar los insumos necesarios para la reparación.
      </p>

      <p>
        <strong>Prueba técnica:</strong>
        El cliente autoriza el manejo del vehículo únicamente con fines de prueba técnica.
      </p>

      <p>
        <strong>Retiro del vehículo:</strong>
        El cliente se compromete a retirar el vehículo una vez concluidas las reparaciones. En caso contrario, se cobrará Bs. 10 por día por concepto de parqueo.
      </p>
    </section>
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

function vehicleConditionSummary(document: ReceptionPrintDocument): string {
  const condition = document.inspection.vehicleCondition;

  const selectedConditions = [
    condition.dented ? 'Abollado' : '',
    condition.scratched ? 'Raspadura' : '',
    condition.broken ? 'Roto' : '',
    condition.noDamage ? 'No tiene daños visibles' : '',
    condition.other ? `Otros: ${condition.other}` : '',
  ].filter(Boolean);

  return selectedConditions.length > 0 ? selectedConditions.join(', ') : '—';
}

function inventorySummary(document: ReceptionPrintDocument): string {
  const inventory = document.inspection.vehicleInventory;

  const inventoryLabels: Array<
    [keyof ReceptionPrintDocument['inspection']['vehicleInventory'], string]
  > = [
    ['spareTire', 'Llanta de auxilio'],
    ['wheelWrench', 'Llave de ruedas'],
    ['jack', 'Gata'],
    ['fireExtinguisher', 'Extinguidor'],
    ['hubcaps', 'Tapacubos'],
    ['mirrors', 'Espejos'],
    ['antenna', 'Antena'],
    ['radio', 'Radio'],
    ['tools', 'Herramientas'],
    ['floorMats', 'Pisos'],
    ['fogLights', 'Halógenos'],
    ['other', 'Otros'],
  ];

  const selectedItems = inventoryLabels
    .filter(([key]) => inventory[key])
    .map(([, label]) => label);

  return selectedItems.length > 0 ? selectedItems.join(', ') : '—';
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
