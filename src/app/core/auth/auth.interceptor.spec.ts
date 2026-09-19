import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment.js';
import { authInterceptor, resetInterceptorState } from './auth.interceptor.js';
import { AuthService } from './auth.service.js';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    resetInterceptorState();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: class DummyComponent {} }]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    resetInterceptorState();
    localStorage.clear();
  });

  it('injects Authorization Bearer header when token exists', () => {
    authService.token.set('active-access-token');

    http.get('/api/resource').subscribe();

    const req = httpMock.expectOne('/api/resource');
    expect(req.request.headers.get('Authorization')).toBe('Bearer active-access-token');
    req.flush({ ok: true });
  });

  it('does not inject Authorization header when token is null', () => {
    authService.token.set(null);

    http.get('/api/public-resource').subscribe();

    const req = httpMock.expectOne('/api/public-resource');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });

  it('passes non-401 HTTP errors through unmodified without calling refresh', () => {
    authService.token.set('active-access-token');
    authService.refreshTokenSignal.set('valid-refresh-token');

    let errorResponse: HttpErrorResponse | null = null;
    http.get('/api/not-found').subscribe({
      error: (err: HttpErrorResponse) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/not-found');
    req.flush({ message: 'Resource not found' }, { status: 404, statusText: 'Not Found' });

    expect(errorResponse).not.toBeNull();
    expect(errorResponse!.status).toBe(404);
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('catches single 401, calls refresh endpoint, and retries original request with new token', () => {
    authService.token.set('expired-access-token');
    authService.refreshTokenSignal.set('stored-refresh-token');
    localStorage.setItem('saeta_refresh_token', 'stored-refresh-token');

    let resultData: unknown = null;
    http.get('/api/protected').subscribe((data) => {
      resultData = data;
    });

    // Initial request fails with 401
    const initialReq = httpMock.expectOne('/api/protected');
    expect(initialReq.request.headers.get('Authorization')).toBe('Bearer expired-access-token');
    initialReq.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    // Refresh request triggered
    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReq.request.method).toBe('POST');
    expect(refreshReq.request.body).toEqual({ refreshToken: 'stored-refresh-token' });

    refreshReq.flush({
      accessToken: 'new-access-token',
      refreshToken: 'renewed-refresh-token',
      user: { id: 'u1', email: 'test@saeta.test', role: 'ADMIN' },
    });

    // Retried original request
    const retriedReq = httpMock.expectOne('/api/protected');
    expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retriedReq.flush({ success: true, payload: 'data' });

    expect(resultData).toEqual({ success: true, payload: 'data' });
  });

  it('excludes /auth/login from 401 interception to prevent recursion loops', () => {
    let errorStatus = 0;
    http.post(`${environment.apiUrl}/auth/login`, { email: 'bad', password: 'bad' }).subscribe({
      error: (err: HttpErrorResponse) => {
        errorStatus = err.status;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorStatus).toBe(401);
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('excludes /auth/refresh from 401 interception to prevent recursion loops', () => {
    let errorStatus = 0;
    http.post(`${environment.apiUrl}/auth/refresh`, { refreshToken: 'invalid' }).subscribe({
      error: (err: HttpErrorResponse) => {
        errorStatus = err.status;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    req.flush({ message: 'Invalid refresh' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorStatus).toBe(401);
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('immediately logs out and propagates error if 401 occurs but refresh token is missing', () => {
    authService.token.set('expired-access-token');
    authService.refreshTokenSignal.set(null);
    localStorage.removeItem('saeta_refresh_token');

    const logoutSpy = vi.spyOn(authService, 'logout');
    let errorStatus = 0;

    http.get('/api/protected').subscribe({
      error: (err: HttpErrorResponse) => {
        errorStatus = err.status;
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorStatus).toBe(401);
    expect(logoutSpy).toHaveBeenCalled();
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('coordinates concurrent 401 requests with exactly one refresh call and replays all requests', () => {
    authService.token.set('expired-access-token');
    authService.refreshTokenSignal.set('stored-refresh-token');
    localStorage.setItem('saeta_refresh_token', 'stored-refresh-token');

    let resultA: unknown = null;
    let resultB: unknown = null;
    let resultC: unknown = null;

    http.get('/api/endpoint-a').subscribe((d) => (resultA = d));
    http.get('/api/endpoint-b').subscribe((d) => (resultB = d));
    http.get('/api/endpoint-c').subscribe((d) => (resultC = d));

    const reqA = httpMock.expectOne('/api/endpoint-a');
    const reqB = httpMock.expectOne('/api/endpoint-b');
    const reqC = httpMock.expectOne('/api/endpoint-c');

    // All three fail with 401 in parallel
    reqA.flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });
    reqB.flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });
    reqC.flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });

    // Only ONE refresh request should be issued
    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);

    refreshReq.flush({
      accessToken: 'brand-new-access-token',
      refreshToken: 'brand-new-refresh-token',
      user: { id: 'u1', email: 'test@saeta.test', role: 'ADMIN' },
    });

    // All three original requests should now be retried with the new token
    const retryA = httpMock.expectOne('/api/endpoint-a');
    const retryB = httpMock.expectOne('/api/endpoint-b');
    const retryC = httpMock.expectOne('/api/endpoint-c');

    expect(retryA.request.headers.get('Authorization')).toBe('Bearer brand-new-access-token');
    expect(retryB.request.headers.get('Authorization')).toBe('Bearer brand-new-access-token');
    expect(retryC.request.headers.get('Authorization')).toBe('Bearer brand-new-access-token');

    retryA.flush({ data: 'A' });
    retryB.flush({ data: 'B' });
    retryC.flush({ data: 'C' });

    expect(resultA).toEqual({ data: 'A' });
    expect(resultB).toEqual({ data: 'B' });
    expect(resultC).toEqual({ data: 'C' });
  });

  it('tears down session on refresh failure, logs out, and rejects initial and queued requests', () => {
    authService.token.set('expired-access-token');
    authService.refreshTokenSignal.set('bad-refresh-token');
    localStorage.setItem('saeta_refresh_token', 'bad-refresh-token');

    const logoutSpy = vi.spyOn(authService, 'logout');

    let errorA: unknown = null;
    let errorB: unknown = null;

    http.get('/api/primary').subscribe({
      error: (err: unknown) => {
        errorA = err;
      },
    });
    http.get('/api/queued').subscribe({
      error: (err: unknown) => {
        errorB = err;
      },
    });

    const reqPrimary = httpMock.expectOne('/api/primary');
    const reqQueued = httpMock.expectOne('/api/queued');

    reqPrimary.flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });
    reqQueued.flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    refreshReq.flush({ message: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(errorA).not.toBeNull();
    expect(errorB).not.toBeNull();
  });
});
