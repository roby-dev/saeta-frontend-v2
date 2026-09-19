import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
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

  it('should initialize with no authenticated user', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should store session and update signals on login', () => {
    const mockResponse = {
      ok: true,
      accessToken: 'fake-jwt-token',
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
    expect(service.currentUser()?.name).toBe('Carlos');
    expect(service.isAdministrative()).toBe(true);
  });

  it('should clear signals and local storage on logout', () => {
    service.token.set('temp-token');
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
    expect(service.currentUser()).toBeNull();
  });
});
