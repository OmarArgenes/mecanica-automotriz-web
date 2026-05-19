import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuickActionsComponent } from '../../../../shared/components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickActionsComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent {
  searchTerm = '';

  stats = [
    {
      label: 'Vehículos en reparación',
      value: '03',
      detail: 'Trabajos actualmente activos',
      tone: 'blue',
    },
    {
      label: 'Vehículos entregados',
      value: '05',
      detail: 'Trabajos finalizados y entregados',
      tone: 'green',
    },
    {
      label: 'Esperando repuestos',
      value: '02',
      detail: 'Pendientes de aprobación o compra',
      tone: 'red',
    },
  ];

  recentIntakes = [
    {
      time: '09:20',
      plate: '4821 ABC',
      customer: 'Carlos Mendoza',
      vehicle: 'Toyota Corolla',
      status: 'En diagnóstico',
    },
    {
      time: '10:45',
      plate: '3912 KLP',
      customer: 'María López',
      vehicle: 'Suzuki Swift',
      status: 'Esperando repuestos',
    },
    {
      time: '11:30',
      plate: '7284 TDR',
      customer: 'Jorge Salazar',
      vehicle: 'Nissan Frontier',
      status: 'En reparación',
    },
  ];

  get filteredRecentIntakes() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.recentIntakes;
    }

    return this.recentIntakes.filter((item) =>
      [item.time, item.plate, item.customer, item.vehicle, item.status].some(
        (value) => value.toLowerCase().includes(term),
      ),
    );
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }
}
