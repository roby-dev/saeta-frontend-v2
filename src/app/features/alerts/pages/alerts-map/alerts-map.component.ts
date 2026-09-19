import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
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
          <h4 class="card-title text-sm font-bold text-[#455a64] flex items-center">
            <span class="lstick"></span>Filtros del Mapa
          </h4>

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
              [(ngModel)]="selectedDistrictId"
              (change)="onDistrictChange()"
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
              [(ngModel)]="selectedStateFilter"
              (change)="onStateFilterChange()"
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
          <h4 class="card-title text-sm font-bold text-[#455a64] flex items-center">
            <span class="lstick"></span>Estado de Emergencias
          </h4>
          <div class="text-xs space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Pendientes</span>
              </div>
              <span class="font-bold text-amber-600">{{ alertsService.pendingCount() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-[#009efb]"></span>
                <span>En Proceso</span>
              </div>
              <span class="font-bold text-[#009efb]">{{ alertsService.processCount() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Resueltas</span>
              </div>
              <span class="font-bold text-emerald-600">{{ alertsService.resolvedCount() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>Canceladas</span>
              </div>
              <span class="font-bold text-rose-500">{{ alertsService.rejectedCount() }}</span>
            </div>
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

        <!-- Selected Alert Floating Detail Card -->
        @if (selectedAlert()) {
          <div class="absolute bottom-5 right-5 z-20 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 max-w-sm w-full animate-fade-in">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-full"
                  [ngClass]="getDotClass(selectedAlert()!.state?.name)"
                ></span>
                <span class="font-bold text-xs text-slate-800">
                  Alerta #{{ selectedAlert()!.id.slice(-6).toUpperCase() }}
                </span>
              </div>
              <button
                type="button"
                (click)="selectedAlert.set(null)"
                class="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div class="py-2.5 space-y-1.5 text-xs text-slate-600">
              <p>
                <b class="text-slate-700">Ciudadano:</b>
                {{ selectedAlert()!.user?.name }} {{ selectedAlert()!.user?.lastname }}
              </p>
              @if (selectedAlert()!.user?.phone) {
                <p>
                  <b class="text-slate-700">Teléfono:</b>
                  <a [href]="'tel:' + selectedAlert()!.user?.phone" class="text-blue-600 font-semibold underline">
                    {{ selectedAlert()!.user?.phone }}
                  </a>
                </p>
              }
              <p>
                <b class="text-slate-700">Incidente:</b>
                {{ selectedAlert()!.type?.name || 'Emergencia' }}
              </p>
              <p>
                <b class="text-slate-700">Fecha:</b>
                {{ selectedAlert()!.creationDate | date: 'dd/MM/yyyy HH:mm' }}
              </p>
              @if (selectedAlert()!.attendedBy) {
                <p>
                  <b class="text-slate-700">Atendido por:</b>
                  {{ selectedAlert()!.attendedBy?.name }} {{ selectedAlert()!.attendedBy?.lastname }}
                </p>
              }
              @if (selectedAlert()!.score) {
                <p class="text-amber-500 font-bold">
                  <b>Calificación:</b> ★ {{ selectedAlert()!.score }} / 5
                </p>
              }
            </div>

            <div class="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                (click)="centerOnAlert(selectedAlert()!)"
                class="flex-1 text-center py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Enfocar
              </button>
              <a
                [href]="'https://www.google.com/maps?q=' + selectedAlert()!.latitude + ',' + selectedAlert()!.longitude"
                target="_blank"
                class="flex-1 text-center py-1.5 rounded bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-semibold transition-colors"
              >
                Navegar GPS ↗
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AlertsMapComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly alertsService = inject(AlertsService);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private markersLayer?: L.LayerGroup;

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

  protected selectedDistrictId = '';
  protected selectedStateFilter = 'all';
  protected readonly selectedAlert = signal<Alert | null>(null);

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
    const filter = this.selectedStateFilter;

    if (filter === 'all') return list;

    return list.filter((a) => {
      const s = a.state?.name?.toLowerCase() ?? '';
      if (filter === 'pendiente') return s.includes('pendiente');
      if (filter === 'proceso') return s.includes('proceso');
      if (filter === 'resuelta') return s.includes('resuelta') || s.includes('resuelto');
      if (filter === 'rechazada') return s.includes('rechazada') || s.includes('cancelada');
      return true;
    });
  });

  ngOnInit(): void {
    this.alertsService.loadCatalogs();
    // Load up to 100 alerts for map visualization
    this.alertsService.loadAlerts({ limit: 100, page: 1 }).subscribe(() => {
      this.updateMarkers();
    });
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
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
    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    const alerts = this.displayedAlerts();

    for (const alert of alerts) {
      if (!alert.latitude || !alert.longitude) continue;

      const color = this.getMarkerColor(alert.state?.name);
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

      marker.on('click', () => {
        this.selectedAlert.set(alert);
      });

      marker.bindTooltip(
        `<b>#${alert.id.slice(-6).toUpperCase()}</b> - ${alert.type?.name || 'Alerta'} (${alert.state?.name || 'Estado'})`,
        { direction: 'top', offset: [0, -10] },
      );

      this.markersLayer.addLayer(marker);
    }
  }

  onDistrictChange(): void {
    if (!this.map) return;
    const dist = this.districts.find((d) => d.id === this.selectedDistrictId);
    if (dist) {
      this.map.flyTo([dist.lat, dist.lng], 14, { duration: 1.2 });
    } else {
      this.map.flyTo(this.TACNA_CENTER, 13, { duration: 1.2 });
    }
  }

  onStateFilterChange(): void {
    this.updateMarkers();
  }

  resetMapFilters(): void {
    this.selectedDistrictId = '';
    this.selectedStateFilter = 'all';
    this.selectedAlert.set(null);
    if (this.map) {
      this.map.flyTo(this.TACNA_CENTER, 13, { duration: 1.2 });
    }
    this.updateMarkers();
  }

  centerOnAlert(alert: Alert): void {
    if (this.map && alert.latitude && alert.longitude) {
      this.map.flyTo([alert.latitude, alert.longitude], 16, { duration: 1 });
    }
  }

  private getMarkerColor(stateName?: string): string {
    const s = stateName?.toLowerCase() ?? '';
    if (s.includes('pendiente')) return '#ffb22b';
    if (s.includes('proceso')) return '#009efb';
    if (s.includes('resuelta') || s.includes('resuelto')) return '#26c6da';
    if (s.includes('rechazada') || s.includes('cancelada')) return '#ef5350';
    return '#745af2';
  }

  getDotClass(stateName?: string): string {
    const s = stateName?.toLowerCase() ?? '';
    if (s.includes('pendiente')) return 'bg-amber-500';
    if (s.includes('proceso')) return 'bg-sky-500';
    if (s.includes('resuelta') || s.includes('resuelto')) return 'bg-emerald-500';
    if (s.includes('rechazada') || s.includes('cancelada')) return 'bg-rose-500';
    return 'bg-slate-400';
  }
}
