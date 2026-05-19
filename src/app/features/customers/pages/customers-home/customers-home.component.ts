import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Customer, CustomerFormValue } from '../../models/customer.model';
import { CustomersService } from '../../data-access/customers.service';
import { CustomerListComponent } from '../../components/customer-list/customer-list.component';
import { CustomerFormModalComponent } from '../../components/customer-form-modal/customer-form-modal.component';

@Component({
  selector: 'app-customers-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CustomerListComponent,
    CustomerFormModalComponent,
  ],
  templateUrl: './customers-home.component.html',
  styleUrl: './customers-home.component.scss',
})
export class CustomersHomeComponent {
  private readonly customersService = inject(CustomersService);

  readonly searchTerm = signal('');
  readonly isFormModalOpen = signal(false);
  readonly customerToEdit = signal<Customer | null>(null);

  readonly customers = this.customersService.customers;

  readonly filteredCustomers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.customers();
    }

    return this.customers().filter((customer) => {
      const vehicleText = customer.vehicles
        .map(
          (vehicle) =>
            `${vehicle.plateNumber} ${vehicle.brand} ${vehicle.model}`,
        )
        .join(' ')
        .toLowerCase();

      return [
        customer.fullName,
        customer.documentNumber,
        customer.phone,
        customer.whatsapp,
        customer.email,
        customer.address,
        vehicleText,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  });

  readonly totalCustomers = computed(() => this.customers().length);

  readonly customersWithVehicles = computed(
    () =>
      this.customers().filter((customer) => customer.vehicles.length > 0)
        .length,
  );

  readonly totalVehicles = computed(() =>
    this.customers().reduce(
      (total, customer) => total + customer.vehicles.length,
      0,
    ),
  );

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openCreateModal(): void {
    this.customerToEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(customer: Customer): void {
    this.customerToEdit.set(customer);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.customerToEdit.set(null);
  }

  async saveCustomer(formValue: CustomerFormValue): Promise<void> {
    const customer = this.customerToEdit();

    try {
      if (customer) {
        await this.customersService.updateCustomer(customer.id, formValue);
      } else {
        await this.customersService.createCustomer(formValue);
      }

      this.closeFormModal();
    } catch (error) {
      console.error(error);
      window.alert(
        'No se pudo guardar el cliente. Revisa los datos e intenta nuevamente.',
      );
    }
  }

  async deleteCustomer(customer: Customer): Promise<void> {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar al cliente ${customer.fullName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.customersService.deleteCustomer(customer.id);
    } catch (error) {
      console.error(error);
      window.alert(
        'No se pudo eliminar el cliente. Puede tener vehículos u órdenes relacionadas.',
      );
    }
  }
}
