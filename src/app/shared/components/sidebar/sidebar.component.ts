import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
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
  isMobileMenuOpen = false;

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
          route: '/vehicle-intake/new',
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
    // {
    //   title: 'Control',
    //   items: [
    //     {
    //       label: 'Reportes',
    //       route: '/reports',
    //       icon: 'I',
    //     },
    //     {
    //       label: 'Configuración',
    //       route: '/settings',
    //       icon: 'S',
    //     },
    //   ],
    // },
  ];

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeMenuWithEscape(): void {
    this.closeMobileMenu();
  }
}
