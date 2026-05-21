export type WorkOrderPrintStatus = 'pending' | 'completed';

export interface WorkOrderPrintChargeItem {
  id: string;
  description: string;
  quantity: number;
  amount: number;
  subtotal: number;
}

export interface WorkOrderPrintDocument {
  orderNumber: string;
  status: WorkOrderPrintStatus;

  customer: {
    name: string;
    phone: string;
  };

  vehicle: {
    brand: string;
    model: string;
    plateNumber: string;
  };

  dates: {
    receptionDate: string;
    receptionTime?: string;
    completedDate?: string;
    completedAt?: string;
  };

  mechanicName: string;
  problemDescription: string;
  workDescription: string;
  chargeItems?: WorkOrderPrintChargeItem[];
  totalAmount: number;
}
