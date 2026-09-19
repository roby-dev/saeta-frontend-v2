import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service.js';
import { ButtonComponent } from '../../../../shared/ui/button/button.component.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div>
      <div class="mb-6 text-center">
        <h2 class="text-xl font-bold text-slate-900">Iniciar Sesión</h2>
        <p class="text-xs text-slate-500 mt-1">Acceso a la plataforma operativa SAETA</p>
      </div>

      @if (errorMessage()) {
        <div class="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="email" class="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="operador@seguridad.pe"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            [class.border-rose-400]="isFieldInvalid('email')"
          />
          @if (isFieldInvalid('email')) {
            <p class="mt-1 text-xs text-rose-600">Ingrese un correo válido</p>
          }
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Contraseña
            </label>
          </div>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            [class.border-rose-400]="isFieldInvalid('password')"
          />
          @if (isFieldInvalid('password')) {
            <p class="mt-1 text-xs text-rose-600">La contraseña es obligatoria</p>
          }
        </div>

        <div class="pt-2">
          <app-button
            type="submit"
            [fullWidth]="true"
            [loading]="isLoading()"
            [disabled]="loginForm.invalid"
          >
            Ingresar al Sistema
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
  });

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.loginForm.get(field);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email: email ?? '', password: password ?? '' }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'Credenciales incorrectas o servidor no disponible.',
        );
      },
    });
  }
}
