import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, interval, map } from 'rxjs';
import { PrintDocumentsService } from '../../../print-documents/data-access/print-documents.service';
import { WorkOrdersService } from '../../../work-orders/data-access/work-orders.service';
import {
  VehicleIntakeSearchCustomer,
  VehicleIntakeSearchVehicle,
  VehicleIntakeService,
} from '../../data-access/vehicle-intake.service';

@Component({
  selector: 'app-vehicle-intake-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-intake-new.component.html',
  styleUrl: './vehicle-intake-new.component.scss',
})
export class VehicleIntakeNewComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly printDocumentsService = inject(PrintDocumentsService);
  private readonly vehicleIntakeService = inject(VehicleIntakeService);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly destroyRef = inject(DestroyRef);

  isSaved = false;
  isSaving = false;
  receptionCode = '';
  orderCode = '';

  selectedCustomerId: string | null = null;
  selectedVehicleId: string | null = null;

  selectedCustomer: VehicleIntakeSearchCustomer | null = null;
  selectedVehicle: VehicleIntakeSearchVehicle | null = null;

  searchResults: VehicleIntakeSearchCustomer[] = [];
  vehicleSelectionCustomer: VehicleIntakeSearchCustomer | null = null;

  isSearching = false;
  hasSearched = false;
  searchMessage = '';

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

  ngOnInit(): void {
    this.intakeForm
      .get('search')
      ?.valueChanges.pipe(
        map((value) => String(value ?? '').trim()),
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        if (term.length < 2) {
          this.searchResults = [];
          this.hasSearched = false;
          this.searchMessage = '';
          return;
        }

        void this.searchExistingRecord({
          autoSelectSingle: false,
          showEmptyMessage: false,
        });
      });

    this.startReceptionClock();
  }

  async searchExistingRecord(
    options: {
      autoSelectSingle?: boolean;
      showEmptyMessage?: boolean;
    } = {},
  ): Promise<void> {
    const autoSelectSingle = options.autoSelectSingle ?? true;
    const showEmptyMessage = options.showEmptyMessage ?? true;

    const searchTerm = String(
      this.intakeForm.get('search')?.value ?? '',
    ).trim();

    this.hasSearched = true;
    this.searchMessage = '';
    this.searchResults = [];

    if (searchTerm.length < 2) {
      if (showEmptyMessage) {
        this.searchMessage =
          'Ingresa al menos 2 caracteres para buscar por placa, CI/NIT, teléfono o nombre.';
      }

      return;
    }

    this.isSearching = true;

    try {
      const candidates =
        await this.vehicleIntakeService.searchCustomerVehicleCandidates(
          searchTerm,
        );

      if (candidates.length === 0) {
        if (showEmptyMessage) {
          this.searchMessage =
            'No se encontró un cliente o vehículo registrado. Puedes continuar llenando el formulario como cliente nuevo.';
        }

        return;
      }

      if (candidates.length === 1 && autoSelectSingle) {
        this.selectCustomerCandidate(candidates[0]);
        return;
      }

      if (candidates.length === 1) {
        this.searchResults = candidates;
        this.searchMessage =
          'Se encontró un cliente. Selecciona el registro para cargar sus datos.';
        return;
      }

      this.searchResults = candidates;
      this.searchMessage =
        'Se encontraron varios clientes. Selecciona el registro correcto para continuar.';
    } catch (error) {
      console.error(error);
      this.searchMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo realizar la búsqueda. Intenta nuevamente.';
    } finally {
      this.isSearching = false;
    }
  }

  selectCustomerCandidate(customer: VehicleIntakeSearchCustomer): void {
    this.selectedCustomer = customer;
    this.selectedCustomerId = customer.id;

    this.selectedVehicle = null;
    this.selectedVehicleId = null;
    this.searchResults = [];

    this.fillCustomerFields(customer);

    if (customer.vehicles.length === 1) {
      this.selectVehicleCandidate(customer.vehicles[0]);
      return;
    }

    if (customer.vehicles.length > 1) {
      this.vehicleSelectionCustomer = customer;
      this.searchMessage =
        'Cliente cargado. Selecciona el vehículo que ingresa al taller.';
      return;
    }

    this.clearVehicleFields();
    this.searchMessage =
      'Cliente cargado. Registra los datos del vehículo que ingresa al taller.';
  }

  selectVehicleCandidate(vehicle: VehicleIntakeSearchVehicle): void {
    this.selectedVehicle = vehicle;
    this.selectedVehicleId = vehicle.id;
    this.vehicleSelectionCustomer = null;
    this.searchResults = [];

    this.fillVehicleFields(vehicle);

    this.searchMessage =
      'Cliente y vehículo cargados correctamente. Completa los datos del ingreso al taller.';
  }

  prepareNewVehicleForSelectedCustomer(): void {
    if (!this.selectedCustomerId) {
      return;
    }

    this.selectedVehicle = null;
    this.selectedVehicleId = null;
    this.vehicleSelectionCustomer = null;

    this.clearVehicleFields();

    this.searchMessage =
      'Cliente cargado. Registra el nuevo vehículo para este mismo cliente.';
  }

  closeVehicleSelectionModal(): void {
    this.vehicleSelectionCustomer = null;
  }

  clearSmartSelection(): void {
    this.selectedCustomerId = null;
    this.selectedVehicleId = null;
    this.selectedCustomer = null;
    this.selectedVehicle = null;
    this.searchResults = [];
    this.vehicleSelectionCustomer = null;
    this.searchMessage = '';
    this.hasSearched = false;

    this.intakeForm.patchValue({
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
    });
  }

  registerAnotherVehicleForSameCustomer(): void {
    if (!this.selectedCustomerId) {
      return;
    }

    this.isSaved = false;
    this.isSaving = false;
    this.receptionCode = '';
    this.orderCode = '';

    this.selectedVehicle = null;
    this.selectedVehicleId = null;
    this.vehicleSelectionCustomer = null;
    this.searchResults = [];

    this.clearVehicleFields();

    this.intakeForm.patchValue({
      search: '',
      intakeDate: this.getTodayDate(),
      intakeTime: this.getCurrentTime(),
      arrivalMethod: '',
      arrivalState: '',
      mechanicName: '',
      reportedProblems: '',
    });
    this.resetReceptionClockState();

    this.searchMessage =
      'Cliente conservado. Registra el siguiente vehículo para este mismo cliente.';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private fillCustomerFields(customer: VehicleIntakeSearchCustomer): void {
    this.intakeForm.patchValue({
      customerFullName: customer.fullName,
      customerPhone: customer.phone,
      customerDocument: customer.documentNumber,
      customerAddress: customer.address ?? '',
    });
  }

  private fillVehicleFields(vehicle: VehicleIntakeSearchVehicle): void {
    this.intakeForm.patchValue({
      plate: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : '',
      color: vehicle.color ?? '',
      mileage: vehicle.mileage ? String(vehicle.mileage) : '',
    });
  }

  private clearVehicleFields(): void {
    this.intakeForm.patchValue({
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      mileage: '',
      fuelType: '',
    });
  }

  async submitForm(): Promise<void> {
    this.isSaved = false;

    if (this.intakeForm.invalid) {
      this.intakeForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const rawValue = this.intakeForm.getRawValue();

      const result = await this.vehicleIntakeService.createVehicleIntake(
        {
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
        },
        {
          customerId: this.selectedCustomerId,
          vehicleId: this.selectedVehicleId,
        },
      );

      this.receptionCode = result.receptionCode;
      this.orderCode = result.orderCode;
      this.selectedCustomerId = result.customerId;
      this.selectedVehicleId = result.vehicleId;
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
    this.selectedCustomerId = null;
    this.selectedVehicleId = null;
    this.selectedCustomer = null;
    this.selectedVehicle = null;
    this.searchResults = [];
    this.vehicleSelectionCustomer = null;
    this.isSearching = false;
    this.hasSearched = false;
    this.searchMessage = '';

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
    this.resetReceptionClockState();
  }

  isInvalid(fieldName: string): boolean {
    const field = this.intakeForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getValue(fieldName: string): string {
    const value = this.intakeForm.get(fieldName)?.value;
    return value ? String(value) : '—';
  }
  private startReceptionClock(): void {
    this.refreshReceptionDateTime();

    interval(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshReceptionDateTime();
      });
  }

  private refreshReceptionDateTime(): void {
    if (this.isSaved) {
      return;
    }

    const dateControl = this.intakeForm.get('intakeDate');
    const timeControl = this.intakeForm.get('intakeTime');

    if (dateControl && !dateControl.dirty) {
      dateControl.setValue(this.getTodayDate(), { emitEvent: false });
    }

    if (timeControl && !timeControl.dirty) {
      timeControl.setValue(this.getCurrentTime(), { emitEvent: false });
    }
  }

  private resetReceptionClockState(): void {
    this.intakeForm.get('intakeDate')?.markAsPristine();
    this.intakeForm.get('intakeTime')?.markAsPristine();
    this.refreshReceptionDateTime();
  }
  private getTodayDate(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = this.padTwoDigits(now.getMonth() + 1);
    const day = this.padTwoDigits(now.getDate());

    return `${year}-${month}-${day}`;
  }

  private getCurrentTime(): string {
    const now = new Date();

    const hours = this.padTwoDigits(now.getHours());
    const minutes = this.padTwoDigits(now.getMinutes());

    return `${hours}:${minutes}`;
  }

  private padTwoDigits(value: number): string {
    return String(value).padStart(2, '0');
  }
}
