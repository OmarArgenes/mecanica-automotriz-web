import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { WorkOrder } from '../../../work-orders/models/work-order.model';

@Component({
  selector: 'app-selected-work-order-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selected-work-order-panel.component.html',
  styleUrl: './selected-work-order-panel.component.scss',
})
export class SelectedWorkOrderPanelComponent {
  @Input() order: WorkOrder | null = null;

  @Output() requestClicked = new EventEmitter<void>();

  requestParts(): void {
    this.requestClicked.emit();
  }
}
