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
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Customer,
  CustomerFormValue,
  CustomerVehicleFormValue,
} from '../../models/customer.model';

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
    vehicles: this.fb.array<FormGroup>([]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['customer']) {
      return;
    }

    this.vehiclesFormArray.clear();

    if (this.customer) {
      this.customerForm.patchValue({
        fullName: this.customer.fullName,
        documentNumber: this.customer.documentNumber,
        phone: this.customer.phone,
        whatsapp: this.customer.whatsapp ?? '',
        email: this.customer.email ?? '',
        address: this.customer.address ?? '',
      });

      if (this.customer.vehicles.length > 0) {
        this.customer.vehicles.forEach((vehicle) => {
          this.vehiclesFormArray.push(
            this.createVehicleGroup({
              id: vehicle.id,
              plateNumber: vehicle.plateNumber,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year ?? null,
              color: vehicle.color ?? '',
              vin: vehicle.vin ?? '',
              mileage: vehicle.mileage ?? null,
              observations: vehicle.observations ?? '',
            }),
          );
        });
      } else {
        this.addVehicle();
      }

      return;
    }

    this.customerForm.reset({
      fullName: '',
      documentNumber: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
    });

    this.addVehicle();
  }

  get vehiclesFormArray(): FormArray<FormGroup> {
    return this.customerForm.get('vehicles') as FormArray<FormGroup>;
  }

  get vehicleFormGroups(): FormGroup[] {
    return this.vehiclesFormArray.controls;
  }

  get modalTitle(): string {
    return this.customer ? 'Editar cliente' : 'Nuevo cliente';
  }

  get modalDescription(): string {
    return this.customer
      ? 'Actualiza los datos del cliente y administra sus vehículos registrados.'
      : 'Registra un cliente y uno o varios vehículos relacionados.';
  }

  addVehicle(): void {
    this.vehiclesFormArray.push(this.createVehicleGroup());
  }

  removeVehicle(index: number): void {
    if (this.vehiclesFormArray.length === 1) {
      this.vehiclesFormArray.at(0).reset({
        id: '',
        plateNumber: '',
        brand: '',
        model: '',
        year: null,
        color: '',
        vin: '',
        mileage: null,
        observations: '',
      });

      return;
    }

    this.vehiclesFormArray.removeAt(index);
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
      vehicles: this.buildVehiclesFormValue(),
    });
  }

  closeModal(): void {
    this.closed.emit();
  }

  isInvalid(controlName: string): boolean {
    const control = this.customerForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isVehicleFieldInvalid(index: number, controlName: string): boolean {
    const control = this.vehiclesFormArray.at(index).get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private createVehicleGroup(vehicle?: CustomerVehicleFormValue): FormGroup {
    return this.fb.group({
      id: [vehicle?.id ?? ''],
      plateNumber: [vehicle?.plateNumber ?? ''],
      brand: [vehicle?.brand ?? ''],
      model: [vehicle?.model ?? ''],
      year: [vehicle?.year ?? null],
      color: [vehicle?.color ?? ''],
      vin: [vehicle?.vin ?? ''],
      mileage: [vehicle?.mileage ?? null],
      observations: [vehicle?.observations ?? ''],
    });
  }

  private buildVehiclesFormValue(): CustomerVehicleFormValue[] {
    return this.vehiclesFormArray.controls
      .map((vehicleGroup) => {
        const rawValue = vehicleGroup.getRawValue();

        return {
          id: rawValue.id || undefined,
          plateNumber: String(rawValue.plateNumber ?? '').trim(),
          brand: String(rawValue.brand ?? '').trim(),
          model: String(rawValue.model ?? '').trim(),
          year: rawValue.year ? Number(rawValue.year) : null,
          color: String(rawValue.color ?? '').trim(),
          vin: String(rawValue.vin ?? '').trim(),
          mileage: rawValue.mileage ? Number(rawValue.mileage) : null,
          observations: String(rawValue.observations ?? '').trim(),
        };
      })
      .filter(
        (vehicle) =>
          vehicle.plateNumber ||
          vehicle.brand ||
          vehicle.model ||
          vehicle.year ||
          vehicle.color ||
          vehicle.vin ||
          vehicle.mileage ||
          vehicle.observations,
      );
  }
}
