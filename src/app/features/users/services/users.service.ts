import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.js';
import type {
  AccountStatus,
  CreateUserPayload,
  GetUsersResponse,
  UpdateUserPayload,
  User,
  UserRole,
} from '../../../core/models/user.model.js';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/users`;

  // Signals
  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(false);
  readonly total = signal<number>(0);
  readonly selectedUser = signal<User | null>(null);

  // Filter & Pagination Signals
  readonly selectedRoleTab = signal<string>('TODOS');
  readonly selectedStatusFilter = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Computed counters by role
  readonly adminCount = computed(() => {
    return this.users().filter((u) => u.role === 'ADMIN').length;
  });

  readonly baseCount = computed(() => {
    return this.users().filter((u) => u.role === 'BASE_SEGURIDAD').length;
  });

  readonly personalCount = computed(() => {
    return this.users().filter((u) => u.role === 'PERSONAL_SEGURIDAD').length;
  });

  readonly citizenCount = computed(() => {
    return this.users().filter((u) => u.role === 'CIUDADANO').length;
  });

  readonly totalCount = computed(() => this.users().length);

  readonly enabledCount = computed(() => {
    return this.users().filter((u) => (u.statusAccount ?? 'HABILITADO') === 'HABILITADO').length;
  });

  readonly disabledCount = computed(() => {
    return this.users().filter((u) => u.statusAccount === 'INHABILITADO').length;
  });

  // Computed list filtered by role tab, status, and search query
  readonly filteredUsers = computed(() => {
    let list = this.users();
    const roleTab = this.selectedRoleTab();
    const statusFilter = this.selectedStatusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    if (roleTab !== 'TODOS') {
      list = list.filter((u) => u.role === roleTab);
    }

    if (statusFilter) {
      list = list.filter((u) => (u.statusAccount ?? 'HABILITADO') === statusFilter);
    }

    if (query) {
      list = list.filter((u) => {
        const fullName = `${u.name ?? ''} ${u.lastname ?? ''}`.toLowerCase();
        const dni = u.dni?.toLowerCase() ?? '';
        const phone = u.phone?.toLowerCase() ?? '';
        const email = u.email?.toLowerCase() ?? '';
        return fullName.includes(query) || dni.includes(query) || phone.includes(query) || email.includes(query);
      });
    }

    return list;
  });

  readonly filteredTotal = computed(() => this.filteredUsers().length);

  readonly totalPages = computed(() => {
    const total = this.filteredTotal();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  // Paginated slice for current page
  readonly paginatedUsers = computed(() => {
    const list = this.filteredUsers();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  loadUsers(): Observable<{ ok: boolean; users: User[] }> {
    this.loading.set(true);

    return this.http.get<{ ok: boolean; users: User[] }>(`${this.API_URL}/all`).pipe(
      tap({
        next: (res) => {
          const list = res.users ?? [];
          this.users.set(list);
          this.total.set(list.length);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      }),
    );
  }

  createUser(payload: CreateUserPayload): Observable<{ ok: boolean; user: User }> {
    return this.http.post<{ ok: boolean; user: User }>(this.API_URL, payload).pipe(
      tap((res) => {
        if (res.ok && res.user) {
          this.users.update((list) => [res.user, ...list]);
          this.total.update((t) => t + 1);
        }
      }),
    );
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<{ ok: boolean; user: User }> {
    return this.http.patch<{ ok: boolean; user: User }>(`${this.API_URL}/${id}`, payload).pipe(
      tap((res) => {
        if (res.ok && res.user) {
          this.users.update((list) =>
            list.map((u) => (u.id === id ? { ...u, ...res.user } : u)),
          );
          if (this.selectedUser()?.id === id) {
            this.selectedUser.set({ ...this.selectedUser()!, ...res.user });
          }
        }
      }),
    );
  }

  toggleUserStatus(user: User): Observable<{ ok: boolean; user: User }> {
    const nextStatus: AccountStatus =
      (user.statusAccount ?? 'HABILITADO') === 'HABILITADO' ? 'INHABILITADO' : 'HABILITADO';

    return this.updateUser(user.id, { statusAccount: nextStatus });
  }

  changePassword(id: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.API_URL}/${id}/password`, {
      newPassword,
    });
  }

  setRoleTab(role: string): void {
    this.selectedRoleTab.set(role);
    this.currentPage.set(1);
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
    this.currentPage.set(1);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    const max = this.totalPages();
    const target = Math.max(1, Math.min(page, max));
    this.currentPage.set(target);
  }

  nextPage(): void {
    this.setPage(this.currentPage() + 1);
  }

  prevPage(): void {
    this.setPage(this.currentPage() - 1);
  }
}
