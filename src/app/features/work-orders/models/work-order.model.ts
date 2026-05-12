export type WorkOrderStatus = 'pending' | 'completed';

export interface WorkOrder {
  id: string;
  orderNumber: string;

  customerName: string;
  customerPhone: string;

  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;

  receptionDate: string;
  completedDate?: string;

  mechanicName: string;
  problemDescription: string;
  workDescription: string;

  totalAmount: number;
  status: WorkOrderStatus;
}
