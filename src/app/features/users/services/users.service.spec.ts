import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment.js';
import type { CreateUserPayload, UpdateUserPayload, User } from '../../../core/models/user.model.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const mockUsers: User[] = [
    {
      id: 'u-1',
      name: 'Carlos',
      lastname: 'Robles',
      dni: '12345678',
      phone: '987654321',
      email: 'carlos@test.com',
      role: 'ADMIN',
      statusAccount: 'HABILITADO',
    },
    {
      id: 'u-2',
      name: 'Maria',
      lastname: 'Gomez',
      dni: '87654321',
      phone: '912345678',
      email: 'maria@test.com',
      role: 'BASE_SEGURIDAD',
      statusAccount: 'HABILITADO',
    },
    {
      id: 'u-3',
      name: 'Juan',
      lastname: 'Perez',
      dni: '11223344',
      phone: '955443322',
      email: 'juan@test.com',
      role: 'PERSONAL_SEGURIDAD',
      statusAccount: 'HABILITADO',
      availability: 'DISPONIBLE',
    },
    {
      id: 'u-4',
      name: 'Ana',
      lastname: 'Lopez',
      dni: '55667788',
      phone: '944332211',
      email: 'ana@test.com',
      role: 'CIUDADANO',
      statusAccount: 'INHABILITADO',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initializes with default empty signals and 0 counters', () => {
    expect(service.users()).toEqual([]);
    expect(service.total()).toBe(0);
    expect(service.loading()).toBe(false);
    expect(service.adminCount()).toBe(0);
    expect(service.baseCount()).toBe(0);
    expect(service.personalCount()).toBe(0);
    expect(service.citizenCount()).toBe(0);
    expect(service.enabledCount()).toBe(0);
    expect(service.disabledCount()).toBe(0);
  });

  it('loads all users and calculates role counts and filtered results', () => {
    service.loadUsers().subscribe();

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/users/all`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, users: mockUsers });

    expect(service.loading()).toBe(false);
    expect(service.users().length).toBe(4);
    expect(service.total()).toBe(4);
    expect(service.adminCount()).toBe(1);
    expect(service.baseCount()).toBe(1);
    expect(service.personalCount()).toBe(1);
    expect(service.citizenCount()).toBe(1);
    expect(service.enabledCount()).toBe(3);
    expect(service.disabledCount()).toBe(1);
  });

  it('filters users by role tab', () => {
    service.users.set(mockUsers);

    service.setRoleTab('PERSONAL_SEGURIDAD');
    expect(service.filteredUsers().length).toBe(1);
    expect(service.filteredUsers()[0].name).toBe('Juan');

    service.setRoleTab('TODOS');
    expect(service.filteredUsers().length).toBe(4);
  });

  it('filters users by search query across name, DNI, phone or email', () => {
    service.users.set(mockUsers);

    service.setSearchQuery('gomez');
    expect(service.filteredUsers().length).toBe(1);
    expect(service.filteredUsers()[0].name).toBe('Maria');

    service.setSearchQuery('11223344');
    expect(service.filteredUsers().length).toBe(1);
    expect(service.filteredUsers()[0].name).toBe('Juan');

    service.setSearchQuery('944332211');
    expect(service.filteredUsers().length).toBe(1);
    expect(service.filteredUsers()[0].name).toBe('Ana');
  });

  it('creates user and updates signals', () => {
    service.users.set(mockUsers);

    const newUserPayload: CreateUserPayload = {
      name: 'Pedro',
      lastname: 'Alvarez',
      dni: '99887766',
      phone: '977889900',
      email: 'pedro@test.com',
      password: 'password123',
      role: 'BASE_SEGURIDAD',
    };

    const createdUser: User = {
      id: 'u-5',
      name: newUserPayload.name,
      lastname: newUserPayload.lastname,
      dni: newUserPayload.dni,
      phone: newUserPayload.phone,
      email: newUserPayload.email,
      role: 'BASE_SEGURIDAD',
      statusAccount: 'HABILITADO',
    };

    service.createUser(newUserPayload).subscribe((res) => {
      expect(res.ok).toBe(true);
      expect(res.user.id).toBe('u-5');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    req.flush({ ok: true, user: createdUser });

    expect(service.users().length).toBe(5);
    expect(service.users()[0].name).toBe('Pedro');
  });

  it('updates user and reflects changes in signals', () => {
    service.users.set(mockUsers);

    const updatePayload: UpdateUserPayload = {
      name: 'Carlos Alberto',
    };

    service.updateUser('u-1', updatePayload).subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/u-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({
      ok: true,
      user: { ...mockUsers[0], name: 'Carlos Alberto' },
    });

    const updated = service.users().find((u) => u.id === 'u-1');
    expect(updated?.name).toBe('Carlos Alberto');
  });

  it('toggles user status from HABILITADO to INHABILITADO and vice versa', () => {
    service.users.set(mockUsers);

    service.toggleUserStatus(mockUsers[0]).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/u-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ statusAccount: 'INHABILITADO' });
    req.flush({
      ok: true,
      user: { ...mockUsers[0], statusAccount: 'INHABILITADO' },
    });

    const found = service.users().find((u) => u.id === 'u-1');
    expect(found?.statusAccount).toBe('INHABILITADO');
  });

  it('changes user password', () => {
    service.changePassword('u-1', 'newSecret123').subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/u-1/password`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ newPassword: 'newSecret123' });
    req.flush({ ok: true });
  });
});
