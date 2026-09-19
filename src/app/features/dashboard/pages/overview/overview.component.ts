import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service.js';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component.js';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 mb-2">
              <app-badge variant="info">
                Plataforma Operativa v2
              </app-badge>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">
              Bienvenido, {{ userFullName() }}
            </h1>
            <p class="mt-1 text-sm text-blue-100 max-w-2xl">
              Panel de control y monitoreo de emergencias ciudadanas en tiempo real.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2"></span>
              Servidor Conectado
            </span>
          </div>
        </div>
      </div>

      <!-- Metric Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Stat 1 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Alertas Pendientes</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">12</p>
            <span class="text-xs text-amber-600 font-semibold mt-1 inline-flex items-center">
              Requieren atención
            </span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            🚨
          </div>
        </div>

        <!-- Stat 2 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Alertas Atendidas</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">143</p>
            <span class="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center">
              En este mes
            </span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            ✅
          </div>
        </div>

        <!-- Stat 3 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Personal Activo</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">8</p>
            <span class="text-xs text-blue-600 font-semibold mt-1 inline-flex items-center">
              En patrullaje
            </span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            👮
          </div>
        </div>

        <!-- Stat 4 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Calificación Promedio</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">4.8 / 5</p>
            <span class="text-xs text-indigo-600 font-semibold mt-1 inline-flex items-center">
              Satisfacción vecinal
            </span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
            ⭐
          </div>
        </div>
      </div>

      <!-- Quick Actions / Status Notice -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-base font-bold text-slate-900 mb-2">Arquitectura de Frontend v2</h2>
        <p class="text-sm text-slate-600 leading-relaxed">
          Esta aplicación está construida sobre <strong>Angular 22 Zoneless</strong> con reactividad nativa mediante <strong>Signals</strong>, estilos utilitarios con <strong>Tailwind CSS v4</strong> y consumo seguro de la API protegida con JWT e Interceptor.
        </p>
      </div>
    </div>
  `,
})
export class OverviewComponent {
  private readonly authService = inject(AuthService);

  protected readonly userFullName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.name} ${user.lastname}` : 'Operador';
  });
}
