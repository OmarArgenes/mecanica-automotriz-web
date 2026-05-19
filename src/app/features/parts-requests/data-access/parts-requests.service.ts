import { Injectable, signal } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';
import { WorkOrder } from '../../work-orders/models/work-order.model';
import {
  PartRequest,
  PartRequestItem,
  PartRequestStatus,
} from '../models/part-request.model';

interface SupabasePartRequestItemRow {
  id: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  supplier_name: string | null;
  notes: string | null;
  sort_order: number;
}

interface SupabaseRelatedWorkOrderRow {
  order_number: string;
}

interface SupabasePartRequestRow {
  id: string;
  request_number: string;
  work_order_id: string | null;
  customer_name_snapshot: string;
  customer_phone_snapshot: string | null;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  vehicle_plate_snapshot: string;
  requested_date: string;
  needed_date: string | null;
  status: PartRequestStatus;
  workshop_provides_parts: boolean;
  notes: string | null;
  total_amount: number;
  work_orders?:
    | SupabaseRelatedWorkOrderRow
    | SupabaseRelatedWorkOrderRow[]
    | null;
  parts_request_items?: SupabasePartRequestItemRow[];
}

@Injectable({
  providedIn: 'root',
})
export class PartsRequestsService {
  private readonly partRequestsSignal = signal<PartRequest[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly partRequests = this.partRequestsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    void this.loadPartRequests();
  }

  async loadPartRequests(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const { data, error } = await supabase
      .from('parts_requests')
      .select(
        `
        id,
        request_number,
        work_order_id,
        customer_name_snapshot,
        customer_phone_snapshot,
        vehicle_brand_snapshot,
        vehicle_model_snapshot,
        vehicle_plate_snapshot,
        requested_date,
        needed_date,
        status,
        workshop_provides_parts,
        notes,
        total_amount,
        work_orders (
          order_number
        ),
        parts_request_items (
          id,
          part_name,
          quantity,
          unit_price,
          subtotal,
          supplier_name,
          notes,
          sort_order
        )
      `,
      )
      .order('requested_date', { ascending: false })
      .order('request_number', { ascending: false });

    if (error) {
      this.loadingSignal.set(false);
      this.errorSignal.set(error.message);
      throw new Error(error.message);
    }

    this.partRequestsSignal.set(
      ((data ?? []) as SupabasePartRequestRow[]).map((request) =>
        this.mapPartRequestFromDatabase(request),
      ),
    );

    this.loadingSignal.set(false);
  }

  async createPartRequest(
    workOrder: WorkOrder,
    workshopProvidesParts: boolean,
    parts: PartRequestItem[],
  ): Promise<void> {
    const { data: workOrderData, error: workOrderError } = await supabase
      .from('work_orders')
      .select('id, customer_id, vehicle_id')
      .eq('id', workOrder.id)
      .single();

    if (workOrderError) {
      throw new Error(workOrderError.message);
    }

    const { data: request, error: requestError } = await supabase
      .from('parts_requests')
      .insert({
        work_order_id: workOrder.id,
        customer_id: workOrderData.customer_id,
        vehicle_id: workOrderData.vehicle_id,

        customer_name_snapshot: workOrder.customerName,
        customer_phone_snapshot: workOrder.customerPhone,
        vehicle_plate_snapshot: workOrder.plateNumber,
        vehicle_brand_snapshot: workOrder.vehicleBrand,
        vehicle_model_snapshot: workOrder.vehicleModel,

        requested_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        workshop_provides_parts: workshopProvidesParts,
        notes: null,
      })
      .select('id')
      .single();

    if (requestError) {
      throw new Error(requestError.message);
    }

    const partRows = parts
      .filter((part) => part.name.trim() && part.quantity > 0)
      .map((part, index) => ({
        parts_request_id: request.id,
        part_name: part.name.trim(),
        quantity: part.quantity,
        unit_price: part.unitPrice ?? 0,
        supplier_name: part.supplierName?.trim() || null,
        notes: part.notes?.trim() || null,
        sort_order: index + 1,
      }));

    if (partRows.length > 0) {
      const { error: itemsError } = await supabase
        .from('parts_request_items')
        .insert(partRows);

      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }

    await this.loadPartRequests();
  }

  getRequestsByWorkOrder(workOrderId: string): PartRequest[] {
    return this.partRequestsSignal().filter(
      (request) => request.workOrderId === workOrderId,
    );
  }

  private mapPartRequestFromDatabase(
    request: SupabasePartRequestRow,
  ): PartRequest {
    const parts = (request.parts_request_items ?? [])
      .map((item) => this.mapPartRequestItemFromDatabase(item))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: request.id,
      requestNumber: request.request_number,

      workOrderId: request.work_order_id ?? '',
      orderNumber: this.getRelatedOrderNumber(request.work_orders),

      customerName: request.customer_name_snapshot,
      customerPhone: request.customer_phone_snapshot ?? '',

      vehicleBrand: request.vehicle_brand_snapshot,
      vehicleModel: request.vehicle_model_snapshot,
      plateNumber: request.vehicle_plate_snapshot,

      requestedAt: request.requested_date,
      neededDate: request.needed_date ?? undefined,
      status: request.status,
      workshopProvidesParts: request.workshop_provides_parts,
      notes: request.notes ?? '',
      totalAmount: Number(request.total_amount ?? 0),

      parts,
    };
  }

  private getRelatedOrderNumber(
    workOrders:
      | SupabaseRelatedWorkOrderRow
      | SupabaseRelatedWorkOrderRow[]
      | null
      | undefined,
  ): string {
    if (Array.isArray(workOrders)) {
      return workOrders[0]?.order_number ?? 'Sin orden';
    }

    return workOrders?.order_number ?? 'Sin orden';
  }

  private mapPartRequestItemFromDatabase(
    item: SupabasePartRequestItemRow,
  ): PartRequestItem {
    return {
      id: item.id,
      name: item.part_name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      supplierName: item.supplier_name ?? '',
      notes: item.notes ?? '',
    };
  }
}
