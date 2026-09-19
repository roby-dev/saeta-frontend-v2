import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../../environments/environment.js';
import type { User } from '../../../../core/models/user.model.js';
import { UsersService } from '../../services/users.service.js';
import { UsersListComponent } from './users-list.component.js';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;
  let usersService: UsersService;
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
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    usersService = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load users on init', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/all`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, users: mockUsers });

    expect(component).toBeTruthy();
    expect(usersService.users().length).toBe(2);
  });

  it('should switch role tabs and filter correctly', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/all`);
    req.flush({ ok: true, users: mockUsers });

    component.selectRoleTab('ADMIN');
    expect(usersService.selectedRoleTab()).toBe('ADMIN');
    expect(usersService.filteredUsers().length).toBe(1);
    expect(usersService.filteredUsers()[0].role).toBe('ADMIN');
  });

  it('should open and close create modal with valid initial state', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/all`);
    req.flush({ ok: true, users: mockUsers });

    component.openCreateModal();
    expect(component['isUserModalOpen']()).toBe(true);
    expect(component['isEditMode']()).toBe(false);

    component.closeUserModal();
    expect(component['isUserModalOpen']()).toBe(false);
  });

  it('should open edit modal populated with selected user data', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/all`);
    req.flush({ ok: true, users: mockUsers });

    component.openEditModal(mockUsers[0]);
    expect(component['isUserModalOpen']()).toBe(true);
    expect(component['isEditMode']()).toBe(true);
    expect(component['userForm'].get('dni')?.value).toBe('12345678');
    expect(component['userForm'].get('name')?.value).toBe('Carlos');
  });

  it('should open password reset modal for target user', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/all`);
    req.flush({ ok: true, users: mockUsers });

    component.openPasswordModal(mockUsers[0]);
    expect(component['isPasswordModalOpen']()).toBe(true);
    expect(component['passwordTargetUser']()?.id).toBe('u-1');
    expect(component['newPasswordValue']().length).toBeGreaterThanOrEqual(6);

    component.closePasswordModal();
    expect(component['isPasswordModalOpen']()).toBe(false);
  });
});
