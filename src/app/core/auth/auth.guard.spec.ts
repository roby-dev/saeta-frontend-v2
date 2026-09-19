import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  Router,
  type RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard, guestGuard, publicGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

describe('Auth Guards', () => {
  let authService: AuthService;
  let router: Router;
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'auth/login', component: class DummyLoginComponent {} },
          { path: 'dashboard', component: class DummyDashboardComponent {} },
        ]),
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  describe('authGuard', () => {
    it('returns true when user is authenticated', () => {
      authService.token.set('valid-token');
      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('returns UrlTree redirecting to /auth/login when user is not authenticated', () => {
      authService.token.set(null);
      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
      expect(result).toEqual(router.createUrlTree(['/auth/login']));
    });
  });

  describe('guestGuard', () => {
    it('returns true when user is unauthenticated', () => {
      authService.token.set(null);
      const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('returns UrlTree redirecting to /dashboard when user is authenticated', () => {
      authService.token.set('valid-token');
      const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));
      expect(result).toEqual(router.createUrlTree(['/dashboard']));
    });
  });

  describe('publicGuard alias', () => {
    it('is an alias for guestGuard', () => {
      expect(publicGuard).toBe(guestGuard);
    });

    it('returns UrlTree redirecting to /dashboard when user is authenticated', () => {
      authService.token.set('valid-token');
      const result = TestBed.runInInjectionContext(() => publicGuard(dummyRoute, dummyState));
      expect(result).toEqual(router.createUrlTree(['/dashboard']));
    });

    it('returns true when user is unauthenticated', () => {
      authService.token.set(null);
      const result = TestBed.runInInjectionContext(() => publicGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });
  });
});
