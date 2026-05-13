import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Customer, CustomerFormValue } from '../../models/customer.model';

@Component({
  selector: 'app-customer-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form-modal.component.html',
  styleUrl: './customer-form-modal.component.scss',
})
export class CustomerFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() customer: Customer | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<CustomerFormValue>();

  readonly customerForm = this.fb.group({
    fullName: ['', Validators.required],
    documentNumber: [''],
    phone: ['', Validators.required],
    whatsapp: [''],
    email: ['', Validators.email],
    address: [''],

    vehiclePlateNumber: [''],
    vehicleBrand: [''],
    vehicleModel: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['customer']) {
      return;
    }

    if (this.customer) {
      const firstVehicle = this.customer.vehicles[0];

      this.customerForm.reset({
        fullName: this.customer.fullName,
        documentNumber: this.customer.documentNumber,
        phone: this.customer.phone,
        whatsapp: this.customer.whatsapp ?? '',
        email: this.customer.email ?? '',
        address: this.customer.address ?? '',
        vehiclePlateNumber: firstVehicle?.plateNumber ?? '',
        vehicleBrand: firstVehicle?.brand ?? '',
        vehicleModel: firstVehicle?.model ?? '',
      });

      return;
    }

    this.customerForm.reset({
      fullName: '',
      documentNumber: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',

      vehiclePlateNumber: '',
      vehicleBrand: '',
      vehicleModel: '',
    });
  }

  get modalTitle(): string {
    return this.customer ? 'Editar cliente' : 'Nuevo cliente';
  }

  get modalDescription(): string {
    return this.customer
      ? 'Actualiza los datos principales del cliente seleccionado.'
      : 'Registra un cliente y, opcionalmente, su primer vehículo relacionado.';
  }

  submitForm(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const rawValue = this.customerForm.getRawValue();

    this.saved.emit({
      fullName: rawValue.fullName ?? '',
      documentNumber: rawValue.documentNumber ?? '',
      phone: rawValue.phone ?? '',
      whatsapp: rawValue.whatsapp ?? '',
      email: rawValue.email ?? '',
      address: rawValue.address ?? '',
      vehiclePlateNumber: rawValue.vehiclePlateNumber ?? '',
      vehicleBrand: rawValue.vehicleBrand ?? '',
      vehicleModel: rawValue.vehicleModel ?? '',
    });
  }

  closeModal(): void {
    this.closed.emit();
  }

  isInvalid(controlName: string): boolean {
    const control = this.customerForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
