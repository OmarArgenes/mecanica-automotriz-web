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

import { WorkOrder } from '../../models/work-order.model';

@Component({
  selector: 'app-work-order-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-order-detail-modal.component.html',
  styleUrl: './work-order-detail-modal.component.scss',
})
export class WorkOrderDetailModalComponent implements OnChanges {
  @Input({ required: true }) order!: WorkOrder;

  @Output() closed = new EventEmitter<void>();
  @Output() printed = new EventEmitter<WorkOrder>();
  @Output() finished = new EventEmitter<WorkOrder>();

  editableWorkDescription = '';
  editableTotalAmount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      this.editableWorkDescription = this.order.workDescription;
      this.editableTotalAmount = this.order.totalAmount;
    }
  }

  get isPending(): boolean {
    return this.order.status === 'pending';
  }

  get orderWithEditableValues(): WorkOrder {
    return {
      ...this.order,
      workDescription: this.editableWorkDescription,
      totalAmount: Number(this.editableTotalAmount) || 0,
    };
  }

  close(): void {
    this.closed.emit();
  }

  print(): void {
    this.printed.emit(this.orderWithEditableValues);
  }

  finish(): void {
    this.finished.emit(this.orderWithEditableValues);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.close();
  }
}
