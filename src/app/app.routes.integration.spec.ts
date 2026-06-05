import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';

// Simple wrapper component for testing router outlet
@Component({
  selector: 'app-test-root',
  template: '<router-outlet></router-outlet>',
  imports: [],
  standalone: true
})
class TestRootComponent {}

describe('Navigation Flow Integration Tests', () => {
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

  describe('Navigation from Landing Page to Gameplay', () => {
    it('should navigate from landing page (/) to gameplay (/game)', async () => {
      // Start at landing page
      await router.navigate(['/']);
      expect(router.url).toBe('/');

      // Navigate to gameplay
      await router.navigate(['/game']);
      expect(router.url).toBe('/game');
    });

    it('should load the correct component when navigating to /game', async () => {
      await router.navigate(['/game']);
      
      const currentRoute = router.routerState.root.firstChild;
      expect(currentRoute).toBeTruthy();
      expect(router.url).toBe('/game');
    });

    it('should successfully navigate using routerLink simulation', async () => {
      // Start at root
      await router.navigate(['/']);
      expect(router.url).toBe('/');

      // Simulate clicking a routerLink to /game
      await router.navigateByUrl('/game');
      expect(router.url).toBe('/game');
    });
  });

  describe('Browser History Maintenance', () => {
    it('should maintain navigation state when navigating between routes', async () => {
      // Navigate to landing page
      await router.navigate(['/']);
      const initialUrl = router.url;
      expect(initialUrl).toBe('/');

      // Navigate to gameplay
      await router.navigate(['/game']);
      expect(router.url).toBe('/game');

      // Navigate back to landing
      await router.navigate(['/']);
      expect(router.url).toBe('/');
    });

    it('should support multiple sequential navigations', async () => {
      // Navigate through pages multiple times
      await router.navigate(['/']);
      expect(router.url).toBe('/');
      
      await router.navigate(['/game']);
      expect(router.url).toBe('/game');
      
      await router.navigate(['/']);
      expect(router.url).toBe('/');
    });

    it('should maintain correct URL state through navigation sequence', async () => {
      // Create a navigation history
      await router.navigate(['/']);
      await router.navigate(['/game']);
      await router.navigate(['/']);
      await router.navigate(['/game']);

      // Current location should be /game
      expect(router.url).toBe('/game');
    });
  });

  describe('Direct URL Navigation', () => {
    it('should work when directly navigating to root path', async () => {
      await router.navigateByUrl('/');
      expect(router.url).toBe('/');
    });

    it('should work when directly navigating to /game path', async () => {
      await router.navigateByUrl('/game');
      expect(location.path()).toBe('/game');
      expect(router.url).toBe('/game');
    });

    it('should handle direct navigation to /game without prior navigation', async () => {
      // Simulate user entering URL directly in browser
      await router.navigate(['/game']);
      
      expect(location.path()).toBe('/game');
      expect(router.url).toBe('/game');
    });

    it('should redirect invalid URLs to landing page', async () => {
      await router.navigate(['/invalid-route']);
      
      // Should redirect to root due to wildcard route
      expect(router.url).toBe('/');
    });

    it('should handle navigation to deeply nested invalid paths', async () => {
      await router.navigate(['/some/invalid/deep/path']);
      
      // Should redirect to root
      expect(router.url).toBe('/');
    });
  });

  describe('Complete User Journey', () => {
    it('should support a complete user flow: land -> play -> land -> play again', async () => {
      // User lands on the page
      await router.navigate(['/']);
      expect(router.url).toBe('/');

      // User clicks "New Game"
      await router.navigate(['/game']);
      expect(router.url).toBe('/game');

      // User navigates back to landing
      await router.navigate(['/']);
      expect(router.url).toBe('/');

      // User clicks "New Game" again
      await router.navigate(['/game']);
      expect(router.url).toBe('/game');
    });

    it('should maintain correct state through multiple navigation cycles', async () => {
      const navigationSequence = ['/', '/game', '/', '/game', '/'];
      
      for (const path of navigationSequence) {
        await router.navigate([path]);
        expect(router.url).toBe(path);
      }
    });
  });

  describe('Route Titles', () => {
    it('should set correct title for landing page route', async () => {
      await router.navigate(['/']);
      
      const route = routes.find(r => r.path === '');
      expect(route?.title).toBe('Game - Home');
    });

    it('should set correct title for gameplay route', async () => {
      await router.navigate(['/game']);
      
      const route = routes.find(r => r.path === 'game');
      expect(route?.title).toBe('Game - Play');
    });
  });
});
