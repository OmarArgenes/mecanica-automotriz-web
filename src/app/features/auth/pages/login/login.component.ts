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
    } catch {
      this.errorMessage =
        'No se pudo iniciar sesión. Verifica el correo y la contraseña.';
    } finally {
      this.loading = false;
    }
  }
}
