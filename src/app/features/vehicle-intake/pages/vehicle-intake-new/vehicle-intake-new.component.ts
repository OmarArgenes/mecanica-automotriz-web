import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vehicle-intake-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-intake-new.component.html',
  styleUrl: './vehicle-intake-new.component.scss',
})
export class VehicleIntakeNewComponent {
  private readonly fb = inject(FormBuilder);

  isSaved = false;
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
    reportedProblems: ['', Validators.required],
    initialObservation: [''],
  });

  submitForm(): void {
    this.isSaved = false;

    if (this.intakeForm.invalid) {
      this.intakeForm.markAllAsTouched();
      return;
    }

    const timestamp = Date.now().toString().slice(-6);

    this.receptionCode = `REC-${timestamp}`;
    this.orderCode = `OT-${timestamp}`;
    this.isSaved = true;
  }

  printReceptionReceipt(): void {
    window.print();
  }

  resetForm(): void {
    this.isSaved = false;
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
      reportedProblems: '',
      initialObservation: '',
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
