import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../../environments/environment.js';
import type { Alert } from '../../models/alert.model.js';
import { AlertsService } from '../../services/alerts.service.js';
import { AlertsListComponent } from './alerts-list.component.js';

describe('AlertsListComponent', () => {
  let component: AlertsListComponent;
  let fixture: ComponentFixture<AlertsListComponent>;
  let alertsService: AlertsService;
  let httpMock: HttpTestingController;

  const mockAlerts: Alert[] = [
    {
      id: 'alert-1',
      userId: 'user-1',
      latitude: -18.01,
      longitude: -70.25,
      typeId: 'type-1',
      stateId: 'state-1',
      creationDate: '2026-09-19T10:00:00.000Z',
      user: { id: 'user-1', name: 'Juan', lastname: 'Perez', dni: '11223344', phone: '999888777' },
      type: { id: 'type-1', name: 'Robo' },
      state: { id: 'state-1', name: 'Pendiente' },
    },
    {
      id: 'alert-2',
      userId: 'user-2',
      latitude: -18.02,
      longitude: -70.26,
      typeId: 'type-2',
      stateId: 'state-2',
      creationDate: '2026-09-19T11:00:00.000Z',
      user: { id: 'user-2', name: 'Maria', lastname: 'Lopez', dni: '88776655', phone: '988776655' },
      type: { id: 'type-2', name: 'Accidente' },
      state: { id: 'state-2', name: 'En proceso' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsListComponent],
      providers: [
        AlertsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsListComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitRequests(): void {
    fixture.detectChanges();

    const reqStates = httpMock.expectOne(`${environment.apiUrl}/states`);
    reqStates.flush({
      ok: true,
      states: [
        { id: 'state-1', name: 'Pendiente' },
        { id: 'state-2', name: 'En proceso' },
        { id: 'state-3', name: 'Resuelta' },
      ],
    });

    const reqTypes = httpMock.expectOne(`${environment.apiUrl}/types`);
    reqTypes.flush({
      ok: true,
      types: [
        { id: 'type-1', name: 'Robo' },
        { id: 'type-2', name: 'Accidente' },
      ],
    });

    const reqPersonnel = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/users`);
    reqPersonnel.flush({ ok: true, users: [] });

    const reqAlerts = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqAlerts.flush({
      ok: true,
      alerts: mockAlerts,
      total: 2,
      stateCounts: { pending: 1, inProcess: 1, resolved: 0, rejected: 0, total: 2 },
    });
  }

  it('should initialize and load alerts and catalogs', () => {
    flushInitRequests();

    expect(component).toBeTruthy();
    expect(component['filteredAlerts']().length).toBe(2);
  });

  it('should reactively filter alerts in real-time when searchQuery signal changes', () => {
    flushInitRequests();

    // Type "Juan" into the reactive search query
    component['searchQuery'].set('Juan');
    fixture.detectChanges();

    const filtered = component['filteredAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].user?.name).toBe('Juan');

    // Filter by DNI
    component['searchQuery'].set('88776655');
    fixture.detectChanges();

    const filteredDni = component['filteredAlerts']();
    expect(filteredDni.length).toBe(1);
    expect(filteredDni[0].user?.lastname).toBe('Lopez');

    // Non-existent search
    component['searchQuery'].set('NonExistent');
    fixture.detectChanges();
    expect(component['filteredAlerts']().length).toBe(0);
  });

  it('should reload alerts with state filter when onStateChange is triggered', () => {
    flushInitRequests();

    const selectEvent = { target: { value: 'state-1' } } as unknown as Event;
    component.onStateChange(selectEvent);

    expect(component['selectedStateId']()).toBe('state-1');
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && r.params.get('stateId') === 'state-1',
    );
    req.flush({ ok: true, alerts: [mockAlerts[0]], total: 1 });

    expect(component['isStateActive']('pendiente')).toBe(true);
  });

  it('should toggle state filter when setStateFilterDirect is called from metric cards', () => {
    flushInitRequests();

    component.setStateFilterDirect('proceso');
    expect(component['selectedStateId']()).toBe('state-2');

    const req1 = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && r.params.get('stateId') === 'state-2',
    );
    req1.flush({ ok: true, alerts: [mockAlerts[1]], total: 1 });

    // Calling it again should toggle it off
    component.setStateFilterDirect('proceso');
    expect(component['selectedStateId']()).toBe('');

    const req2 = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && !r.params.has('stateId'),
    );
    req2.flush({ ok: true, alerts: mockAlerts, total: 2 });
  });

  it('should reset all filters and reload page 1 when resetFilters is called', () => {
    flushInitRequests();

    component['searchQuery'].set('test');
    component['selectedStateId'].set('state-1');
    component['selectedTypeId'].set('type-1');

    component.resetFilters();

    expect(component['searchQuery']()).toBe('');
    expect(component['selectedStateId']()).toBe('');
    expect(component['selectedTypeId']()).toBe('');

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    req.flush({ ok: true, alerts: mockAlerts, total: 2 });
  });
});
