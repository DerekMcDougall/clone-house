/**
 * Environment Configuration Tests
 * Feature: angular-pwa-setup
 * 
 * These tests validate that environment files are correctly configured
 * to control service worker registration based on the build environment.
 */

import { describe, expect, it } from 'vitest';
import { environment as devEnvironment } from '../environments/environment';
import { environment as prodEnvironment } from '../environments/environment.prod';

describe('Environment Configuration Tests', () => {
  describe('Example 8: Service Worker Environment Configuration', () => {
    /**
     * **Validates: Requirements 2.5, 9.2**
     * 
     * Verify that service worker is disabled in development:
     * - environment.ts has enableServiceWorker: false
     * - environment.prod.ts has enableServiceWorker: true
     */
    it('should have enableServiceWorker set to false in development environment', () => {
      expect(devEnvironment).toBeDefined();
      expect(devEnvironment.enableServiceWorker).toBeDefined();
      expect(devEnvironment.enableServiceWorker).toBe(false);
    });

    it('should have production set to false in development environment', () => {
      expect(devEnvironment).toBeDefined();
      expect(devEnvironment.production).toBeDefined();
      expect(devEnvironment.production).toBe(false);
    });

    it('should have enableServiceWorker set to true in production environment', () => {
      expect(prodEnvironment).toBeDefined();
      expect(prodEnvironment.enableServiceWorker).toBeDefined();
      expect(prodEnvironment.enableServiceWorker).toBe(true);
    });

    it('should have production set to true in production environment', () => {
      expect(prodEnvironment).toBeDefined();
      expect(prodEnvironment.production).toBeDefined();
      expect(prodEnvironment.production).toBe(true);
    });

    it('should have different enableServiceWorker values between environments', () => {
      expect(devEnvironment.enableServiceWorker).not.toBe(prodEnvironment.enableServiceWorker);
      expect(devEnvironment.enableServiceWorker).toBe(false);
      expect(prodEnvironment.enableServiceWorker).toBe(true);
    });

    it('should have matching production and enableServiceWorker flags', () => {
      // In development: production=false, enableServiceWorker=false
      expect(devEnvironment.production).toBe(devEnvironment.enableServiceWorker);
      
      // In production: production=true, enableServiceWorker=true
      expect(prodEnvironment.production).toBe(prodEnvironment.enableServiceWorker);
    });
  });
});
