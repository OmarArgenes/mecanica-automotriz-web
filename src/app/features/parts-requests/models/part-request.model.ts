export interface PartRequest {
  id: string;
  requestNumber: string;

  workOrderId: string;
  orderNumber: string;

  customerName: string;
  customerPhone: string;

  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;

  requestedAt: string;
  workshopProvidesParts: boolean;

  parts: PartRequestItem[];
}

export interface PartRequestItem {
  id: string;
  name: string;
  quantity: number;
}

export interface PartRequestFormValue {
  workshopProvidesParts: boolean;
  parts: PartRequestItem[];
}
