import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.js';
import { AuthService } from '../auth/auth.service.js';
import type { Alert, AlertUserSummary } from '../../features/alerts/models/alert.model.js';

export interface LocationUpdateEvent {
  user: AlertUserSummary | any;
  coords: [number, number]; // [lat, lng]
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private socket: Socket | null = null;

  // Connection status signal
  readonly isConnected = signal<boolean>(false);

  // Observable event streams
  private readonly alertCreatedSubject = new Subject<Alert>();
  readonly alertCreated$: Observable<Alert> = this.alertCreatedSubject.asObservable();

  private readonly alertUpdatedSubject = new Subject<Alert>();
  readonly alertUpdated$: Observable<Alert> = this.alertUpdatedSubject.asObservable();

  private readonly locationUpdatedSubject = new Subject<LocationUpdateEvent>();
  readonly locationUpdated$: Observable<LocationUpdateEvent> = this.locationUpdatedSubject.asObservable();

  private readonly personalConnectedSubject = new Subject<string>();
  readonly personalConnected$: Observable<string> = this.personalConnectedSubject.asObservable();

  private readonly personalDisconnectedSubject = new Subject<string>();
  readonly personalDisconnected$: Observable<string> = this.personalDisconnectedSubject.asObservable();

  private readonly personalStateUpdatedSubject = new Subject<any>();
  readonly personalStateUpdated$: Observable<any> = this.personalStateUpdatedSubject.asObservable();

  constructor() {
    this.initSocket();
  }

  initSocket(): void {
    if (typeof window === 'undefined') return;

    if (this.socket) {
      this.socket.disconnect();
    }

    const wsUrl = environment.wsUrl ?? environment.apiUrl.replace(/\/v1\/?$/, '');
    const token = this.authService.token();
    const currentUser = this.authService.currentUser();

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: {
        token: token ?? '',
      },
      query: {
        id: currentUser?.id ?? '',
      },
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('sendAlert', (data: Alert) => {
      this.alertCreatedSubject.next(data);
    });

    this.socket.on('updatedAlert', (data: Alert) => {
      this.alertUpdatedSubject.next(data);
    });

    this.socket.on('updateLocation', (user: any, coords: any) => {
      let latLng: [number, number] = [0, 0];
      if (Array.isArray(coords)) {
        latLng = [coords[0], coords[1]];
      } else if (coords && typeof coords === 'object') {
        latLng = [coords.latitude ?? coords.lat, coords.longitude ?? coords.lng];
      }
      this.locationUpdatedSubject.next({ user, coords: latLng });
    });

    this.socket.on('personalConnected', (idUser: string) => {
      this.personalConnectedSubject.next(idUser);
    });

    this.socket.on('personalDisconnected', (idUser: string) => {
      this.personalDisconnectedSubject.next(idUser);
    });

    this.socket.on('updatePersonalState', (payload: any) => {
      this.personalStateUpdatedSubject.next(payload);
    });
  }

  emit(event: string, ...args: unknown[]): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
