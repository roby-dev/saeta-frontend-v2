import {
  HttpErrorResponse,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service.js';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export function resetInterceptorState(): void {
  isRefreshing = false;
  refreshTokenSubject = new BehaviorSubject<string | null>(null);
}

function addTokenHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  const authReq = token ? addTokenHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        return handle401Error(authService, req, next, error);
      }
      return throwError(() => error);
    }),
  );
};

function handle401Error(
  authService: AuthService,
  req: HttpRequest<unknown>,
  next: Parameters<HttpInterceptorFn>[1],
  originalError: HttpErrorResponse,
) {
  if (!authService.getRefreshToken()) {
    authService.logout();
    return throwError(() => originalError);
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        return next(addTokenHeader(req, response.accessToken));
      }),
      catchError((refreshErr: unknown) => {
        isRefreshing = false;
        const errorSubject = refreshTokenSubject;
        refreshTokenSubject = new BehaviorSubject<string | null>(null);
        authService.logout();
        errorSubject.error(refreshErr);
        return throwError(() => refreshErr);
      }),
    );
  }

  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((newToken) => next(addTokenHeader(req, newToken))),
  );
}
