import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: class DummyComponent {} }]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize with no authenticated user and null tokens', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.refreshTokenSignal()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('should store session, update tokens and signals on login', () => {
    const mockResponse = {
      ok: true,
      accessToken: 'fake-jwt-token',
      refreshToken: 'fake-refresh-token',
      user: {
        id: '123',
        name: 'Carlos',
        lastname: 'Gomez',
        dni: '12345678',
        phone: '987654321',
        email: 'carlos@example.com',
        role: 'ADMIN' as const,
      },
    };

    service.login({ email: 'carlos@example.com', password: 'password' }).subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('fake-jwt-token');
    expect(service.refreshTokenSignal()).toBe('fake-refresh-token');
    expect(service.getRefreshToken()).toBe('fake-refresh-token');
    expect(localStorage.getItem('saeta_token')).toBe('fake-jwt-token');
    expect(localStorage.getItem('saeta_refresh_token')).toBe('fake-refresh-token');
    expect(service.currentUser()?.name).toBe('Carlos');
    expect(service.isAdministrative()).toBe(true);
  });

  it('should refresh tokens and update session and storage on refreshToken()', () => {
    localStorage.setItem('saeta_token', 'old-access-token');
    localStorage.setItem('saeta_refresh_token', 'old-refresh-token');
    service.token.set('old-access-token');
    service.refreshTokenSignal.set('old-refresh-token');

    const refreshResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: '123',
        name: 'Carlos',
        lastname: 'Gomez',
        dni: '12345678',
        phone: '987654321',
        email: 'carlos@example.com',
        role: 'ADMIN' as const,
      },
    };

    service.refreshToken().subscribe((res) => {
      expect(res.accessToken).toBe('new-access-token');
      expect(res.refreshToken).toBe('new-refresh-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
    req.flush(refreshResponse);

    expect(service.token()).toBe('new-access-token');
    expect(service.refreshTokenSignal()).toBe('new-refresh-token');
    expect(service.getRefreshToken()).toBe('new-refresh-token');
    expect(localStorage.getItem('saeta_token')).toBe('new-access-token');
    expect(localStorage.getItem('saeta_refresh_token')).toBe('new-refresh-token');
  });

  it('should retain current refresh token if server does not return a new refresh token', () => {
    localStorage.setItem('saeta_refresh_token', 'retained-refresh-token');
    service.refreshTokenSignal.set('retained-refresh-token');

    const partialResponse = {
      accessToken: 'new-access-token-only',
      user: {
        id: '123',
        name: 'Carlos',
        lastname: 'Gomez',
        dni: '12345678',
        phone: '987654321',
        email: 'carlos@example.com',
        role: 'ADMIN' as const,
      },
    };

    service.refreshToken().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    req.flush(partialResponse);

    expect(service.token()).toBe('new-access-token-only');
    expect(service.getRefreshToken()).toBe('retained-refresh-token');
  });

  it('should clear signals and local storage on logout', () => {
    service.token.set('temp-token');
    service.refreshTokenSignal.set('temp-refresh-token');
    localStorage.setItem('saeta_token', 'temp-token');
    localStorage.setItem('saeta_refresh_token', 'temp-refresh-token');
    service.currentUser.set({
      id: '1',
      name: 'Test',
      lastname: 'User',
      dni: '12345678',
      phone: '999999999',
      email: 'test@example.com',
      role: 'CIUDADANO',
    });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.refreshTokenSignal()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('saeta_token')).toBeNull();
    expect(localStorage.getItem('saeta_refresh_token')).toBeNull();
    expect(localStorage.getItem('saeta_user')).toBeNull();
  });

  it('should fetch profile and update signals and local storage', () => {
    const mockUser = {
      id: '456',
      name: 'Maria',
      lastname: 'Lopez',
      dni: '87654321',
      phone: '912345678',
      email: 'maria@example.com',
      role: 'ADMIN' as const,
      statusAccount: 'ACTIVO' as const,
    };

    service.fetchProfile().subscribe((user) => {
      expect(user.name).toBe('Maria');
      expect(user.lastname).toBe('Lopez');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    expect(service.currentUser()?.name).toBe('Maria');
    expect(service.currentUser()?.lastname).toBe('Lopez');
    expect(service.currentUser()?.dni).toBe('87654321');
  });
});
