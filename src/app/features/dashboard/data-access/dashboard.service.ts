import { Injectable, signal } from '@angular/core';

import { supabase } from '../../../core/supabase/supabase.client';

export interface DashboardStat {
  label: string;
  value: string;
  detail: string;
  tone: 'blue' | 'green' | 'orange' | 'red';
}

export interface DashboardRecentIntake {
  id: string;
  time: string;
  plate: string;
  customer: string;
  vehicle: string;
  status: string;
}

interface SupabaseRecentWorkOrderRow {
  id: string;
  order_number: string;
  reception_date: string;
  reception_time: string | null;
  customer_name_snapshot: string;
  vehicle_plate_snapshot: string;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  status: 'pending' | 'completed';
}

interface SupabasePendingPartsRequestRow {
  id: string;
  status: string;
  parts_request_items?: { id: string }[];
}
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly statsSignal = signal<DashboardStat[]>(
    this.buildStats(0, 0, 0),
  );

  private readonly recentIntakesSignal = signal<DashboardRecentIntake[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly stats = this.statsSignal.asReadonly();
  readonly recentIntakes = this.recentIntakesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    void this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const [
      pendingOrdersResult,
      completedOrdersResult,
      waitingPartsResult,
      recentIntakesResult,
    ] = await Promise.all([
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),

      supabase
        .from('parts_requests')
        .select(
          `
    id,
    status,
    parts_request_items (
      id
    )
  `,
        )
        .eq('status', 'pending'),

      supabase
        .from('work_orders')
        .select(
          `
    id,
    order_number,
    reception_date,
    reception_time,
    customer_name_snapshot,
    vehicle_plate_snapshot,
    vehicle_brand_snapshot,
    vehicle_model_snapshot,
    status
  `,
        )
        .order('reception_date', { ascending: false })
        .order('reception_time', { ascending: false })
        .limit(100),
    ]);

    const error =
      pendingOrdersResult.error ??
      completedOrdersResult.error ??
      waitingPartsResult.error ??
      recentIntakesResult.error;

    if (error) {
      this.errorSignal.set(error.message);
      this.loadingSignal.set(false);
      throw new Error(error.message);
    }

    const waitingPartsCount = (
      (waitingPartsResult.data ?? []) as SupabasePendingPartsRequestRow[]
    ).filter(
      (request) => (request.parts_request_items ?? []).length > 0,
    ).length;

    this.statsSignal.set(
      this.buildStats(
        pendingOrdersResult.count ?? 0,
        completedOrdersResult.count ?? 0,
        waitingPartsCount,
      ),
    );

    this.recentIntakesSignal.set(
      ((recentIntakesResult.data ?? []) as SupabaseRecentWorkOrderRow[]).map(
        (item) => this.mapRecentWorkOrder(item),
      ),
    );

    this.loadingSignal.set(false);
  }

  private buildStats(
    pendingOrders: number,
    completedOrders: number,
    waitingParts: number,
  ): DashboardStat[] {
    return [
      {
        label: 'Vehículos en reparación',
        value: this.formatCounter(pendingOrders),
        detail: 'Órdenes actualmente pendientes',
        tone: 'blue',
      },
      {
        label: 'Vehículos entregados',
        value: this.formatCounter(completedOrders),
        detail: 'Órdenes finalizadas registradas',
        tone: 'green',
      },
      {
        label: 'Esperando repuestos',
        value: this.formatCounter(waitingParts),
        detail: 'Solicitudes activas de repuestos',
        tone: 'orange',
      },
    ];
  }

  private mapRecentWorkOrder(
    item: SupabaseRecentWorkOrderRow,
  ): DashboardRecentIntake {
    return {
      id: item.id,
      time: item.reception_time
        ? item.reception_time.slice(0, 5)
        : item.reception_date,
      plate: item.vehicle_plate_snapshot,
      customer: item.customer_name_snapshot,
      vehicle:
        `${item.vehicle_brand_snapshot} ${item.vehicle_model_snapshot}`.trim(),
      status: item.status === 'completed' ? 'Entregado' : 'Pendiente',
    };
  }

  private formatCounter(value: number): string {
    return String(value).padStart(2, '0');
  }
}
