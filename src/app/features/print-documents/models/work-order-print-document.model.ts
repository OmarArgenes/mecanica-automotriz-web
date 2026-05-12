export type WorkOrderPrintStatus = 'pending' | 'completed';

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
    completedDate?: string;
  };

  mechanicName: string;
  problemDescription: string;
  workDescription: string;
  totalAmount: number;
}
