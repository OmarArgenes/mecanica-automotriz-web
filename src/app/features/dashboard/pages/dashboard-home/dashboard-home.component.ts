import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuickActionsComponent } from '../../../../shared/components/quick-actions/quick-actions.component';
import { DashboardService } from '../../data-access/dashboard.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickActionsComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent {
  private readonly dashboardService = inject(DashboardService);

  searchTerm = '';

  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  get stats() {
    return this.dashboardService.stats();
  }

  get recentIntakes() {
    return this.dashboardService.recentIntakes();
  }

  get filteredRecentIntakes() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.recentIntakes;
    }

    return this.recentIntakes.filter((item) =>
      [item.time, item.plate, item.customer, item.vehicle, item.status].some(
        (value) => value.toLowerCase().includes(term),
      ),
    );
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  async refreshDashboard(): Promise<void> {
    try {
      await this.dashboardService.loadDashboardData();
    } catch (error) {
      console.error(error);
    }
  }
}
