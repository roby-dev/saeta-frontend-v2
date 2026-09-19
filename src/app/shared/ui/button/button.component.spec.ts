import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ButtonComponent } from './button.component.js';

describe('ButtonComponent', () => {
  it('should render button with primary variant by default', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.className).toContain('bg-blue-600');
    expect(button.disabled).toBe(false);
  });

  it('should be disabled when loading or disabled input is true', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });
});
