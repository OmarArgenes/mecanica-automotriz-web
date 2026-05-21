import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PrintDocumentsService } from '../../../print-documents/data-access/print-documents.service';
import { WorkOrdersService } from '../../../work-orders/data-access/work-orders.service';
import { VehicleIntakeService } from '../../data-access/vehicle-intake.service';

@Component({
  selector: 'app-vehicle-intake-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-intake-new.component.html',
  styleUrl: './vehicle-intake-new.component.scss',
})
export class VehicleIntakeNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly printDocumentsService = inject(PrintDocumentsService);
  private readonly vehicleIntakeService = inject(VehicleIntakeService);
  private readonly workOrdersService = inject(WorkOrdersService);

  isSaved = false;
  isSaving = false;
  receptionCode = '';
  orderCode = '';

  arrivalMethods = [
    'Conduciendo',
    'En grúa',
    'Remolcado',
    'No arranca',
    'Otro',
  ];

  arrivalStates = [
    'Funcionando',
    'Funciona con fallas',
    'No arranca',
    'Apagado / sin encender',
    'Con ruido extraño',
    'Con fuga visible',
    'Accidentado',
    'Otro',
  ];

  fuelTypes = ['Gasolina', 'Diésel', 'GNV', 'Híbrido', 'Eléctrico', 'Otro'];

  intakeForm = this.fb.group({
    search: [''],

    customerFullName: ['', Validators.required],
    customerPhone: ['', Validators.required],
    customerDocument: [''],
    customerAddress: [''],

    plate: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    year: [''],
    color: [''],
    mileage: [''],
    fuelType: [''],

    intakeDate: [this.getTodayDate(), Validators.required],
    intakeTime: [this.getCurrentTime(), Validators.required],
    arrivalMethod: [''],
    arrivalState: ['', Validators.required],
    mechanicName: [''],
    reportedProblems: ['', Validators.required],
  });

  async submitForm(): Promise<void> {
    this.isSaved = false;

    if (this.intakeForm.invalid) {
      this.intakeForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const rawValue = this.intakeForm.getRawValue();

      const result = await this.vehicleIntakeService.createVehicleIntake({
        customerFullName: rawValue.customerFullName ?? '',
        customerPhone: rawValue.customerPhone ?? '',
        customerDocument: rawValue.customerDocument ?? '',
        customerAddress: rawValue.customerAddress ?? '',

        plate: rawValue.plate ?? '',
        brand: rawValue.brand ?? '',
        model: rawValue.model ?? '',
        year: rawValue.year ?? '',
        color: rawValue.color ?? '',
        mileage: rawValue.mileage ?? '',
        fuelType: rawValue.fuelType ?? '',

        intakeDate: rawValue.intakeDate ?? this.getTodayDate(),
        intakeTime: rawValue.intakeTime ?? this.getCurrentTime(),
        arrivalMethod: rawValue.arrivalMethod ?? '',
        arrivalState: rawValue.arrivalState ?? '',
        mechanicName: rawValue.mechanicName ?? '',
        reportedProblems: rawValue.reportedProblems ?? '',
      });

      this.receptionCode = result.receptionCode;
      this.orderCode = result.orderCode;
      this.isSaved = true;

      await this.workOrdersService.loadWorkOrders();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el ingreso. Intenta nuevamente.',
      );
    } finally {
      this.isSaving = false;
    }
  }

  printReceptionReceipt(): void {
    this.printDocumentsService.printReceptionReceipt({
      receptionCode: this.receptionCode,
      orderCode: this.orderCode,

      customer: {
        fullName: this.getValue('customerFullName'),
        phone: this.getValue('customerPhone'),
        document: this.getValue('customerDocument'),
        address: this.getValue('customerAddress'),
      },

      vehicle: {
        plate: this.getValue('plate'),
        brand: this.getValue('brand'),
        model: this.getValue('model'),
        year: this.getValue('year'),
        color: this.getValue('color'),
        mileage: this.getValue('mileage'),
        fuelType: this.getValue('fuelType'),
      },

      intake: {
        date: this.getValue('intakeDate'),
        time: this.getValue('intakeTime'),
        arrivalMethod: this.getValue('arrivalMethod'),
        arrivalState: this.getValue('arrivalState'),
        mechanicName: this.getValue('mechanicName'),
        reportedProblems: this.getValue('reportedProblems'),
      },
    });
  }

  resetForm(): void {
    this.isSaved = false;
    this.isSaving = false;
    this.receptionCode = '';
    this.orderCode = '';

    this.intakeForm.reset({
      search: '',
      customerFullName: '',
      customerPhone: '',
      customerDocument: '',
      customerAddress: '',
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      mileage: '',
      fuelType: '',
      intakeDate: this.getTodayDate(),
      intakeTime: this.getCurrentTime(),
      arrivalMethod: '',
      arrivalState: '',
      mechanicName: '',
      reportedProblems: '',
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.intakeForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getValue(fieldName: string): string {
    const value = this.intakeForm.get(fieldName)?.value;
    return value ? String(value) : '—';
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private getCurrentTime(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }
}
