import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService, type ToastNotification } from '../../../core/services/notification.service.js';
import { ToastContainerComponent } from './toast-container.component.js';
import type { Alert } from '../../../features/alerts/models/alert.model.js';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastsSignal: ReturnType<typeof signal<ToastNotification[]>>;
  let mockNotificationService: {
    toasts: typeof toastsSignal;
    dismiss: ReturnType<typeof vi.fn>;
    openAlertInMap: ReturnType<typeof vi.fn>;
  };

  const sampleAlert: Alert = {
    id: 'alert-abc-123',
    userId: 'user-1',
    latitude: -18.01,
    longitude: -70.25,
    typeId: 'type-1',
    stateId: 'state-1',
    creationDate: '2026-09-20T12:00:00.000Z',
  };

  beforeEach(async () => {
    toastsSignal = signal<ToastNotification[]>([]);
    mockNotificationService = {
      toasts: toastsSignal,
      dismiss: vi.fn(),
      openAlertInMap: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render toasts dynamically based on service signals', () => {
    toastsSignal.set([
      {
        id: 'toast-1',
        type: 'emergency',
        title: 'Emergency Alert',
        message: 'Robo en progreso',
        timestamp: new Date(),
        alert: sampleAlert,
      },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Emergency Alert');
    expect(compiled.textContent).toContain('Robo en progreso');
    expect(compiled.textContent).toContain('Ver en Mapa');
  });

  it('should call dismiss when clicking close button', () => {
    toastsSignal.set([
      {
        id: 'toast-1',
        type: 'info',
        title: 'Info Alert',
        message: 'Info message',
        timestamp: new Date(),
      },
    ]);
    fixture.detectChanges();

    component.onDismiss('toast-1');
    expect(mockNotificationService.dismiss).toHaveBeenCalledWith('toast-1');
  });

  it('should call openAlertInMap when clicking map button for an emergency toast', () => {
    const toast: ToastNotification = {
      id: 'toast-emergency',
      type: 'emergency',
      title: 'Emergency Alert',
      message: 'Robo',
      timestamp: new Date(),
      alert: sampleAlert,
    };
    toastsSignal.set([toast]);
    fixture.detectChanges();

    component.onOpenMap(toast);
    expect(mockNotificationService.openAlertInMap).toHaveBeenCalledWith('alert-abc-123', 'toast-emergency');
  });
});
