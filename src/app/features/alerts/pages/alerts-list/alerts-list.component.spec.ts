import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      // Renamed state ('Pendiente' -> 'En espera') proves rendering follows
      // the code, not the name.
      state: { id: 'state-1', name: 'En espera', code: 'PENDING' },
      allowedActions: ['delegate', 'reject', 'manage'],
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
      state: { id: 'state-2', name: 'En proceso', code: 'IN_PROGRESS' },
      allowedActions: ['reject', 'manage'],
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
        { id: 'state-1', name: 'En espera', code: 'PENDING' },
        { id: 'state-2', name: 'En proceso', code: 'IN_PROGRESS' },
        { id: 'state-3', name: 'Resuelta', code: 'RESOLVED' },
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

    expect(component['isStateActive']('PENDING')).toBe(true);
  });

  it('should toggle state filter by code when setStateFilterDirect is called from metric cards', () => {
    flushInitRequests();

    component.setStateFilterDirect('IN_PROGRESS');
    expect(component['selectedStateId']()).toBe('state-2');

    const req1 = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && r.params.get('stateId') === 'state-2',
    );
    req1.flush({ ok: true, alerts: [mockAlerts[1]], total: 1 });

    // Calling it again should toggle it off
    component.setStateFilterDirect('IN_PROGRESS');
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

  it('should resolve which actions a renamed-but-still-PENDING alert allows, from allowedActions only', () => {
    flushInitRequests();

    // mockAlerts[0] carries name 'En espera' (not 'Pendiente') but code PENDING
    // and allowedActions ['delegate', 'reject', 'manage'] from the backend.
    expect(component['hasAction'](mockAlerts[0], 'delegate')).toBe(true);
    expect(component['hasAction'](mockAlerts[0], 'reject')).toBe(true);
    expect(component['hasAction'](mockAlerts[1], 'delegate')).toBe(false);
    expect(component['hasAction'](mockAlerts[1], 'manage')).toBe(true);
  });

  it('should map state codes to list badge classes, independent of the state name', () => {
    expect(component.getStateBadgeClass('PENDING')).toContain('amber');
    expect(component.getStateBadgeClass('IN_PROGRESS')).toContain('sky');
    expect(component.getStateBadgeClass('RESOLVED')).toContain('emerald');
    expect(component.getStateBadgeClass('REJECTED')).toContain('rose');
    expect(component.getStateBadgeClass(undefined)).toContain('slate');
  });

  it('should open the manage modal in delegate mode without preselecting a state', () => {
    flushInitRequests();

    component.openDelegateModal(mockAlerts[0]);
    expect(component['managingAlert']()).toEqual(mockAlerts[0]);
    expect(component['modalMode']()).toBe('delegate');
  });

  it('should delegate an alert to the selected officer', () => {
    flushInitRequests();

    component.openDelegateModal(mockAlerts[0]);
    component['modalAttendedById'] = 'officer-1';

    component.saveAlertChanges();

    const reqPost = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1/delegate`);
    expect(reqPost.request.method).toBe('POST');
    expect(reqPost.request.body).toEqual({ attendedById: 'officer-1' });
    const delegated: Alert = { ...mockAlerts[0], attendedById: 'officer-1' };
    reqPost.flush({ ok: true, alerts: delegated });

    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: [delegated] });

    expect(component['managingAlert']()).toBeNull();
  });

  it('should reject an alert via the dedicated endpoint when confirmed', () => {
    flushInitRequests();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.rejectAlert(mockAlerts[0]);

    const reqPost = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1/reject`);
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({ ok: true, alerts: mockAlerts[0] });

    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: mockAlerts, total: 2 });
  });

  it('should not reject an alert when the confirmation is dismissed', () => {
    flushInitRequests();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.rejectAlert(mockAlerts[0]);

    httpMock.expectNone(`${environment.apiUrl}/alerts/alert-1/reject`);
  });

  it('should save generic manage changes sending only stateId/attendedById/commentary', () => {
    flushInitRequests();

    component.openManageModal(mockAlerts[1]);
    component['modalStateId'] = 'state-3';
    component['modalCommentary'] = 'Resuelto';

    component.saveAlertChanges();

    const reqPut = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-2`);
    expect(reqPut.request.method).toBe('PUT');
    expect(reqPut.request.body).toEqual({
      stateId: 'state-3',
      attendedById: undefined,
      commentary: 'Resuelto',
    });
    reqPut.flush({ ok: true, alerts: { ...mockAlerts[1], stateId: 'state-3' } });

    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqReload.flush({ ok: true, alerts: mockAlerts, total: 2 });
  });
});
