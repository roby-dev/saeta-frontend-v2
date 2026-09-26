import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      // Renamed state ('Pendiente' -> 'En espera') proves rendering follows
      // the code, not the name.
      state: { id: 'state-pending', name: 'En espera', code: 'PENDING' },
      type: { id: 'type-1', name: 'Robo' },
      allowedActions: ['delegate', 'reject', 'manage'],
    },
    {
      id: 'alert-2',
      userId: 'user-2',
      latitude: -18.02,
      longitude: -70.25,
      typeId: 'type-2',
      stateId: 'state-process',
      creationDate: '2026-09-19T13:00:00.000Z',
      state: { id: 'state-process', name: 'En proceso', code: 'IN_PROGRESS' },
      type: { id: 'type-2', name: 'Accidente' },
      allowedActions: ['reject', 'manage'],
    },
    {
      id: 'alert-3',
      userId: 'user-3',
      latitude: -18.03,
      longitude: -70.24,
      typeId: 'type-1',
      stateId: 'state-resolved',
      creationDate: '2026-09-19T14:00:00.000Z',
      state: { id: 'state-resolved', name: 'Resuelta', code: 'RESOLVED' },
      allowedActions: ['manage'],
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
      allowedActions: ['manage'],
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
        { id: 'state-pending', name: 'En espera', code: 'PENDING' },
        { id: 'state-process', name: 'En proceso', code: 'IN_PROGRESS' },
        { id: 'state-resolved', name: 'Resuelta', code: 'RESOLVED' },
        { id: 'state-cancelled', name: 'Cancelada', code: 'REJECTED' },
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

  it('should filter alerts reactively when selectedStateFilter is set to PENDING', () => {
    flushInitRequests();

    component.setStateFilter('PENDING');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('PENDING');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-1');
  });

  it('should filter alerts reactively when selectedStateFilter is set to IN_PROGRESS', () => {
    flushInitRequests();

    component.setStateFilter('IN_PROGRESS');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('IN_PROGRESS');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-2');
  });

  it('should filter alerts reactively when selectedStateFilter is set to RESOLVED', () => {
    flushInitRequests();

    component.setStateFilter('RESOLVED');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('RESOLVED');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-3');
  });

  it('should filter alerts reactively when selectedStateFilter is set to REJECTED using catalog fallback', () => {
    flushInitRequests();

    component.setStateFilter('REJECTED');
    fixture.detectChanges();

    expect(component['selectedStateFilter']()).toBe('REJECTED');
    const filtered = component['displayedAlerts']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('alert-4');
  });

  it('should reset filters when resetMapFilters is called', () => {
    flushInitRequests();

    component.setStateFilter('PENDING');
    component['selectedDistrictId'].set('tacna');
    expect(component['displayedAlerts']().length).toBe(1);

    component.resetMapFilters();
    expect(component['selectedStateFilter']()).toBe('all');
    expect(component['selectedDistrictId']()).toBe('');
    expect(component['displayedAlerts']().length).toBe(4);
  });

  it('should resolve alert state name accurately with populated and unpopulated relations', () => {
    flushInitRequests();

    expect(component['getAlertStateName'](mockAlerts[0])).toBe('En espera');
    expect(component['getAlertStateName'](mockAlerts[3])).toBe('Cancelada');
  });

  it('should resolve alert state code from populated relation or catalog fallback by id (never by name)', () => {
    flushInitRequests();

    expect(component['resolveStateCode'](mockAlerts[0])).toBe('PENDING');
    // alert-4 has no populated `state`, resolved purely via stateId -> catalog code
    expect(component['resolveStateCode'](mockAlerts[3])).toBe('REJECTED');
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

  it('should select alert on marker click without opening the detail side sheet', () => {
    flushInitRequests();

    component['onMarkerClick'](mockAlerts[0]);

    expect(component['selectedAlert']()?.id).toBe('alert-1');
    expect(component['isDetailOpen']()).toBe(false);
  });

  it('should build a brief popup summary with a "Ver más" action that opens the side sheet', () => {
    flushInitRequests();

    const popup = component['buildPopupContent'](mockAlerts[0]);
    expect(popup.textContent).toContain('Robo');
    expect(popup.textContent).toContain('En espera');

    const button = popup.querySelector('button');
    expect(button?.textContent).toContain('Ver más');
    button!.click();

    expect(component['selectedAlert']()?.id).toBe('alert-1');
    expect(component['isDetailOpen']()).toBe(true);
  });

  it('should map state codes to side sheet badge/dot classes, independent of the state name', () => {
    expect(component.getStateBadgeClass('PENDING')).toContain('amber');
    expect(component.getStateBadgeClass('IN_PROGRESS')).toContain('sky');
    expect(component.getStateBadgeClass('RESOLVED')).toContain('emerald');
    expect(component.getStateBadgeClass('REJECTED')).toContain('rose');
    expect(component.getStateBadgeClass(undefined)).toContain('slate');

    expect(component.getDotClass('PENDING')).toContain('amber');
    expect(component.getDotClass(undefined)).toContain('slate');
  });

  it('should close the detail side sheet and clear selection', () => {
    flushInitRequests();

    component.openDetail(mockAlerts[1]);
    expect(component['isDetailOpen']()).toBe(true);

    component.closeDetail();
    expect(component['isDetailOpen']()).toBe(false);
    expect(component['selectedAlert']()).toBeNull();
  });

  it('should expose which actions a renamed-but-still-PENDING alert allows, from allowedActions only', () => {
    flushInitRequests();

    // mockAlerts[0] carries name 'En espera' (not 'Pendiente') but code PENDING
    // and allowedActions ['delegate', 'reject', 'manage'] from the backend.
    expect(component['hasAction'](mockAlerts[0], 'delegate')).toBe(true);
    expect(component['hasAction'](mockAlerts[0], 'reject')).toBe(true);
    expect(component['hasAction'](mockAlerts[2], 'delegate')).toBe(false);
  });

  it('should open the manage modal in delegate mode without preselecting a state', () => {
    flushInitRequests();

    component.openDelegateModal(mockAlerts[0]);
    expect(component['managingAlert']()).toEqual(mockAlerts[0]);
    expect(component['modalMode']()).toBe('delegate');
  });

  it('should delegate an alert to the selected officer and update the selected alert', () => {
    flushInitRequests();

    component.openDelegateModal(mockAlerts[0]);
    component['modalAttendedById'] = 'officer-1';
    component['modalCommentary'] = 'Atendiendo';

    component.saveAlertChanges();

    const reqPost = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1/delegate`);
    expect(reqPost.request.method).toBe('POST');
    expect(reqPost.request.body).toEqual({ attendedById: 'officer-1', commentary: 'Atendiendo' });
    const delegated: Alert = {
      ...mockAlerts[0],
      attendedById: 'officer-1',
      state: { id: 'state-process', name: 'En proceso', code: 'IN_PROGRESS' },
    };
    reqPost.flush({ ok: true, alerts: delegated });

    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: [delegated] });

    expect(component['managingAlert']()).toBeNull();
    expect(component['selectedAlert']()?.attendedById).toBe('officer-1');
  });

  it('should not delegate when no officer is selected', () => {
    flushInitRequests();

    component.openDelegateModal(mockAlerts[0]);
    component['modalAttendedById'] = '';

    component.saveAlertChanges();

    httpMock.expectNone(`${environment.apiUrl}/alerts/alert-1/delegate`);
  });

  it('should save alert changes (generic manage) sending only stateId/attendedById/commentary', () => {
    flushInitRequests();

    component.openManageModal(mockAlerts[0]);
    component['modalStateId'] = 'state-resolved';
    component['modalCommentary'] = 'Atendido en mapa';

    component.saveAlertChanges();

    const reqPut = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1`);
    expect(reqPut.request.method).toBe('PUT');
    expect(reqPut.request.body).toEqual({
      stateId: 'state-resolved',
      attendedById: undefined,
      commentary: 'Atendido en mapa',
    });
    const updated: Alert = { ...mockAlerts[0], stateId: 'state-resolved' };
    reqPut.flush({ ok: true, alerts: updated });

    // AlertsService reload triggers loadAlerts
    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: [updated] });

    expect(component['managingAlert']()).toBeNull();
    expect(component['selectedAlert']()?.stateId).toBe('state-resolved');
  });

  it('should reject an alert via the dedicated endpoint when confirmed', () => {
    flushInitRequests();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.rejectAlert(mockAlerts[0]);

    const reqPost = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1/reject`);
    expect(reqPost.request.method).toBe('POST');
    const rejected: Alert = {
      ...mockAlerts[0],
      state: { id: 'state-cancelled', name: 'Cancelada', code: 'REJECTED' },
    };
    reqPost.flush({ ok: true, alerts: rejected });

    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: [rejected] });

    expect(component['selectedAlert']()?.state?.code).toBe('REJECTED');
  });

  it('should not reject an alert when the confirmation is dismissed', () => {
    flushInitRequests();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.rejectAlert(mockAlerts[0]);

    httpMock.expectNone(`${environment.apiUrl}/alerts/alert-1/reject`);
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
