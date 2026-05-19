import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomersService } from '../../../customers/data-access/customers.service';
import { VehiclesService } from '../../data-access/vehicles.service';
import { VehicleFormValue, VehicleListItem } from '../../models/vehicle.model';
import { VehicleListComponent } from '../../components/vehicle-list/vehicle-list.component';
import { VehicleFormModalComponent } from '../../components/vehicle-form-modal/vehicle-form-modal.component';

@Component({
  selector: 'app-vehicles-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    VehicleListComponent,
    VehicleFormModalComponent,
  ],
  templateUrl: './vehicles-home.component.html',
  styleUrl: './vehicles-home.component.scss',
})
export class VehiclesHomeComponent {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly customersService = inject(CustomersService);

  readonly searchTerm = signal('');
  readonly isFormModalOpen = signal(false);
  readonly vehicleToEdit = signal<VehicleListItem | null>(null);

  readonly vehicles = this.vehiclesService.vehicles;
  readonly customers = this.customersService.customers;

  readonly filteredVehicles = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.vehicles();
    }

    return this.vehicles().filter((vehicle) =>
      [
        vehicle.plateNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.vin,
        vehicle.mileage,
        vehicle.customerName,
        vehicle.customerPhone,
        vehicle.customerDocument,
        vehicle.observations,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  });

  readonly totalVehicles = computed(() => this.vehicles().length);

  readonly totalBrands = computed(() => {
    const brands = this.vehicles()
      .map((vehicle) => vehicle.brand.trim().toLowerCase())
      .filter(Boolean);

    return new Set(brands).size;
  });

  readonly totalLinkedCustomers = computed(() => {
    const customers = this.vehicles()
      .map((vehicle) => vehicle.customerId)
      .filter(Boolean);

    return new Set(customers).size;
  });

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openCreateModal(): void {
    this.vehicleToEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(vehicle: VehicleListItem): void {
    this.vehicleToEdit.set(vehicle);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.vehicleToEdit.set(null);
  }

  async saveVehicle(formValue: VehicleFormValue): Promise<void> {
    const vehicle = this.vehicleToEdit();

    try {
      if (vehicle) {
        await this.vehiclesService.updateVehicle(vehicle.id, formValue);
      } else {
        await this.vehiclesService.createVehicle(formValue);
      }

      this.closeFormModal();
    } catch (error) {
      console.error(error);
      window.alert(
        'No se pudo guardar el vehículo. Revisa los datos e intenta nuevamente.',
      );
    }
  }

  async deleteVehicle(vehicle: VehicleListItem): Promise<void> {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el vehículo ${vehicle.plateNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.vehiclesService.deleteVehicle(vehicle.id);
    } catch (error) {
      console.error(error);
      window.alert(
        'No se pudo eliminar el vehículo. Puede tener órdenes o solicitudes relacionadas.',
      );
    }
  }
}
