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

import {
  WorkOrder,
  WorkOrderChargeItem,
  WorkOrderChargeItemType,
} from '../../models/work-order.model';
import {
  formatDateAndTime,
  formatTimestamp,
} from '../../../../shared/utils/date-time-format.util';

type WorkOrderModalMode = 'view' | 'edit';

interface ChargeItemDraft {
  description: string;
  quantity: number;
  amount: number | null;
  editingItemId: string | null;
}

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
  recommendations = '';

  chargeItems: WorkOrderChargeItem[] = [];

  serviceDraft: ChargeItemDraft = this.createEmptyChargeItemDraft();
  supplyDraft: ChargeItemDraft = this.createEmptyChargeItemDraft();

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['order'] || changes['mode']) && this.order) {
      this.workDescription = this.order.workDescription ?? '';
      this.recommendations = this.order.recommendations ?? '';

      this.chargeItems = (this.order.chargeItems ?? []).map((item) => ({
        ...item,
        itemType: item.itemType === 'supply' ? 'supply' : 'service',
      }));

      this.resetAllChargeForms();
    }
  }

  get isPending(): boolean {
    return this.order.status === 'pending';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get canEditChargeItems(): boolean {
    return this.isPending || this.isEditMode;
  }

  get serviceChargeItems(): WorkOrderChargeItem[] {
    return this.chargeItems.filter((item) => item.itemType === 'service');
  }

  get supplyChargeItems(): WorkOrderChargeItem[] {
    return this.chargeItems.filter((item) => item.itemType === 'supply');
  }

  get serviceTotal(): number {
    return this.calculateItemsTotal(this.serviceChargeItems);
  }

  get supplyTotal(): number {
    return this.calculateItemsTotal(this.supplyChargeItems);
  }

  get chargeTotal(): number {
    return this.serviceTotal + this.supplyTotal;
  }

  get isEditingServiceItem(): boolean {
    return this.serviceDraft.editingItemId !== null;
  }

  get isEditingSupplyItem(): boolean {
    return this.supplyDraft.editingItemId !== null;
  }

  get orderWithEditableValues(): WorkOrder {
    return {
      ...this.order,
      workDescription: this.workDescription,
      recommendations: this.recommendations,
      chargeItems: this.chargeItems.map((item, index) => ({
        ...item,
        subtotal:
          this.normalizeQuantity(item.quantity) *
          this.normalizeAmount(item.amount),
      })),
      totalAmount: this.chargeTotal,
    };
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

  addOrUpdateChargeItem(itemType: WorkOrderChargeItemType): void {
    const draft = this.getDraftByType(itemType);

    const cleanDescription = draft.description.trim();
    const cleanQuantity = this.normalizeQuantity(draft.quantity);
    const cleanAmount = this.normalizeAmount(draft.amount);

    if (!cleanDescription || cleanAmount <= 0) {
      return;
    }

    const subtotal = cleanQuantity * cleanAmount;

    if (draft.editingItemId) {
      this.chargeItems = this.chargeItems.map((item) =>
        item.id === draft.editingItemId
          ? {
              ...item,
              itemType,
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
          itemType,
          description: cleanDescription,
          quantity: cleanQuantity,
          amount: cleanAmount,
          subtotal,
        },
      ];
    }

    this.resetChargeForm(itemType);
  }

  editChargeItem(item: WorkOrderChargeItem): void {
    const itemType = item.itemType === 'supply' ? 'supply' : 'service';
    const draft = this.getDraftByType(itemType);

    draft.editingItemId = item.id;
    draft.description = item.description;
    draft.quantity = item.quantity;
    draft.amount = item.amount;
  }

  deleteChargeItem(itemId: string): void {
    this.chargeItems = this.chargeItems.filter((item) => item.id !== itemId);

    if (this.serviceDraft.editingItemId === itemId) {
      this.resetChargeForm('service');
    }

    if (this.supplyDraft.editingItemId === itemId) {
      this.resetChargeForm('supply');
    }
  }

  cancelChargeEdit(itemType: WorkOrderChargeItemType): void {
    this.resetChargeForm(itemType);
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
    if (this.chargeItems.length === 0) {
      window.alert(
        'Debes registrar al menos un servicio, trabajo, repuesto o insumo antes de finalizar la orden.',
      );
      return;
    }

    this.finished.emit(this.orderWithEditableValues);
  }

  trackByChargeItemId(_: number, item: WorkOrderChargeItem): string {
    return item.id;
  }

  private getDraftByType(itemType: WorkOrderChargeItemType): ChargeItemDraft {
    return itemType === 'supply' ? this.supplyDraft : this.serviceDraft;
  }

  private resetAllChargeForms(): void {
    this.resetChargeForm('service');
    this.resetChargeForm('supply');
  }

  private resetChargeForm(itemType: WorkOrderChargeItemType): void {
    const emptyDraft = this.createEmptyChargeItemDraft();

    if (itemType === 'supply') {
      this.supplyDraft = emptyDraft;
      return;
    }

    this.serviceDraft = emptyDraft;
  }

  private createEmptyChargeItemDraft(): ChargeItemDraft {
    return {
      description: '',
      quantity: 1,
      amount: null,
      editingItemId: null,
    };
  }

  private calculateItemsTotal(items: WorkOrderChargeItem[]): number {
    return items.reduce((total, item) => total + Number(item.subtotal ?? 0), 0);
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
