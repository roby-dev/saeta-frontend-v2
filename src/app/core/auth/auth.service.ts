import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import type { AuthResponse, User } from '../models/user.model.js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;

  // Signals
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly token = signal<string | null>(this.loadStoredToken());
  readonly refreshTokenSignal = signal<string | null>(this.loadStoredRefreshToken());

  // Computed Signals
  readonly isAuthenticated = computed(() => Boolean(this.token()));
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly isAdministrative = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ADMIN' || role === 'BASE_SEGURIDAD';
  });

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response.accessToken && response.user) {
          this.setSession(response.accessToken, response.refreshToken ?? null, response.user);
        }
      }),
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const currentRefresh = this.getRefreshToken();
    return this.http
      .post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken: currentRefresh })
      .pipe(
        tap((response) => {
          if (response.accessToken && response.user) {
            this.setSession(
              response.accessToken,
              response.refreshToken ?? currentRefresh,
              response.user,
            );
          }
        }),
      );
  }

  fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap((user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('saeta_user', JSON.stringify(user));
        }
        this.currentUser.set(user);
      }),
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saeta_token');
      localStorage.removeItem('saeta_refresh_token');
      localStorage.removeItem('saeta_user');
    }
    this.token.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSignal() ?? this.loadStoredRefreshToken();
  }

  private setSession(token: string, refreshToken: string | null, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saeta_token', token);
      if (refreshToken) {
        localStorage.setItem('saeta_refresh_token', refreshToken);
      }
      localStorage.setItem('saeta_user', JSON.stringify(user));
    }
    this.token.set(token);
    if (refreshToken) {
      this.refreshTokenSignal.set(refreshToken);
    }
    this.currentUser.set(user);
  }

  private loadStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('saeta_token');
  }

  private loadStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('saeta_refresh_token');
  }

  private loadStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('saeta_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
