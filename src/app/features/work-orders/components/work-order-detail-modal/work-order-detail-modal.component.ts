import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorkOrder, WorkOrderChargeItem } from '../../models/work-order.model';
import {
  formatDateAndTime,
  formatTimestamp,
} from '../../../../shared/utils/date-time-format.util';

type WorkOrderModalMode = 'view' | 'edit';

@Component({
  selector: 'app-work-order-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-order-detail-modal.component.html',
  styleUrl: './work-order-detail-modal.component.scss',
})
export class WorkOrderDetailModalComponent implements OnChanges {
  @Input({ required: true }) order!: WorkOrder;
  @Input() mode: WorkOrderModalMode = 'view';

  @Output() closed = new EventEmitter<void>();
  @Output() printed = new EventEmitter<WorkOrder>();
  @Output() saved = new EventEmitter<WorkOrder>();
  @Output() finished = new EventEmitter<WorkOrder>();

  workDescription = '';

  chargeDescription = '';
  chargeQuantity = 1;
  chargeAmount: number | null = null;
  chargeItems: WorkOrderChargeItem[] = [];
  editingChargeItemId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['order'] || changes['mode']) && this.order) {
      this.workDescription = this.order.workDescription ?? '';
      this.chargeItems = (this.order.chargeItems ?? []).map((item) => ({
        ...item,
      }));
      this.resetChargeForm();
    }
  }

  get isPending(): boolean {
    return this.order.status === 'pending';
  }

  formatReceptionDateTime(): string {
    return formatDateAndTime(
      this.order.receptionDate,
      this.order.receptionTime,
    );
  }

  formatCompletedDateTime(): string {
    return formatTimestamp(this.order.completedAt, this.order.completedDate);
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get canEditChargeItems(): boolean {
    return this.isPending || this.isEditMode;
  }

  get isEditingChargeItem(): boolean {
    return this.editingChargeItemId !== null;
  }

  get chargeTotal(): number {
    return this.chargeItems.reduce((total, item) => total + item.subtotal, 0);
  }

  get orderWithEditableValues(): WorkOrder {
    return {
      ...this.order,
      workDescription: this.workDescription,
      chargeItems: this.chargeItems.map((item) => ({ ...item })),
      totalAmount: this.chargeTotal,
    };
  }

  addOrUpdateChargeItem(): void {
    const cleanDescription = this.chargeDescription.trim();
    const cleanQuantity = this.normalizeQuantity(this.chargeQuantity);
    const cleanAmount = this.normalizeAmount(this.chargeAmount);

    if (!cleanDescription || cleanAmount <= 0) {
      return;
    }

    const subtotal = cleanQuantity * cleanAmount;

    if (this.editingChargeItemId) {
      this.chargeItems = this.chargeItems.map((item) =>
        item.id === this.editingChargeItemId
          ? {
              ...item,
              description: cleanDescription,
              quantity: cleanQuantity,
              amount: cleanAmount,
              subtotal,
            }
          : item,
      );
    } else {
      this.chargeItems = [
        ...this.chargeItems,
        {
          id: crypto.randomUUID(),
          description: cleanDescription,
          quantity: cleanQuantity,
          amount: cleanAmount,
          subtotal,
        },
      ];
    }

    this.resetChargeForm();
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('es-BO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  editChargeItem(item: WorkOrderChargeItem): void {
    this.editingChargeItemId = item.id;
    this.chargeDescription = item.description;
    this.chargeQuantity = item.quantity;
    this.chargeAmount = item.amount;
  }

  deleteChargeItem(itemId: string): void {
    this.chargeItems = this.chargeItems.filter((item) => item.id !== itemId);

    if (this.editingChargeItemId === itemId) {
      this.resetChargeForm();
    }
  }

  cancelChargeEdit(): void {
    this.resetChargeForm();
  }

  close(): void {
    this.closed.emit();
  }

  print(): void {
    this.printed.emit(this.orderWithEditableValues);
  }

  save(): void {
    this.saved.emit(this.orderWithEditableValues);
  }

  finish(): void {
    if (this.isPending && this.chargeItems.length === 0) {
      window.alert(
        'Debes registrar al menos un detalle de cobro antes de finalizar la orden.',
      );
      return;
    }

    this.finished.emit(this.orderWithEditableValues);
  }

  trackByChargeItemId(_: number, item: WorkOrderChargeItem): string {
    return item.id;
  }

  private resetChargeForm(): void {
    this.chargeDescription = '';
    this.chargeQuantity = 1;
    this.chargeAmount = null;
    this.editingChargeItemId = null;
  }

  private normalizeQuantity(value: number): number {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 1) {
      return 1;
    }

    return Math.floor(numericValue);
  }

  private normalizeAmount(value: number | null): number {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return 0;
    }

    return numericValue;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.close();
  }
}
