import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service.js';
import type { User, UserRole } from '../../../../core/models/user.model.js';
import { ProfileService } from '../../services/profile.service.js';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb / Header Title -->
      <div class="bg-white p-5 rounded border border-[#e5edef] shadow-sm flex items-center justify-between">
        <div>
          <h4 class="card-title text-base font-bold text-[#455a64] flex items-center mb-1">
            <span class="lstick"></span>Mi Perfil de Usuario
          </h4>
          <p class="text-xs text-slate-400">
            Administra tu información personal y credenciales de acceso al sistema SAETA.
          </p>
        </div>
      </div>

      <!-- Main Profile Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- ============================================================== -->
        <!-- Left Column: User Summary Card (Admin Pro Style)              -->
        <!-- ============================================================== -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-white rounded border border-[#e5edef] shadow-sm p-6 text-center">
            <!-- Big Avatar -->
            <div class="mx-auto w-24 h-24 rounded-full bg-[#1976d2] text-white flex items-center justify-center font-black text-2xl shadow-md border-4 border-blue-50">
              @if (currentUser()?.image) {
                <img
                  [src]="currentUser()!.image"
                  alt="Avatar"
                  class="w-full h-full rounded-full object-cover"
                />
              } @else {
                <span>{{ userInitials() }}</span>
              }
            </div>

            <!-- Name and Role -->
            <h5 class="text-base font-bold text-[#2b354f] mt-4">
              {{ currentUser()?.name }} {{ currentUser()?.lastname }}
            </h5>
            <div class="mt-1">
              <span
                class="inline-block px-2.5 py-0.5 rounded text-xs font-bold"
                [ngClass]="getRoleBadgeClass(currentUser()?.role)"
              >
                {{ getRoleLabel(currentUser()?.role) }}
              </span>
            </div>

            @if (currentUser()?.availability) {
              <div class="mt-2">
                <span
                  class="inline-block px-2 py-0.5 rounded text-[11px] font-bold"
                  [ngClass]="currentUser()?.availability === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                >
                  {{ currentUser()?.availability }}
                </span>
              </div>
            }

            <hr class="my-5 border-slate-100" />

            <!-- User Metadata List -->
            <div class="text-left space-y-3 text-xs">
              <div>
                <span class="text-slate-400 font-semibold block uppercase text-[10px]">Documento de Identidad (DNI)</span>
                <span class="font-bold text-slate-700 font-mono">{{ currentUser()?.dni || 'S/D' }}</span>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase text-[10px]">Correo Electrónico</span>
                <span class="font-bold text-slate-700">{{ currentUser()?.email }}</span>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase text-[10px]">Número de Celular</span>
                <span class="font-bold text-slate-700">{{ currentUser()?.phone || 'S/D' }}</span>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase text-[10px]">Estado de Cuenta</span>
                <span
                  class="inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5"
                  [ngClass]="currentUser()?.statusAccount === 'INHABILITADO' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'"
                >
                  {{ currentUser()?.statusAccount === 'INHABILITADO' ? 'Inhabilitado' : 'Habilitado' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- Right Column: Profile & Password Tabs                         -->
        <!-- ============================================================== -->
        <div class="lg:col-span-8">
          <div class="bg-white rounded border border-[#e5edef] shadow-sm overflow-hidden">
            <!-- Nav Tabs (Customtab Style) -->
            <div class="border-b border-[#e5edef] px-6 pt-3 bg-slate-50/40">
              <ul class="flex gap-4 text-xs font-semibold select-none">
                <li>
                  <button
                    type="button"
                    (click)="activeTab.set('profile')"
                    class="py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer"
                    [ngClass]="activeTab() === 'profile' 
                      ? 'border-[#1976d2] text-[#1976d2] font-bold bg-white rounded-t' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Datos Personales</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    (click)="activeTab.set('security')"
                    class="py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer"
                    [ngClass]="activeTab() === 'security' 
                      ? 'border-[#1976d2] text-[#1976d2] font-bold bg-white rounded-t' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Seguridad & Contraseña</span>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Tab 1: Profile Info Form -->
            @if (activeTab() === 'profile') {
              <div class="p-6">
                @if (profileSuccess()) {
                  <div class="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs font-semibold flex items-center justify-between">
                    <span>¡Tus datos de perfil han sido actualizados exitosamente!</span>
                    <button type="button" (click)="profileSuccess.set(false)" class="text-emerald-800 font-bold">✕</button>
                  </div>
                }

                @if (profileError()) {
                  <div class="mb-4 p-3 bg-rose-50 text-rose-700 rounded border border-rose-200 text-xs font-semibold flex items-center justify-between">
                    <span>{{ profileError() }}</span>
                    <button type="button" (click)="profileError.set(null)" class="text-rose-800 font-bold">✕</button>
                  </div>
                }

                <form [formGroup]="profileForm" (ngSubmit)="submitProfileForm()" class="space-y-4 text-xs text-slate-600">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Nombres -->
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">
                        Nombres <span class="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        formControlName="name"
                        class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none"
                        [ngClass]="isProfileFieldInvalid('name') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                      />
                      @if (isProfileFieldInvalid('name')) {
                        <p class="text-rose-600 text-[11px] mt-0.5">El nombre es requerido.</p>
                      }
                    </div>

                    <!-- Apellidos -->
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">
                        Apellidos <span class="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        formControlName="lastname"
                        class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none"
                        [ngClass]="isProfileFieldInvalid('lastname') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                      />
                      @if (isProfileFieldInvalid('lastname')) {
                        <p class="text-rose-600 text-[11px] mt-0.5">Los apellidos son requeridos.</p>
                      }
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Email -->
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">
                        Correo Electrónico <span class="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        formControlName="email"
                        class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none"
                        [ngClass]="isProfileFieldInvalid('email') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                      />
                      @if (isProfileFieldInvalid('email')) {
                        <p class="text-rose-600 text-[11px] mt-0.5">Ingrese un correo válido.</p>
                      }
                    </div>

                    <!-- Phone -->
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">
                        Nro. de Celular <span class="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        formControlName="phone"
                        maxlength="9"
                        class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none"
                        [ngClass]="isProfileFieldInvalid('phone') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                      />
                      @if (isProfileFieldInvalid('phone')) {
                        <p class="text-rose-600 text-[11px] mt-0.5">Debe ser un número de 9 dígitos.</p>
                      }
                    </div>
                  </div>

                  <!-- Submit button -->
                  <div class="pt-3 flex justify-end">
                    <button
                      type="submit"
                      [disabled]="isSavingProfile() || profileForm.invalid"
                      class="px-5 py-2.5 bg-[#1976d2] hover:bg-[#1565c0] text-white font-semibold rounded text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      @if (isSavingProfile()) {
                        <div class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                        <span>Guardando cambios...</span>
                      } @else {
                        <span>Guardar Cambios</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- Tab 2: Security & Password Form -->
            @if (activeTab() === 'security') {
              <div class="p-6">
                @if (passwordSuccess()) {
                  <div class="mb-4 p-4 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs font-semibold flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>¡Tu contraseña ha sido actualizada correctamente! Úsala en tu próximo inicio de sesión.</span>
                    </div>
                    <button type="button" (click)="passwordSuccess.set(false)" class="text-emerald-800 font-bold">✕</button>
                  </div>
                }

                @if (passwordError()) {
                  <div class="mb-4 p-3 bg-rose-50 text-rose-700 rounded border border-rose-200 text-xs font-semibold flex items-center justify-between">
                    <span>{{ passwordError() }}</span>
                    <button type="button" (click)="passwordError.set(null)" class="text-rose-800 font-bold">✕</button>
                  </div>
                }

                <form [formGroup]="passwordForm" (ngSubmit)="submitPasswordForm()" class="space-y-4 text-xs text-slate-600 max-w-lg">
                  <!-- Contraseña Actual -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="font-bold text-slate-700">
                        Contraseña Actual <span class="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        (click)="showCurrentPass.set(!showCurrentPass())"
                        class="text-[11px] text-[#1976d2] hover:underline cursor-pointer"
                      >
                        {{ showCurrentPass() ? 'Ocultar' : 'Mostrar' }}
                      </button>
                    </div>
                    <input
                      [type]="showCurrentPass() ? 'text' : 'password'"
                      formControlName="currentPassword"
                      placeholder="Ingresa tu contraseña actual"
                      class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none font-mono"
                      [ngClass]="isPasswordFieldInvalid('currentPassword') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                    />
                    @if (isPasswordFieldInvalid('currentPassword')) {
                      <p class="text-rose-600 text-[11px] mt-0.5">La contraseña actual es requerida.</p>
                    }
                  </div>

                  <!-- Nueva Contraseña -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="font-bold text-slate-700">
                        Nueva Contraseña <span class="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        (click)="showNewPass.set(!showNewPass())"
                        class="text-[11px] text-[#1976d2] hover:underline cursor-pointer"
                      >
                        {{ showNewPass() ? 'Ocultar' : 'Mostrar' }}
                      </button>
                    </div>
                    <input
                      [type]="showNewPass() ? 'text' : 'password'"
                      formControlName="newPassword"
                      placeholder="Mínimo 6 caracteres"
                      class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none font-mono"
                      [ngClass]="isPasswordFieldInvalid('newPassword') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                    />
                    @if (isPasswordFieldInvalid('newPassword')) {
                      <p class="text-rose-600 text-[11px] mt-0.5">La nueva contraseña debe tener al menos 6 caracteres.</p>
                    }
                  </div>

                  <!-- Confirmar Nueva Contraseña -->
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">
                      Confirmar Nueva Contraseña <span class="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      formControlName="confirmPassword"
                      placeholder="Vuelve a escribir la nueva contraseña"
                      class="w-full p-2.5 border rounded focus:border-[#1976d2] focus:outline-none font-mono"
                      [ngClass]="(isPasswordFieldInvalid('confirmPassword') || passwordsMismatch()) ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                    />
                    @if (passwordsMismatch()) {
                      <p class="text-rose-600 text-[11px] mt-0.5">Las contraseñas no coinciden.</p>
                    }
                  </div>

                  <!-- Submit button -->
                  <div class="pt-3 flex justify-start">
                    <button
                      type="submit"
                      [disabled]="isChangingPassword() || passwordForm.invalid || passwordsMismatch()"
                      class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      @if (isChangingPassword()) {
                        <div class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                        <span>Actualizando contraseña...</span>
                      } @else {
                        <span>Actualizar Contraseña</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfilePageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);

  // Active Tab: 'profile' | 'security'
  readonly activeTab = signal<'profile' | 'security'>('profile');

  // Signals
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly isSavingProfile = signal<boolean>(false);
  readonly profileSuccess = signal<boolean>(false);
  readonly profileError = signal<string | null>(null);

  readonly isChangingPassword = signal<boolean>(false);
  readonly passwordSuccess = signal<boolean>(false);
  readonly passwordError = signal<string | null>(null);

  readonly showCurrentPass = signal<boolean>(false);
  readonly showNewPass = signal<boolean>(false);

  // Forms
  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    lastname: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return 'SA';
    const first = u.name?.charAt(0) ?? '';
    const last = u.lastname?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || 'U';
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name ?? '',
        lastname: user.lastname ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }

  getRoleBadgeClass(role?: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'BASE_SEGURIDAD':
        return 'bg-sky-100 text-sky-800 border border-sky-200';
      case 'PERSONAL_SEGURIDAD':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'CIUDADANO':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  getRoleLabel(role?: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'BASE_SEGURIDAD':
        return 'Base de Seguridad';
      case 'PERSONAL_SEGURIDAD':
        return 'Personal Seguridad';
      case 'CIUDADANO':
        return 'Ciudadano';
      default:
        return role || 'Usuario';
    }
  }

  isProfileFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  isPasswordFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  passwordsMismatch(): boolean {
    const newPass = this.passwordForm.get('newPassword')?.value;
    const confirmPass = this.passwordForm.get('confirmPassword')?.value;
    return !!newPass && !!confirmPass && newPass !== confirmPass;
  }

  submitProfileForm(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isSavingProfile.set(true);
    this.profileError.set(null);
    this.profileSuccess.set(false);

    const values = this.profileForm.getRawValue();

    this.profileService.updateProfile(user.id, values).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.profileSuccess.set(true);
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.profileError.set(
          err?.error?.message || err?.error?.msg || 'Error al actualizar datos de perfil',
        );
      },
    });
  }

  submitPasswordForm(): void {
    if (this.passwordForm.invalid || this.passwordsMismatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isChangingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(false);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.profileService.changePassword(user.id, currentPassword, newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(
          err?.error?.message || err?.error?.msg || 'Error al actualizar la contraseña',
        );
      },
    });
  }
}
