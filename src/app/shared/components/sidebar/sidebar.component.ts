import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  highlight?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  logoMissing = false;

  menuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      items: [
        {
          label: 'Dashboard',
          route: '/dashboard',
          icon: 'D',
        },
      ],
    },
    {
      title: 'Operación del taller',
      items: [
        {
          label: 'Recepción',
          route: '/vehicle-intake',
          icon: 'R',
          highlight: true,
        },
        {
          label: 'Órdenes',
          route: '/work-orders',
          icon: 'O',
        },
        {
          label: 'Repuestos',
          route: '/parts-requests',
          icon: 'P',
        },
      ],
    },
    {
      title: 'Registros',
      items: [
        {
          label: 'Clientes',
          route: '/customers',
          icon: 'C',
        },
        {
          label: 'Vehículos',
          route: '/vehicles',
          icon: 'V',
        },
      ],
    },
    {
      title: 'Control',
      items: [
        {
          label: 'Reportes',
          route: '/reports',
          icon: 'I',
        },
        {
          label: 'Configuración',
          route: '/settings',
          icon: 'S',
        },
      ],
    },
  ];
}
