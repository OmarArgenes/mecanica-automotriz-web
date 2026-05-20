import { Injectable, signal } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';
import {
  WorkOrder,
  WorkOrderChargeItem,
  WorkOrderStatus,
} from '../models/work-order.model';

interface SupabaseChargeItemRow {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sort_order: number;
}

interface SupabaseWorkOrderRow {
  id: string;
  order_number: string;
  customer_name_snapshot: string;
  customer_phone_snapshot: string | null;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  vehicle_plate_snapshot: string;
  reception_date: string;
  completed_date: string | null;
  mechanic_name: string | null;
  problem_description: string | null;
  work_description: string | null;
  total_amount: number;
  status: WorkOrderStatus;
  work_order_charge_items?: SupabaseChargeItemRow[];
}

@Injectable({
  providedIn: 'root',
})
export class WorkOrdersService {
  private readonly workOrdersSignal = signal<WorkOrder[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly workOrders = this.workOrdersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    void this.loadWorkOrders();
  }

  async loadWorkOrders(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const { data, error } = await supabase
      .from('work_orders')
      .select(
        `
        id,
        order_number,
        customer_name_snapshot,
        customer_phone_snapshot,
        vehicle_brand_snapshot,
        vehicle_model_snapshot,
        vehicle_plate_snapshot,
        reception_date,
        completed_date,
        mechanic_name,
        problem_description,
        work_description,
        total_amount,
        status,
        work_order_charge_items (
          id,
          description,
          quantity,
          unit_price,
          subtotal,
          sort_order
        )
      `,
      )
      .order('reception_date', { ascending: false })
      .order('order_number', { ascending: false });

    if (error) {
      this.loadingSignal.set(false);
      this.errorSignal.set(error.message);
      throw new Error(error.message);
    }

    this.workOrdersSignal.set(
      ((data ?? []) as SupabaseWorkOrderRow[]).map((order) =>
        this.mapWorkOrderFromDatabase(order),
      ),
    );

    this.loadingSignal.set(false);
  }

  async finishWorkOrder(orderId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        completed_date: today,
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(error.message);
    }

    await this.loadWorkOrders();
  }

  getWorkOrderById(orderId: string): WorkOrder | undefined {
    return this.workOrdersSignal().find((order) => order.id === orderId);
  }

  async updateWorkOrderDetails(
    orderId: string,
    workDescription: string,
    _totalAmount: number,
    chargeItems: WorkOrderChargeItem[] = [],
  ): Promise<void> {
    const { error: orderError } = await supabase
      .from('work_orders')
      .update({
        work_description: workDescription.trim(),
      })
      .eq('id', orderId);

    if (orderError) {
      throw new Error(orderError.message);
    }

    const { error: deleteError } = await supabase
      .from('work_order_charge_items')
      .delete()
      .eq('work_order_id', orderId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const chargeRows = chargeItems
      .filter((item) => item.description.trim() && item.amount > 0)
      .map((item, index) => ({
        work_order_id: orderId,
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.amount,
        sort_order: index + 1,
      }));

    if (chargeRows.length > 0) {
      const { error: insertError } = await supabase
        .from('work_order_charge_items')
        .insert(chargeRows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    await this.loadWorkOrders();
  }

  private mapWorkOrderFromDatabase(order: SupabaseWorkOrderRow): WorkOrder {
    const chargeItems = (order.work_order_charge_items ?? [])
      .map((item) => this.mapChargeItemFromDatabase(item))
      .sort((a, b) => a.description.localeCompare(b.description));

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name_snapshot,
      customerPhone: order.customer_phone_snapshot ?? '',
      vehicleBrand: order.vehicle_brand_snapshot,
      vehicleModel: order.vehicle_model_snapshot,
      plateNumber: order.vehicle_plate_snapshot,
      receptionDate: order.reception_date,
      completedDate: order.completed_date ?? undefined,
      mechanicName: order.mechanic_name ?? '',
      problemDescription: order.problem_description ?? '',
      workDescription: order.work_description ?? '',
      chargeItems,
      totalAmount: Number(order.total_amount ?? 0),
      status: order.status,
    };
  }

  private mapChargeItemFromDatabase(
    item: SupabaseChargeItemRow,
  ): WorkOrderChargeItem {
    return {
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      amount: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    };
  }
}
