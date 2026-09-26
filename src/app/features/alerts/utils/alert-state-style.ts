import type { StateCode } from '../models/alert.model.js';

/**
 * Presentation styling for an alert state, keyed purely by its backend
 * StateCode. This is the single source of truth for state colors/labels
 * across the alerts feature (map markers, side sheet, list badges).
 *
 * Renaming a state's `name` never changes its style: this module never
 * receives or inspects the name, only the stable `code`.
 */
export interface AlertStateStyle {
  /** Fallback label used when the alert's state has no populated name. */
  label: string;
  /** Hex color used for Leaflet map markers. */
  markerColor: string;
  /** Tailwind class for the small status dot (side sheet header, legend). */
  dotClass: string;
  /** Tailwind classes for the side sheet / popup badge. */
  badgeClass: string;
  /** Tailwind classes for the operational table badge. */
  listBadgeClass: string;
}

const STYLE_BY_CODE: Record<StateCode, AlertStateStyle> = {
  PENDING: {
    label: 'Pendiente',
    markerColor: '#ffb22b',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700',
    listBadgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  IN_PROGRESS: {
    label: 'En proceso',
    markerColor: '#009efb',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-50 text-sky-700',
    listBadgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
  },
  RESOLVED: {
    label: 'Resuelta',
    markerColor: '#26c6da',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    listBadgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  REJECTED: {
    label: 'Rechazada',
    markerColor: '#ef5350',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-600',
    listBadgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
  },
};

const DEFAULT_STYLE: AlertStateStyle = {
  label: 'Sin estado',
  markerColor: '#745af2',
  dotClass: 'bg-slate-400',
  badgeClass: 'bg-slate-100 text-slate-600',
  listBadgeClass: 'bg-slate-100 text-slate-700',
};

/** Resolves the presentation style for a given (possibly missing) state code. */
export function getAlertStateStyle(code?: StateCode): AlertStateStyle {
  if (!code) return DEFAULT_STYLE;
  return STYLE_BY_CODE[code] ?? DEFAULT_STYLE;
}
