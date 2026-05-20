import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PartRequest } from '../../models/part-request.model';

@Component({
  selector: 'app-part-request-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './part-request-history.component.html',
  styleUrl: './part-request-history.component.scss',
})
export class PartRequestHistoryComponent {
  @Input() requests: PartRequest[] = [];

  @Output() printRequested = new EventEmitter<PartRequest>();
  @Output() editRequested = new EventEmitter<PartRequest>();
  @Output() deleteRequested = new EventEmitter<PartRequest>();

  searchTerm = '';

  get hasSearchTerm(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  get filteredRequests(): PartRequest[] {
    const term = this.normalizeText(this.searchTerm);

    if (!term) {
      return this.requests;
    }

    return this.requests.filter((request) =>
      [
        request.requestNumber,
        request.orderNumber,
        request.customerName,
        request.customerPhone,
        request.vehicleBrand,
        request.vehicleModel,
        request.plateNumber,
        request.requestedAt,
        request.workshopProvidesParts ? 'provee taller' : 'no provee taller',
        ...request.parts.map((part) => part.name),
      ].some((value) => this.normalizeText(value).includes(term)),
    );
  }

  printRequest(request: PartRequest): void {
    this.printRequested.emit(request);
  }

  editRequest(request: PartRequest): void {
    this.editRequested.emit(request);
  }

  deleteRequest(request: PartRequest): void {
    this.deleteRequested.emit(request);
  }

  trackByRequestId(_: number, request: PartRequest): string {
    return request.id;
  }

  trackByPartId(_: number, part: { id: string }): string {
    return part.id;
  }

  private normalizeText(value: string | number | null | undefined): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }
}
