import { Injectable } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';

export interface VehicleIntakeFormValue {
  customerFullName: string;
  customerPhone: string;
  customerDocument?: string | null;
  customerAddress?: string | null;

  mechanicName?: string | null;

  plate: string;
  brand: string;
  model: string;
  year?: string | number | null;
  color?: string | null;
  mileage?: string | number | null;
  fuelType?: string | null;

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
        reported_problems: formValue.reportedProblems.trim(),
        initial_observation: this.trimToNull(formValue.initialObservation),
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
