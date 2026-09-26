import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { RealtimeService } from '../../../../core/services/realtime.service.js';
import type { Alert, AlertUserSummary } from '../../models/alert.model.js';
import { AlertsService } from '../../services/alerts.service.js';

interface DistrictOption {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-alerts-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-140px)] select-none">
      <!-- ============================================================== -->
      <!-- Left Filters & Counter Panel (Classic Tacna Identity)          -->
      <!-- ============================================================== -->
      <div class="w-full lg:w-80 flex-shrink-0 space-y-4">
        <!-- Filter Card -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="card-title text-sm font-bold text-[#455a64] flex items-center">
              <span class="lstick"></span>Filtros del Mapa
            </h4>
            <div class="flex items-center gap-1.5" title="Estado de conexión en tiempo real">
              <span
                class="w-2.5 h-2.5 rounded-full"
                [ngClass]="realtimeService.isConnected() ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-slate-300'"
              ></span>
              <span
                class="text-[11px] font-semibold"
                [ngClass]="realtimeService.isConnected() ? 'text-emerald-600' : 'text-slate-400'"
              >
                {{ realtimeService.isConnected() ? 'En vivo' : 'Desconectado' }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-100">
            <span>Total en Mapa:</span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-white font-bold font-mono">
              {{ displayedAlerts().length }}
            </span>
          </div>

          <!-- District Quick Zoom -->
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Distrito (Tacna)
            </label>
            <select
              [value]="selectedDistrictId()"
              (change)="onDistrictChange($event)"
              class="w-full text-xs p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
            >
              <option value="">Todos los distritos</option>
              @for (d of districts; track d.id) {
                <option [value]="d.id">{{ d.name }}</option>
              }
            </select>
          </div>

          <!-- State Filter -->
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Por Estado
            </label>
            <select
              [value]="selectedStateFilter()"
              (change)="onStateFilterChange($event)"
              class="w-full text-xs p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
            >
              <option value="all">Todas las alertas</option>
              <option value="pendiente">Pendientes</option>
              <option value="proceso">En proceso</option>
              <option value="resuelta">Resueltas</option>
              <option value="rechazada">Canceladas / Rechazadas</option>
            </select>
          </div>


          <!-- Reset Filter -->
          <button
            type="button"
            (click)="resetMapFilters()"
            class="w-full text-xs font-semibold text-[#1976d2] bg-blue-50 hover:bg-blue-100 py-1.5 rounded transition-colors"
          >
            Restablecer Vista Centrada
          </button>
        </div>

        <!-- Personnel Counters Card -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm space-y-2">
          <h4 class="card-title text-sm font-bold text-[#455a64] flex items-center">
            <span class="lstick"></span>Personal de Seguridad
          </h4>
          <div class="text-xs space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-600">Disponibles:</span>
              <span class="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{{ availablePersonnel() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600">En patrullaje / Ocupados:</span>
              <span class="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">{{ busyPersonnel() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600">Inactivos / Franco:</span>
              <span class="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{{ inactivePersonnel() }}</span>
            </div>
          </div>
        </div>

        <!-- Alert Status Legend Card -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="card-title text-sm font-bold text-[#455a64] flex items-center">
              <span class="lstick"></span>Estado de Emergencias
            </h4>
            @if (selectedStateFilter() !== 'all') {
              <button
                type="button"
                (click)="setStateFilter('all')"
                class="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Ver todas
              </button>
            }
          </div>
          <div class="text-xs space-y-1.5">
            <button
              type="button"
              (click)="setStateFilter(selectedStateFilter() === 'pendiente' ? 'all' : 'pendiente')"
              class="w-full flex items-center justify-between p-1.5 rounded transition-colors text-left"
              [ngClass]="selectedStateFilter() === 'pendiente' ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50'"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                <span class="font-medium text-slate-700">Pendientes</span>
              </div>
              <span class="font-bold text-amber-600">{{ alertsService.pendingCount() }}</span>
            </button>

            <button
              type="button"
              (click)="setStateFilter(selectedStateFilter() === 'proceso' ? 'all' : 'proceso')"
              class="w-full flex items-center justify-between p-1.5 rounded transition-colors text-left"
              [ngClass]="selectedStateFilter() === 'proceso' ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-[#009efb]"></span>
                <span class="font-medium text-slate-700">En Proceso</span>
              </div>
              <span class="font-bold text-[#009efb]">{{ alertsService.processCount() }}</span>
            </button>

            <button
              type="button"
              (click)="setStateFilter(selectedStateFilter() === 'resuelta' ? 'all' : 'resuelta')"
              class="w-full flex items-center justify-between p-1.5 rounded transition-colors text-left"
              [ngClass]="selectedStateFilter() === 'resuelta' ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span class="font-medium text-slate-700">Resueltas</span>
              </div>
              <span class="font-bold text-emerald-600">{{ alertsService.resolvedCount() }}</span>
            </button>

            <button
              type="button"
              (click)="setStateFilter(selectedStateFilter() === 'rechazada' ? 'all' : 'rechazada')"
              class="w-full flex items-center justify-between p-1.5 rounded transition-colors text-left"
              [ngClass]="selectedStateFilter() === 'rechazada' ? 'bg-rose-50 border border-rose-200' : 'hover:bg-slate-50'"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                <span class="font-medium text-slate-700">Canceladas</span>
              </div>
              <span class="font-bold text-rose-500">{{ alertsService.rejectedCount() }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- Interactive Leaflet Map Container                              -->
      <!-- ============================================================== -->
      <div class="flex-1 bg-white rounded border border-[#e5edef] shadow-sm overflow-hidden relative min-h-[500px]">
        <div #mapContainer id="map" class="w-full h-full min-h-[550px] z-10"></div>

        <!-- Map Loading Indicator -->
        @if (alertsService.loading()) {
          <div class="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md text-xs font-semibold text-[#1976d2] flex items-center gap-2">
            <div class="w-3.5 h-3.5 border-2 border-blue-200 border-t-[#1976d2] rounded-full animate-spin"></div>
            <span>Actualizando mapa...</span>
          </div>
        }

        <!-- Selected Alert Detail Side Sheet -->
        @if (selectedAlert() && isDetailOpen()) {
          @let alert = selectedAlert()!;
          @let stateName = getAlertStateName(alert);
          <div class="fixed inset-0 z-40 bg-black/30" (click)="closeDetail()"></div>
          <aside class="fixed inset-y-0 right-0 z-40 bg-slate-50 shadow-2xl border-l border-slate-200 w-full max-w-lg xl:max-w-xl flex flex-col">
            <!-- Header -->
            <header class="bg-white border-b border-slate-200 px-6 py-5">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1.5">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detalle de alerta</p>
                  <h3 class="text-xl font-bold text-slate-800">#{{ alert.id.slice(-6).toUpperCase() }}</h3>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" [ngClass]="getStateBadgeClass(stateName)">
                      <span class="w-2 h-2 rounded-full" [ngClass]="getDotClass(stateName)"></span>
                      {{ stateName }}
                    </span>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {{ alert.type?.name || 'Emergencia' }}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="closeDetail()"
                  class="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg cursor-pointer"
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>
            </header>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm text-slate-600">
              <!-- Citizen -->
              <section class="bg-white rounded-lg border border-slate-200 p-4">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Ciudadano</h4>
                <div class="flex items-center gap-3 mb-4">
                  @if (alert.user?.image) {
                    <img [src]="alert.user!.image" alt="" class="w-12 h-12 rounded-full object-cover" />
                  } @else {
                    <div class="w-12 h-12 rounded-full bg-[#1976d2] text-white flex items-center justify-center font-bold">
                      {{ alert.user?.name?.charAt(0) || 'C' }}
                    </div>
                  }
                  <div>
                    <p class="font-bold text-slate-800">{{ alert.user?.name }} {{ alert.user?.lastname }}</p>
                    <p class="text-xs text-slate-400">DNI {{ alert.user?.dni || 'S/D' }}</p>
                  </div>
                </div>
                <dl class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt class="text-slate-400">Teléfono</dt>
                    <dd class="font-semibold text-slate-700">
                      @if (alert.user?.phone) {
                        <a [href]="'tel:' + alert.user!.phone" class="text-blue-600 hover:underline">{{ alert.user!.phone }}</a>
                      } @else {
                        S/D
                      }
                    </dd>
                  </div>
                  <div>
                    <dt class="text-slate-400">Correo</dt>
                    <dd class="font-semibold text-slate-700 truncate">{{ alert.user?.email || 'S/D' }}</dd>
                  </div>
                </dl>
              </section>

              <!-- Timeline -->
              <section class="bg-white rounded-lg border border-slate-200 p-4">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Línea de tiempo</h4>
                <ol class="relative border-l-2 border-slate-200 ml-1.5 space-y-4 text-xs">
                  <li class="pl-4 relative">
                    <span class="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white"></span>
                    <p class="font-semibold text-slate-700">Alerta creada</p>
                    <p class="text-slate-400">{{ (alert.createdAt || alert.creationDate) | date: 'dd/MM/yyyy HH:mm' }}</p>
                  </li>
                  <li class="pl-4 relative">
                    <span class="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full ring-2 ring-white" [ngClass]="alert.attentionDate ? 'bg-sky-500' : 'bg-slate-300'"></span>
                    <p class="font-semibold" [ngClass]="alert.attentionDate ? 'text-slate-700' : 'text-slate-400'">En atención</p>
                    <p class="text-slate-400">{{ alert.attentionDate ? (alert.attentionDate | date: 'dd/MM/yyyy HH:mm') : 'Pendiente' }}</p>
                  </li>
                  <li class="pl-4 relative">
                    <span class="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full ring-2 ring-white" [ngClass]="alert.culminationDate ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                    <p class="font-semibold" [ngClass]="alert.culminationDate ? 'text-slate-700' : 'text-slate-400'">Culminada</p>
                    <p class="text-slate-400">{{ alert.culminationDate ? (alert.culminationDate | date: 'dd/MM/yyyy HH:mm') : 'Pendiente' }}</p>
                  </li>
                </ol>
              </section>

              <!-- Location -->
              <section class="bg-white rounded-lg border border-slate-200 p-4">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Ubicación</h4>
                <dl class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt class="text-slate-400">Latitud</dt>
                    <dd class="font-mono font-semibold text-slate-700">{{ alert.latitude | number: '1.6-6' }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-400">Longitud</dt>
                    <dd class="font-mono font-semibold text-slate-700">{{ alert.longitude | number: '1.6-6' }}</dd>
                  </div>
                </dl>
              </section>

              <!-- Attention -->
              <section class="bg-white rounded-lg border border-slate-200 p-4">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Atención</h4>
                @if (alert.attendedBy) {
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      {{ alert.attendedBy.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800">{{ alert.attendedBy.name }} {{ alert.attendedBy.lastname }}</p>
                      <p class="text-xs text-slate-400">{{ alert.attendedBy.role || 'Personal de seguridad' }}</p>
                    </div>
                  </div>
                } @else {
                  <p class="text-xs text-slate-400">Sin personal asignado.</p>
                }

                @if (alert.score) {
                  <p class="mt-3 text-amber-500 font-bold text-sm">★ {{ alert.score }} / 5</p>
                }
                @if (alert.commentary) {
                  <p class="mt-3 text-xs text-slate-600 italic bg-slate-50 p-3 rounded border border-slate-200">
                    "{{ alert.commentary }}"
                  </p>
                }
              </section>
            </div>

            <!-- Footer actions -->
            <footer class="bg-white border-t border-slate-200 px-6 py-4 space-y-2">
              @if (stateName.toLowerCase().includes('pendiente')) {
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="openDelegateModal(alert)"
                    class="flex-1 py-2.5 px-3 bg-[#009efb] hover:bg-[#0088db] text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Delegar / Atender
                  </button>
                  <button
                    type="button"
                    (click)="rejectAlert(alert)"
                    class="py-2.5 px-4 border border-rose-300 hover:bg-rose-50 text-rose-600 rounded text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Rechazar
                  </button>
                </div>
              } @else if (stateName.toLowerCase().includes('proceso')) {
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="toggleRouteToPersonnel(alert)"
                    class="flex-1 py-2.5 px-3 rounded text-sm font-semibold shadow-sm transition-colors text-white cursor-pointer"
                    [ngClass]="isRoutingActive() ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'"
                  >
                    {{ isRoutingActive() ? 'Ocultar Ruta' : 'Trazar Ruta' }}
                  </button>
                  <button
                    type="button"
                    (click)="openManageModal(alert)"
                    class="flex-1 py-2.5 px-3 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Gestionar
                  </button>
                </div>
              } @else {
                <button
                  type="button"
                  (click)="openManageModal(alert)"
                  class="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-semibold transition-colors cursor-pointer"
                >
                  Ver / Modificar Alerta
                </button>
              }

              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="centerOnAlert(alert)"
                  class="flex-1 py-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Enfocar
                </button>
                <a
                  [href]="'https://www.google.com/maps?q=' + alert.latitude + ',' + alert.longitude"
                  target="_blank"
                  rel="noopener"
                  class="flex-1 text-center py-2.5 rounded bg-[#1976d2] hover:bg-[#1565c0] text-white text-sm font-semibold transition-colors"
                >
                  Navegar GPS ↗
                </a>
              </div>
            </footer>
          </aside>
        }

        <!-- Alert Management Modal (Map View) -->
        @if (managingAlert()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div class="bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-200">
              <!-- Modal Header -->
              <div class="bg-[#1976d2] px-6 py-4 text-white flex items-center justify-between">
                <h5 class="text-base font-bold">
                  Gestionar Alerta #{{ managingAlert()!.id.slice(-6).toUpperCase() }}
                </h5>
                <button
                  type="button"
                  (click)="closeManageModal()"
                  class="text-white hover:text-rose-200 font-bold text-lg cursor-pointer"
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
                </div>

                <!-- Update State -->
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
                  class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="saveAlertChanges()"
                  [disabled]="isSavingAlert()"
                  class="px-4 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white font-semibold rounded text-xs disabled:opacity-50 cursor-pointer"
                >
                  {{ isSavingAlert() ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AlertsMapComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly alertsService = inject(AlertsService);
  protected readonly realtimeService = inject(RealtimeService);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private personnelLayer?: L.LayerGroup;
  private readonly personnelMarkers = new Map<string, L.Marker>();
  private readonly alertMarkers = new Map<string, L.Marker>();
  private readonly subs = new Subscription();

  constructor() {
    effect(() => {
      // Re-run whenever displayedAlerts signal changes
      this.displayedAlerts();
      if (this.map && this.markersLayer) {
        this.updateMarkers();
      }
    });
  }

  // Tacna geographical center default
  private readonly TACNA_CENTER: L.LatLngTuple = [-18.0146, -70.2536];

  // District definitions
  protected readonly districts: DistrictOption[] = [
    { id: 'tacna', name: 'Tacna Centro', lat: -18.0146, lng: -70.2536 },
    { id: 'alto', name: 'Alto de la Alianza', lat: -18.0004, lng: -70.2471 },
    { id: 'ciudad', name: 'Ciudad Nueva', lat: -17.9898, lng: -70.2443 },
    { id: 'gregorio', name: 'Gregorio Albarracín', lat: -18.0435, lng: -70.2592 },
    { id: 'pocollay', name: 'Pocollay', lat: -18.0069, lng: -70.2241 },
  ];

  protected readonly selectedDistrictId = signal<string>('');
  protected readonly selectedStateFilter = signal<string>('all');
  protected readonly selectedAlert = signal<Alert | null>(null);
  protected readonly isDetailOpen = signal<boolean>(false);
  protected readonly managingAlert = signal<Alert | null>(null);
  protected readonly isSavingAlert = signal<boolean>(false);
  protected readonly isRoutingActive = signal<boolean>(false);
  protected modalStateId = '';
  protected modalAttendedById = '';
  protected modalCommentary = '';
  private routeLine?: L.Polyline;

  // Personnel counters
  protected readonly availablePersonnel = computed(() => {
    return this.alertsService.personnel().filter((p) => (p.availability ?? '').toLowerCase() === 'disponible').length;
  });

  protected readonly busyPersonnel = computed(() => {
    return this.alertsService.personnel().filter((p) => {
      const a = (p.availability ?? '').toLowerCase();
      return a === 'ocupado' || a === 'patrullando';
    }).length;
  });

  protected readonly inactivePersonnel = computed(() => {
    return this.alertsService.personnel().filter((p) => {
      const a = (p.availability ?? '').toLowerCase();
      return a === 'inactivo' || a === 'franco' || !a;
    }).length;
  });

  // Filtered alerts for map display
  protected readonly displayedAlerts = computed(() => {
    const list = this.alertsService.alerts();
    const filter = this.selectedStateFilter().toLowerCase();

    if (filter === 'all') return list;

    return list.filter((a) => {
      let stateName = a.state?.name?.toLowerCase() ?? '';
      if (!stateName && a.stateId) {
        const matched = this.alertsService.states().find((s) => s.id === a.stateId);
        if (matched) {
          stateName = matched.name.toLowerCase();
        }
      }

      if (filter === 'pendiente') return stateName.includes('pendiente');
      if (filter === 'proceso') return stateName.includes('proceso');
      if (filter === 'resuelta') return stateName.includes('resuelt');
      if (filter === 'rechazada') return stateName.includes('rechazad') || stateName.includes('cancelad');
      return true;
    });
  });

  ngOnInit(): void {
    this.alertsService.loadCatalogs();
    // Load all alerts unpaginated for full map visualization
    this.alertsService.loadAlerts({ all: true }).subscribe(() => {
      this.updateMarkers();
      this.checkRouteAlertId();
    });

    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        const alertId = params['alertId'];
        if (alertId) {
          this.focusAlertById(alertId);
        }
      }),
    );

    this.subs.add(
      this.realtimeService.locationUpdated$.subscribe(({ user, coords }) => {
        this.updatePersonnelLocation(user, coords);
      }),
    );

    this.subs.add(
      this.realtimeService.personalDisconnected$.subscribe((userId) => {
        this.removePersonnelMarker(userId);
      }),
    );
  }

  private focusAlertById(alertId: string): void {
    const alert = this.alertsService.alerts().find((a) => a.id === alertId);
    if (alert) {
      this.selectedAlert.set(alert);
      this.centerOnAlert(alert);
      this.alertMarkers.get(alert.id)?.openPopup();
    }
  }

  private checkRouteAlertId(): void {
    const alertId = this.route.snapshot.queryParams['alertId'];
    if (alertId) {
      this.focusAlertById(alertId);
    }
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    this.clearRoute();
    this.subs.unsubscribe();
    this.personnelMarkers.clear();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.TACNA_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.personnelLayer = L.layerGroup().addTo(this.map);
    this.updateMarkers();
  }

  private updatePersonnelLocation(user: any, coords: [number, number]): void {
    const userId = user?.id || user?._id;
    if (!userId || !this.map || !this.personnelLayer) return;

    const existing = this.personnelMarkers.get(userId);
    if (existing) {
      existing.setLatLng(coords);
    } else {
      const name = user?.name ? `${user.name} ${user.lastname ?? ''}`.trim() : 'Personal de Seguridad';
      const icon = L.divIcon({
        className: 'custom-police-pin',
        html: `
          <div style="
            background-color: #009efb;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">
            👮
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(coords, { icon });
      marker.bindTooltip(`<b>👮 ${name}</b><br><span style="color:#009efb;">En patrullaje</span>`, {
        direction: 'top',
        offset: [0, -10],
      });

      this.personnelLayer.addLayer(marker);
      this.personnelMarkers.set(userId, marker);
    }

    // Update active route if tracing to this officer
    if (this.isRoutingActive() && this.routeLine && this.selectedAlert()) {
      const cur = this.selectedAlert()!;
      const officerId = cur.attendedById || cur.attendedBy?.id;
      if (officerId === userId) {
        this.routeLine.setLatLngs([coords, [cur.latitude, cur.longitude]]);
      }
    }
  }

  private removePersonnelMarker(userId: string): void {
    const marker = this.personnelMarkers.get(userId);
    if (marker && this.personnelLayer) {
      this.personnelLayer.removeLayer(marker);
      this.personnelMarkers.delete(userId);
    }
    const cur = this.selectedAlert();
    const officerId = cur?.attendedById || cur?.attendedBy?.id;
    if (this.isRoutingActive() && officerId === userId) {
      this.clearRoute();
    }
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    this.alertMarkers.clear();
    const alerts = this.displayedAlerts();

    for (const alert of alerts) {
      if (!alert.latitude || !alert.longitude) continue;

      const stateName = this.getAlertStateName(alert);
      const color = this.getMarkerColor(stateName);
      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([alert.latitude, alert.longitude], { icon });

      marker.on('click', () => this.onMarkerClick(alert));
      marker.bindPopup(() => this.buildPopupContent(alert), {
        offset: [0, -8],
        minWidth: 200,
      });

      this.markersLayer.addLayer(marker);
      this.alertMarkers.set(alert.id, marker);
    }
  }

  private onMarkerClick(alert: Alert): void {
    this.selectedAlert.set(alert);
  }

  private buildPopupContent(alert: Alert): HTMLElement {
    const stateName = this.getAlertStateName(alert);
    const citizen = `${alert.user?.name ?? ''} ${alert.user?.lastname ?? ''}`.trim() || 'Ciudadano';

    const container = document.createElement('div');
    container.className = 'text-xs text-slate-600 space-y-1';

    const title = document.createElement('p');
    title.className = 'font-bold text-slate-800';
    title.textContent = `Alerta #${alert.id.slice(-6).toUpperCase()}`;

    const type = document.createElement('p');
    type.textContent = alert.type?.name || 'Emergencia';

    const state = document.createElement('p');
    state.className = 'font-semibold';
    state.style.color = this.getMarkerColor(stateName);
    state.textContent = stateName;

    const user = document.createElement('p');
    user.textContent = citizen;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mt-1.5 w-full py-1 rounded bg-[#1976d2] hover:bg-[#1565c0] text-white font-semibold cursor-pointer';
    button.textContent = 'Ver más';
    button.addEventListener('click', () => {
      this.map?.closePopup();
      this.openDetail(alert);
    });

    container.append(title, type, state, user, button);
    return container;
  }

  openDetail(alert: Alert): void {
    this.selectedAlert.set(alert);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedAlert.set(null);
    this.clearRoute();
  }

  onDistrictChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target?.value ?? '';
    this.selectedDistrictId.set(value);
    if (!this.map) return;
    const dist = this.districts.find((d) => d.id === value);
    if (dist) {
      this.map.flyTo([dist.lat, dist.lng], 14, { duration: 1.2 });
    } else {
      this.map.flyTo(this.TACNA_CENTER, 13, { duration: 1.2 });
    }
  }

  onStateFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target?.value ?? 'all';
    this.setStateFilter(value);
  }

  setStateFilter(filter: string): void {
    this.selectedStateFilter.set(filter);
    this.updateMarkers();
  }

  resetMapFilters(): void {
    this.selectedDistrictId.set('');
    this.selectedStateFilter.set('all');
    this.selectedAlert.set(null);
    this.isDetailOpen.set(false);
    if (this.map) {
      this.map.flyTo(this.TACNA_CENTER, 13, { duration: 1.2 });
    }
    this.updateMarkers();
  }

  openDelegateModal(alert: Alert): void {
    const processState = this.alertsService.states().find((s) => s.name.toLowerCase().includes('proceso'));
    this.openManageModal(alert, processState?.id);
  }

  openManageModal(alert: Alert, preselectedStateId?: string): void {
    this.managingAlert.set(alert);
    this.modalStateId = preselectedStateId || alert.stateId || alert.state?.id || '';
    this.modalAttendedById = alert.attendedById || alert.attendedBy?.id || '';
    this.modalCommentary = alert.commentary || '';
  }

  closeManageModal(): void {
    this.managingAlert.set(null);
  }

  saveAlertChanges(): void {
    const alert = this.managingAlert();
    if (!alert) return;

    this.isSavingAlert.set(true);
    const payload = {
      stateId: this.modalStateId,
      state: this.modalStateId,
      attendedById: this.modalAttendedById || undefined,
      attendedBy: this.modalAttendedById || undefined,
      commentary: this.modalCommentary || undefined,
    };

    this.alertsService.updateAlert(alert.id, payload).subscribe({
      next: (res) => {
        this.isSavingAlert.set(false);
        if (res.alerts) {
          this.selectedAlert.set(res.alerts);
        }
        this.closeManageModal();
      },
      error: (err) => {
        console.error('Error updating alert from map', err);
        this.isSavingAlert.set(false);
      },
    });
  }

  rejectAlert(alert: Alert): void {
    const cancelState = this.alertsService.states().find((s) => {
      const n = s.name.toLowerCase();
      return n.includes('rechazad') || n.includes('cancelad');
    });

    if (!cancelState) return;

    if (
      typeof window !== 'undefined' &&
      window.confirm(`¿Está seguro que desea rechazar/cancelar la alerta #${alert.id.slice(-6).toUpperCase()}?`)
    ) {
      this.alertsService.updateAlert(alert.id, {
        stateId: cancelState.id,
        state: cancelState.id,
        commentary: 'Cancelada desde el monitor de mapa',
      }).subscribe({
        next: (res) => {
          if (res.alerts) {
            this.selectedAlert.set(res.alerts);
          }
        },
      });
    }
  }

  toggleRouteToPersonnel(alert: Alert): void {
    if (this.isRoutingActive()) {
      this.clearRoute();
      return;
    }

    const attendedId = alert.attendedById || alert.attendedBy?.id;
    if (!attendedId) {
      if (typeof window !== 'undefined') {
        window.alert('Esta alerta aún no tiene personal de seguridad asignado.');
      }
      return;
    }

    const officerMarker = this.personnelMarkers.get(attendedId);
    if (!officerMarker || !this.map) {
      const officerName = alert.attendedBy
        ? `${alert.attendedBy.name} ${alert.attendedBy.lastname ?? ''}`.trim()
        : 'asignado';
      if (typeof window !== 'undefined') {
        window.alert(`El personal ${officerName} no cuenta con reporte GPS activo en el mapa en estos momentos.`);
      }
      return;
    }

    const officerLatLng = officerMarker.getLatLng();
    const alertLatLng: L.LatLngTuple = [alert.latitude, alert.longitude];

    this.clearRoute();

    this.routeLine = L.polyline([officerLatLng, alertLatLng], {
      color: '#009efb',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9,
    }).addTo(this.map);

    this.isRoutingActive.set(true);
    this.map.fitBounds(L.latLngBounds([officerLatLng, alertLatLng]), {
      padding: [70, 70],
      maxZoom: 17,
    });
  }

  clearRoute(): void {
    if (this.routeLine) {
      this.routeLine.remove();
      this.routeLine = undefined;
    }
    this.isRoutingActive.set(false);
  }

  centerOnAlert(alert: Alert): void {
    if (this.map && alert.latitude && alert.longitude) {
      this.map.flyTo([alert.latitude, alert.longitude], 16, { duration: 1 });
    }
  }

  protected getAlertStateName(alert: Alert): string {
    if (alert.state?.name) return alert.state.name;
    if (alert.stateId) {
      const matched = this.alertsService.states().find((s) => s.id === alert.stateId);
      if (matched) return matched.name;
    }
    return 'Sin estado';
  }

  private getMarkerColor(stateName?: string): string {
    const s = stateName?.toLowerCase() ?? '';
    if (s.includes('pendiente')) return '#ffb22b';
    if (s.includes('proceso')) return '#009efb';
    if (s.includes('resuelt')) return '#26c6da';
    if (s.includes('rechazad') || s.includes('cancelad')) return '#ef5350';
    return '#745af2';
  }

  getStateBadgeClass(stateName?: string): string {
    const s = stateName?.toLowerCase() ?? '';
    if (s.includes('pendiente')) return 'bg-amber-50 text-amber-700';
    if (s.includes('proceso')) return 'bg-sky-50 text-sky-700';
    if (s.includes('resuelt')) return 'bg-emerald-50 text-emerald-700';
    if (s.includes('rechazad') || s.includes('cancelad')) return 'bg-rose-50 text-rose-600';
    return 'bg-slate-100 text-slate-600';
  }

  getDotClass(stateName?: string): string {
    const s = stateName?.toLowerCase() ?? '';
    if (s.includes('pendiente')) return 'bg-amber-500';
    if (s.includes('proceso')) return 'bg-sky-500';
    if (s.includes('resuelt')) return 'bg-emerald-500';
    if (s.includes('rechazad') || s.includes('cancelad')) return 'bg-rose-500';
    return 'bg-slate-400';
  }
}
