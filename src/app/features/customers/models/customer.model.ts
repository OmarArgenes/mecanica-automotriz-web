export interface CustomerVehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  vin?: string;
  mileage?: number | null;
  observations?: string;
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

export interface CustomerVehicleFormValue {
  id?: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  vin?: string;
  mileage?: number | null;
  observations?: string;
}

export interface CustomerFormValue {
  fullName: string;
  documentNumber: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;

  /*
   * Nueva estructura profesional:
   * permite registrar uno o varios vehículos para el mismo cliente.
   */
  vehicles?: CustomerVehicleFormValue[];

  /*
   * Compatibilidad temporal con el formulario actual.
   * Estos campos se eliminarán cuando actualicemos el modal visual.
   */
  vehiclePlateNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}
