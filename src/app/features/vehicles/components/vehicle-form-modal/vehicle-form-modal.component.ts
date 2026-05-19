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

import { Customer } from '../../../customers/models/customer.model';
import { VehicleFormValue, VehicleListItem } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-form-modal.component.html',
  styleUrl: './vehicle-form-modal.component.scss',
})
export class VehicleFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() vehicle: VehicleListItem | null = null;
  @Input() customers: Customer[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<VehicleFormValue>();

  readonly vehicleForm = this.fb.group({
    customerId: ['', Validators.required],
    plateNumber: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    year: [null as number | null],
    color: [''],
    vin: [''],
    mileage: [null as number | null],
    observations: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['vehicle'] && !changes['customers']) {
      return;
    }

    if (this.vehicle) {
      this.vehicleForm.reset({
        customerId: this.vehicle.customerId,
        plateNumber: this.vehicle.plateNumber,
        brand: this.vehicle.brand,
        model: this.vehicle.model,
        year: this.vehicle.year ?? null,
        color: this.vehicle.color ?? '',
        vin: this.vehicle.vin ?? '',
        mileage: this.vehicle.mileage ?? null,
        observations: this.vehicle.observations ?? '',
      });

      return;
    }

    this.vehicleForm.reset({
      customerId: this.customers[0]?.id ?? '',
      plateNumber: '',
      brand: '',
      model: '',
      year: null,
      color: '',
      vin: '',
      mileage: null,
      observations: '',
    });
  }

  get modalTitle(): string {
    return this.vehicle ? 'Editar vehículo' : 'Nuevo vehículo';
  }

  get modalDescription(): string {
    return this.vehicle
      ? 'Actualiza los datos principales del vehículo y su cliente relacionado.'
      : 'Registra un vehículo y asígnalo a un cliente existente.';
  }

  submitForm(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const rawValue = this.vehicleForm.getRawValue();

    this.saved.emit({
      customerId: rawValue.customerId ?? '',
      plateNumber: rawValue.plateNumber ?? '',
      brand: rawValue.brand ?? '',
      model: rawValue.model ?? '',
      year: rawValue.year ?? null,
      color: rawValue.color ?? '',
      vin: rawValue.vin ?? '',
      mileage: rawValue.mileage ?? null,
      observations: rawValue.observations ?? '',
    });
  }

  closeModal(): void {
    this.closed.emit();
  }

  isInvalid(controlName: string): boolean {
    const control = this.vehicleForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
