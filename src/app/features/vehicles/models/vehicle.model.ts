export interface Vehicle {
  id: string;
  customerId: string;

  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  vin?: string;
  mileage?: number | null;

  observations?: string;
  registeredAt: string;
}

export interface VehicleListItem extends Vehicle {
  customerName: string;
  customerPhone: string;
  customerDocument?: string;
}

export interface VehicleFormValue {
  customerId: string;

  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  vin?: string;
  mileage?: number | null;

  observations?: string;
}
