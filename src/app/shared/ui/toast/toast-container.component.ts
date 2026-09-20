import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService, type ToastNotification } from '../../../core/services/notification.service.js';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-20 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-xl shadow-2xl border p-4 bg-white transition-all transform duration-300 translate-y-0"
          [ngClass]="{
            'border-rose-400 bg-gradient-to-r from-white via-rose-50/30 to-rose-100/40 ring-2 ring-rose-500/20':
              toast.type === 'emergency' || toast.type === 'error',
            'border-emerald-300 bg-gradient-to-r from-white to-emerald-50/40': toast.type === 'success',
            'border-amber-300 bg-gradient-to-r from-white to-amber-50/40': toast.type === 'warning',
            'border-blue-300 bg-gradient-to-r from-white to-blue-50/40': toast.type === 'info'
          }"
        >
          <div class="flex items-start gap-3">
            <!-- Icon Indicator -->
            <div class="flex-shrink-0 pt-0.5">
              @if (toast.type === 'emergency') {
                <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-sm shadow">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span>!</span>
                </div>
              } @else if (toast.type === 'success') {
                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
              } @else if (toast.type === 'warning') {
                <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                  ⚠
                </div>
              } @else {
                <div class="w-8 h-8 rounded-full bg-blue-100 text-[#1976d2] flex items-center justify-center font-bold text-sm">
                  ℹ
                </div>
              }
            </div>

            <!-- Content Area -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h5 class="text-xs font-bold uppercase tracking-wider text-slate-800 truncate">
                  {{ toast.title }}
                </h5>
                <span class="text-[10px] text-slate-400 font-mono ml-2 flex-shrink-0">
                  {{ toast.timestamp | date: 'HH:mm:ss' }}
                </span>
              </div>

              <p class="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                {{ toast.message }}
              </p>

              @if (toast.alert) {
                <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span class="text-[11px] text-slate-500 font-mono">
                    ID: #{{ toast.alert.id.slice(-6).toUpperCase() }}
                  </span>
                  <button
                    type="button"
                    (click)="onOpenMap(toast)"
                    class="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver en Mapa</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              }
            </div>

            <!-- Close Button -->
            <button
              type="button"
              (click)="onDismiss(toast.id)"
              class="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
              title="Cerrar notificación"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly notificationService = inject(NotificationService);

  onDismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  onOpenMap(toast: ToastNotification): void {
    if (toast.alert) {
      this.notificationService.openAlertInMap(toast.alert.id, toast.id);
    }
  }
}
