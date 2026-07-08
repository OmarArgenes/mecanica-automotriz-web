import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  async submitLogin(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.signIn(this.email, this.password);

      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

      await this.router.navigateByUrl(returnUrl);
    } catch (error: unknown) {
      this.errorMessage = this.getLoginErrorMessage(error);
      console.error('Error al iniciar sesión.', error);
    } finally {
      this.loading = false;
    }
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof TypeError || this.isNetworkError(error)) {
      return 'No se pudo conectar con el servidor de autenticación. Verifica la conexión o la disponibilidad del servicio.';
    }

    return 'No se pudo iniciar sesión. Verifica el correo y la contraseña.';
  }

  private isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();

    return (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('name_not_resolved')
    );
  }
}
