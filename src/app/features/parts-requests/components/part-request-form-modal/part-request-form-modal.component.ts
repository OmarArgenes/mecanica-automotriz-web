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

import { WorkOrder } from '../../../work-orders/models/work-order.model';
import {
  PartRequest,
  PartRequestFormValue,
  PartRequestItem,
} from '../../models/part-request.model';

@Component({
  selector: 'app-part-request-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './part-request-form-modal.component.html',
  styleUrl: './part-request-form-modal.component.scss',
})
export class PartRequestFormModalComponent implements OnChanges {
  @Input({ required: true }) order!: WorkOrder;
  @Input() requestToEdit: PartRequest | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<PartRequestFormValue>();

  workshopProvidesParts = false;

  partName = '';
  quantity = 1;

  parts: PartRequestItem[] = [];
  editingPartId: string | null = null;

  get isEditing(): boolean {
    return this.editingPartId !== null;
  }

  get isEditingRequest(): boolean {
    return this.requestToEdit !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestToEdit']) {
      this.loadRequestToEdit();
    }
  }

  addOrUpdatePart(): void {
    const cleanName = this.partName.trim();
    const cleanQuantity = this.normalizeQuantity(this.quantity);

    if (!cleanName) {
      return;
    }

    if (this.editingPartId) {
      this.parts = this.parts.map((part) =>
        part.id === this.editingPartId
          ? {
              ...part,
              name: cleanName,
              quantity: cleanQuantity,
            }
          : part,
      );
    } else {
      this.parts = [
        ...this.parts,
        {
          id: crypto.randomUUID(),
          name: cleanName,
          quantity: cleanQuantity,
        },
      ];
    }

    this.resetPartForm();
  }

  editPart(part: PartRequestItem): void {
    this.editingPartId = part.id;
    this.partName = part.name;
    this.quantity = part.quantity;
  }

  deletePart(partId: string): void {
    this.parts = this.parts.filter((part) => part.id !== partId);

    if (this.editingPartId === partId) {
      this.resetPartForm();
    }
  }

  cancelEdit(): void {
    this.resetPartForm();
  }

  close(): void {
    this.closed.emit();
  }

  save(): void {
    if (this.parts.length === 0) {
      window.alert('Agrega al menos un repuesto antes de guardar.');
      return;
    }

    this.saved.emit({
      workshopProvidesParts: this.workshopProvidesParts,
      parts: this.parts,
    });
  }

  trackByPartId(_: number, part: PartRequestItem): string {
    return part.id;
  }

  private loadRequestToEdit(): void {
    this.resetPartForm();

    if (!this.requestToEdit) {
      this.workshopProvidesParts = false;
      this.parts = [];
      return;
    }

    this.workshopProvidesParts = this.requestToEdit.workshopProvidesParts;
    this.parts = this.requestToEdit.parts.map((part) => ({
      ...part,
      id: part.id || crypto.randomUUID(),
    }));
  }

  private resetPartForm(): void {
    this.partName = '';
    this.quantity = 1;
    this.editingPartId = null;
  }

  private normalizeQuantity(value: number): number {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 1) {
      return 1;
    }

    return Math.floor(numericValue);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.close();
  }
}
