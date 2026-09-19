import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div
      class="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style="background-image: url('/assets/images/banner_login.png');"
    >
      <!-- Subtle Dark Overlay for contrast -->
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"></div>

      <div class="relative z-10 w-full max-w-md">
        <div class="bg-white rounded shadow-2xl p-8 sm:p-10 border border-slate-200">
          <router-outlet />
        </div>

        <div class="mt-4 text-center text-xs text-white/80 drop-shadow font-medium">
          &copy; {{ currentYear }} Municipalidad Provincial de Tacna — SAETA
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  protected readonly currentYear = new Date().getFullYear();
}
