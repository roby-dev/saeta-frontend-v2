import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert } from '../../features/alerts/models/alert.model.js';
import { NotificationService } from './notification.service.js';

describe('NotificationService', () => {
  let service: NotificationService;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockAlert: Alert = {
    id: 'alert-emergency-1',
    userId: 'user-1',
    latitude: -18.01,
    longitude: -70.25,
    typeId: 'type-1',
    stateId: 'state-1',
    creationDate: '2026-09-20T12:00:00.000Z',
    type: { id: 'type-1', name: 'Robo a mano armada' },
    user: { id: 'user-1', name: 'Juan', lastname: 'Pérez' },
  };

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should be created and start with empty toasts', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('should add toast notification to signals on show()', () => {
    const id = service.show({
      type: 'info',
      title: 'Info Title',
      message: 'Info message body',
      timeout: 0,
    });

    expect(id).toBeTruthy();
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].title).toBe('Info Title');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should show emergency toast with formatted title and citizen name', () => {
    const playSpy = vi.spyOn(service, 'playAlertSound').mockImplementation(() => {});

    const id = service.showEmergency(mockAlert);

    expect(id).toBeTruthy();
    expect(playSpy).toHaveBeenCalled();
    expect(service.toasts().length).toBe(1);

    const toast = service.toasts()[0];
    expect(toast.type).toBe('emergency');
    expect(toast.title).toContain('Emergencia');
    expect(toast.message).toContain('Robo a mano armada');
    expect(toast.message).toContain('Juan Pérez');
    expect(toast.alert).toEqual(mockAlert);
  });

  it('should dismiss a toast by ID', () => {
    const id1 = service.show({ type: 'info', title: 'Toast 1', message: 'Msg 1', timeout: 0 });
    const id2 = service.show({ type: 'success', title: 'Toast 2', message: 'Msg 2', timeout: 0 });

    expect(service.toasts().length).toBe(2);

    service.dismiss(id1);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].id).toBe(id2);
  });

  it('should clear all toasts', () => {
    service.show({ type: 'info', title: 'Toast 1', message: 'Msg 1', timeout: 0 });
    service.show({ type: 'info', title: 'Toast 2', message: 'Msg 2', timeout: 0 });

    expect(service.toasts().length).toBe(2);

    service.clear();

    expect(service.toasts().length).toBe(0);
  });

  it('should navigate to map and dismiss toast when openAlertInMap is called', () => {
    const toastId = service.show({ type: 'emergency', title: 'Emergency', message: 'Msg', timeout: 0 });

    service.openAlertInMap('alert-99', toastId);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/alerts/map'], {
      queryParams: { alertId: 'alert-99' },
    });
    expect(service.toasts().length).toBe(0);
  });

  it('should play alert sound without throwing in environments without AudioContext support', () => {
    expect(() => service.playAlertSound()).not.toThrow();
  });
});
