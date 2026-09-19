import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.js';
import type {
  Alert,
  AlertFilter,
  AlertsResponse,
  AlertStateCounts,
  AlertStateSummary,
  AlertTypeSummary,
  AlertUserSummary,
} from '../models/alert.model.js';

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/alerts`;

  // Signals
  readonly alerts = signal<Alert[]>([]);
  readonly total = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly states = signal<AlertStateSummary[]>([]);
  readonly types = signal<AlertTypeSummary[]>([]);
  readonly personnel = signal<AlertUserSummary[]>([]);
  readonly selectedAlert = signal<Alert | null>(null);

  // Server state counts signal
  readonly stateCounts = signal<AlertStateCounts>({
    pending: 0,
    inProcess: 0,
    resolved: 0,
    rejected: 0,
    total: 0,
  });

  // Pagination & Filter Signals
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly activeFilters = signal<AlertFilter>({});

  // Summary counts derived directly from server state aggregation
  readonly resolvedCount = computed(() => this.stateCounts().resolved);
  readonly processCount = computed(() => this.stateCounts().inProcess);
  readonly pendingCount = computed(() => this.stateCounts().pending);
  readonly rejectedCount = computed(() => this.stateCounts().rejected);


  loadCatalogs(): void {
    // States
    this.http
      .get<{ ok: boolean; states: AlertStateSummary[] }>(`${environment.apiUrl}/states`)
      .subscribe({
        next: (res) => {
          if (res.states) this.states.set(res.states);
        },
        error: (err) => console.error('Error loading states', err),
      });

    // Types
    this.http
      .get<{ ok: boolean; types: AlertTypeSummary[] }>(`${environment.apiUrl}/types`)
      .subscribe({
        next: (res) => {
          if (res.types) this.types.set(res.types);
        },
        error: (err) => console.error('Error loading alert types', err),
      });

    // Personnel
    this.http
      .get<{ ok: boolean; users: AlertUserSummary[] }>(`${environment.apiUrl}/users`)
      .subscribe({
        next: (res) => {
          if (res.users) {
            const secPersonnel = res.users.filter(
              (u) =>
                u.role === 'PERSONAL_SEGURIDAD' ||
                u.role === 'BASE_SEGURIDAD' ||
                u.role === 'ADMIN',
            );
            this.personnel.set(secPersonnel);
          }
        },
        error: (err) => console.error('Error loading personnel', err),
      });
  }

  loadAlerts(filters?: AlertFilter): Observable<AlertsResponse> {
    this.loading.set(true);

    let params = new HttpParams()
      .set('page', String(filters?.page ?? this.currentPage()))
      .set('limit', String(filters?.limit ?? this.pageSize()));

    if (filters?.stateId) {
      params = params.set('stateId', filters.stateId);
    }
    if (filters?.typeId) {
      params = params.set('typeId', filters.typeId);
    }

    if (filters) {
      this.activeFilters.set(filters);
    }

    return this.http.get<AlertsResponse>(this.API_URL, { params }).pipe(
      tap({
        next: (response) => {
          this.alerts.set(response.alerts ?? []);
          this.total.set(response.total ?? 0);
          if (response.stateCounts) {
            this.stateCounts.set(response.stateCounts);
          }
          if (filters?.page) {
            this.currentPage.set(filters.page);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      }),
    );
  }

  updateAlert(id: string, payload: Partial<Alert>): Observable<{ ok: boolean; alerts: Alert }> {
    return this.http.put<{ ok: boolean; alerts: Alert }>(`${this.API_URL}/${id}`, payload).pipe(
      tap((res) => {
        if (res.ok && res.alerts) {
          // Update in local signal array
          this.alerts.update((list) =>
            list.map((item) => (item.id === id ? { ...item, ...res.alerts } : item)),
          );
          if (this.selectedAlert()?.id === id) {
            this.selectedAlert.set({ ...this.selectedAlert()!, ...res.alerts });
          }
          // Reload alerts to refresh global counts and pagination
          this.loadAlerts(this.activeFilters()).subscribe();
        }
      }),
    );
  }


  deletePendingAlerts(): Observable<{ ok: boolean; deletedCount: number }> {
    return this.http.delete<{ ok: boolean; deletedCount: number }>(this.API_URL).pipe(
      tap(() => {
        // Reload alerts
        this.loadAlerts(this.activeFilters()).subscribe();
      }),
    );
  }
}
