import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.js';
import type {
  AccountStatus,
  CreateUserPayload,
  GetUsersResponse,
  UpdateUserPayload,
  User,
  UserCountsSummary,
} from '../../../core/models/user.model.js';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/users`;

  // Server state signals
  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(false);
  readonly total = signal<number>(0);
  readonly selectedUser = signal<User | null>(null);
  readonly counts = signal<UserCountsSummary>({
    total: 0,
    admin: 0,
    baseSecurity: 0,
    securityPersonnel: 0,
    citizen: 0,
    enabled: 0,
    disabled: 0,
  });

  // Filter & Pagination Signals
  readonly selectedRoleTab = signal<string>('TODOS');
  readonly selectedStatusFilter = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Search debounce subject
  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.loadUsers().subscribe();
      });
  }

  // Counters derived directly from server aggregation
  readonly adminCount = computed(() => this.counts().admin);
  readonly baseCount = computed(() => this.counts().baseSecurity);
  readonly personalCount = computed(() => this.counts().securityPersonnel);
  readonly citizenCount = computed(() => this.counts().citizen);
  readonly totalCount = computed(() => this.counts().total);
  readonly enabledCount = computed(() => this.counts().enabled);
  readonly disabledCount = computed(() => this.counts().disabled);

  // Total matching current filter (for pagination text, e.g. "Mostrando X de Y usuarios")
  readonly filteredTotal = computed(() => this.total());

  readonly totalPages = computed(() => {
    const total = this.total();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  // Paginated users slice returned by server
  readonly paginatedUsers = computed(() => this.users());
  readonly filteredUsers = computed(() => this.users());

  loadUsers(page?: number): Observable<GetUsersResponse> {
    this.loading.set(true);

    const targetPage = page ?? this.currentPage();
    let params = new HttpParams()
      .set('page', String(targetPage))
      .set('limit', String(this.pageSize()));

    const roleTab = this.selectedRoleTab();
    if (roleTab && roleTab !== 'TODOS') {
      params = params.set('role', roleTab);
    }

    const statusFilter = this.selectedStatusFilter();
    if (statusFilter) {
      params = params.set('statusAccount', statusFilter);
    }

    const query = this.searchQuery().trim();
    if (query) {
      params = params.set('search', query);
    }

    return this.http.get<GetUsersResponse>(this.API_URL, { params }).pipe(
      tap({
        next: (res) => {
          this.users.set(res.users ?? []);
          this.total.set(res.total ?? 0);
          if (page) {
            this.currentPage.set(page);
          }
          if (res.counts) {
            this.counts.set(res.counts);
          }
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
          this.loadUsers().subscribe();
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
          this.loadUsers().subscribe();
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
    if (this.selectedRoleTab() !== role) {
      this.selectedRoleTab.set(role);
      this.currentPage.set(1);
      this.loadUsers(1).subscribe();
    }
  }

  setStatusFilter(status: string): void {
    if (this.selectedStatusFilter() !== status) {
      this.selectedStatusFilter.set(status);
      this.currentPage.set(1);
      this.loadUsers(1).subscribe();
    }
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.searchSubject.next(query);
  }

  setPage(page: number): void {
    const max = this.totalPages();
    const target = Math.max(1, Math.min(page, max));
    if (this.currentPage() !== target) {
      this.currentPage.set(target);
      this.loadUsers(target).subscribe();
    }
  }

  nextPage(): void {
    this.setPage(this.currentPage() + 1);
  }

  prevPage(): void {
    this.setPage(this.currentPage() - 1);
  }
}
