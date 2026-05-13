export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  vin?: string;

  customerName: string;
  customerPhone: string;

  observations?: string;
  registeredAt: string;
}

export interface VehicleFormValue {
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  vin?: string;

  customerName: string;
  customerPhone: string;

  observations?: string;
}
