import { Injectable, signal } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';
import {
  Customer,
  CustomerFormValue,
  CustomerVehicleFormValue,
  CustomerVehicleSummary,
} from '../models/customer.model';

interface SupabaseVehicleRow {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  vin: string | null;
  mileage: number | null;
  observations: string | null;
}

interface SupabaseCustomerRow {
  id: string;
  full_name: string;
  document_number: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  vehicles?: SupabaseVehicleRow[];
}

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly customersSignal = signal<Customer[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly customers = this.customersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    void this.loadCustomers();
  }

  async loadCustomers(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const { data, error } = await supabase
      .from('customers')
      .select(
        `
        id,
        full_name,
        document_number,
        phone,
        whatsapp,
        email,
        address,
        created_at,
        vehicles (
          id,
          plate_number,
          brand,
          model,
          year,
          color,
          vin,
          mileage,
          observations
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      this.loadingSignal.set(false);
      this.errorSignal.set(error.message);
      throw new Error(error.message);
    }

    this.customersSignal.set(
      ((data ?? []) as SupabaseCustomerRow[]).map((customer) =>
        this.mapCustomerFromDatabase(customer),
      ),
    );

    this.loadingSignal.set(false);
  }

  async createCustomer(formValue: CustomerFormValue): Promise<void> {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        full_name: formValue.fullName.trim(),
        document_number: this.trimToNull(formValue.documentNumber),
        phone: formValue.phone.trim(),
        whatsapp: this.trimToNull(formValue.whatsapp),
        email: this.trimToNull(formValue.email),
        address: this.trimToNull(formValue.address),
      })
      .select('id')
      .single();

    if (customerError) {
      throw new Error(customerError.message);
    }

    const vehicleRows = this.buildVehicleRows(
      customer.id,
      formValue.vehicles ?? [],
    );

    if (vehicleRows.length > 0) {
      const { error: vehiclesError } = await supabase
        .from('vehicles')
        .insert(vehicleRows);

      if (vehiclesError) {
        throw new Error(vehiclesError.message);
      }
    }

    await this.loadCustomers();
  }

  async updateCustomer(
    customerId: string,
    formValue: CustomerFormValue,
  ): Promise<void> {
    const { error: customerError } = await supabase
      .from('customers')
      .update({
        full_name: formValue.fullName.trim(),
        document_number: this.trimToNull(formValue.documentNumber),
        phone: formValue.phone.trim(),
        whatsapp: this.trimToNull(formValue.whatsapp),
        email: this.trimToNull(formValue.email),
        address: this.trimToNull(formValue.address),
      })
      .eq('id', customerId);

    if (customerError) {
      throw new Error(customerError.message);
    }

    await this.syncCustomerVehicles(customerId, formValue.vehicles ?? []);
    await this.syncCustomerSnapshots(customerId, formValue);
    await this.loadCustomers();
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      throw new Error(error.message);
    }

    await this.loadCustomers();
  }

  async addVehicleToCustomer(
    customerId: string,
    vehicleValue: CustomerVehicleFormValue,
  ): Promise<void> {
    const vehicleRows = this.buildVehicleRows(customerId, [vehicleValue]);

    if (vehicleRows.length === 0) {
      return;
    }

    const { error } = await supabase.from('vehicles').insert(vehicleRows);

    if (error) {
      throw new Error(error.message);
    }

    await this.loadCustomers();
  }

  async updateVehicleForCustomer(
    customerId: string,
    vehicleId: string,
    vehicleValue: CustomerVehicleFormValue,
  ): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update(this.buildVehicleUpdateRow(vehicleValue))
      .eq('id', vehicleId)
      .eq('customer_id', customerId);

    if (error) {
      throw new Error(error.message);
    }

    await this.syncVehicleSnapshots(vehicleId, vehicleValue);
    await this.loadCustomers();
  }

  async deleteVehicleFromCustomer(
    customerId: string,
    vehicleId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('customer_id', customerId);

    if (error) {
      throw new Error(error.message);
    }

    await this.loadCustomers();
  }

  private async syncCustomerVehicles(
    customerId: string,
    vehicles: CustomerVehicleFormValue[],
  ): Promise<void> {
    const currentCustomer = this.customersSignal().find(
      (customer) => customer.id === customerId,
    );

    const currentVehicleIds = new Set(
      currentCustomer?.vehicles.map((vehicle) => vehicle.id) ?? [],
    );

    const incomingVehicleIds = new Set(
      vehicles
        .map((vehicle) => vehicle.id)
        .filter((vehicleId): vehicleId is string => !!vehicleId),
    );

    const removedVehicleIds = [...currentVehicleIds].filter(
      (vehicleId) => !incomingVehicleIds.has(vehicleId),
    );

    for (const vehicle of vehicles) {
      const hasUsefulData = this.hasVehicleData(vehicle);

      if (!hasUsefulData) {
        continue;
      }

      if (vehicle.id && currentVehicleIds.has(vehicle.id)) {
        const { error } = await supabase
          .from('vehicles')
          .update(this.buildVehicleUpdateRow(vehicle))
          .eq('id', vehicle.id)
          .eq('customer_id', customerId);

        if (error) {
          throw new Error(error.message);
        }

        await this.syncVehicleSnapshots(vehicle.id, vehicle);
        continue;
      }

      const rows = this.buildVehicleRows(customerId, [vehicle]);

      if (rows.length > 0) {
        const { error } = await supabase.from('vehicles').insert(rows);

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    if (removedVehicleIds.length > 0) {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('customer_id', customerId)
        .in('id', removedVehicleIds);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  private async syncCustomerSnapshots(
    customerId: string,
    formValue: CustomerFormValue,
  ): Promise<void> {
    const fullName = formValue.fullName.trim();
    const phone = formValue.phone.trim();
    const documentNumber = this.trimToNull(formValue.documentNumber);
    const address = this.trimToNull(formValue.address);

    const { error: workOrdersError } = await supabase
      .from('work_orders')
      .update({
        customer_name_snapshot: fullName,
        customer_phone_snapshot: phone,
      })
      .eq('customer_id', customerId);

    if (workOrdersError) {
      throw new Error(workOrdersError.message);
    }

    const { error: intakesError } = await supabase
      .from('vehicle_intakes')
      .update({
        customer_name_snapshot: fullName,
        customer_phone_snapshot: phone,
        customer_document_snapshot: documentNumber,
        customer_address_snapshot: address,
      })
      .eq('customer_id', customerId);

    if (intakesError) {
      throw new Error(intakesError.message);
    }

    const { error: partsRequestsError } = await supabase
      .from('parts_requests')
      .update({
        customer_name_snapshot: fullName,
        customer_phone_snapshot: phone,
      })
      .eq('customer_id', customerId);

    if (partsRequestsError) {
      throw new Error(partsRequestsError.message);
    }
  }

  private async syncVehicleSnapshots(
    vehicleId: string,
    vehicleValue: CustomerVehicleFormValue,
  ): Promise<void> {
    const plateNumber = this.normalizePlate(vehicleValue.plateNumber);
    const brand = vehicleValue.brand?.trim() || 'Sin marca';
    const model = vehicleValue.model?.trim() || 'Sin modelo';

    const { error: workOrdersError } = await supabase
      .from('work_orders')
      .update({
        vehicle_plate_snapshot: plateNumber,
        vehicle_brand_snapshot: brand,
        vehicle_model_snapshot: model,
      })
      .eq('vehicle_id', vehicleId);

    if (workOrdersError) {
      throw new Error(workOrdersError.message);
    }

    const { error: intakesError } = await supabase
      .from('vehicle_intakes')
      .update({
        vehicle_plate_snapshot: plateNumber,
        vehicle_brand_snapshot: brand,
        vehicle_model_snapshot: model,
        vehicle_year_snapshot: vehicleValue.year ?? null,
        vehicle_color_snapshot: this.trimToNull(vehicleValue.color),
        vehicle_mileage_snapshot: vehicleValue.mileage ?? null,
      })
      .eq('vehicle_id', vehicleId);

    if (intakesError) {
      throw new Error(intakesError.message);
    }

    const { error: partsRequestsError } = await supabase
      .from('parts_requests')
      .update({
        vehicle_plate_snapshot: plateNumber,
        vehicle_brand_snapshot: brand,
        vehicle_model_snapshot: model,
      })
      .eq('vehicle_id', vehicleId);

    if (partsRequestsError) {
      throw new Error(partsRequestsError.message);
    }
  }

  private buildVehicleRows(
    customerId: string,
    vehicles: CustomerVehicleFormValue[],
  ) {
    return vehicles
      .filter((vehicle) => this.hasVehicleData(vehicle))
      .map((vehicle) => ({
        customer_id: customerId,
        plate_number: this.normalizePlate(vehicle.plateNumber),
        brand: vehicle.brand?.trim() || 'Sin marca',
        model: vehicle.model?.trim() || 'Sin modelo',
        year: vehicle.year ?? null,
        color: this.trimToNull(vehicle.color),
        vin: this.trimToNull(vehicle.vin),
        mileage: vehicle.mileage ?? null,
        observations: this.trimToNull(vehicle.observations),
      }));
  }

  private buildVehicleUpdateRow(vehicle: CustomerVehicleFormValue) {
    return {
      plate_number: this.normalizePlate(vehicle.plateNumber),
      brand: vehicle.brand?.trim() || 'Sin marca',
      model: vehicle.model?.trim() || 'Sin modelo',
      year: vehicle.year ?? null,
      color: this.trimToNull(vehicle.color),
      vin: this.trimToNull(vehicle.vin),
      mileage: vehicle.mileage ?? null,
      observations: this.trimToNull(vehicle.observations),
    };
  }

  private mapCustomerFromDatabase(customer: SupabaseCustomerRow): Customer {
    return {
      id: customer.id,
      fullName: customer.full_name,
      documentNumber: customer.document_number ?? '',
      phone: customer.phone,
      whatsapp: customer.whatsapp ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      registeredAt: this.formatDate(customer.created_at),
      vehicles: (customer.vehicles ?? [])
        .map((vehicle) => this.mapVehicleFromDatabase(vehicle))
        .sort((a, b) => a.plateNumber.localeCompare(b.plateNumber)),
    };
  }

  private mapVehicleFromDatabase(
    vehicle: SupabaseVehicleRow,
  ): CustomerVehicleSummary {
    return {
      id: vehicle.id,
      plateNumber: vehicle.plate_number,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color ?? '',
      vin: vehicle.vin ?? '',
      mileage: vehicle.mileage,
      observations: vehicle.observations ?? '',
    };
  }

  private hasVehicleData(vehicle: CustomerVehicleFormValue): boolean {
    return [
      vehicle.plateNumber,
      vehicle.brand,
      vehicle.model,
      vehicle.color,
      vehicle.vin,
      vehicle.observations,
    ].some((value) => String(value ?? '').trim().length > 0);
  }

  private normalizePlate(plateNumber?: string): string {
    const value = plateNumber?.trim().toUpperCase();

    if (value) {
      return value;
    }

    return `SIN-PLACA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private trimToNull(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private formatDate(value: string): string {
    return value.split('T')[0];
  }
}
