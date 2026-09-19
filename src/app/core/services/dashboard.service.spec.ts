import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment.js';
import type { DashboardOverview } from '../models/dashboard.model.js';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const mockOverview: DashboardOverview = {
    states: {
      pending: 4,
      inProcess: 2,
      resolved: 10,
      rejected: 3,
      total: 19,
    },
    users: {
      admin: 1,
      baseSecurity: 2,
      securityPersonnel: 5,
      citizen: 25,
      total: 33,
    },
    averageTimes: {
      attentionTimeSeconds: 180,
      attentionTimeFormatted: '3 min 0 seg',
      resolutionTimeSeconds: 600,
      resolutionTimeFormatted: '10 min 0 seg',
      totalTimeSeconds: 780,
      totalTimeFormatted: '13 min 0 seg',
    },
    typesDistribution: [
      { id: 'type-1', name: 'Robo', count: 12, percentage: 63.2 },
      { id: 'type-2', name: 'Accidente', count: 7, percentage: 36.8 },
    ],
    monthlySeries: [1, 2, 0, 4, 3, 1, 0, 2, 5, 1, 0, 0],
    recentCommentaries: [
      {
        id: 'c-1',
        commentary: 'Rápida atención',
        score: 5,
        userName: 'Maria Diaz',
        date: '19/09/2026',
      },
    ],
    year: 2026,
    weeklyAlerts: 6,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initializes with default year and signals', () => {
    expect(service.selectedYear()).toBe(new Date().getFullYear());
    expect(service.overview()).toBeNull();
    expect(service.totalAlerts()).toBe(0);
  });

  it('loads dashboard data and updates computed metric signals', () => {
    service.loadDashboardData(2026);
    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/overview?year=2026`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOverview);

    expect(service.loading()).toBe(false);
    expect(service.overview()).toEqual(mockOverview);
    expect(service.totalAlerts()).toBe(19);
    expect(service.totalPendingAlerts()).toBe(4);
    expect(service.totalProcessAlerts()).toBe(2);
    expect(service.totalResolvedAlerts()).toBe(10);
    expect(service.totalRejectedAlerts()).toBe(3);
    expect(service.totalPersonalUsers()).toBe(5);
    expect(service.totalCitizenUsers()).toBe(25);
    expect(service.attentionTimeResume()).toBe('3 min 0 seg');
    expect(service.resolutionTimeResume()).toBe('10 min 0 seg');
    expect(service.totalTimeResume()).toBe('13 min 0 seg');
    expect(service.typesMetrics().length).toBe(2);
    expect(service.totalWeekAlerts()).toBe(6);
    expect(service.alertsWithCommentaries().length).toBe(1);

    // Sum of monthlySeries: 1+2+0+4+3+1+0+2+5+1+0+0 = 19
    expect(service.totalYearAlerts()).toBe(19);
  });

  it('handles HTTP error gracefully', () => {
    service.loadDashboardData(2026);

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/overview?year=2026`);
    req.error(new ProgressEvent('Network error'), { status: 500, statusText: 'Server Error' });

    expect(service.loading()).toBe(false);
    expect(service.error()).toBeTruthy();
    expect(service.overview()).toBeNull();
  });

  it('updates selected month and computes month alerts correctly', () => {
    service.loadDashboardData(2026);
    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/overview?year=2026`);
    req.flush(mockOverview);

    // Month 3 is Abril: monthlySeries[3] is 4
    service.setMonth(3);
    expect(service.selectedMonth()).toBe(3);
    expect(service.totalMonthAlerts()).toBe(4);
  });

  it('updates selected year and triggers reloading data', () => {
    service.setYear(2025);
    expect(service.selectedYear()).toBe(2025);

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/overview?year=2025`);
    expect(req.request.method).toBe('GET');
    req.flush({ ...mockOverview, year: 2025 });
  });
});
