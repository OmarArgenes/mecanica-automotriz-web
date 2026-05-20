import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  today = new Date();
  isUserMenuOpen = false;
  isLoggingOut = false;

  readonly userEmail = computed(() => {
    return this.authService.user()?.email ?? 'Usuario interno';
  });

  readonly userInitials = computed(() => {
    const email = this.userEmail();

    if (!email || email === 'Usuario interno') {
      return 'US';
    }

    return email.slice(0, 2).toUpperCase();
  });

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  async logout(): Promise<void> {
    this.isLoggingOut = true;

    try {
      await this.authService.signOut();
      this.closeUserMenu();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error(error);
      window.alert('No se pudo cerrar sesión. Intenta nuevamente.');
    } finally {
      this.isLoggingOut = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeMenuWithEscape(): void {
    this.closeUserMenu();
  }
}
