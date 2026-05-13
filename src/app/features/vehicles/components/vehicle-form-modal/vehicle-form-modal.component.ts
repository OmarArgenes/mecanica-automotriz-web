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

import { Vehicle, VehicleFormValue } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-form-modal.component.html',
  styleUrl: './vehicle-form-modal.component.scss',
})
export class VehicleFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() vehicle: Vehicle | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<VehicleFormValue>();

  readonly vehicleForm = this.fb.group({
    plateNumber: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    year: [null as number | null],
    color: [''],
    vin: [''],

    customerName: ['', Validators.required],
    customerPhone: ['', Validators.required],

    observations: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['vehicle']) {
      return;
    }

    if (this.vehicle) {
      this.vehicleForm.reset({
        plateNumber: this.vehicle.plateNumber,
        brand: this.vehicle.brand,
        model: this.vehicle.model,
        year: this.vehicle.year ?? null,
        color: this.vehicle.color ?? '',
        vin: this.vehicle.vin ?? '',
        customerName: this.vehicle.customerName,
        customerPhone: this.vehicle.customerPhone,
        observations: this.vehicle.observations ?? '',
      });

      return;
    }

    this.vehicleForm.reset({
      plateNumber: '',
      brand: '',
      model: '',
      year: null,
      color: '',
      vin: '',
      customerName: '',
      customerPhone: '',
      observations: '',
    });
  }

  get modalTitle(): string {
    return this.vehicle ? 'Editar vehículo' : 'Nuevo vehículo';
  }

  get modalDescription(): string {
    return this.vehicle
      ? 'Actualiza los datos principales del vehículo seleccionado.'
      : 'Registra un vehículo y relaciónalo con su cliente.';
  }

  submitForm(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const rawValue = this.vehicleForm.getRawValue();

    this.saved.emit({
      plateNumber: rawValue.plateNumber ?? '',
      brand: rawValue.brand ?? '',
      model: rawValue.model ?? '',
      year: rawValue.year ?? null,
      color: rawValue.color ?? '',
      vin: rawValue.vin ?? '',
      customerName: rawValue.customerName ?? '',
      customerPhone: rawValue.customerPhone ?? '',
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
