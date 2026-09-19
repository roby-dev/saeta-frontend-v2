import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">SAETA</h1>
        <p class="mt-1 text-sm text-slate-400 font-medium">
          Sistema de Atención y Emergencias de Seguridad Ciudadana
        </p>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-white/95 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/20">
          <router-outlet />
        </div>

        <div class="mt-8 text-center text-xs text-slate-500">
          &copy; {{ currentYear }} Municipalidad Provincial de Tacna. Todos los derechos reservados.
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  protected readonly currentYear = new Date().getFullYear();
}
