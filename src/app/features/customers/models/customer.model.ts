export interface CustomerVehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
}

export interface Customer {
  id: string;
  fullName: string;
  documentNumber: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  registeredAt: string;
  vehicles: CustomerVehicleSummary[];
}

export interface CustomerFormValue {
  fullName: string;
  documentNumber: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;

  vehiclePlateNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}
