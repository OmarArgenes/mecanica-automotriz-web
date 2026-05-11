import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
})
export class QuickActionsComponent {
  actions = [
    {
      label: 'Nuevo ingreso',
      description: 'Registrar vehículo',
      route: '/vehicle-intake/new',
      tone: 'danger',
    },
    {
      label: 'Registrar cliente',
      description: 'Nuevo propietario',
      route: '/customers',
      tone: 'primary',
    },
    {
      label: 'Registrar vehículo',
      description: 'Datos del auto',
      route: '/vehicles',
      tone: 'primary',
    },
    {
      label: 'Nueva orden',
      description: 'Trabajo técnico',
      route: '/work-orders',
      tone: 'primary',
    },
    {
      label: 'Solicitar repuesto',
      description: 'Documento cliente',
      route: '/parts-requests',
      tone: 'warning',
    },
  ];
}
