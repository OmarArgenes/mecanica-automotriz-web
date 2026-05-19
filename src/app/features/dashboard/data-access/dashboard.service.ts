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

interface SupabaseRecentIntakeRow {
  id: string;
  reception_number: string;
  intake_date: string;
  intake_time: string | null;
  customer_name_snapshot: string;
  vehicle_plate_snapshot: string;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  arrival_state: string;
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
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'quoted', 'approved', 'purchased']),

      supabase
        .from('vehicle_intakes')
        .select(
          `
          id,
          reception_number,
          intake_date,
          intake_time,
          customer_name_snapshot,
          vehicle_plate_snapshot,
          vehicle_brand_snapshot,
          vehicle_model_snapshot,
          arrival_state
        `,
        )
        .order('intake_date', { ascending: false })
        .order('intake_time', { ascending: false })
        .limit(8),
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

    this.statsSignal.set(
      this.buildStats(
        pendingOrdersResult.count ?? 0,
        completedOrdersResult.count ?? 0,
        waitingPartsResult.count ?? 0,
      ),
    );

    this.recentIntakesSignal.set(
      ((recentIntakesResult.data ?? []) as SupabaseRecentIntakeRow[]).map(
        (item) => this.mapRecentIntake(item),
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

  private mapRecentIntake(
    item: SupabaseRecentIntakeRow,
  ): DashboardRecentIntake {
    return {
      id: item.id,
      time: item.intake_time ? item.intake_time.slice(0, 5) : item.intake_date,
      plate: item.vehicle_plate_snapshot,
      customer: item.customer_name_snapshot,
      vehicle:
        `${item.vehicle_brand_snapshot} ${item.vehicle_model_snapshot}`.trim(),
      status: item.arrival_state || 'Registrado',
    };
  }

  private formatCounter(value: number): string {
    return String(value).padStart(2, '0');
  }
}
