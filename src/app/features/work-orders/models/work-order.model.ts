export type WorkOrderStatus = 'pending' | 'completed';

export interface WorkOrderChargeItem {
  id: string;
  description: string;
  quantity: number;
  amount: number;
  subtotal: number;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;

  customerName: string;
  customerPhone: string;

  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;

  receptionDate: string;
  receptionTime?: string;
  completedDate?: string;
  completedAt?: string;

  mechanicName: string;
  problemDescription: string;
  workDescription: string;

  chargeItems: WorkOrderChargeItem[];
  totalAmount: number;

  status: WorkOrderStatus;
}
