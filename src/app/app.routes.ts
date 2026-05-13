import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';

const placeholder = () =>
  import('./shared/components/placeholder-page/placeholder-page.component').then(
    (m) => m.PlaceholderPageComponent,
  );

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
      {
        path: 'vehicle-intake',
        pathMatch: 'full',
        redirectTo: 'vehicle-intake/new',
      },
      {
        path: 'vehicle-intake/new',
        loadComponent: () =>
          import('./features/vehicle-intake/pages/vehicle-intake-new/vehicle-intake-new.component').then(
            (m) => m.VehicleIntakeNewComponent,
          ),
      },
      {
        path: 'work-orders',
        loadComponent: () =>
          import('./features/work-orders/pages/work-orders-home/work-orders-home.component').then(
            (m) => m.WorkOrdersHomeComponent,
          ),
        data: {
          title: 'Órdenes de trabajo',
          description:
            'Controla diagnósticos, trabajos solicitados, trabajos realizados y estados de reparación.',
        },
      },
      {
        path: 'parts-requests',
        loadComponent: () =>
          import('./features/parts-requests/pages/parts-requests-home/parts-requests-home.component').then(
            (m) => m.PartsRequestsHomeComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/pages/customers-home/customers-home.component').then(
            (m) => m.CustomersHomeComponent,
          ),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/pages/vehicles-home/vehicles-home.component').then(
            (m) => m.VehiclesHomeComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: placeholder,
        data: {
          title: 'Reportes',
          description:
            'Consulta vehículos en taller, órdenes pendientes, trabajos finalizados y documentos imprimibles.',
        },
      },
      {
        path: 'settings',
        loadComponent: placeholder,
        data: {
          title: 'Configuración',
          description:
            'Configura datos del taller, usuarios, servicios frecuentes y parámetros del sistema.',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
