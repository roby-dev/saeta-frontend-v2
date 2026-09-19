import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../../core/services/dashboard.service.js';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Loading State -->
      @if (dashboard.loading()) {
        <div class="p-12 text-center bg-white border border-slate-200 rounded-sm">
          <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-3 text-sm text-slate-500 font-medium">Cargando métricas operativas de SAETA...</p>
        </div>
      } @else if (dashboard.error()) {
        <!-- Error State -->
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-sm text-rose-700 flex items-center justify-between">
          <div>
            <p class="font-bold text-sm">Error al conectar con la base de datos de SAETA</p>
            <p class="text-xs text-rose-600 mt-0.5">{{ dashboard.error() }}</p>
          </div>
          <button
            (click)="dashboard.loadDashboardData()"
            class="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      } @else {
        <!-- Top Metrics Row (Legacy Style with .lstick) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Total de Alertas -->
          <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
            <h5 class="card-title"><span class="lstick"></span>Total de alertas</h5>
            <div class="flex items-center justify-between mt-3">
              <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div class="text-right">
                <h2 class="text-3xl font-bold text-slate-800">{{ dashboard.totalAlerts() }}</h2>
                <span class="text-xs text-slate-400 font-medium">Registradas</span>
              </div>
            </div>
          </div>

          <!-- Rechazadas -->
          <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
            <h5 class="card-title"><span class="lstick"></span>Rechazadas</h5>
            <div class="flex items-center justify-between mt-3">
              <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-right">
                <h2 class="text-3xl font-bold text-slate-800">{{ dashboard.totalRejectedAlerts() }}</h2>
                <span class="text-xs text-slate-400 font-medium">Desestimadas</span>
              </div>
            </div>
          </div>

          <!-- Personal -->
          <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
            <h5 class="card-title"><span class="lstick"></span>Personal</h5>
            <div class="flex items-center justify-between mt-3">
              <div class="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="text-right">
                <h2 class="text-3xl font-bold text-slate-800">{{ dashboard.totalPersonalUsers() }}</h2>
                <span class="text-xs text-slate-400 font-medium">Efectivos</span>
              </div>
            </div>
          </div>

          <!-- Ciudadanos -->
          <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
            <h5 class="card-title"><span class="lstick"></span>Ciudadanos</h5>
            <div class="flex items-center justify-between mt-3">
              <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="text-right">
                <h2 class="text-3xl font-bold text-slate-800">{{ dashboard.totalCitizenUsers() }}</h2>
                <span class="text-xs text-slate-400 font-medium">Registrados</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Grid (Left content + Right aside widgets) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Section (8 cols) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Row: Promedios de tiempo & Tipos de Alerta -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Promedios de tiempo (3 stacked cards) -->
              <div class="space-y-4">
                <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
                  <h4 class="card-title"><span class="lstick"></span>Tiempo promedio de Atención</h4>
                  <p class="text-center text-2xl font-bold text-slate-800 my-2 tracking-tight">
                    {{ dashboard.attentionTimeResume() }}
                  </p>
                  <p class="text-center text-xs text-slate-400">Creación hasta primera asignación</p>
                </div>

                <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
                  <h4 class="card-title"><span class="lstick"></span>Tiempo promedio de Resolución</h4>
                  <p class="text-center text-2xl font-bold text-slate-800 my-2 tracking-tight">
                    {{ dashboard.resolutionTimeResume() }}
                  </p>
                  <p class="text-center text-xs text-slate-400">Atención hasta culminación</p>
                </div>

                <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
                  <h4 class="card-title"><span class="lstick"></span>Tiempo promedio Total</h4>
                  <p class="text-center text-2xl font-bold text-slate-800 my-2 tracking-tight text-blue-600">
                    {{ dashboard.totalTimeResume() }}
                  </p>
                  <p class="text-center text-xs text-slate-400">Ciclo de vida completo del incidente</p>
                </div>
              </div>

              <!-- Tipos de Alerta Breakdown -->
              <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 class="card-title"><span class="lstick"></span>Tipos de Alerta</h4>
                  <p class="text-xs text-slate-400 mb-4">Distribución porcentual por categoría</p>

                  <div class="space-y-3">
                    @for (item of dashboard.typesMetrics(); track item.name) {
                      <div>
                        <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>{{ item.name }}</span>
                          <span class="text-slate-500">{{ item.count }} ({{ item.percentage }}%)</span>
                        </div>
                        <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-blue-600 rounded-full transition-all duration-500"
                            [style.width.%]="item.percentage"
                          ></div>
                        </div>
                      </div>
                    }
                    @if (dashboard.typesMetrics().length === 0) {
                      <p class="text-xs text-slate-400 text-center py-6">No hay tipos de alerta registrados</p>
                    }
                  </div>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                  <span>Total Tipos: {{ dashboard.typesMetrics().length }}</span>
                  <span>Alertas: {{ dashboard.totalAlerts() }}</span>
                </div>
              </div>
            </div>

            <!-- Alertas Recibidas (Year / Month Breakdown) -->
            <div class="bg-white border border-slate-200/90 rounded-sm shadow-xs overflow-hidden">
              <div class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
                <div>
                  <h3 class="card-title mb-0"><span class="lstick"></span>Alertas Recibidas</h3>
                  <p class="text-xs text-slate-400 mt-1">Evolución histórica anual y mensual</p>
                </div>

                <!-- Selectores Año y Mes -->
                <div class="flex items-center gap-2">
                  <select
                    [value]="dashboard.selectedYear()"
                    (change)="onYearChange($event)"
                    class="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option [value]="2026">Año 2026</option>
                    <option [value]="2025">Año 2025</option>
                    <option [value]="2024">Año 2024</option>
                  </select>

                  <select
                    [value]="dashboard.selectedMonth()"
                    (change)="onMonthChange($event)"
                    class="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    @for (m of dashboard.months; track m.id) {
                      <option [value]="m.id">{{ m.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Stats Bar (Classic Legacy Theme Banner) -->
              <div class="bg-slate-900 text-white grid grid-cols-3 divide-x divide-slate-800">
                <div class="p-4 text-center sm:text-left sm:px-6">
                  <p class="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Alertas {{ dashboard.selectedYear() }}</p>
                  <h3 class="text-2xl font-bold mt-1">{{ dashboard.totalYearAlerts() }}</h3>
                </div>
                <div class="p-4 text-center sm:text-left sm:px-6">
                  <p class="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Mes Actual</p>
                  <h3 class="text-2xl font-bold mt-1 text-sky-400">{{ dashboard.totalMonthAlerts() }}</h3>
                </div>
                <div class="p-4 text-center sm:text-left sm:px-6">
                  <p class="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Esta Semana</p>
                  <h3 class="text-2xl font-bold mt-1 text-emerald-400">{{ dashboard.totalWeekAlerts() }}</h3>
                </div>
              </div>

              <!-- Monthly Distribution Chart / Bars -->
              <div class="p-5">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Comportamiento Mensual (Ene - Dic)</p>
                <div class="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
                  @for (month of dashboard.months; track month.id; let idx = $index) {
                    <div class="flex flex-col items-center">
                      <div class="w-full bg-slate-100 rounded-t h-28 flex items-end justify-center p-1">
                        <div
                          class="w-full bg-blue-600 rounded-t transition-all duration-500 min-h-[4px]"
                          [style.height.%]="getBarHeight(dashboard.monthlySeries()[idx])"
                          [title]="month.name + ': ' + dashboard.monthlySeries()[idx] + ' alertas'"
                        ></div>
                      </div>
                      <span class="text-[11px] font-bold text-slate-700 mt-1.5">{{ dashboard.monthlySeries()[idx] }}</span>
                      <span class="text-[10px] text-slate-400 uppercase">{{ month.name.slice(0, 3) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Right Aside Panel (4 cols) -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Widget de Estados -->
            <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
              <h3 class="card-title mb-4"><span class="lstick"></span>Estados</h3>

              <div class="space-y-3">
                <!-- Resueltas -->
                <div class="bg-emerald-600 text-white rounded-sm p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h2 class="text-3xl font-extrabold">{{ dashboard.totalResolvedAlerts() }}+</h2>
                    <p class="text-xs font-medium text-emerald-100 uppercase tracking-wider mt-0.5">Resueltas</p>
                  </div>
                  <a
                    routerLink="/alerts"
                    [queryParams]="{ state: 'resueltas' }"
                    class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Ir a lista
                  </a>
                </div>

                <!-- En Proceso -->
                <div class="bg-sky-600 text-white rounded-sm p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h2 class="text-3xl font-extrabold">{{ dashboard.totalProcessAlerts() }}+</h2>
                    <p class="text-xs font-medium text-sky-100 uppercase tracking-wider mt-0.5">En Proceso</p>
                  </div>
                  <a
                    routerLink="/alerts"
                    [queryParams]="{ state: 'proceso' }"
                    class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Ir a lista
                  </a>
                </div>

                <!-- Pendientes -->
                <div class="bg-amber-500 text-white rounded-sm p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h2 class="text-3xl font-extrabold">{{ dashboard.totalPendingAlerts() }}+</h2>
                    <p class="text-xs font-medium text-amber-100 uppercase tracking-wider mt-0.5">Pendientes</p>
                  </div>
                  <a
                    routerLink="/alerts"
                    [queryParams]="{ state: 'pendientes' }"
                    class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Ir a lista
                  </a>
                </div>

                <!-- Rechazadas -->
                <div class="bg-rose-600 text-white rounded-sm p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h2 class="text-3xl font-extrabold">{{ dashboard.totalRejectedAlerts() }}+</h2>
                    <p class="text-xs font-medium text-rose-100 uppercase tracking-wider mt-0.5">Rechazadas</p>
                  </div>
                  <a
                    routerLink="/alerts"
                    [queryParams]="{ state: 'rechazadas' }"
                    class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Ir a lista
                  </a>
                </div>
              </div>
            </div>

            <!-- Widget de Comentarios -->
            <div class="bg-white border border-slate-200/90 rounded-sm p-5 shadow-xs">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title mb-0"><span class="lstick"></span>Comentarios</h3>
                <span class="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {{ dashboard.alertsWithCommentaries().length }}
                </span>
              </div>

              <div class="space-y-4">
                @for (comment of dashboard.alertsWithCommentaries(); track comment.id) {
                  <div class="p-3 bg-slate-50 border border-slate-200/70 rounded-sm">
                    <p class="text-xs text-slate-700 italic leading-relaxed">
                      "{{ comment.commentary }}"
                    </p>
                    <div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {{ comment.userName.charAt(0) }}
                        </div>
                        <div>
                          <p class="text-[11px] font-bold text-slate-800">{{ comment.userName }}</p>
                          <p class="text-[10px] text-slate-400">{{ comment.date }}</p>
                        </div>
                      </div>
                      @if (comment.score > 0) {
                        <div class="text-amber-500 text-xs">
                          @for (star of getStars(comment.score); track $index) {
                            ★
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
                @if (dashboard.alertsWithCommentaries().length === 0) {
                  <p class="text-xs text-slate-400 text-center py-4">No hay comentarios registrados</p>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OverviewComponent implements OnInit {
  protected readonly dashboard = inject(DashboardService);

  ngOnInit(): void {
    this.dashboard.loadDashboardData();
  }

  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.dashboard.setYear(Number(target.value));
  }

  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.dashboard.setMonth(Number(target.value));
  }

  getBarHeight(count: number): number {
    const max = Math.max(1, ...this.dashboard.monthlySeries());
    return Math.max(8, Math.round((count / max) * 100));
  }

  getStars(score: number): number[] {
    return Array.from({ length: Math.min(5, Math.max(1, score)) });
  }
}
