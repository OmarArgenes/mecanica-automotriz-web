import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, interval, map } from 'rxjs';
import { PrintDocumentsService } from '../../../print-documents/data-access/print-documents.service';
import { WorkOrdersService } from '../../../work-orders/data-access/work-orders.service';
import { formatDateAndTime } from '../../../../shared/utils/date-time-format.util';
import {
  FuelLevelStatus,
  TireConditionStatus,
  TireConditionValue,
  VehicleConditionValue,
  VehicleIntakeListItem,
  VehicleIntakeSearchCustomer,
  VehicleIntakeSearchVehicle,
  VehicleIntakeService,
  VehicleInventoryValue,
} from '../../data-access/vehicle-intake.service';

type VehicleConditionKey = 'dented' | 'scratched' | 'broken' | 'noDamage';

type TirePositionKey = 'frontRight' | 'frontLeft' | 'rearRight' | 'rearLeft';

type InventoryKey =
  | 'spareTire'
  | 'wheelWrench'
  | 'jack'
  | 'fireExtinguisher'
  | 'hubcaps'
  | 'mirrors'
  | 'antenna'
  | 'radio'
  | 'tools'
  | 'floorMats'
  | 'fogLights'
  | 'other';

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
  editingIntakeId: string | null = null;
  editingWorkOrderId: string | null = null;

  receivedIntakes: VehicleIntakeListItem[] = [];
  receivedSearchTerm = '';
  isLoadingIntakes = false;
  listError = '';

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

  vehicleConditionOptions = [
    { key: 'dented', label: 'Abollado' },
    { key: 'scratched', label: 'Raspadura' },
    { key: 'broken', label: 'Roto' },
    { key: 'noDamage', label: 'No tiene' },
  ] as const;

  tirePositions = [
    { key: 'frontRight', label: 'Delantera derecha' },
    { key: 'frontLeft', label: 'Delantera izquierda' },
    { key: 'rearRight', label: 'Trasera derecha' },
    { key: 'rearLeft', label: 'Trasera izquierda' },
  ] as const;

  tireStatusOptions: TireConditionStatus[] = ['Bueno', 'Regular', 'Malo'];

  fuelLevelOptions: FuelLevelStatus[] = ['E', '1/4', '1/2', '3/4', 'F'];

  inventoryOptions = [
    { key: 'spareTire', label: 'Llanta de auxilio' },
    { key: 'wheelWrench', label: 'Llave de ruedas' },
    { key: 'jack', label: 'Gata' },
    { key: 'fireExtinguisher', label: 'Extinguidor' },
    { key: 'hubcaps', label: 'Tapacubos' },
    { key: 'mirrors', label: 'Espejos' },
    { key: 'antenna', label: 'Antena' },
    { key: 'radio', label: 'Radio' },
    { key: 'tools', label: 'Herramientas' },
    { key: 'floorMats', label: 'Pisos' },
    { key: 'fogLights', label: 'Halógenos' },
    { key: 'other', label: 'Otros' },
  ] as const;

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
    vehicleCondition: this.fb.group({
      dented: [false],
      scratched: [false],
      broken: [false],
      noDamage: [false],
      other: [''],
    }),

    tireCondition: this.fb.group({
      frontRight: ['' as TireConditionStatus],
      frontLeft: ['' as TireConditionStatus],
      rearRight: ['' as TireConditionStatus],
      rearLeft: ['' as TireConditionStatus],
    }),

    fuelLevel: ['' as FuelLevelStatus],

    vehicleInventory: this.fb.group({
      spareTire: [false],
      wheelWrench: [false],
      jack: [false],
      fireExtinguisher: [false],
      hubcaps: [false],
      mirrors: [false],
      antenna: [false],
      radio: [false],
      tools: [false],
      floorMats: [false],
      fogLights: [false],
      other: [false],
    }),

    inventoryObservations: [''],

    intakeDate: [this.getTodayDate(), Validators.required],
    intakeTime: [this.getCurrentTime(), Validators.required],
    arrivalMethod: [''],
    arrivalState: ['', Validators.required],
    mechanicName: [''],
    driverName: [''],
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
    void this.loadReceivedIntakes();
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

      vehicleCondition: {
        dented: false,
        scratched: false,
        broken: false,
        noDamage: false,
        other: '',
      },

      tireCondition: {
        frontRight: '',
        frontLeft: '',
        rearRight: '',
        rearLeft: '',
      },

      fuelLevel: '',

      vehicleInventory: {
        spareTire: false,
        wheelWrench: false,
        jack: false,
        fireExtinguisher: false,
        hubcaps: false,
        mirrors: false,
        antenna: false,
        radio: false,
        tools: false,
        floorMats: false,
        fogLights: false,
        other: false,
      },

      inventoryObservations: '',

      intakeDate: this.getTodayDate(),
      intakeTime: this.getCurrentTime(),
      arrivalMethod: '',
      arrivalState: '',
      driverName: '',
      mechanicName: '',
      reportedProblems: '',
    });

    this.resetReceptionClockState();

    this.searchMessage =
      'Cliente conservado. Registra el siguiente vehículo para este mismo cliente.';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleVehicleCondition(key: VehicleConditionKey): void {
    const control = this.intakeForm.get([
      'vehicleCondition',
      key,
    ]) as FormControl<boolean | null> | null;

    if (!control) {
      return;
    }

    const nextValue = !Boolean(control.value);
    control.setValue(nextValue);

    if (key === 'noDamage' && nextValue) {
      this.intakeForm.patchValue({
        vehicleCondition: {
          dented: false,
          scratched: false,
          broken: false,
        },
      });
    }

    if (key !== 'noDamage' && nextValue) {
      this.intakeForm.patchValue({
        vehicleCondition: {
          noDamage: false,
        },
      });
    }
  }

  isVehicleConditionSelected(key: VehicleConditionKey): boolean {
    const control = this.intakeForm.get([
      'vehicleCondition',
      key,
    ]) as FormControl<boolean | null> | null;

    return !!control?.value;
  }

  selectTireCondition(key: TirePositionKey, status: TireConditionStatus): void {
    const control = this.intakeForm.get([
      'tireCondition',
      key,
    ]) as FormControl<TireConditionStatus | null> | null;

    control?.setValue(status);
  }

  isTireConditionSelected(
    key: TirePositionKey,
    status: TireConditionStatus,
  ): boolean {
    const control = this.intakeForm.get([
      'tireCondition',
      key,
    ]) as FormControl<TireConditionStatus | null> | null;

    return control?.value === status;
  }

  selectFuelLevel(level: FuelLevelStatus): void {
    this.intakeForm.get('fuelLevel')?.setValue(level);
  }

  isFuelLevelSelected(level: FuelLevelStatus): boolean {
    return this.intakeForm.get('fuelLevel')?.value === level;
  }

  toggleInventoryItem(key: InventoryKey): void {
    const control = this.intakeForm.get([
      'vehicleInventory',
      key,
    ]) as FormControl<boolean | null> | null;

    if (!control) {
      return;
    }

    control.setValue(!Boolean(control.value));
  }

  isInventorySelected(key: InventoryKey): boolean {
    const control = this.intakeForm.get([
      'vehicleInventory',
      key,
    ]) as FormControl<boolean | null> | null;

    return !!control?.value;
  }

  async loadReceivedIntakes(): Promise<void> {
    this.isLoadingIntakes = true;
    this.listError = '';

    try {
      this.receivedIntakes =
        await this.vehicleIntakeService.loadVehicleIntakes();
    } catch (error) {
      console.error(error);
      this.listError =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la lista de vehículos recepcionados.';
    } finally {
      this.isLoadingIntakes = false;
    }
  }

  editReceivedIntake(item: VehicleIntakeListItem): void {
    this.isSaved = false;
    this.isSaving = false;

    this.editingIntakeId = item.id;
    this.editingWorkOrderId = item.workOrderId;

    this.receptionCode = item.receptionCode;
    this.orderCode = item.orderCode;

    this.selectedCustomerId = item.customerId;
    this.selectedVehicleId = item.vehicleId;

    this.selectedCustomer = null;
    this.selectedVehicle = null;
    this.searchResults = [];
    this.vehicleSelectionCustomer = null;

    this.intakeForm.patchValue({
      search: '',
      customerFullName: item.customer.fullName,
      customerPhone: item.customer.phone,
      customerDocument: item.customer.document,
      customerAddress: item.customer.address,

      plate: item.vehicle.plate,
      brand: item.vehicle.brand,
      model: item.vehicle.model,
      year: item.vehicle.year,
      color: item.vehicle.color,
      mileage: item.vehicle.mileage,
      fuelType: item.vehicle.fuelType,

      vehicleCondition: item.inspection.vehicleCondition,
      tireCondition: item.inspection.tireCondition,
      fuelLevel: item.inspection.fuelLevel,
      vehicleInventory: item.inspection.vehicleInventory,
      inventoryObservations: item.inspection.inventoryObservations,

      intakeDate: item.intake.date,
      intakeTime: item.intake.time,
      arrivalMethod: item.intake.arrivalMethod,
      arrivalState: item.intake.arrivalState,
      driverName: item.intake.driverName,
      mechanicName: item.intake.mechanicName,
      reportedProblems: item.intake.reportedProblems,
    });

    this.intakeForm.get('intakeDate')?.markAsDirty();
    this.intakeForm.get('intakeTime')?.markAsDirty();

    this.searchMessage = `Editando OT ${item.orderCode || 'seleccionada'}.`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteReceivedIntake(item: VehicleIntakeListItem): Promise<void> {
    const confirmed = window.confirm(
      `¿Eliminar la OT ${item.orderCode || 'seleccionada'}? Esta acción también eliminará la orden asociada.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.vehicleIntakeService.deleteVehicleIntake(
        item.id,
        item.workOrderId,
      );

      await this.loadReceivedIntakes();
      await this.workOrdersService.loadWorkOrders();

      if (this.editingIntakeId === item.id) {
        this.resetForm();
      }
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la recepción.',
      );
    }
  }

  printReceivedIntake(item: VehicleIntakeListItem): void {
    this.printDocumentsService.printReceptionReceipt({
      receptionCode: item.receptionCode,
      orderCode: item.orderCode,

      customer: item.customer,
      vehicle: item.vehicle,

      intake: {
        date: item.intake.date,
        time: item.intake.time,
        arrivalMethod: item.intake.arrivalMethod,
        arrivalState: item.intake.arrivalState,
        driverName: item.intake.driverName,
        mechanicName: item.intake.mechanicName,
        reportedProblems: item.intake.reportedProblems,
      },

      inspection: item.inspection,
    });
  }

  updateReceivedSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receivedSearchTerm = input.value;
  }

  get filteredReceivedIntakes(): VehicleIntakeListItem[] {
    const term = this.normalizeReceivedSearchValue(this.receivedSearchTerm);

    if (!term) {
      return this.receivedIntakes;
    }

    return this.receivedIntakes.filter((item) => {
      const searchableValues = [
        item.orderCode,
        item.customer.fullName,
        item.customer.phone,
        item.customer.document,
        item.customer.address,
        item.vehicle.plate,
        item.vehicle.brand,
        item.vehicle.model,
        item.vehicle.year,
        item.vehicle.color,
        item.vehicle.mileage,
        item.vehicle.fuelType,
        item.intake.date,
        item.intake.time,
        this.formatReceivedIntakeDateTime(item),
        item.intake.driverName,
        item.intake.mechanicName,
        item.intake.arrivalMethod,
        item.intake.arrivalState,
        item.intake.reportedProblems,
      ];

      return searchableValues.some((value) =>
        this.normalizeReceivedSearchValue(value).includes(term),
      );
    });
  }

  private normalizeReceivedSearchValue(value?: string | number | null): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  formatReceivedIntakeDateTime(item: VehicleIntakeListItem): string {
    return formatDateAndTime(item.intake.date, item.intake.time);
  }

  private getVehicleConditionValue(): VehicleConditionValue {
    const value = this.intakeForm.get('vehicleCondition')?.value;

    return {
      dented: !!value?.dented,
      scratched: !!value?.scratched,
      broken: !!value?.broken,
      noDamage: !!value?.noDamage,
      other: String(value?.other ?? '').trim(),
    };
  }

  private getTireConditionValue(): TireConditionValue {
    const value = this.intakeForm.get('tireCondition')?.value;

    return {
      frontRight: (value?.frontRight ?? '') as TireConditionStatus,
      frontLeft: (value?.frontLeft ?? '') as TireConditionStatus,
      rearRight: (value?.rearRight ?? '') as TireConditionStatus,
      rearLeft: (value?.rearLeft ?? '') as TireConditionStatus,
    };
  }

  private getVehicleInventoryValue(): VehicleInventoryValue {
    const value = this.intakeForm.get('vehicleInventory')?.value;

    return {
      spareTire: !!value?.spareTire,
      wheelWrench: !!value?.wheelWrench,
      jack: !!value?.jack,
      fireExtinguisher: !!value?.fireExtinguisher,
      hubcaps: !!value?.hubcaps,
      mirrors: !!value?.mirrors,
      antenna: !!value?.antenna,
      radio: !!value?.radio,
      tools: !!value?.tools,
      floorMats: !!value?.floorMats,
      fogLights: !!value?.fogLights,
      other: !!value?.other,
    };
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

      const payload = {
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

        vehicleCondition: this.getVehicleConditionValue(),
        tireCondition: this.getTireConditionValue(),
        fuelLevel: (rawValue.fuelLevel ?? '') as FuelLevelStatus,
        vehicleInventory: this.getVehicleInventoryValue(),
        inventoryObservations: rawValue.inventoryObservations ?? '',

        intakeDate: rawValue.intakeDate ?? this.getTodayDate(),
        intakeTime: rawValue.intakeTime ?? this.getCurrentTime(),
        arrivalMethod: rawValue.arrivalMethod ?? '',
        arrivalState: rawValue.arrivalState ?? '',
        driverName: rawValue.driverName ?? '',
        mechanicName: rawValue.mechanicName ?? '',
        reportedProblems: rawValue.reportedProblems ?? '',
      };

      const result =
        this.editingIntakeId && this.editingWorkOrderId
          ? await this.vehicleIntakeService.updateVehicleIntake(
              this.editingIntakeId,
              this.editingWorkOrderId,
              payload,
              {
                customerId: this.selectedCustomerId,
                vehicleId: this.selectedVehicleId,
              },
            )
          : await this.vehicleIntakeService.createVehicleIntake(payload, {
              customerId: this.selectedCustomerId,
              vehicleId: this.selectedVehicleId,
            });

      this.receptionCode = result.receptionCode;
      this.orderCode = result.orderCode;
      this.selectedCustomerId = result.customerId;
      this.selectedVehicleId = result.vehicleId;
      this.isSaved = true;

      await this.workOrdersService.loadWorkOrders();
      await this.loadReceivedIntakes();
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
        driverName: this.getValue('driverName'),
        mechanicName: this.getValue('mechanicName'),
        reportedProblems: this.getValue('reportedProblems'),
      },

      inspection: {
        vehicleCondition: this.getVehicleConditionValue(),
        tireCondition: this.getTireConditionValue(),
        fuelLevel: String(this.intakeForm.get('fuelLevel')?.value ?? ''),
        vehicleInventory: this.getVehicleInventoryValue(),
        inventoryObservations: this.getValue('inventoryObservations'),
      },
    });
  }

  resetForm(): void {
    this.isSaved = false;
    this.isSaving = false;
    this.receptionCode = '';
    this.orderCode = '';
    this.editingIntakeId = null;
    this.editingWorkOrderId = null;
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
      vehicleCondition: {
        dented: false,
        scratched: false,
        broken: false,
        noDamage: false,
        other: '',
      },
      tireCondition: {
        frontRight: '',
        frontLeft: '',
        rearRight: '',
        rearLeft: '',
      },
      fuelLevel: '',
      vehicleInventory: {
        spareTire: false,
        wheelWrench: false,
        jack: false,
        fireExtinguisher: false,
        hubcaps: false,
        mirrors: false,
        antenna: false,
        radio: false,
        tools: false,
        floorMats: false,
        fogLights: false,
        other: false,
      },
      inventoryObservations: '',

      intakeDate: this.getTodayDate(),
      intakeTime: this.getCurrentTime(),
      arrivalMethod: '',
      arrivalState: '',
      mechanicName: '',
      driverName: '',
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
