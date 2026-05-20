export type PartRequestStatus =
  | 'pending'
  | 'quoted'
  | 'approved'
  | 'purchased'
  | 'delivered'
  | 'cancelled';

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
  neededDate?: string;
  status: PartRequestStatus;
  workshopProvidesParts: boolean;
  notes?: string;
  totalAmount: number;

  parts: PartRequestItem[];
}

export interface PartRequestItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
  supplierName?: string;
  notes?: string;
}

export interface PartRequestFormValue {
  workshopProvidesParts: boolean;
  parts: PartRequestItem[];
}
