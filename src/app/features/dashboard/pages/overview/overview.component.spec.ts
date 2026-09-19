import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardService } from '../../../../core/services/dashboard.service.js';
import { OverviewComponent } from './overview.component.js';

describe('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;
  let dashboardService: DashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    dashboardService = TestBed.inject(DashboardService);
    vi.spyOn(dashboardService, 'loadDashboardData').mockImplementation(() => {});

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component and triggers loadDashboardData on init', () => {
    expect(component).toBeTruthy();
    expect(dashboardService.loadDashboardData).toHaveBeenCalled();
  });

  it('calculates star arrays for reviews correctly', () => {
    expect(component.getStars(5).length).toBe(5);
    expect(component.getStars(3).length).toBe(3);
    expect(component.getStars(0).length).toBe(1);
  });

  it('calculates bar height based on monthly series', () => {
    dashboardService.overview.set({
      states: { pending: 0, inProcess: 0, resolved: 0, rejected: 0, total: 0 },
      users: { admin: 0, baseSecurity: 0, securityPersonnel: 0, citizen: 0, total: 0 },
      averageTimes: {
        attentionTimeSeconds: 0,
        attentionTimeFormatted: '',
        resolutionTimeSeconds: 0,
        resolutionTimeFormatted: '',
        totalTimeSeconds: 0,
        totalTimeFormatted: '',
      },
      typesDistribution: [],
      monthlySeries: [10, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      recentCommentaries: [],
      year: 2026,
      weeklyAlerts: 0,
    });

    const height10 = component.getBarHeight(10);
    const height20 = component.getBarHeight(20);

    expect(height20).toBe(100);
    expect(height10).toBe(50);
  });

  it('updates year and month when selection changes', () => {
    const setYearSpy = vi.spyOn(dashboardService, 'setYear');
    const setMonthSpy = vi.spyOn(dashboardService, 'setMonth');

    const fakeYearEvent = { target: { value: '2025' } } as unknown as Event;
    component.onYearChange(fakeYearEvent);
    expect(setYearSpy).toHaveBeenCalledWith(2025);

    const fakeMonthEvent = { target: { value: '5' } } as unknown as Event;
    component.onMonthChange(fakeMonthEvent);
    expect(setMonthSpy).toHaveBeenCalledWith(5);
  });
});
