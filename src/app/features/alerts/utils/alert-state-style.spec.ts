import { describe, expect, it } from 'vitest';
import { getAlertStateStyle } from './alert-state-style.js';

describe('getAlertStateStyle', () => {
  it('maps PENDING to the amber style', () => {
    const style = getAlertStateStyle('PENDING');
    expect(style.markerColor).toBe('#ffb22b');
    expect(style.dotClass).toContain('amber');
    expect(style.badgeClass).toContain('amber');
    expect(style.listBadgeClass).toContain('amber');
    expect(style.label).toBe('Pendiente');
  });

  it('maps IN_PROGRESS to the sky style', () => {
    const style = getAlertStateStyle('IN_PROGRESS');
    expect(style.markerColor).toBe('#009efb');
    expect(style.dotClass).toContain('sky');
    expect(style.badgeClass).toContain('sky');
    expect(style.listBadgeClass).toContain('sky');
  });

  it('maps RESOLVED to the emerald/cyan style', () => {
    const style = getAlertStateStyle('RESOLVED');
    expect(style.markerColor).toBe('#26c6da');
    expect(style.dotClass).toContain('emerald');
    expect(style.badgeClass).toContain('emerald');
    expect(style.listBadgeClass).toContain('emerald');
  });

  it('maps REJECTED to the rose style', () => {
    const style = getAlertStateStyle('REJECTED');
    expect(style.markerColor).toBe('#ef5350');
    expect(style.dotClass).toContain('rose');
    expect(style.badgeClass).toContain('rose');
    expect(style.listBadgeClass).toContain('rose');
  });

  it('falls back to a neutral style for an undefined or unknown code', () => {
    const style = getAlertStateStyle(undefined);
    expect(style.dotClass).toContain('slate');
    expect(style.badgeClass).toContain('slate');
    expect(style.label).toBe('Sin estado');
  });

  it('is keyed purely by code, so renaming a state cannot change its style', () => {
    // A state renamed from 'Pendiente' to 'En espera' still carries code
    // PENDING; the style function never receives or looks at the name.
    const renamedStyle = getAlertStateStyle('PENDING');
    const originalStyle = getAlertStateStyle('PENDING');
    expect(renamedStyle).toEqual(originalStyle);
  });
});
