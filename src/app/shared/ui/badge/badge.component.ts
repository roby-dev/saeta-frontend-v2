import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span [class]="classes()">
      <span class="w-1.5 h-1.5 me-1.5 rounded-full" [class]="dotClass()"></span>
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');

  protected readonly classes = computed(() => {
    const base = 'inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full';

    const variants: Record<BadgeVariant, string> = {
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200',
      danger: 'bg-rose-50 text-rose-700 border border-rose-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
      neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    };

    return `${base} ${variants[this.variant()]}`;
  });

  protected readonly dotClass = computed(() => {
    const dots: Record<BadgeVariant, string> = {
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-rose-500',
      info: 'bg-blue-500',
      neutral: 'bg-slate-400',
    };
    return dots[this.variant()];
  });
}
