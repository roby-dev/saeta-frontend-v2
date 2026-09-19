import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import type { Alert, AlertsResponse } from '../models/alert.model.js';
import type { AlertState, StatesResponse } from '../models/state.model.js';
import type { AlertType, TypesResponse } from '../models/type.model.js';
import type { User } from '../models/user.model.js';

export interface TypeMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface AlertComment {
  id: string;
  commentary: string;
  score: number;
  userName: string;
  userImage?: string;
  date: string;
}

function parseCustomDate(dateStr?: string | Date): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const [datePart, timePart = '00:00:00'] = dateStr.split(',');
    const parts = datePart.split('/').map(Number);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const [h = 0, min = 0, s = 0] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, h, min, s);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0 min 0 seg';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins} min ${secs} seg`;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Raw Signals
  readonly alerts = signal<Alert[]>([]);
  readonly users = signal<User[]>([]);
  readonly types = signal<AlertType[]>([]);
  readonly states = signal<AlertState[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly selectedMonth = signal<number>(new Date().getMonth());

  readonly months = [
    { id: 0, name: 'Enero' },
    { id: 1, name: 'Febrero' },
    { id: 2, name: 'Marzo' },
    { id: 3, name: 'Abril' },
    { id: 4, name: 'Mayo' },
    { id: 5, name: 'Junio' },
    { id: 6, name: 'Julio' },
    { id: 7, name: 'Agosto' },
    { id: 8, name: 'Septiembre' },
    { id: 9, name: 'Octubre' },
    { id: 10, name: 'Noviembre' },
    { id: 11, name: 'Diciembre' },
  ];

  // Computed Header Metrics
  readonly totalAlerts = computed(() => this.alerts().length);

  readonly totalRejectedAlerts = computed(() => {
    return this.alerts().filter((a) => {
      const stateName = (a.state?.name ?? '').toUpperCase();
      return stateName.includes('RECHAZAD');
    }).length;
  });

  readonly totalResolvedAlerts = computed(() => {
    return this.alerts().filter((a) => {
      const stateName = (a.state?.name ?? '').toUpperCase();
      return stateName.includes('RESUELT');
    }).length;
  });

  readonly totalProcessAlerts = computed(() => {
    return this.alerts().filter((a) => {
      const stateName = (a.state?.name ?? '').toUpperCase();
      return stateName.includes('PROCESO');
    }).length;
  });

  readonly totalPendingAlerts = computed(() => {
    return this.alerts().filter((a) => {
      const stateName = (a.state?.name ?? '').toUpperCase();
      return stateName.includes('PENDIENTE');
    }).length;
  });

  readonly totalPersonalUsers = computed(() => {
    return this.users().filter((u) => u.role === 'PERSONAL_SEGURIDAD').length;
  });

  readonly totalCitizenUsers = computed(() => {
    return this.users().filter((u) => u.role === 'CIUDADANO').length;
  });

  // Average Time Resumes
  readonly attentionTimeResume = computed(() => {
    let totalSeconds = 0;
    let count = 0;
    for (const alert of this.alerts()) {
      if (alert.attentionDate && alert.creationDate) {
        const start = parseCustomDate(alert.creationDate);
        const end = parseCustomDate(alert.attentionDate);
        if (start && end && end.getTime() >= start.getTime()) {
          totalSeconds += (end.getTime() - start.getTime()) / 1000;
          count++;
        }
      }
    }
    return count > 0 ? formatDuration(totalSeconds / count) : '0 min 0 seg';
  });

  readonly resolutionTimeResume = computed(() => {
    let totalSeconds = 0;
    let count = 0;
    for (const alert of this.alerts()) {
      if (alert.culminationDate && alert.attentionDate) {
        const start = parseCustomDate(alert.attentionDate);
        const end = parseCustomDate(alert.culminationDate);
        if (start && end && end.getTime() >= start.getTime()) {
          totalSeconds += (end.getTime() - start.getTime()) / 1000;
          count++;
        }
      }
    }
    return count > 0 ? formatDuration(totalSeconds / count) : '0 min 0 seg';
  });

  readonly totalTimeResume = computed(() => {
    let totalSeconds = 0;
    let count = 0;
    for (const alert of this.alerts()) {
      if (alert.culminationDate && alert.creationDate) {
        const start = parseCustomDate(alert.creationDate);
        const end = parseCustomDate(alert.culminationDate);
        if (start && end && end.getTime() >= start.getTime()) {
          totalSeconds += (end.getTime() - start.getTime()) / 1000;
          count++;
        }
      }
    }
    return count > 0 ? formatDuration(totalSeconds / count) : '0 min 0 seg';
  });

  // Breakdown by Type
  readonly typesMetrics = computed<TypeMetric[]>(() => {
    const alerts = this.alerts();
    const types = this.types();
    const total = alerts.length;

    return types.map((type) => {
      const count = alerts.filter(
        (a) => a.typeId === type.id || a.type?.id === type.id || a.type?.name === type.name,
      ).length;
      const percentage = total > 0 ? Number(((count * 100) / total).toFixed(1)) : 0;
      return {
        name: type.name,
        count,
        percentage,
      };
    });
  });

  // Yearly / Monthly Graphs
  readonly totalYearAlerts = computed(() => {
    const year = this.selectedYear();
    return this.alerts().filter((a) => {
      const date = parseCustomDate(a.creationDate);
      return date ? date.getFullYear() === year : false;
    }).length;
  });

  readonly totalMonthAlerts = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    return this.alerts().filter((a) => {
      const date = parseCustomDate(a.creationDate);
      return date ? date.getFullYear() === year && date.getMonth() === month : false;
    }).length;
  });

  readonly totalWeekAlerts = computed(() => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    return this.alerts().filter((a) => {
      const date = parseCustomDate(a.creationDate);
      return date ? date.getFullYear() === currentYear && getWeekNumber(date) === currentWeek : false;
    }).length;
  });

  readonly monthlySeries = computed(() => {
    const year = this.selectedYear();
    const series = new Array<number>(12).fill(0);

    for (const a of this.alerts()) {
      const date = parseCustomDate(a.creationDate);
      if (date && date.getFullYear() === year) {
        const m = date.getMonth();
        if (m >= 0 && m < 12) {
          series[m]++;
        }
      }
    }
    return series;
  });

  // Recent Citizen Feedback / Comments
  readonly alertsWithCommentaries = computed<AlertComment[]>(() => {
    return this.alerts()
      .filter((a) => a.commentary && a.commentary.trim().length > 0)
      .slice(0, 5)
      .map((a) => {
        const u = a.user;
        const fullName = u ? `${u.name ?? ''} ${u.lastname ?? ''}`.trim() || 'Ciudadano' : 'Ciudadano';
        const date = parseCustomDate(a.creationDate);
        const formattedDate = date
          ? date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
          : a.creationDate;

        return {
          id: a.id,
          commentary: a.commentary ?? '',
          score: a.score ?? 0,
          userName: fullName,
          userImage: u?.image,
          date: formattedDate,
        };
      });
  });

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      alerts: this.http
        .get<AlertsResponse>(`${this.apiUrl}/alerts?limit=100`)
        .pipe(map((res) => res.alerts ?? [])),
      users: this.http
        .get<{ users: User[]; total: number }>(`${this.apiUrl}/users?limit=100`)
        .pipe(map((res) => res.users ?? [])),
      types: this.http
        .get<TypesResponse>(`${this.apiUrl}/types?limit=50`)
        .pipe(map((res) => res.types ?? [])),
      states: this.http
        .get<StatesResponse>(`${this.apiUrl}/states?limit=50`)
        .pipe(map((res) => res.states ?? [])),
    }).subscribe({
      next: ({ alerts, users, types, states }) => {
        this.alerts.set(alerts);
        this.users.set(users);
        this.types.set(types);
        this.states.set(states);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Error cargando datos del dashboard');
        this.loading.set(false);
      },
    });
  }

  setYear(year: number): void {
    this.selectedYear.set(year);
  }

  setMonth(month: number): void {
    this.selectedMonth.set(month);
  }
}
