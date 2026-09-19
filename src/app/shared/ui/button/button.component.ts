import { Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="classes()"
    >
      @if (loading()) {
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg text-sm px-5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';

    const width = this.fullWidth() ? 'w-full' : '';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 shadow-sm active:scale-[0.98]',
      secondary:
        'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-200',
      danger:
        'text-white bg-red-600 hover:bg-red-700 focus:ring-red-300 shadow-sm active:scale-[0.98]',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:ring-gray-200',
    };

    return `${base} ${variantStyles[this.variant()]} ${width}`;
  });
}
