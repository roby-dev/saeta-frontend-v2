import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../../environments/environment.js';
import { AuthService } from '../../../../core/auth/auth.service.js';
import type { User } from '../../../../core/models/user.model.js';
import { ProfileService } from '../../services/profile.service.js';
import { ProfilePageComponent } from './profile-page.component.js';

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;
  let authService: AuthService;
  let profileService: ProfileService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'user-789',
    name: 'Roberto',
    lastname: 'Sanchez',
    dni: '44556677',
    phone: '988776655',
    email: 'roberto@test.com',
    role: 'ADMIN',
    statusAccount: 'HABILITADO',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [AuthService, ProfileService, provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    profileService = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);

    authService.currentUser.set(mockUser);

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize and populate profileForm with currentUser values', () => {
    expect(component).toBeTruthy();
    expect(component.profileForm.get('name')?.value).toBe('Roberto');
    expect(component.profileForm.get('lastname')?.value).toBe('Sanchez');
    expect(component.profileForm.get('email')?.value).toBe('roberto@test.com');
    expect(component.profileForm.get('phone')?.value).toBe('988776655');
  });

  it('should detect password mismatch when confirming password', () => {
    component.passwordForm.patchValue({
      currentPassword: 'currentPassword123',
      newPassword: 'newSecretPassword123',
      confirmPassword: 'differentPassword123',
    });

    expect(component.passwordsMismatch()).toBe(true);
  });

  it('should submit profile form and update profile', () => {
    component.profileForm.patchValue({
      name: 'Roberto Carlos',
    });

    component.submitProfileForm();
    expect(component.isSavingProfile()).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/users/user-789`);
    expect(req.request.method).toBe('PATCH');
    req.flush({
      ok: true,
      user: { ...mockUser, name: 'Roberto Carlos' },
    });

    expect(component.isSavingProfile()).toBe(false);
    expect(component.profileSuccess()).toBe(true);
    expect(authService.currentUser()?.name).toBe('Roberto Carlos');
  });

  it('should submit password form and show success message', () => {
    component.passwordForm.patchValue({
      currentPassword: 'currentPassword123',
      newPassword: 'newSecretPassword123',
      confirmPassword: 'newSecretPassword123',
    });

    expect(component.passwordsMismatch()).toBe(false);

    component.submitPasswordForm();
    expect(component.isChangingPassword()).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/users/user-789/password`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      currentPassword: 'currentPassword123',
      newPassword: 'newSecretPassword123',
    });
    req.flush({ ok: true });

    expect(component.isChangingPassword()).toBe(false);
    expect(component.passwordSuccess()).toBe(true);
  });
});
