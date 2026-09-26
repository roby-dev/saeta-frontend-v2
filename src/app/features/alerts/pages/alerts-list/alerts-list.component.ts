import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service.js';
import type { Alert, AlertAction, AlertFilter, StateCode } from '../../models/alert.model.js';
import { AlertsService } from '../../services/alerts.service.js';
import { getAlertStateStyle } from '../../utils/alert-state-style.js';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- ============================================================== -->
      <!-- Metric Cards (Admin Pro Style with .lstick)                   -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- Total -->
        <button
          type="button"
          (click)="resetFilters()"
          class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between text-left transition-all hover:border-blue-300 hover:shadow cursor-pointer"
          [ngClass]="selectedStateId() === '' ? 'ring-2 ring-[#1976d2] border-transparent' : ''"
        >
          <div>
            <span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Alertas</span>
            <h3 class="text-2xl font-black text-[#2b354f] mt-1">{{ alertsService.total() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-blue-50 text-[#1976d2] flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>

        <!-- Pendientes -->
        <button
          type="button"
          (click)="setStateFilterDirect('PENDING')"
          class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between text-left transition-all hover:border-amber-300 hover:shadow cursor-pointer"
          [ngClass]="isStateActive('PENDING') ? 'ring-2 ring-amber-500 border-transparent bg-amber-50/20' : ''"
        >
          <div>
            <span class="text-xs text-amber-600 font-semibold uppercase tracking-wider">Pendientes</span>
            <h3 class="text-2xl font-black text-amber-600 mt-1">{{ alertsService.pendingCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>

        <!-- En Proceso -->
        <button
          type="button"
          (click)="setStateFilterDirect('IN_PROGRESS')"
          class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between text-left transition-all hover:border-sky-300 hover:shadow cursor-pointer"
          [ngClass]="isStateActive('IN_PROGRESS') ? 'ring-2 ring-sky-500 border-transparent bg-sky-50/20' : ''"
        >
          <div>
            <span class="text-xs text-[#009efb] font-semibold uppercase tracking-wider">En Proceso</span>
            <h3 class="text-2xl font-black text-[#009efb] mt-1">{{ alertsService.processCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-sky-50 text-[#009efb] flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </button>

        <!-- Resueltas -->
        <button
          type="button"
          (click)="setStateFilterDirect('RESOLVED')"
          class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between text-left transition-all hover:border-emerald-300 hover:shadow cursor-pointer"
          [ngClass]="isStateActive('RESOLVED') ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/20' : ''"
        >
          <div>
            <span class="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Resueltas</span>
            <h3 class="text-2xl font-black text-emerald-600 mt-1">{{ alertsService.resolvedCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>

        <!-- Canceladas -->
        <button
          type="button"
          (click)="setStateFilterDirect('REJECTED')"
          class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between text-left col-span-2 sm:col-span-1 transition-all hover:border-rose-300 hover:shadow cursor-pointer"
          [ngClass]="isStateActive('REJECTED') ? 'ring-2 ring-rose-500 border-transparent bg-rose-50/20' : ''"
        >
          <div>
            <span class="text-xs text-rose-500 font-semibold uppercase tracking-wider">Canceladas</span>
            <h3 class="text-2xl font-black text-rose-500 mt-1">{{ alertsService.rejectedCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- Filters Card                                                   -->
      <!-- ============================================================== -->
      <div class="bg-white p-5 rounded border border-[#e5edef] shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="card-title text-base font-bold text-[#455a64] flex items-center">
            <span class="lstick"></span>Filtros de Búsqueda
          </h4>
          @if (isAdministrative()) {
            <button
              type="button"
              (click)="confirmDeletePending()"
              class="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded transition-colors"
            >
              Eliminar Pendientes Antiguas
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Text Search -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Buscar por Ciudadano / DNI</label>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Nombre, apellido o DNI..."
              class="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none"
            />
          </div>

          <!-- State Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
            <select
              [value]="selectedStateId()"
              (change)="onStateChange($event)"
              class="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
            >
              <option value="">Todos los estados</option>
              @for (st of alertsService.states(); track st.id) {
                <option [value]="st.id">{{ st.name }}</option>
              }
            </select>
          </div>

          <!-- Type Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo de Incidente</label>
            <select
              [value]="selectedTypeId()"
              (change)="onTypeChange($event)"
              class="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
            >
              <option value="">Todos los tipos</option>
              @for (tp of alertsService.types(); track tp.id) {
                <option [value]="tp.id">{{ tp.name }}</option>
              }
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-end gap-2">
            <button
              type="button"
              (click)="resetFilters()"
              class="w-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded transition-colors"
            >
              Limpiar
            </button>
            <button
              type="button"
              (click)="applyFilters()"
              class="w-full text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white py-2 px-3 rounded transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- Alerts Operational Table                                       -->
      <!-- ============================================================== -->
      <div class="bg-white rounded border border-[#e5edef] shadow-sm overflow-hidden">
        <div class="p-5 border-b border-[#e5edef] flex items-center justify-between">
          <h4 class="card-title text-base font-bold text-[#455a64] flex items-center mb-0">
            <span class="lstick"></span>Registro Operativo de Alertas
          </h4>
          <span class="text-xs text-slate-400 font-medium">
            {{ filteredAlerts().length }} de {{ alertsService.total() }} registros
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th class="py-3 px-4">Código</th>
                <th class="py-3 px-4">Ciudadano</th>
                <th class="py-3 px-4">Tipo de Alerta</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4">Fecha / Hora</th>
                <th class="py-3 px-4">Atendido Por</th>
                <th class="py-3 px-4">Calificación</th>
                <th class="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs text-[#555f6d]">
              @if (alertsService.loading()) {
                <tr>
                  <td colspan="8" class="py-12 text-center text-slate-400">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-[#1976d2]"></div>
                    <p class="mt-2 text-xs font-semibold">Cargando alertas...</p>
                  </td>
                </tr>
              } @else if (filteredAlerts().length === 0) {
                <tr>
                  <td colspan="8" class="py-12 text-center text-slate-400">
                    No se encontraron alertas registradas para los filtros seleccionados.
                  </td>
                </tr>
              } @else {
                @for (alert of filteredAlerts(); track alert.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <!-- Código -->
                    <td class="py-3 px-4 font-mono font-bold text-[#1976d2]">
                      #{{ alert.id.slice(-6).toUpperCase() }}
                    </td>

                    <!-- Ciudadano -->
                    <td class="py-3 px-4">
                      <div class="font-bold text-[#2b354f]">
                        {{ alert.user?.name ?? 'Ciudadano' }} {{ alert.user?.lastname ?? '' }}
                      </div>
                      <div class="text-[11px] text-slate-400">
                        <span>DNI: {{ alert.user?.dni || 'S/D' }}</span>
                        @if (alert.user?.phone) {
                          <span class="mx-1">•</span>
                          <a [href]="'tel:' + alert.user?.phone" class="text-blue-600 hover:underline">
                            {{ alert.user?.phone }}
                          </a>
                        }
                      </div>
                    </td>

                    <!-- Tipo de Alerta -->
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {{ alert.type?.name || 'Emergencia' }}
                      </span>
                    </td>

                    <!-- Estado -->
                    <td class="py-3 px-4">
                      <span
                        class="inline-block px-2.5 py-1 rounded text-[11px] font-bold"
                        [ngClass]="getStateBadgeClass(alert.state?.code)"
                      >
                        {{ alert.state?.name || 'Pendiente' }}
                      </span>
                    </td>

                    <!-- Fecha / Hora -->
                    <td class="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {{ alert.createdAt ? (alert.createdAt | date: 'dd/MM/yyyy HH:mm') : alert.creationDate }}
                    </td>


                    <!-- Atendido Por -->
                    <td class="py-3 px-4">
                      @if (alert.attendedBy) {
                        <span class="font-semibold text-slate-700">
                          {{ alert.attendedBy.name }} {{ alert.attendedBy.lastname }}
                        </span>
                      } @else {
                        <span class="text-slate-400 italic text-[11px]">Sin asignar</span>
                      }
                    </td>

                    <!-- Calificación -->
                    <td class="py-3 px-4">
                      @if (alert.score) {
                        <div class="flex items-center text-amber-500 font-bold">
                          <span>★</span>
                          <span class="ml-1 text-xs">{{ alert.score }} / 5</span>
                        </div>
                      } @else {
                        <span class="text-slate-300">-</span>
                      }
                    </td>

                    <!-- Acciones -->
                    <td class="py-3 px-4 text-center">
                      <div class="flex items-center justify-center gap-1.5 flex-wrap">
                        @if (hasAction(alert, 'delegate')) {
                          <button
                            type="button"
                            (click)="openDelegateModal(alert)"
                            class="text-[11px] font-semibold bg-sky-50 hover:bg-[#009efb] text-[#009efb] hover:text-white px-2.5 py-1 rounded border border-sky-200 transition-colors"
                          >
                            Delegar / Atender
                          </button>
                        }
                        @if (hasAction(alert, 'reject')) {
                          <button
                            type="button"
                            (click)="rejectAlert(alert)"
                            class="text-[11px] font-semibold bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white px-2.5 py-1 rounded border border-rose-200 transition-colors"
                          >
                            Rechazar
                          </button>
                        }
                        @if (hasAction(alert, 'manage')) {
                          <button
                            type="button"
                            (click)="openManageModal(alert)"
                            class="text-xs font-semibold bg-[#f2f7fd] hover:bg-[#1976d2] text-[#1976d2] hover:text-white px-3 py-1 rounded border border-blue-200 transition-colors"
                          >
                            {{ hasAction(alert, 'delegate') || hasAction(alert, 'reject') ? 'Gestionar' : 'Ver / Modificar Alerta' }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="p-4 border-t border-[#e5edef] flex items-center justify-between text-xs text-slate-500">
          <div>
            Página {{ alertsService.currentPage() }} de {{ totalPages() }}
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              (click)="prevPage()"
              [disabled]="alertsService.currentPage() <= 1"
              class="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              Anterior
            </button>
            <button
              type="button"
              (click)="nextPage()"
              [disabled]="alertsService.currentPage() >= totalPages()"
              class="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- Alert Management Modal                                         -->
      <!-- ============================================================== -->
      @if (managingAlert()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div class="bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-200">
            <!-- Modal Header -->
            <div class="bg-[#1976d2] px-6 py-4 text-white flex items-center justify-between">
              <h5 class="text-base font-bold">
                {{ modalMode() === 'delegate' ? 'Delegar' : 'Gestionar' }} Alerta #{{ managingAlert()!.id.slice(-6).toUpperCase() }}
              </h5>
              <button
                type="button"
                (click)="closeManageModal()"
                class="text-white hover:text-rose-200 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 text-xs text-slate-600 max-h-[80vh] overflow-y-auto">
              <!-- Citizen Info Banner -->
              <div class="p-3 bg-slate-50 rounded border border-slate-200 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#1976d2] text-white flex items-center justify-center font-bold text-sm">
                  {{ managingAlert()!.user?.name?.charAt(0) || 'C' }}
                </div>
                <div>
                  <h6 class="font-bold text-slate-800 text-sm">
                    {{ managingAlert()!.user?.name }} {{ managingAlert()!.user?.lastname }}
                  </h6>
                  <p class="text-slate-400">
                    DNI: {{ managingAlert()!.user?.dni || 'S/D' }} | Tel: {{ managingAlert()!.user?.phone || 'S/D' }}
                  </p>
                </div>
              </div>

              <!-- Location Info -->
              <div>
                <span class="font-bold text-slate-700 block mb-1">Ubicación GPS:</span>
                <p class="font-mono text-[11px] text-slate-500">
                  Lat: {{ managingAlert()!.latitude }}, Lon: {{ managingAlert()!.longitude }}
                </p>
                <a
                  [href]="'https://www.google.com/maps?q=' + managingAlert()!.latitude + ',' + managingAlert()!.longitude"
                  target="_blank"
                  class="text-blue-600 hover:underline text-[11px] inline-flex items-center gap-1 mt-1 font-semibold"
                >
                  Ver en Google Maps ↗
                </a>
              </div>

              <!-- Update State (generic manage mode only; delegate mode only assigns personnel) -->
              @if (modalMode() === 'manage') {
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Estado de la Alerta:</label>
                  <select
                    [(ngModel)]="modalStateId"
                    class="w-full p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white text-xs"
                  >
                    @for (st of alertsService.states(); track st.id) {
                      <option [value]="st.id">{{ st.name }}</option>
                    }
                  </select>
                </div>
              }

              <!-- Assign Personnel -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Asignar Personal de Seguridad:</label>
                <select
                  [(ngModel)]="modalAttendedById"
                  class="w-full p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white text-xs"
                >
                  <option value="">-- Sin asignar --</option>
                  @for (p of alertsService.personnel(); track p.id) {
                    <option [value]="p.id">
                      {{ p.name }} {{ p.lastname }} ({{ p.role }})
                    </option>
                  }
                </select>
              </div>

              <!-- Notes / Commentary -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Comentario / Bitácora de Atención:</label>
                <textarea
                  [(ngModel)]="modalCommentary"
                  rows="3"
                  placeholder="Detalles sobre la atención del incidente..."
                  class="w-full p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none text-xs"
                ></textarea>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                (click)="closeManageModal()"
                class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="saveAlertChanges()"
                [disabled]="isSaving() || (modalMode() === 'delegate' && !modalAttendedById)"
                class="px-4 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white font-semibold rounded text-xs disabled:opacity-50"
              >
                {{ isSaving() ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AlertsListComponent implements OnInit {
  protected readonly alertsService = inject(AlertsService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // Administrative check
  protected readonly isAdministrative = computed(() => this.authService.isAdministrative());

  // Filter state signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStateId = signal<string>('');
  protected readonly selectedTypeId = signal<string>('');

  // Managing modal state
  protected readonly managingAlert = signal<Alert | null>(null);
  protected readonly modalMode = signal<'manage' | 'delegate'>('manage');
  protected modalStateId = '';
  protected modalAttendedById = '';
  protected modalCommentary = '';
  protected readonly isSaving = signal<boolean>(false);

  // Client-side search filtering
  protected readonly filteredAlerts = computed(() => {
    const list = this.alertsService.alerts();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) => {
      const name = `${a.user?.name ?? ''} ${a.user?.lastname ?? ''}`.toLowerCase();
      const dni = a.user?.dni?.toLowerCase() ?? '';
      const phone = a.user?.phone?.toLowerCase() ?? '';
      const type = a.type?.name?.toLowerCase() ?? '';
      return name.includes(q) || dni.includes(q) || phone.includes(q) || type.includes(q);
    });
  });

  protected readonly totalPages = computed(() => {
    const total = this.alertsService.total();
    const size = this.alertsService.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  ngOnInit(): void {
    this.alertsService.loadCatalogs();

    const stateParam = this.route.snapshot.queryParamMap.get('state');
    if (stateParam) {
      this.handleInitialStateParam(stateParam);
    } else {
      this.alertsService.loadAlerts().subscribe();
    }
  }

  /**
   * Maps the fixed set of `?state=` query param keywords used by dashboard
   * links (see overview.component.ts) to a StateCode. This is a routing
   * convention we own, not alert-state name matching: the resolved code is
   * then looked up against the state catalog by `code`, never by `name`.
   */
  private static readonly CODE_BY_QUERY_PARAM: Record<string, StateCode> = {
    pendiente: 'PENDING',
    pendientes: 'PENDING',
    proceso: 'IN_PROGRESS',
    resuelta: 'RESOLVED',
    resueltas: 'RESOLVED',
    rechazada: 'REJECTED',
    rechazadas: 'REJECTED',
    cancelada: 'REJECTED',
    canceladas: 'REJECTED',
  };

  private handleInitialStateParam(stateParam: string): void {
    const code = AlertsListComponent.CODE_BY_QUERY_PARAM[stateParam.toLowerCase()];
    if (!code) {
      this.alertsService.loadAlerts().subscribe();
      return;
    }

    const matchState = () => {
      const found = this.alertsService.states().find((s) => s.code === code);
      if (found) {
        this.selectedStateId.set(found.id);
        this.applyFilters();
      } else {
        this.alertsService.loadAlerts().subscribe();
      }
    };

    if (this.alertsService.states().length > 0) {
      matchState();
    } else {
      setTimeout(() => matchState(), 300);
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onStateChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStateId.set(target.value);
    this.applyFilters();
  }

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTypeId.set(target.value);
    this.applyFilters();
  }

  setStateFilterDirect(code: StateCode): void {
    const found = this.alertsService.states().find((s) => s.code === code);
    if (found) {
      if (this.selectedStateId() === found.id) {
        this.selectedStateId.set('');
      } else {
        this.selectedStateId.set(found.id);
      }
      this.applyFilters();
    }
  }

  isStateActive(code: StateCode): boolean {
    const currentId = this.selectedStateId();
    if (!currentId) return false;
    const found = this.alertsService.states().find((s) => s.id === currentId);
    return found?.code === code;
  }

  protected hasAction(alert: Alert, action: AlertAction): boolean {
    return (alert.allowedActions ?? []).includes(action);
  }

  applyFilters(): void {
    const filters: AlertFilter = {
      stateId: this.selectedStateId() || undefined,
      typeId: this.selectedTypeId() || undefined,
      page: 1,
    };
    this.alertsService.loadAlerts(filters).subscribe();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStateId.set('');
    this.selectedTypeId.set('');
    this.alertsService.loadAlerts({ page: 1 }).subscribe();
  }

  prevPage(): void {
    const current = this.alertsService.currentPage();
    if (current > 1) {
      this.alertsService.loadAlerts({
        ...this.alertsService.activeFilters(),
        page: current - 1,
      }).subscribe();
    }
  }

  nextPage(): void {
    const current = this.alertsService.currentPage();
    if (current < this.totalPages()) {
      this.alertsService.loadAlerts({
        ...this.alertsService.activeFilters(),
        page: current + 1,
      }).subscribe();
    }
  }

  getStateBadgeClass(code?: StateCode): string {
    return getAlertStateStyle(code).listBadgeClass;
  }

  openManageModal(alert: Alert): void {
    this.managingAlert.set(alert);
    this.modalMode.set('manage');
    this.modalStateId = alert.stateId ?? '';
    this.modalAttendedById = alert.attendedById ?? '';
    this.modalCommentary = alert.commentary ?? '';
  }

  openDelegateModal(alert: Alert): void {
    this.managingAlert.set(alert);
    this.modalMode.set('delegate');
    this.modalAttendedById = alert.attendedById ?? '';
    this.modalCommentary = alert.commentary ?? '';
  }

  closeManageModal(): void {
    this.managingAlert.set(null);
    this.modalMode.set('manage');
  }

  saveAlertChanges(): void {
    const alert = this.managingAlert();
    if (!alert) return;

    if (this.modalMode() === 'delegate') {
      if (!this.modalAttendedById) return;
      this.isSaving.set(true);
      this.alertsService
        .delegateAlert(alert.id, this.modalAttendedById, this.modalCommentary || undefined)
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.closeManageModal();
          },
          error: (err) => {
            console.error('Error delegating alert', err);
            this.isSaving.set(false);
          },
        });
      return;
    }

    this.isSaving.set(true);

    const payload = {
      stateId: this.modalStateId,
      attendedById: this.modalAttendedById || undefined,
      commentary: this.modalCommentary || undefined,
    };

    this.alertsService.updateAlert(alert.id, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeManageModal();
      },
      error: (err) => {
        console.error('Error updating alert', err);
        this.isSaving.set(false);
      },
    });
  }

  rejectAlert(alert: Alert): void {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`¿Está seguro que desea rechazar/cancelar la alerta #${alert.id.slice(-6).toUpperCase()}?`)
    ) {
      this.alertsService.rejectAlert(alert.id, 'Cancelada desde el listado de alertas').subscribe();
    }
  }

  confirmDeletePending(): void {
    if (typeof window !== 'undefined' && confirm('¿Estás seguro de eliminar todas las alertas pendientes antiguas?')) {
      this.alertsService.deletePendingAlerts().subscribe();
    }
  }
}
