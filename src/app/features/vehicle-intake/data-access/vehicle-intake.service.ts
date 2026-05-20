import { Injectable } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';

export interface VehicleIntakeFormValue {
  customerFullName: string;
  customerPhone: string;
  customerDocument?: string | null;
  customerAddress?: string | null;

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

export interface VehicleIntakeResult {
  receptionCode: string;
  orderCode: string;
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

@Injectable({
  providedIn: 'root',
})
export class VehicleIntakeService {
  async createVehicleIntake(
    formValue: VehicleIntakeFormValue,
  ): Promise<VehicleIntakeResult> {
    const customer = await this.findOrCreateCustomer(formValue);
    const vehicle = await this.findOrCreateVehicle(customer.id, formValue);

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
        mechanic_name: '',
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
