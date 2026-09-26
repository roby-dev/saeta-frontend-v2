import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../core/auth/auth.service.js';
import { AdminLayoutComponent } from './admin-layout.component.js';

@Component({ template: '' })
class StubPageComponent {}

describe('AdminLayoutComponent', () => {
  async function setup(initialUrl: string) {
    const mockAuth = {
      userRole: signal('ADMIN'),
      currentUser: signal(null),
      isAuthenticated: () => false,
      fetchProfile: () => of(null),
      logout: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: StubPageComponent },
          { path: 'alerts', component: StubPageComponent },
          { path: 'alerts/map', component: StubPageComponent },
        ]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    // Simulates a page reload: navigation completes before the layout subscribes to router events
    await TestBed.inject(Router).navigateByUrl(initialUrl);

    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should resolve the current url on reload instead of defaulting to dashboard', async () => {
    const component = await setup('/alerts/map?alertId=abc');

    expect(component.isActive('/alerts/map')).toBe(true);
    expect(component.isActive('/dashboard')).toBe(false);
    expect(component['currentSectionTitle']()).toBe('Mapa de Alertas');
  });

  it('should not mark the parent alerts item as active while on the map', async () => {
    const component = await setup('/alerts/map');

    expect(component.isActive('/alerts/map')).toBe(true);
    expect(component.isActive('/alerts')).toBe(false);
  });

  it('should mark only the alerts registry item on /alerts', async () => {
    const component = await setup('/alerts');

    expect(component.isActive('/alerts')).toBe(true);
    expect(component.isActive('/alerts/map')).toBe(false);
  });
});
