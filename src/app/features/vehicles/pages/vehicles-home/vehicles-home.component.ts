import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VehiclesService } from '../../data-access/vehicles.service';
import { Vehicle, VehicleFormValue } from '../../models/vehicle.model';
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

  readonly searchTerm = signal('');
  readonly isFormModalOpen = signal(false);
  readonly vehicleToEdit = signal<Vehicle | null>(null);

  readonly vehicles = this.vehiclesService.vehicles;

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
        vehicle.customerName,
        vehicle.customerPhone,
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
      .map((vehicle) => vehicle.customerName.trim().toLowerCase())
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

  openEditModal(vehicle: Vehicle): void {
    this.vehicleToEdit.set(vehicle);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.vehicleToEdit.set(null);
  }

  saveVehicle(formValue: VehicleFormValue): void {
    const vehicle = this.vehicleToEdit();

    if (vehicle) {
      this.vehiclesService.updateVehicle(vehicle.id, formValue);
    } else {
      this.vehiclesService.createVehicle(formValue);
    }

    this.closeFormModal();
  }

  deleteVehicle(vehicle: Vehicle): void {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el vehículo ${vehicle.plateNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    this.vehiclesService.deleteVehicle(vehicle.id);
  }
}
