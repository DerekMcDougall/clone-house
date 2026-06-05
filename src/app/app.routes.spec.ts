import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';

// Mock components for testing
@Component({
  standalone: true,
  template: '<div>Landing Page</div>'
})
class MockLandingPageComponent {}

@Component({
  standalone: true,
  template: '<div>Gameplay</div>'
})
class MockGameplayComponent {}

describe('App Routes Configuration', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes)
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  describe('Route Configuration Structure', () => {
    it('should have landing page route configured at root path', () => {
      const rootRoute = routes.find(route => route.path === '');
      
      expect(rootRoute).toBeTruthy();
      expect(rootRoute?.path).toBe('');
    });

    it('should have gameplay route configured at /game path', () => {
      const gameRoute = routes.find(route => route.path === 'game');
      
      expect(gameRoute).toBeTruthy();
      expect(gameRoute?.path).toBe('game');
    });

    it('should have wildcard route that redirects to root', () => {
      const wildcardRoute = routes.find(route => route.path === '**');
      
      expect(wildcardRoute).toBeTruthy();
      expect(wildcardRoute?.redirectTo).toBe('');
    });
  });

  describe('Route Titles', () => {
    it('should set correct title for landing page route', () => {
      const rootRoute = routes.find(route => route.path === '');
      
      expect(rootRoute?.title).toBe('Game - Home');
    });

    it('should set correct title for gameplay route', () => {
      const gameRoute = routes.find(route => route.path === 'game');
      
      expect(gameRoute?.title).toBe('Game - Play');
    });
  });

  describe('Route Navigation', () => {
    it('should navigate to landing page at root path', async () => {
      await router.navigate(['']);
      
      expect(location.path()).toBe('');
    });

    it('should navigate to gameplay at /game path', async () => {
      await router.navigate(['/game']);
      
      expect(location.path()).toBe('/game');
    });

    it('should redirect undefined routes to root', async () => {
      await router.navigate(['/undefined-route']);
      
      expect(location.path()).toBe('');
    });

    it('should redirect deeply nested undefined routes to root', async () => {
      await router.navigate(['/some/deeply/nested/undefined/path']);
      
      expect(location.path()).toBe('');
    });
  });

  describe('Route Component Loading', () => {
    it('should have loadComponent function for landing page', () => {
      const rootRoute = routes.find(route => route.path === '');
      
      expect(rootRoute?.loadComponent).toBeDefined();
      expect(typeof rootRoute?.loadComponent).toBe('function');
    });

    it('should have loadComponent function for gameplay route', () => {
      const gameRoute = routes.find(route => route.path === 'game');
      
      expect(gameRoute?.loadComponent).toBeDefined();
      expect(typeof gameRoute?.loadComponent).toBe('function');
    });
  });
});
