import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment.js';
import type {
  DashboardOverview,
  RecentCommentary,
  TypeDistribution,
} from '../models/dashboard.model.js';

// Retain alias export for backwards compatibility if needed
export type TypeMetric = TypeDistribution;
export type AlertComment = RecentCommentary;

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Server state
  readonly overview = signal<DashboardOverview | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Time filters
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

  // Overview metrics derived directly from server state
  readonly totalAlerts = computed(() => this.overview()?.states.total ?? 0);
  readonly totalRejectedAlerts = computed(() => this.overview()?.states.rejected ?? 0);
  readonly totalResolvedAlerts = computed(() => this.overview()?.states.resolved ?? 0);
  readonly totalProcessAlerts = computed(() => this.overview()?.states.inProcess ?? 0);
  readonly totalPendingAlerts = computed(() => this.overview()?.states.pending ?? 0);

  readonly totalPersonalUsers = computed(() => this.overview()?.users.securityPersonnel ?? 0);
  readonly totalCitizenUsers = computed(() => this.overview()?.users.citizen ?? 0);

  readonly attentionTimeResume = computed(
    () => this.overview()?.averageTimes.attentionTimeFormatted ?? '0 min 0 seg',
  );
  readonly resolutionTimeResume = computed(
    () => this.overview()?.averageTimes.resolutionTimeFormatted ?? '0 min 0 seg',
  );
  readonly totalTimeResume = computed(
    () => this.overview()?.averageTimes.totalTimeFormatted ?? '0 min 0 seg',
  );

  readonly typesMetrics = computed<TypeDistribution[]>(
    () => this.overview()?.typesDistribution ?? [],
  );

  readonly monthlySeries = computed<number[]>(
    () => this.overview()?.monthlySeries ?? new Array<number>(12).fill(0),
  );

  readonly totalYearAlerts = computed(() =>
    this.monthlySeries().reduce((sum, count) => sum + count, 0),
  );

  readonly totalMonthAlerts = computed(() => {
    const monthIndex = this.selectedMonth();
    return this.monthlySeries()[monthIndex] ?? 0;
  });

  readonly totalWeekAlerts = computed(() => this.overview()?.weeklyAlerts ?? 0);

  readonly alertsWithCommentaries = computed<RecentCommentary[]>(
    () => this.overview()?.recentCommentaries ?? [],
  );

  loadDashboardData(year?: number): void {
    const targetYear = year ?? this.selectedYear();
    this.loading.set(true);
    this.error.set(null);

    this.http.get<DashboardOverview>(`${this.apiUrl}/dashboard/overview?year=${targetYear}`).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Error cargando métricas del dashboard');
        this.loading.set(false);
      },
    });
  }

  setYear(year: number): void {
    if (this.selectedYear() !== year) {
      this.selectedYear.set(year);
      this.loadDashboardData(year);
    }
  }

  setMonth(month: number): void {
    this.selectedMonth.set(month);
  }
}
