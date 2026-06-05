import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';

/**
 * Property-Based Tests for Route Configuration
 * 
 * These tests use fast-check to verify routing properties across
 * a wide range of generated inputs, ensuring the router behaves
 * correctly for all possible route paths.
 */
describe('App Routes - Property-Based Tests', () => {
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

  /**
   * Property 1: Wildcard Route Redirect
   * 
   * **Validates: Requirements 3.3**
   * 
   * For any undefined route path (not '' or 'game'), the router should
   * redirect to the landing page (root path).
   * 
   * This property test generates random invalid route paths and verifies
   * that all of them navigate to the landing page, ensuring the wildcard
   * redirect works correctly for all possible invalid routes.
   */
  describe('Property 1: Wildcard Route Redirect', () => {
    it('should redirect all undefined routes to landing page', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random route paths that are NOT valid routes
          fc.array(
            fc.oneof(
              // Random alphanumeric strings
              fc.stringMatching(/^[a-zA-Z0-9-_]+$/),
              // Random words
              fc.lorem({ maxCount: 3 }),
              // Random UUIDs
              fc.uuid(),
              // Random integers as strings
              fc.integer().map(n => n.toString()),
              // Random special characters
              fc.stringMatching(/^[!@#$%^&*()]+$/)
            ),
            { minLength: 1, maxLength: 5 }
          ).filter(segments => {
            // Filter out valid routes ('' and 'game')
            const path = segments.join('/');
            return path !== '' && path !== 'game' && !path.startsWith('game/');
          }),
          async (pathSegments) => {
            // Construct the invalid route path
            const invalidPath = '/' + pathSegments.join('/');
            
            // Navigate to the invalid route
            await router.navigate([invalidPath]);
            
            // Verify it redirects to the landing page (root path)
            expect(location.path()).toBe('');
          }
        ),
        {
          // Run at least 100 iterations as specified in the task
          numRuns: 100,
          // Add verbose output for debugging if needed
          verbose: false
        }
      );
    });

    it('should redirect deeply nested undefined routes to landing page', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate deeply nested paths (3-10 segments)
          fc.array(
            fc.stringMatching(/^[a-zA-Z0-9-_]+$/),
            { minLength: 3, maxLength: 10 }
          ).filter(segments => {
            // Ensure it's not a valid route
            const firstSegment = segments[0];
            return firstSegment !== '' && firstSegment !== 'game';
          }),
          async (pathSegments) => {
            // Construct deeply nested path
            const deepPath = '/' + pathSegments.join('/');
            
            // Navigate to the deeply nested invalid route
            await router.navigate([deepPath]);
            
            // Verify it redirects to the landing page
            expect(location.path()).toBe('');
          }
        ),
        {
          numRuns: 100,
          verbose: false
        }
      );
    });
  });
});
