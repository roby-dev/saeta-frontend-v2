import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service.js';
import { BadgeComponent } from '../../shared/ui/badge/badge.component.js';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BadgeComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <!-- Sidebar Desktop -->
      <aside
        class="bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 border-r border-slate-800"
        [class.hidden]="!sidebarOpen()"
      >
        <!-- Brand Header -->
        <div class="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
          <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-blue-500/20">
            S
          </div>
          <div>
            <span class="text-lg font-bold text-white tracking-wide">SAETA</span>
            <span class="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Centro de Control</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          @for (item of filteredNavItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-blue-600 text-white font-semibold shadow-sm"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors group"
            >
              <span class="mr-3 text-lg" [innerHTML]="item.icon"></span>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User Profile Card in Sidebar Footer -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/20">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm">
              {{ userInitials() }}
            </div>
            <div class="ml-3 overflow-hidden">
              <p class="text-sm font-medium text-white truncate">{{ userName() }}</p>
              <p class="text-xs text-slate-400 truncate">{{ userRole() }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Layout -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navigation Bar -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div class="flex items-center">
            <button
              (click)="toggleSidebar()"
              class="text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 p-2 rounded-lg"
              title="Alternar barra lateral"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span class="ml-4 font-semibold text-slate-800 text-sm hidden sm:inline-block">
              Municipalidad Provincial de Tacna
            </span>
          </div>

          <div class="flex items-center space-x-4">
            <app-badge [variant]="roleBadgeVariant()">
              {{ userRole() }}
            </app-badge>

            <button
              (click)="logout()"
              class="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <!-- Dynamic Routed Content -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div class="max-w-7xl mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly sidebarOpen = signal<boolean>(true);

  private readonly navItems: NavItem[] = [
    {
      label: 'Panel Principal',
      path: '/dashboard',
      icon: '📊',
    },
    {
      label: 'Monitor de Alertas',
      path: '/alerts',
      icon: '🚨',
    },
    {
      label: 'Usuarios y Personal',
      path: '/users',
      icon: '👥',
      adminOnly: true,
    },
    {
      label: 'Catálogos (Estados/Tipos)',
      path: '/catalogs',
      icon: '📁',
      adminOnly: true,
    },
  ];

  protected readonly filteredNavItems = computed(() => {
    const isAdmin = this.authService.userRole() === 'ADMIN';
    return this.navItems.filter((item) => !item.adminOnly || isAdmin);
  });

  protected readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.name} ${user.lastname}` : 'Usuario';
  });

  protected readonly userRole = computed(() => {
    return this.authService.userRole() ?? 'INVITADO';
  });

  protected readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'SA';
    const first = user.name?.charAt(0) ?? '';
    const last = user.lastname?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  });

  protected readonly roleBadgeVariant = computed(() => {
    const role = this.authService.userRole();
    if (role === 'ADMIN') return 'danger';
    if (role === 'BASE_SEGURIDAD') return 'warning';
    if (role === 'PERSONAL_SEGURIDAD') return 'info';
    return 'neutral';
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  logout(): void {
    this.authService.logout();
  }
}
