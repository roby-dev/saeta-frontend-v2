import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Alert } from '../../features/alerts/models/alert.model.js';

export interface ToastNotification {
  id: string;
  type: 'emergency' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  alert?: Alert;
  timeout?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly router = inject(Router);

  readonly toasts = signal<ToastNotification[]>([]);

  show(notification: Omit<ToastNotification, 'id' | 'timestamp'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastNotification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    this.toasts.update((current) => [toast, ...current]);

    if (toast.type === 'emergency') {
      this.playAlertSound();
    }

    const duration = notification.timeout ?? (toast.type === 'emergency' ? 12000 : 5000);
    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  showEmergency(alert: Alert): string {
    const typeName = alert.type?.name || 'Emergencia General';
    const citizenName = alert.user ? `${alert.user.name} ${alert.user.lastname ?? ''}`.trim() : 'Ciudadano';

    return this.show({
      type: 'emergency',
      title: `🚨 ¡Nueva Emergencia Reportada!`,
      message: `${typeName} — ${citizenName}`,
      alert,
      timeout: 15000,
    });
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }

  openAlertInMap(alertId: string, toastId?: string): void {
    if (toastId) {
      this.dismiss(toastId);
    }
    this.router.navigate(['/alerts/map'], {
      queryParams: { alertId },
    });
  }

  playAlertSound(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // First beep (880Hz / A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Second higher beep (1174Hz / D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } catch {
      // Audio autoplay policy might block audio before first user interaction
    }
  }
}
