import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment.js';
import { Subject } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service.js';
import { RealtimeService } from '../../../core/services/realtime.service.js';
import type { Alert } from '../models/alert.model.js';
import { AlertsService } from './alerts.service.js';

describe('AlertsService', () => {
  let service: AlertsService;
  let httpMock: HttpTestingController;
  let alertCreated$: Subject<Alert>;
  let alertUpdated$: Subject<Alert>;
  let notificationServiceMock: { showEmergency: ReturnType<typeof vi.fn> };

  const mockAlerts: Alert[] = [
    {
      id: 'alert-1',
      userId: 'user-1',
      latitude: -18.0146,
      longitude: -70.2536,
      typeId: 'type-1',
      stateId: 'state-1',
      creationDate: '2026-09-19T12:00:00.000Z',
      state: { id: 'state-1', name: 'Pendiente' },
      type: { id: 'type-1', name: 'Robo' },
    },
    {
      id: 'alert-2',
      userId: 'user-2',
      latitude: -18.02,
      longitude: -70.25,
      typeId: 'type-2',
      stateId: 'state-2',
      creationDate: '2026-09-19T13:00:00.000Z',
      state: { id: 'state-2', name: 'En proceso' },
      type: { id: 'type-2', name: 'Incendio' },
    },
    {
      id: 'alert-3',
      userId: 'user-3',
      latitude: -18.03,
      longitude: -70.24,
      typeId: 'type-1',
      stateId: 'state-3',
      creationDate: '2026-09-19T14:00:00.000Z',
      state: { id: 'state-3', name: 'Resuelta' },
      score: 5,
    },
  ];

  beforeEach(() => {
    alertCreated$ = new Subject<Alert>();
    alertUpdated$ = new Subject<Alert>();
    notificationServiceMock = {
      showEmergency: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AlertsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RealtimeService,
          useValue: {
            alertCreated$: alertCreated$.asObservable(),
            alertUpdated$: alertUpdated$.asObservable(),
          },
        },
        {
          provide: NotificationService,
          useValue: notificationServiceMock,
        },
      ],
    });

    service = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initializes with default empty signals', () => {
    expect(service.alerts()).toEqual([]);
    expect(service.total()).toBe(0);
    expect(service.loading()).toBe(false);
    expect(service.pendingCount()).toBe(0);
    expect(service.processCount()).toBe(0);
    expect(service.resolvedCount()).toBe(0);
    expect(service.rejectedCount()).toBe(0);
  });

  it('loads catalogs (states, types, users)', () => {
    service.loadCatalogs();

    const statesReq = httpMock.expectOne(`${environment.apiUrl}/states`);
    expect(statesReq.request.method).toBe('GET');
    statesReq.flush({ ok: true, states: [{ id: 'st-1', name: 'Pendiente' }] });

    const typesReq = httpMock.expectOne(`${environment.apiUrl}/types`);
    expect(typesReq.request.method).toBe('GET');
    typesReq.flush({ ok: true, types: [{ id: 'tp-1', name: 'Robo' }] });

    const usersReq = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(usersReq.request.method).toBe('GET');
    usersReq.flush({
      ok: true,
      users: [
        { id: 'u-1', name: 'Oficial', role: 'PERSONAL_SEGURIDAD' },
        { id: 'u-2', name: 'Ciudadano', role: 'CIUDADANO' },
      ],
    });

    expect(service.states().length).toBe(1);
    expect(service.types().length).toBe(1);
    expect(service.personnel().length).toBe(1);
    expect(service.personnel()[0].name).toBe('Oficial');
  });

  it('loads alerts with pagination and sets server state counts', () => {
    service.loadAlerts({ page: 1, limit: 10 }).subscribe();

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && r.params.get('page') === '1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      ok: true,
      alerts: mockAlerts,
      total: 3,
      page: 1,
      limit: 10,
      stateCounts: {
        pending: 1,
        inProcess: 1,
        resolved: 1,
        rejected: 0,
        total: 3,
      },
    });

    expect(service.loading()).toBe(false);
    expect(service.alerts().length).toBe(3);
    expect(service.total()).toBe(3);
    expect(service.pendingCount()).toBe(1);
    expect(service.processCount()).toBe(1);
    expect(service.resolvedCount()).toBe(1);
    expect(service.rejectedCount()).toBe(0);
  });

  it('loads all alerts unpaginated when all is true without page or limit params', () => {
    service.loadAlerts({ all: true }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/alerts` &&
        r.params.get('all') === 'true' &&
        !r.params.has('page') &&
        !r.params.has('limit'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      ok: true,
      alerts: mockAlerts,
      total: 3,
      stateCounts: { pending: 1, inProcess: 1, resolved: 1, rejected: 0, total: 3 },
    });

    expect(service.alerts().length).toBe(3);
  });

  it('updates alert state, reflects in signals, and triggers reload', () => {
    service.alerts.set(mockAlerts);

    const updatedAlert: Alert = {
      ...mockAlerts[0],
      stateId: 'state-2',
      state: { id: 'state-2', name: 'En proceso' },
    };

    service.updateAlert('alert-1', { stateId: 'state-2' }).subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const reqPut = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1`);
    expect(reqPut.request.method).toBe('PUT');
    reqPut.flush({ ok: true, alerts: updatedAlert });

    const reqReload = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    expect(reqReload.request.method).toBe('GET');
    reqReload.flush({
      ok: true,
      alerts: [updatedAlert, mockAlerts[1], mockAlerts[2]],
      total: 3,
      stateCounts: { pending: 0, inProcess: 2, resolved: 1, rejected: 0, total: 3 },
    });

    const found = service.alerts().find((a) => a.id === 'alert-1');
    expect(found?.state?.name).toBe('En proceso');
    expect(service.processCount()).toBe(2);
  });

  it('handles realtime alertCreated by adding the alert to the signals', () => {
    service.alerts.set(mockAlerts);
    service.total.set(3);

    const liveAlert: Alert = {
      id: 'alert-live-99',
      userId: 'user-new',
      latitude: -18.01,
      longitude: -70.25,
      typeId: 'type-1',
      stateId: 'state-1',
      creationDate: '2026-09-19T20:00:00.000Z',
      state: { id: 'state-1', name: 'Pendiente' },
    };

    alertCreated$.next(liveAlert);

    const reqStateCounts = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqStateCounts.flush({
      ok: true,
      alerts: [],
      total: 4,
      stateCounts: { pending: 2, inProcess: 1, resolved: 1, rejected: 0, total: 4 },
    });

    expect(service.alerts().length).toBe(4);
    expect(service.alerts()[0].id).toBe('alert-live-99');
    expect(service.total()).toBe(4);
    expect(service.pendingCount()).toBe(2);
    expect(notificationServiceMock.showEmergency).toHaveBeenCalledWith(liveAlert);
  });

  it('handles realtime alertUpdated by updating the existing alert in signals', () => {
    service.alerts.set(mockAlerts);

    const updatedAlert: Alert = {
      ...mockAlerts[0],
      state: { id: 'state-2', name: 'En proceso' },
    };

    alertUpdated$.next(updatedAlert);

    const reqStateCounts = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alerts`);
    reqStateCounts.flush({
      ok: true,
      alerts: [],
      total: 3,
      stateCounts: { pending: 0, inProcess: 2, resolved: 1, rejected: 0, total: 3 },
    });

    const found = service.alerts().find((a) => a.id === 'alert-1');
    expect(found?.state?.name).toBe('En proceso');
    expect(service.processCount()).toBe(2);
  });
});

