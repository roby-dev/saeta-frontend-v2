import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service.js';
import { RealtimeService } from './realtime.service.js';
import type { Alert } from '../../features/alerts/models/alert.model.js';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    mockAuthService = {
      token: signal('mock-jwt-token'),
      currentUser: signal({ id: 'user-123', name: 'Test' } as never),
    };

    TestBed.configureTestingModule({
      providers: [
        RealtimeService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(RealtimeService);
  });

  it('should be created and have observables ready', () => {
    expect(service).toBeTruthy();
    expect(service.alertCreated$).toBeDefined();
    expect(service.alertUpdated$).toBeDefined();
    expect(service.locationUpdated$).toBeDefined();
    expect(service.personalConnected$).toBeDefined();
    expect(service.personalDisconnected$).toBeDefined();
  });

  it('should stream new alerts when alertCreatedSubject emits', async () => {
    const newAlert: Alert = {
      id: 'alert-realtime-1',
      userId: 'user-1',
      latitude: -18.01,
      longitude: -70.25,
      typeId: 'type-1',
      stateId: 'state-1',
      creationDate: '19/09/2026,12:00:00',
    };

    let received: Alert | undefined;
    service.alertCreated$.subscribe((a) => {
      received = a;
    });

    // Simulate socket event
    (service as any).alertCreatedSubject.next(newAlert);
    expect(received).toEqual(newAlert);
  });

  it('should stream updated alerts when alertUpdatedSubject emits', async () => {
    const updatedAlert: Alert = {
      id: 'alert-realtime-1',
      userId: 'user-1',
      latitude: -18.01,
      longitude: -70.25,
      typeId: 'type-1',
      stateId: 'state-2',
      creationDate: '19/09/2026,12:00:00',
    };

    let received: Alert | undefined;
    service.alertUpdated$.subscribe((a) => {
      received = a;
    });

    (service as any).alertUpdatedSubject.next(updatedAlert);
    expect(received).toEqual(updatedAlert);
  });

  it('should stream location updates', async () => {
    let received: any;
    service.locationUpdated$.subscribe((payload) => {
      received = payload;
    });

    (service as any).locationUpdatedSubject.next({
      user: { id: 'sec-1', name: 'Officer' },
      coords: [-18.01, -70.25],
    });

    expect(received.user.id).toBe('sec-1');
    expect(received.coords).toEqual([-18.01, -70.25]);
  });
});
