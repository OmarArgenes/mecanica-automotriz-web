import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PartRequest } from '../../models/part-request.model';

@Component({
  selector: 'app-part-request-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './part-request-history.component.html',
  styleUrl: './part-request-history.component.scss',
})
export class PartRequestHistoryComponent {
  @Input() requests: PartRequest[] = [];

  @Output() printRequested = new EventEmitter<PartRequest>();

  printRequest(request: PartRequest): void {
    this.printRequested.emit(request);
  }

  trackByRequestId(_: number, request: PartRequest): string {
    return request.id;
  }

  trackByPartId(_: number, part: { id: string }): string {
    return part.id;
  }
}
