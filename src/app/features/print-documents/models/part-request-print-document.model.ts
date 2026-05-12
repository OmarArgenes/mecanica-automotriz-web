export interface PartRequestPrintDocument {
  requestNumber: string;
  orderNumber: string;

  customer: {
    name: string;
    phone: string;
  };

  vehicle: {
    brand: string;
    model: string;
    plateNumber: string;
  };

  requestedAt: string;
  workshopProvidesParts: boolean;

  parts: PartRequestPrintItem[];
}

export interface PartRequestPrintItem {
  name: string;
  quantity: number;
}
