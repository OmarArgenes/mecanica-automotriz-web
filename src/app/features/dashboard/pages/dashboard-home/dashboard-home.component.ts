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
  stats = [
    {
      label: 'Vehículos en taller',
      value: '08',
      detail: 'Actualmente registrados',
      tone: 'blue',
    },
    {
      label: 'Órdenes pendientes',
      value: '05',
      detail: 'Requieren seguimiento',
      tone: 'orange',
    },
    {
      label: 'En reparación',
      value: '03',
      detail: 'Trabajos activos',
      tone: 'blue',
    },
    {
      label: 'Esperando repuestos',
      value: '02',
      detail: 'Pendientes de aprobación',
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
}
