import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service.js';

export type SidebarState = 'full' | 'mini' | 'closed';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-[#f4f6f9] text-[#67757c] font-sans antialiased">
      <!-- ============================================================== -->
      <!-- Topbar Header (Classic Admin Pro #1976d2 Blue)                 -->
      <!-- ============================================================== -->
      <header class="h-16 bg-[#1976d2] text-white fixed top-0 left-0 right-0 z-30 flex items-center justify-between shadow-md select-none">
        <div class="flex items-center h-full">
          <!-- Logo Brand Container -->
          <div
            class="h-full flex items-center px-4 bg-[#1565c0] transition-all duration-300 overflow-hidden"
            [class.w-60]="sidebarState() === 'full'"
            [class.w-[70px]]="sidebarState() === 'mini'"
            [class.w-auto]="isMobile()"
          >
            <a routerLink="/dashboard" class="flex items-center gap-2.5 font-bold tracking-wider text-white truncate">
              <div class="w-8 h-8 rounded bg-white text-[#1976d2] flex items-center justify-center font-black text-base shadow-sm">
                S
              </div>
              @if (sidebarState() === 'full' || isMobile()) {
                <div class="flex flex-col leading-tight">
                  <span class="text-base font-extrabold tracking-wide">SAETA</span>
                  <span class="text-[9px] text-blue-200 tracking-wider font-semibold uppercase">Seguridad</span>
                </div>
              }
            </a>
          </div>

          <!-- Hamburger Toggle Button -->
          <button
            type="button"
            (click)="toggleSidebar()"
            class="p-3 text-white hover:bg-white/10 rounded-md ml-2 transition-colors focus:outline-none"
            title="Alternar barra lateral"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Municipal Subtitle (Desktop only) -->
          <span class="hidden md:inline-block text-xs text-blue-100 font-medium ml-3 tracking-wide">
            Municipalidad Provincial de Tacna — Centro de Operaciones
          </span>
        </div>

        <!-- Topbar Right Profile & Actions -->
        <div class="flex items-center gap-3 pr-4 md:pr-6">
          <div class="flex items-center gap-2.5 text-right">
            <div class="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              {{ userInitials() }}
            </div>
            <div class="hidden sm:block text-left leading-tight">
              <p class="text-xs font-bold text-white truncate max-w-[150px]">{{ userName() }}</p>
              <span class="text-[10px] text-blue-200 font-semibold uppercase">{{ userRole() }}</span>
            </div>
          </div>

          <button
            type="button"
            (click)="logout()"
            class="inline-flex items-center text-xs font-semibold bg-white/15 hover:bg-rose-600 hover:text-white text-white px-3 py-1.5 rounded transition-colors ml-2"
            title="Cerrar sesión"
          >
            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </header>

      <!-- ============================================================== -->
      <!-- Mobile Backdrop Overlay                                        -->
      <!-- ============================================================== -->
      @if (isMobile() && sidebarState() === 'full') {
        <div
          (click)="closeMobileSidebar()"
          class="fixed inset-0 bg-black/50 z-30 transition-opacity animate-fade-in"
        ></div>
      }

      <!-- ============================================================== -->
      <!-- Left Sidebar (White background #ffffff with shadow)            -->
      <!-- ============================================================== -->
      <aside
        class="fixed top-16 bottom-0 left-0 bg-white border-r border-[#e5edef] shadow-[1px_0_20px_rgba(0,0,0,0.06)] z-30 transition-all duration-300 flex flex-col select-none"
        [class.w-60]="sidebarState() === 'full'"
        [class.w-[70px]]="sidebarState() === 'mini'"
        [class.-translate-x-full]="isMobile() && sidebarState() === 'closed'"
        [class.translate-x-0]="!isMobile() || sidebarState() === 'full'"
      >
        <!-- User Profile Mini Box in Sidebar Header -->
        <div class="p-4 border-b border-slate-100 flex items-center gap-3 overflow-hidden bg-slate-50/60">
          <div class="w-10 h-10 rounded-full bg-[#1976d2] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
            {{ userInitials() }}
          </div>
          @if (sidebarState() === 'full') {
            <div class="overflow-hidden leading-tight">
              <h5 class="text-xs font-bold text-[#455a64] truncate">{{ userName() }}</h5>
              <p class="text-[11px] text-slate-400 truncate">{{ userEmail() }}</p>
            </div>
          }
        </div>

        <!-- Sidebar Navigation Menu -->
        <nav class="flex-1 py-3 overflow-y-auto space-y-1">
          @for (item of filteredMenu(); track item.url) {
            <a
              [routerLink]="item.url"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.url === '/dashboard' }"
              (click)="onMenuItemClick()"
              class="group flex items-center px-4 py-2.5 text-sm font-medium transition-colors relative"
              [class.justify-center]="sidebarState() === 'mini'"
              [class.justify-start]="sidebarState() === 'full'"
              [title]="sidebarState() === 'mini' ? item.title : ''"
            >
              <!-- Indicator Bar for Active Route -->
              <span
                class="absolute left-0 top-0 bottom-0 w-1 bg-[#1976d2] transition-opacity duration-200"
                [class.opacity-0]="!isActive(item.url)"
                [class.opacity-100]="isActive(item.url)"
              ></span>

              <!-- Icon -->
              <span
                class="text-lg flex-shrink-0 transition-colors"
                [class.text-[#1976d2]]="isActive(item.url)"
                [class.text-[#555f6d]]="!isActive(item.url)"
                [innerHTML]="item.icon"
              ></span>

              <!-- Title Label -->
              @if (sidebarState() === 'full') {
                <span
                  class="ml-3 truncate text-[13.5px] font-medium"
                  [class.text-[#1976d2]]="isActive(item.url)"
                  [class.font-bold]="isActive(item.url)"
                  [class.text-[#687384]]="!isActive(item.url)"
                  [class.group-hover:text-[#1976d2]]="!isActive(item.url)"
                >
                  {{ item.title }}
                </span>
              }
            </a>
          }
        </nav>

        <!-- Sidebar Footer Version Note -->
        @if (sidebarState() === 'full') {
          <div class="p-3 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-wider">
            SAETA Platform v2.0
          </div>
        }
      </aside>

      <!-- ============================================================== -->
      <!-- Page Content Wrapper                                           -->
      <!-- ============================================================== -->
      <div
        class="flex-1 flex flex-col pt-16 transition-all duration-300 min-h-screen"
        [class.ml-60]="!isMobile() && sidebarState() === 'full'"
        [class.ml-[70px]]="!isMobile() && sidebarState() === 'mini'"
        [class.ml-0]="isMobile()"
      >
        <!-- Breadcrumbs & Section Title Header -->
        <div class="px-6 py-4 bg-white border-b border-[#e5edef] flex items-center justify-between">
          <div>
            <h4 class="text-lg font-bold text-[#455a64] tracking-tight">{{ currentSectionTitle() }}</h4>
            <div class="flex items-center text-xs text-slate-400 gap-1.5 mt-0.5">
              <span>Inicio</span>
              <span>/</span>
              <span class="text-[#1976d2] font-semibold">{{ currentSectionTitle() }}</span>
            </div>
          </div>
        </div>

        <!-- Main Workspace Outlet -->
        <main class="flex-1 p-5 md:p-7 bg-[#f4f6f9]">
          <div class="max-w-[1600px] mx-auto">
            <router-outlet />
          </div>
        </main>

        <!-- Classic Footer -->
        <footer class="py-3 px-6 bg-white border-t border-[#e5edef] text-center sm:text-left text-xs text-slate-400">
          © Kazuro Systems S.A.C. — Sistema Integral SAETA
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      .active {
        background-color: #f2f7fd;
        color: #1976d2 !important;
      }
      .active span {
        color: #1976d2 !important;
      }
    `,
  ],
})
export class AdminLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Responsive signals
  readonly sidebarState = signal<SidebarState>('full');
  readonly isMobile = signal<boolean>(false);

  // Current active URL signal for highlighting
  readonly currentUrl = signal<string>('/dashboard');

  private readonly menuItems: MenuItem[] = [
    {
      title: 'Panel de Inicio',
      url: '/dashboard',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    },
    {
      title: 'Registro de Alertas',
      url: '/alerts',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    },
    {
      title: 'Mapa de Alertas',
      url: '/alerts/map',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
    },
    {
      title: 'Visualizar Usuarios',
      url: '/users',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
      adminOnly: true,
    },
    {
      title: 'Configuración (Estados/Tipos)',
      url: '/catalogs',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      adminOnly: true,
    },
  ];

  protected readonly filteredMenu = computed(() => {
    const isAdmin = this.authService.userRole() === 'ADMIN';
    return this.menuItems.filter((i) => !i.adminOnly || isAdmin);
  });

  protected readonly userName = computed(() => {
    const u = this.authService.currentUser();
    return u ? `${u.name} ${u.lastname}` : 'Usuario';
  });

  protected readonly userEmail = computed(() => {
    return this.authService.currentUser()?.email ?? '';
  });

  protected readonly userRole = computed(() => {
    return this.authService.userRole() ?? 'INVITADO';
  });

  protected readonly userInitials = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return 'SA';
    const first = u.name?.charAt(0) ?? '';
    const last = u.lastname?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  });

  protected readonly currentSectionTitle = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/dashboard')) return 'Panel de Inicio';
    if (url.includes('/alerts/map')) return 'Mapa de Alertas';
    if (url.includes('/alerts')) return 'Registro de Alertas';
    if (url.includes('/users')) return 'Visualizar Usuarios';
    if (url.includes('/catalogs')) return 'Configuración';
    return 'Panel de Control';
  });

  ngOnInit(): void {
    this.checkScreenSize();

    if (this.authService.isAuthenticated()) {
      this.authService.fetchProfile().subscribe({
        error: () => {
          // Token may be invalid or server unreachable
        },
      });
    }

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        if (this.isMobile()) {
          this.sidebarState.set('closed');
        }
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;

    if (width < 768) {
      this.isMobile.set(true);
      this.sidebarState.set('closed');
    } else if (width < 1170) {
      this.isMobile.set(false);
      this.sidebarState.set('mini');
    } else {
      this.isMobile.set(false);
      this.sidebarState.set('full');
    }
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.sidebarState.update((s) => (s === 'closed' ? 'full' : 'closed'));
    } else {
      this.sidebarState.update((s) => (s === 'full' ? 'mini' : 'full'));
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile()) {
      this.sidebarState.set('closed');
    }
  }

  onMenuItemClick(): void {
    if (this.isMobile()) {
      this.sidebarState.set('closed');
    }
  }

  isActive(url: string): boolean {
    const current = this.currentUrl();
    if (url === '/dashboard') return current === '/dashboard' || current === '/';
    return current.startsWith(url);
  }

  logout(): void {
    this.authService.logout();
  }
}
