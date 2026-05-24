import { Injectable } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';

export type TireConditionStatus = 'Bueno' | 'Regular' | 'Malo' | '';

export type FuelLevelStatus = 'E' | '1/4' | '1/2' | '3/4' | 'F' | '';

export interface VehicleConditionValue {
  dented: boolean;
  scratched: boolean;
  broken: boolean;
  noDamage: boolean;
  other: string;
}

export interface TireConditionValue {
  frontRight: TireConditionStatus;
  frontLeft: TireConditionStatus;
  rearRight: TireConditionStatus;
  rearLeft: TireConditionStatus;
}

export interface VehicleInventoryValue {
  spareTire: boolean;
  wheelWrench: boolean;
  jack: boolean;
  fireExtinguisher: boolean;
  hubcaps: boolean;
  mirrors: boolean;
  antenna: boolean;
  radio: boolean;
  tools: boolean;
  floorMats: boolean;
  fogLights: boolean;
  other: boolean;
}

export interface VehicleIntakeFormValue {
  customerFullName: string;
  customerPhone: string;
  customerDocument?: string | null;
  customerAddress?: string | null;

  mechanicName?: string | null;
  driverName?: string | null;

  plate: string;
  brand: string;
  model: string;
  year?: string | number | null;
  color?: string | null;
  mileage?: string | number | null;
  fuelType?: string | null;

  vehicleCondition?: VehicleConditionValue | null;
  tireCondition?: TireConditionValue | null;
  fuelLevel?: FuelLevelStatus | null;
  vehicleInventory?: VehicleInventoryValue | null;
  inventoryObservations?: string | null;

  intakeDate: string;
  intakeTime: string;
  arrivalMethod?: string | null;
  arrivalState: string;
  reportedProblems: string;
  initialObservation?: string | null;
}
export interface VehicleIntakeCreateOptions {
  customerId?: string | null;
  vehicleId?: string | null;
}

export interface VehicleIntakeResult {
  receptionCode: string;
  orderCode: string;
  customerId: string;
  vehicleId: string;
}

export interface VehicleIntakeListItem {
  id: string;
  workOrderId: string;
  customerId: string;
  vehicleId: string;

  receptionCode: string;
  orderCode: string;

  customer: {
    fullName: string;
    phone: string;
    document: string;
    address: string;
  };

  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year: string;
    color: string;
    mileage: string;
    fuelType: string;
  };

  intake: {
    date: string;
    time: string;
    arrivalMethod: string;
    arrivalState: string;
    driverName: string;
    mechanicName: string;
    reportedProblems: string;
    initialObservation: string;
  };

  inspection: {
    vehicleCondition: VehicleConditionValue;
    tireCondition: TireConditionValue;
    fuelLevel: FuelLevelStatus;
    vehicleInventory: VehicleInventoryValue;
    inventoryObservations: string;
  };
}

export interface VehicleIntakeSearchVehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string;
  mileage?: number | null;
  observations?: string;
}

export interface VehicleIntakeSearchCustomer {
  id: string;
  fullName: string;
  documentNumber: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  vehicles: VehicleIntakeSearchVehicle[];
}

interface CustomerRow {
  id: string;
  full_name: string;
  document_number: string | null;
  phone: string;
  address: string | null;
}

interface VehicleRow {
  id: string;
  customer_id: string;
  plate_number: string;
}

interface VehicleSearchRow {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  mileage: number | null;
  observations: string | null;
}

interface CustomerSearchRow {
  id: string;
  full_name: string;
  document_number: string | null;
  phone: string;
  whatsapp: string | null;
  address: string | null;
  vehicles?: VehicleSearchRow[];
}

interface VehicleOwnerSearchRow {
  customer_id: string;
}

interface VehicleIntakeListRow {
  id: string;
  work_order_id: string;
  customer_id: string;
  vehicle_id: string;

  reception_number: string;

  customer_name_snapshot: string;
  customer_phone_snapshot: string | null;
  customer_document_snapshot: string | null;
  customer_address_snapshot: string | null;

  vehicle_plate_snapshot: string;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  vehicle_year_snapshot: number | null;
  vehicle_color_snapshot: string | null;
  vehicle_mileage_snapshot: number | null;
  vehicle_fuel_type_snapshot: string | null;

  intake_date: string;
  intake_time: string | null;
  arrival_method: string | null;
  arrival_state: string;
  driver_name: string | null;
  mechanic_name?: string | null;
  reported_problems: string;
  initial_observation: string | null;

  vehicle_condition: unknown;
  tire_condition: unknown;
  fuel_level: FuelLevelStatus | null;
  vehicle_inventory: unknown;
  inventory_observations: string | null;
}

interface WorkOrderCodeRow {
  id: string;
  order_number: string;
  mechanic_name: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleIntakeService {
  async searchCustomerVehicleCandidates(
    term: string,
  ): Promise<VehicleIntakeSearchCustomer[]> {
    const cleanTerm = term.trim();

    if (cleanTerm.length < 2) {
      return [];
    }

    const textLikeTerm = `%${cleanTerm}%`;
    const plateLikeTerm = `%${this.normalizePlate(cleanTerm)}%`;
    const matches = new Map<string, VehicleIntakeSearchCustomer>();

    const customerQueries = await Promise.all([
      supabase
        .from('customers')
        .select(this.customerSearchSelect())
        .ilike('full_name', textLikeTerm)
        .limit(8),

      supabase
        .from('customers')
        .select(this.customerSearchSelect())
        .ilike('document_number', textLikeTerm)
        .limit(8),

      supabase
        .from('customers')
        .select(this.customerSearchSelect())
        .ilike('phone', textLikeTerm)
        .limit(8),

      supabase
        .from('customers')
        .select(this.customerSearchSelect())
        .ilike('whatsapp', textLikeTerm)
        .limit(8),
    ]);

    for (const response of customerQueries) {
      if (response.error) {
        throw new Error(response.error.message);
      }
      for (const customer of (response.data ??
        []) as unknown as CustomerSearchRow[]) {
        const mappedCustomer = this.mapSearchCustomer(customer);
        matches.set(mappedCustomer.id, mappedCustomer);
      }
    }

    const { data: vehiclesByPlate, error: vehicleSearchError } = await supabase
      .from('vehicles')
      .select('customer_id')
      .ilike('plate_number', plateLikeTerm)
      .limit(8);

    if (vehicleSearchError) {
      throw new Error(vehicleSearchError.message);
    }

    const customerIdsByPlate = [
      ...new Set(
        ((vehiclesByPlate ?? []) as VehicleOwnerSearchRow[])
          .map((vehicle) => vehicle.customer_id)
          .filter(Boolean),
      ),
    ];

    if (customerIdsByPlate.length > 0) {
      const { data: customersByPlate, error: customersByPlateError } =
        await supabase
          .from('customers')
          .select(this.customerSearchSelect())
          .in('id', customerIdsByPlate);

      if (customersByPlateError) {
        throw new Error(customersByPlateError.message);
      }

      for (const customer of (customersByPlate ??
        []) as unknown as CustomerSearchRow[]) {
        const mappedCustomer = this.mapSearchCustomer(customer);
        matches.set(mappedCustomer.id, mappedCustomer);
      }
    }

    const { data: fallbackCustomers, error: fallbackError } = await supabase
      .from('customers')
      .select(this.customerSearchSelect())
      .order('full_name', { ascending: true })
      .limit(150);

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    const normalizedTerm = this.normalizeSearchText(cleanTerm);

    for (const customer of (fallbackCustomers ??
      []) as unknown as CustomerSearchRow[]) {
      const mappedCustomer = this.mapSearchCustomer(customer);

      if (this.customerMatchesSearchTerm(mappedCustomer, normalizedTerm)) {
        matches.set(mappedCustomer.id, mappedCustomer);
      }
    }

    return [...matches.values()].slice(0, 8);
  }

  async createVehicleIntake(
    formValue: VehicleIntakeFormValue,
    options: VehicleIntakeCreateOptions = {},
  ): Promise<VehicleIntakeResult> {
    const customer = options.customerId
      ? await this.updateCustomer(options.customerId, formValue)
      : await this.findOrCreateCustomer(formValue);

    const vehicle = options.vehicleId
      ? await this.findAndUpdateSelectedVehicle(
          options.vehicleId,
          customer.id,
          formValue,
        )
      : await this.findOrCreateVehicle(customer.id, formValue);

    const { data: workOrder, error: workOrderError } = await supabase
      .from('work_orders')
      .insert({
        customer_id: customer.id,
        vehicle_id: vehicle.id,

        customer_name_snapshot: formValue.customerFullName.trim(),
        customer_phone_snapshot: formValue.customerPhone.trim(),
        vehicle_plate_snapshot: this.normalizePlate(formValue.plate),
        vehicle_brand_snapshot: formValue.brand.trim(),
        vehicle_model_snapshot: formValue.model.trim(),

        reception_date: formValue.intakeDate,
        reception_time: formValue.intakeTime || null,
        mechanic_name: this.trimToNull(formValue.mechanicName),
        problem_description: formValue.reportedProblems.trim(),
        work_description: this.buildInitialWorkDescription(formValue),
        status: 'pending',
      })
      .select('id, order_number')
      .single();

    if (workOrderError) {
      throw new Error(workOrderError.message);
    }

    const { data: intake, error: intakeError } = await supabase
      .from('vehicle_intakes')
      .insert({
        work_order_id: workOrder.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,

        customer_name_snapshot: formValue.customerFullName.trim(),
        customer_phone_snapshot: formValue.customerPhone.trim(),
        customer_document_snapshot: this.trimToNull(formValue.customerDocument),
        customer_address_snapshot: this.trimToNull(formValue.customerAddress),

        vehicle_plate_snapshot: this.normalizePlate(formValue.plate),
        vehicle_brand_snapshot: formValue.brand.trim(),
        vehicle_model_snapshot: formValue.model.trim(),
        vehicle_year_snapshot: this.toIntegerOrNull(formValue.year),
        vehicle_color_snapshot: this.trimToNull(formValue.color),
        vehicle_mileage_snapshot: this.toIntegerOrNull(formValue.mileage),
        vehicle_fuel_type_snapshot: this.trimToNull(formValue.fuelType),

        intake_date: formValue.intakeDate,
        intake_time: formValue.intakeTime || null,
        arrival_method: this.trimToNull(formValue.arrivalMethod),
        arrival_state: formValue.arrivalState.trim(),
        driver_name: this.trimToNull(formValue.driverName),
        reported_problems: formValue.reportedProblems.trim(),
        initial_observation: this.trimToNull(formValue.initialObservation),

        vehicle_condition: this.normalizeVehicleCondition(
          formValue.vehicleCondition,
        ),
        tire_condition: this.normalizeTireCondition(formValue.tireCondition),
        fuel_level: this.trimToNull(formValue.fuelLevel),
        vehicle_inventory: this.normalizeVehicleInventory(
          formValue.vehicleInventory,
        ),
        inventory_observations: this.trimToNull(
          formValue.inventoryObservations,
        ),
      })
      .select('reception_number')
      .single();

    if (intakeError) {
      throw new Error(intakeError.message);
    }

    return {
      receptionCode: intake.reception_number,
      orderCode: workOrder.order_number,
      customerId: customer.id,
      vehicleId: vehicle.id,
    };
  }

  async updateVehicleIntake(
    intakeId: string,
    workOrderId: string,
    formValue: VehicleIntakeFormValue,
    options: VehicleIntakeCreateOptions = {},
  ): Promise<VehicleIntakeResult> {
    const customer = options.customerId
      ? await this.updateCustomer(options.customerId, formValue)
      : await this.findOrCreateCustomer(formValue);

    const vehicle = options.vehicleId
      ? await this.findAndUpdateSelectedVehicle(
          options.vehicleId,
          customer.id,
          formValue,
        )
      : await this.findOrCreateVehicle(customer.id, formValue);

    const { data: workOrder, error: workOrderError } = await supabase
      .from('work_orders')
      .update({
        customer_id: customer.id,
        vehicle_id: vehicle.id,

        customer_name_snapshot: formValue.customerFullName.trim(),
        customer_phone_snapshot: formValue.customerPhone.trim(),
        vehicle_plate_snapshot: this.normalizePlate(formValue.plate),
        vehicle_brand_snapshot: formValue.brand.trim(),
        vehicle_model_snapshot: formValue.model.trim(),

        reception_date: formValue.intakeDate,
        reception_time: formValue.intakeTime || null,
        mechanic_name: this.trimToNull(formValue.mechanicName),
        problem_description: formValue.reportedProblems.trim(),
        work_description: this.buildInitialWorkDescription(formValue),
      })
      .eq('id', workOrderId)
      .select('id, order_number')
      .single();

    if (workOrderError) {
      throw new Error(workOrderError.message);
    }

    const { data: intake, error: intakeError } = await supabase
      .from('vehicle_intakes')
      .update({
        work_order_id: workOrder.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,

        customer_name_snapshot: formValue.customerFullName.trim(),
        customer_phone_snapshot: formValue.customerPhone.trim(),
        customer_document_snapshot: this.trimToNull(formValue.customerDocument),
        customer_address_snapshot: this.trimToNull(formValue.customerAddress),

        vehicle_plate_snapshot: this.normalizePlate(formValue.plate),
        vehicle_brand_snapshot: formValue.brand.trim(),
        vehicle_model_snapshot: formValue.model.trim(),
        vehicle_year_snapshot: this.toIntegerOrNull(formValue.year),
        vehicle_color_snapshot: this.trimToNull(formValue.color),
        vehicle_mileage_snapshot: this.toIntegerOrNull(formValue.mileage),
        vehicle_fuel_type_snapshot: this.trimToNull(formValue.fuelType),

        intake_date: formValue.intakeDate,
        intake_time: formValue.intakeTime || null,
        arrival_method: this.trimToNull(formValue.arrivalMethod),
        arrival_state: formValue.arrivalState.trim(),
        driver_name: this.trimToNull(formValue.driverName),
        reported_problems: formValue.reportedProblems.trim(),
        initial_observation: this.trimToNull(formValue.initialObservation),

        vehicle_condition: this.normalizeVehicleCondition(
          formValue.vehicleCondition,
        ),
        tire_condition: this.normalizeTireCondition(formValue.tireCondition),
        fuel_level: this.trimToNull(formValue.fuelLevel),
        vehicle_inventory: this.normalizeVehicleInventory(
          formValue.vehicleInventory,
        ),
        inventory_observations: this.trimToNull(
          formValue.inventoryObservations,
        ),
      })
      .eq('id', intakeId)
      .select('reception_number')
      .single();

    if (intakeError) {
      throw new Error(intakeError.message);
    }

    return {
      receptionCode: intake.reception_number,
      orderCode: workOrder.order_number,
      customerId: customer.id,
      vehicleId: vehicle.id,
    };
  }

  async loadVehicleIntakes(): Promise<VehicleIntakeListItem[]> {
    const { data, error } = await supabase
      .from('vehicle_intakes')
      .select(
        `
        id,
        work_order_id,
        customer_id,
        vehicle_id,
        reception_number,
        customer_name_snapshot,
        customer_phone_snapshot,
        customer_document_snapshot,
        customer_address_snapshot,
        vehicle_plate_snapshot,
        vehicle_brand_snapshot,
        vehicle_model_snapshot,
        vehicle_year_snapshot,
        vehicle_color_snapshot,
        vehicle_mileage_snapshot,
        vehicle_fuel_type_snapshot,
        intake_date,
        intake_time,
        arrival_method,
        arrival_state,
        driver_name,
        reported_problems,
        initial_observation,
        vehicle_condition,
        tire_condition,
        fuel_level,
        vehicle_inventory,
        inventory_observations
      `,
      )
      .order('intake_date', { ascending: false })
      .order('intake_time', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as VehicleIntakeListRow[];
    const workOrderIds = [...new Set(rows.map((row) => row.work_order_id))];

    const workOrderById = new Map<string, WorkOrderCodeRow>();

    if (workOrderIds.length > 0) {
      const { data: workOrders, error: workOrdersError } = await supabase
        .from('work_orders')
        .select('id, order_number, mechanic_name')
        .in('id', workOrderIds);

      if (workOrdersError) {
        throw new Error(workOrdersError.message);
      }

      for (const order of (workOrders ?? []) as WorkOrderCodeRow[]) {
        workOrderById.set(order.id, order);
      }
    }

    return rows.map((row) =>
      this.mapVehicleIntakeListItem(row, workOrderById.get(row.work_order_id)),
    );
  }

  async deleteVehicleIntake(
    intakeId: string,
    workOrderId: string,
  ): Promise<void> {
    const { data: relatedPartRequests, error: findPartRequestsError } =
      await supabase
        .from('parts_requests')
        .select('id')
        .eq('work_order_id', workOrderId);

    if (findPartRequestsError) {
      throw new Error(findPartRequestsError.message);
    }

    const partRequestIds = (relatedPartRequests ?? []).map(
      (request) => request.id,
    );

    if (partRequestIds.length > 0) {
      const { error: deletePartItemsError } = await supabase
        .from('parts_request_items')
        .delete()
        .in('parts_request_id', partRequestIds);

      if (deletePartItemsError) {
        throw new Error(deletePartItemsError.message);
      }

      const { error: deletePartRequestsError } = await supabase
        .from('parts_requests')
        .delete()
        .in('id', partRequestIds);

      if (deletePartRequestsError) {
        throw new Error(deletePartRequestsError.message);
      }
    }

    const { error: deleteChargeItemsError } = await supabase
      .from('work_order_charge_items')
      .delete()
      .eq('work_order_id', workOrderId);

    if (deleteChargeItemsError) {
      throw new Error(deleteChargeItemsError.message);
    }

    const { error: deleteIntakeError } = await supabase
      .from('vehicle_intakes')
      .delete()
      .eq('id', intakeId);

    if (deleteIntakeError) {
      throw new Error(deleteIntakeError.message);
    }

    const { error: deleteOrderError } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', workOrderId);

    if (deleteOrderError) {
      throw new Error(deleteOrderError.message);
    }
  }

  private async findOrCreateCustomer(
    formValue: VehicleIntakeFormValue,
  ): Promise<CustomerRow> {
    const documentNumber = this.trimToNull(formValue.customerDocument);
    const phone = formValue.customerPhone.trim();

    if (documentNumber) {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, document_number, phone, address')
        .eq('document_number', documentNumber)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        return this.updateCustomer(data.id, formValue);
      }
    }

    const { data: customerByPhone, error: phoneError } = await supabase
      .from('customers')
      .select('id, full_name, document_number, phone, address')
      .eq('phone', phone)
      .limit(1)
      .maybeSingle();

    if (phoneError) {
      throw new Error(phoneError.message);
    }

    if (customerByPhone) {
      return this.updateCustomer(customerByPhone.id, formValue);
    }

    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        full_name: formValue.customerFullName.trim(),
        document_number: documentNumber,
        phone,
        whatsapp: phone,
        address: this.trimToNull(formValue.customerAddress),
      })
      .select('id, full_name, document_number, phone, address')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return newCustomer;
  }

  private async updateCustomer(
    customerId: string,
    formValue: VehicleIntakeFormValue,
  ): Promise<CustomerRow> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        full_name: formValue.customerFullName.trim(),
        document_number: this.trimToNull(formValue.customerDocument),
        phone: formValue.customerPhone.trim(),
        whatsapp: formValue.customerPhone.trim(),
        address: this.trimToNull(formValue.customerAddress),
      })
      .eq('id', customerId)
      .select('id, full_name, document_number, phone, address')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private async findAndUpdateSelectedVehicle(
    vehicleId: string,
    customerId: string,
    formValue: VehicleIntakeFormValue,
  ): Promise<VehicleRow> {
    const { data: existingVehicle, error: findError } = await supabase
      .from('vehicles')
      .select('id, customer_id, plate_number')
      .eq('id', vehicleId)
      .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (!existingVehicle) {
      throw new Error('No se encontró el vehículo seleccionado.');
    }

    if (existingVehicle.customer_id !== customerId) {
      throw new Error(
        'El vehículo seleccionado no pertenece al cliente seleccionado. Revisa la información antes de continuar.',
      );
    }

    return this.updateVehicle(existingVehicle.id, customerId, formValue);
  }

  private async findOrCreateVehicle(
    customerId: string,
    formValue: VehicleIntakeFormValue,
  ): Promise<VehicleRow> {
    const plateNumber = this.normalizePlate(formValue.plate);

    const { data: existingVehicle, error: findError } = await supabase
      .from('vehicles')
      .select('id, customer_id, plate_number')
      .ilike('plate_number', plateNumber)
      .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (existingVehicle) {
      if (existingVehicle.customer_id !== customerId) {
        throw new Error(
          'La placa ingresada ya está registrada con otro cliente. Revisa el módulo de vehículos antes de continuar.',
        );
      }

      return this.updateVehicle(existingVehicle.id, customerId, formValue);
    }

    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        customer_id: customerId,
        plate_number: plateNumber,
        brand: formValue.brand.trim(),
        model: formValue.model.trim(),
        year: this.toIntegerOrNull(formValue.year),
        color: this.trimToNull(formValue.color),
        mileage: this.toIntegerOrNull(formValue.mileage),
        observations: this.trimToNull(formValue.initialObservation),
      })
      .select('id, customer_id, plate_number')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return newVehicle;
  }

  private async updateVehicle(
    vehicleId: string,
    customerId: string,
    formValue: VehicleIntakeFormValue,
  ): Promise<VehicleRow> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        brand: formValue.brand.trim(),
        model: formValue.model.trim(),
        year: this.toIntegerOrNull(formValue.year),
        color: this.trimToNull(formValue.color),
        mileage: this.toIntegerOrNull(formValue.mileage),
        observations: this.trimToNull(formValue.initialObservation),
      })
      .eq('id', vehicleId)
      .eq('customer_id', customerId)
      .select('id, customer_id, plate_number')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private customerSearchSelect(): string {
    return `
      id,
      full_name,
      document_number,
      phone,
      whatsapp,
      address,
      vehicles (
        id,
        plate_number,
        brand,
        model,
        year,
        color,
        mileage,
        observations
      )
    `;
  }

  private mapSearchCustomer(
    customer: CustomerSearchRow,
  ): VehicleIntakeSearchCustomer {
    return {
      id: customer.id,
      fullName: customer.full_name,
      documentNumber: customer.document_number ?? '',
      phone: customer.phone,
      whatsapp: customer.whatsapp ?? '',
      address: customer.address ?? '',
      vehicles: (customer.vehicles ?? [])
        .map((vehicle) => ({
          id: vehicle.id,
          plateNumber: vehicle.plate_number,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color ?? '',
          mileage: vehicle.mileage,
          observations: vehicle.observations ?? '',
        }))
        .sort((a, b) => a.plateNumber.localeCompare(b.plateNumber)),
    };
  }
  private customerMatchesSearchTerm(
    customer: VehicleIntakeSearchCustomer,
    normalizedTerm: string,
  ): boolean {
    const customerValues = [
      customer.fullName,
      customer.documentNumber,
      customer.phone,
      customer.whatsapp,
      customer.address,
    ];

    const vehicleValues = customer.vehicles.flatMap((vehicle) => [
      vehicle.plateNumber,
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      vehicle.color,
      vehicle.mileage,
      vehicle.observations,
    ]);

    return [...customerValues, ...vehicleValues]
      .filter((value) => value !== null && value !== undefined)
      .some((value) =>
        this.normalizeSearchText(String(value)).includes(normalizedTerm),
      );
  }

  private normalizeSearchText(value?: string | null): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private mapVehicleIntakeListItem(
    row: VehicleIntakeListRow,
    workOrder?: WorkOrderCodeRow,
  ): VehicleIntakeListItem {
    return {
      id: row.id,
      workOrderId: row.work_order_id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,

      receptionCode: row.reception_number,
      orderCode: workOrder?.order_number ?? '',

      customer: {
        fullName: row.customer_name_snapshot,
        phone: row.customer_phone_snapshot ?? '',
        document: row.customer_document_snapshot ?? '',
        address: row.customer_address_snapshot ?? '',
      },

      vehicle: {
        plate: row.vehicle_plate_snapshot,
        brand: row.vehicle_brand_snapshot,
        model: row.vehicle_model_snapshot,
        year: row.vehicle_year_snapshot
          ? String(row.vehicle_year_snapshot)
          : '',
        color: row.vehicle_color_snapshot ?? '',
        mileage: row.vehicle_mileage_snapshot
          ? String(row.vehicle_mileage_snapshot)
          : '',
        fuelType: row.vehicle_fuel_type_snapshot ?? '',
      },

      intake: {
        date: row.intake_date,
        time: row.intake_time ?? '',
        arrivalMethod: row.arrival_method ?? '',
        arrivalState: row.arrival_state,
        driverName: row.driver_name ?? '',
        mechanicName: workOrder?.mechanic_name ?? '',
        reportedProblems: row.reported_problems,
        initialObservation: row.initial_observation ?? '',
      },

      inspection: {
        vehicleCondition: this.normalizeVehicleCondition(
          row.vehicle_condition as VehicleConditionValue,
        ),
        tireCondition: this.normalizeTireCondition(
          row.tire_condition as TireConditionValue,
        ),
        fuelLevel: row.fuel_level ?? '',
        vehicleInventory: this.normalizeVehicleInventory(
          row.vehicle_inventory as VehicleInventoryValue,
        ),
        inventoryObservations: row.inventory_observations ?? '',
      },
    };
  }

  private normalizeVehicleCondition(
    value?: Partial<VehicleConditionValue> | null,
  ): VehicleConditionValue {
    return {
      dented: !!value?.dented,
      scratched: !!value?.scratched,
      broken: !!value?.broken,
      noDamage: !!value?.noDamage,
      other: String(value?.other ?? '').trim(),
    };
  }

  private normalizeTireCondition(
    value?: Partial<TireConditionValue> | null,
  ): TireConditionValue {
    return {
      frontRight: value?.frontRight ?? '',
      frontLeft: value?.frontLeft ?? '',
      rearRight: value?.rearRight ?? '',
      rearLeft: value?.rearLeft ?? '',
    };
  }

  private normalizeVehicleInventory(
    value?: Partial<VehicleInventoryValue> | null,
  ): VehicleInventoryValue {
    return {
      spareTire: !!value?.spareTire,
      wheelWrench: !!value?.wheelWrench,
      jack: !!value?.jack,
      fireExtinguisher: !!value?.fireExtinguisher,
      hubcaps: !!value?.hubcaps,
      mirrors: !!value?.mirrors,
      antenna: !!value?.antenna,
      radio: !!value?.radio,
      tools: !!value?.tools,
      floorMats: !!value?.floorMats,
      fogLights: !!value?.fogLights,
      other: !!value?.other,
    };
  }

  private buildInitialWorkDescription(
    formValue: VehicleIntakeFormValue,
  ): string {
    const lines = [
      `Estado de llegada: ${formValue.arrivalState}`,
      formValue.arrivalMethod ? `Cómo llega: ${formValue.arrivalMethod}` : null,
      formValue.initialObservation
        ? `Observación inicial: ${formValue.initialObservation}`
        : null,
    ].filter(Boolean);

    return lines.join('\n');
  }

  private normalizePlate(plate?: string | null): string {
    return String(plate ?? '')
      .trim()
      .toUpperCase();
  }

  private trimToNull(value?: string | null): string | null {
    const trimmed = String(value ?? '').trim();
    return trimmed ? trimmed : null;
  }

  private toIntegerOrNull(value?: string | number | null): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return Math.floor(numericValue);
  }
}
