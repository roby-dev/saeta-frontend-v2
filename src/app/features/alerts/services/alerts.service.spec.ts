import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment.js';
import type { Alert } from '../models/alert.model.js';
import { AlertsService } from './alerts.service.js';

describe('AlertsService', () => {
  let service: AlertsService;
  let httpMock: HttpTestingController;

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
    TestBed.configureTestingModule({
      providers: [AlertsService, provideHttpClient(), provideHttpClientTesting()],
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

  it('loads alerts with pagination and calculates state counts', () => {
    service.loadAlerts({ page: 1, limit: 10 }).subscribe();

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alerts` && r.params.get('page') === '1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, alerts: mockAlerts, total: 3, page: 1, limit: 10 });

    expect(service.loading()).toBe(false);
    expect(service.alerts().length).toBe(3);
    expect(service.total()).toBe(3);
    expect(service.pendingCount()).toBe(1);
    expect(service.processCount()).toBe(1);
    expect(service.resolvedCount()).toBe(1);
    expect(service.rejectedCount()).toBe(0);
  });

  it('updates alert state and reflects in signals', () => {
    service.alerts.set(mockAlerts);

    const updatedAlert: Alert = {
      ...mockAlerts[0],
      stateId: 'state-2',
      state: { id: 'state-2', name: 'En proceso' },
    };

    service.updateAlert('alert-1', { stateId: 'state-2' }).subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/alerts/alert-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ok: true, alerts: updatedAlert });

    const found = service.alerts().find((a) => a.id === 'alert-1');
    expect(found?.state?.name).toBe('En proceso');
  });
});
