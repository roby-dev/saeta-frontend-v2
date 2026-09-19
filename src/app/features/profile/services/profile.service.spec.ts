import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment.js';
import { AuthService } from '../../../core/auth/auth.service.js';
import type { User } from '../../../core/models/user.model.js';
import { ProfileService } from './profile.service.js';

describe('ProfileService', () => {
  let service: ProfileService;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'user-123',
    name: 'Carlos',
    lastname: 'Robles',
    dni: '12345678',
    phone: '987654321',
    email: 'carlos@test.com',
    role: 'ADMIN',
    statusAccount: 'HABILITADO',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProfileService);
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    authService.currentUser.set(mockUser);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updates profile and updates currentUser signal', () => {
    service.updateProfile('user-123', { name: 'Carlos Alberto' }).subscribe((res) => {
      expect(res.ok).toBe(true);
      expect(res.user.name).toBe('Carlos Alberto');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/user-123`);
    expect(req.request.method).toBe('PATCH');
    req.flush({
      ok: true,
      user: { ...mockUser, name: 'Carlos Alberto' },
    });

    expect(authService.currentUser()?.name).toBe('Carlos Alberto');
  });

  it('changes password with current and new password', () => {
    service.changePassword('user-123', 'oldPass123', 'newPass456').subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/user-123/password`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      currentPassword: 'oldPass123',
      newPassword: 'newPass456',
    });
    req.flush({ ok: true });
  });

  it('verifies current password via /pass endpoint', () => {
    service.verifyPassword('currentSecret', 'user-123').subscribe((res) => {
      expect(res.ok).toBe(true);
      expect(res.msg).toBe('Contraseña confirmada');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/pass`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      password: 'currentSecret',
      _id: 'user-123',
    });
    req.flush({ ok: true, msg: 'Contraseña confirmada' });
  });
});
