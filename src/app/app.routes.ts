import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard.js';

export const routes: Routes = [
  // Exposed Auth Layout (Public)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component.js').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component.js').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  // Protected Admin Layout (Authenticated)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component.js').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/dashboard/pages/overview/overview.component.js'
          ).then((m) => m.OverviewComponent),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import(
            './features/alerts/pages/alerts-list/alerts-list.component.js'
          ).then((m) => m.AlertsListComponent),
      },
      {
        path: 'alerts/map',
        loadComponent: () =>
          import(
            './features/alerts/pages/alerts-map/alerts-map.component.js'
          ).then((m) => m.AlertsMapComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import(
            './features/users/pages/users-list/users-list.component.js'
          ).then((m) => m.UsersListComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
