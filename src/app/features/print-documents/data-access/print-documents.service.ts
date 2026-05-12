import { Injectable } from '@angular/core';

import { ReceptionPrintDocument } from '../models/reception-print-document.model';
import { WorkOrderPrintDocument } from '../models/work-order-print-document.model';
import { buildReceptionReceiptTemplate } from '../templates/reception-receipt.template';
import { buildWorkOrderTemplate } from '../templates/work-order.template';

@Injectable({
  providedIn: 'root',
})
export class PrintDocumentsService {
  printReceptionReceipt(document: ReceptionPrintDocument): void {
    this.openPrintWindow(buildReceptionReceiptTemplate(document));
  }

  printWorkOrder(document: WorkOrderPrintDocument): void {
    this.openPrintWindow(buildWorkOrderTemplate(document));
  }

  private openPrintWindow(html: string): void {
    const printWindow = window.open('', '_blank', 'width=980,height=720');

    if (!printWindow) {
      window.alert(
        'No se pudo abrir la ventana de impresión. Verifica si el navegador bloqueó las ventanas emergentes.',
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
