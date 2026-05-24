export type WorkOrderStatus = 'pending' | 'completed';

export type WorkOrderChargeItemType = 'service' | 'supply';

export interface WorkOrderChargeItem {
  id: string;
  itemType: WorkOrderChargeItemType;
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
  recommendations: string;

  chargeItems: WorkOrderChargeItem[];
  totalAmount: number;

  status: WorkOrderStatus;
}
