import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../../environments/environment.js';
import type { Alert } from '../../models/alert.model.js';
import { AlertsService } from '../../services/alerts.service.js';
import { AlertsMapComponent } from './alerts-map.component.js';

import { signal } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RealtimeService } from '../../../../core/services/realtime.service.js';

describe('AlertsMapComponent', () => {
  let component: AlertsMapComponent;
  let fixture: ComponentFixture<AlertsMapComponent>;
  let alertsService: AlertsService;
  let httpMock: HttpTestingController;
  let locationUpdated$: Subject<any>;
  let personalDisconnected$: Subject<string>;
  let alertCreated$: Subject<Alert>;
  let alertUpdated$: Subject<Alert>;
  let queryParams$: BehaviorSubject<Record<string, any>>;

  const mockAlerts: Alert[] = [
    {
      id: 'alert-1',
      userId: 'user-1',
      latitude: -18.0146,
      longitude: -70.2536,
      typeId: 'type-1',
      stateId: 'state-pending',
      creationDate: '2026-09-19T12:00:00.000Z',
      state: { id: 'state-pending', name: 'Pendiente' },
      type: { id: 'type-1', name: 'Robo' },
    },
    {
      id: 'alert-2',
      userId: 'user-2',
      latitude: -18.02,
      longitude: -70.25,
      typeId: 'type-2',
      stateId: 'state-process',
      creationDate: '2026-09-19T13:00:00.000Z',
      state: { id: 'state-process', name: 'En proceso' },
      type: { id: 'type-2', name: 'Accidente' },
    },
    {
      id: 'alert-3',
      userId: 'user-3',
      latitude: -18.03,
      longitude: -70.24,
      typeId: 'type-1',
      stateId: 'state-resolved',
      creationDate: '2026-09-19T14:00:00.000Z',
      state: { id: 'state-resolved', name: 'Resuelta' },
    },
    {
      id: 'alert-4',
      userId: 'user-4',
      latitude: -18.04,
      longitude: -70.23,
      typeId: 'type-3',
      stateId: 'state-cancelled',
      creationDate: '2026-09-19T15:00:00.000Z',
      // Testing unpopulated state relation with catalog fallback
    },
  ];

  beforeEach(async () => {
    locationUpdated$ = new Subject();
    personalDisconnected$ = new Subject();
    alertCreated$ = new Subject();
    alertUpdated$ = new Subject();
    queryParams$ = new BehaviorSubject<Record<string, any>>({});

    const mockRealtime = {
      isConnected: signal(true),
      locationUpdated$: locationUpdated$.asObservable(),
      personalDisconnected$: personalDisconnected$.asObservable(),
      alertCreated$: alertCreated$.asObservable(),
      alertUpdated$: alertUpdated$.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [AlertsMapComponent],
      providers: [
        AlertsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RealtimeService, useValue: mockRealtime },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
            snapshot: { queryParams: queryParams$.value },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsMapComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitRequests(): void {
    fixture.detectChanges();

    // Catalogs: states, types, personnel
    const reqStates = httpMock.expectOne(`${environment.apiUrl}/states`);
    reqStates.flush({
      ok: true,
      states: [
        { id: 'state-pending', name: 'Pendiente' },
        { id: 'state-process', name: 'En proceso' },
        { id: 'state-resolved', name: 'Resuelta' },
        { id: 'state-cancelled', name: 'Cancelada' },
      ],
    });

    const reqTypes = httpMock.expectOne(`${environment.apiUrl}/types`);
    reqTypes.flush({ ok: true, types: [{ id: 'type-1', name: 'Robo' }] });

    const reqPersonnel = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/users`);
    reqPersonnel.flush({ ok: true, users: [] });

    // Alerts: loadAlerts({ all: true })
    const reqAlerts = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && r.params.get('all') === 'true',
    );
    reqAlerts.flush({
      ok: true,
      alerts: mockAlerts,
      total: 4,
      stateCounts: { pending: 1, inProcess: 1, resolved: 1, rejected: 1, total: 4 },
    });
  }

  it('should initialize and display all alerts by default', () => {
    flushInitRequests();

    expect(component).toBeTruthy();
    expect(component['selectedStateFilter']()).toBe('all');
    expect(component['displayedAlerts']().length).toBe(4);
  });

  it('should filter alerts reactively when selectedStateFilter is set to pendiente', () => {
    flushInitRequests();

    component.setStateFilter('pendiente');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('pendiente');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-1');
  });

  it('should filter alerts reactively when selectedStateFilter is set to proceso', () => {
    flushInitRequests();

    component.setStateFilter('proceso');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('proceso');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-2');
  });

  it('should filter alerts reactively when selectedStateFilter is set to resuelta', () => {
    flushInitRequests();

    component.setStateFilter('resuelta');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('resuelta');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-3');
  });

  it('should filter alerts reactively when selectedStateFilter is set to rechazada/cancelada using catalog fallback', () => {
    flushInitRequests();

    component.setStateFilter('rechazada');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('rechazada');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-4');
  });

  it('should reset filters when resetMapFilters is called', () => {
    flushInitRequests();

    component.setStateFilter('pendiente');
    component['selectedDistrictId'].set('tacna');
    expect(component['displayedAlerts']().length).toBe(1);

    component.resetMapFilters();
    expect(component['selectedStateFilter']()).toBe('all');
    expect(component['selectedDistrictId']()).toBe('');
    expect(component['displayedAlerts']().length).toBe(4);
  });

  it('should resolve alert state name accurately with populated and unpopulated relations', () => {
    flushInitRequests();

    expect(component['getAlertStateName'](mockAlerts[0])).toBe('Pendiente');
    expect(component['getAlertStateName'](mockAlerts[3])).toBe('Cancelada');
  });

  it('should handle realtime personnel location updates and disconnection', () => {
    flushInitRequests();

    // Push location update
    locationUpdated$.next({
      user: { id: 'sec-1', name: 'Officer Test', lastname: '1' },
      coords: [-18.01, -70.25],
    });

    expect(component['personnelMarkers'].has('sec-1')).toBe(true);

    // Push disconnect
    personalDisconnected$.next('sec-1');
    expect(component['personnelMarkers'].has('sec-1')).toBe(false);
  });

  it('should focus and select alert when alertId query parameter is provided', () => {
    flushInitRequests();

    queryParams$.next({ alertId: 'alert-2' });
    fixture.detectChanges();

    expect(component['selectedAlert']()).toBeTruthy();
    expect(component['selectedAlert']()?.id).toBe('alert-2');
  });

  it('should open delegate modal with process state preselected', () => {
    flushInitRequests();

    component.openDelegateModal(mockAlerts[0]);
    expect(component['managingAlert']()).toEqual(mockAlerts[0]);
    expect(component['modalStateId']).toBe('state-process');
  });

  it('should save alert changes and update selected alert', () => {
    flushInitRequests();

    component.openManageModal(mockAlerts[0]);
    component['modalStateId'] = 'state-resolved';
    component['modalCommentary'] = 'Atendido en mapa';

    component.saveAlertChanges();

    const reqPut = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1`);
    expect(reqPut.request.method).toBe('PUT');
    const updated: Alert = { ...mockAlerts[0], stateId: 'state-resolved' };
    reqPut.flush({ ok: true, alerts: updated });

    // AlertsService reload triggers loadAlerts
    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: [updated] });

    expect(component['managingAlert']()).toBeNull();
    expect(component['selectedAlert']()?.stateId).toBe('state-resolved');
  });

  it('should toggle and clear route to personnel on the map', () => {
    flushInitRequests();

    // Add officer marker
    locationUpdated$.next({
      user: { id: 'user-2', name: 'Officer Test', lastname: '2' },
      coords: [-18.02, -70.25],
    });

    const alertWithOfficer: Alert = {
      ...mockAlerts[1],
      attendedById: 'user-2',
      attendedBy: { id: 'user-2', name: 'Officer Test' },
    };

    component.toggleRouteToPersonnel(alertWithOfficer);
    expect(component['isRoutingActive']()).toBe(true);
    expect(component['routeLine']).toBeDefined();

    component.clearRoute();
    expect(component['isRoutingActive']()).toBe(false);
    expect(component['routeLine']).toBeUndefined();
  });
});
