/**
 * Service Worker Configuration Tests
 * Feature: angular-pwa-setup
 * 
 * These tests validate that the service worker is correctly configured
 * with proper caching strategies for the app shell and assets.
 */

import { describe, expect, it } from 'vitest';

describe('Service Worker Configuration Tests', () => {
  describe('Example 12: Service Worker App Shell Caching', () => {
    /**
     * **Validates: Requirements 4.1, 6.4**
     * 
     * Verify that ngsw-config.json caches app shell:
     * - assetGroups contains a group with installMode "prefetch"
     * - This group's resources.files includes "/index.html"
     * - This group's resources.files includes patterns for CSS and JS files
     */
    it('should have app shell asset group with prefetch mode', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const appShellGroup = ngswConfig.assetGroups.find(
        (group: any) => group.installMode === 'prefetch'
      );
      
      expect(appShellGroup).toBeDefined();
      expect(appShellGroup?.name).toBeDefined();
    });

    it('should cache index.html in app shell', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const appShellGroup = ngswConfig.assetGroups.find(
        (group: any) => group.installMode === 'prefetch'
      );
      
      expect(appShellGroup).toBeDefined();
      
      if (!appShellGroup) return;
      
      expect(appShellGroup.resources).toBeDefined();
      expect(appShellGroup.resources.files).toBeDefined();
      expect(Array.isArray(appShellGroup.resources.files)).toBe(true);
      
      // Check that index.html is cached
      const hasIndexHtml = appShellGroup.resources.files.some(
        (file: string) => file.includes('index.html')
      );
      expect(hasIndexHtml).toBe(true);
    });

    it('should cache CSS files in app shell', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const appShellGroup = ngswConfig.assetGroups.find(
        (group: any) => group.installMode === 'prefetch'
      );
      
      expect(appShellGroup).toBeDefined();
      
      if (!appShellGroup) return;
      
      expect(appShellGroup.resources.files).toBeDefined();
      
      // Check that CSS pattern is included
      const hasCssPattern = appShellGroup.resources.files.some(
        (file: string) => file.includes('.css') || file.includes('*.css')
      );
      expect(hasCssPattern).toBe(true);
    });

    it('should cache JavaScript files in app shell', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const appShellGroup = ngswConfig.assetGroups.find(
        (group: any) => group.installMode === 'prefetch'
      );
      
      expect(appShellGroup).toBeDefined();
      
      if (!appShellGroup) return;
      
      expect(appShellGroup.resources.files).toBeDefined();
      
      // Check that JS pattern is included
      const hasJsPattern = appShellGroup.resources.files.some(
        (file: string) => file.includes('.js') || file.includes('*.js')
      );
      expect(hasJsPattern).toBe(true);
    });
  });

  describe('Example 13: Service Worker Asset Groups', () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * Verify that ngsw-config.json defines multiple cache groups:
     * - assetGroups array has at least 2 entries
     * - One group for app shell (prefetch)
     * - One group for assets (lazy)
     */
    it('should have multiple asset groups defined', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      expect(ngswConfig.assetGroups).toBeDefined();
      expect(Array.isArray(ngswConfig.assetGroups)).toBe(true);
      expect(ngswConfig.assetGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('should have app shell group with prefetch install mode', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const prefetchGroup = ngswConfig.assetGroups.find(
        (group: any) => group.installMode === 'prefetch'
      );
      
      expect(prefetchGroup).toBeDefined();
      expect(prefetchGroup?.name).toBeDefined();
      expect(prefetchGroup?.resources).toBeDefined();
    });

    it('should have assets group with lazy install mode', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const lazyGroup = ngswConfig.assetGroups.find(
        (group: any) => group.installMode === 'lazy'
      );
      
      expect(lazyGroup).toBeDefined();
      expect(lazyGroup?.name).toBeDefined();
      expect(lazyGroup?.resources).toBeDefined();
    });

    it('should have distinct groups for app shell and assets', async () => {
      const ngswConfig = await import('../../ngsw-config.json');
      
      const prefetchGroups = ngswConfig.assetGroups.filter(
        (group: any) => group.installMode === 'prefetch'
      );
      const lazyGroups = ngswConfig.assetGroups.filter(
        (group: any) => group.installMode === 'lazy'
      );
      
      expect(prefetchGroups.length).toBeGreaterThanOrEqual(1);
      expect(lazyGroups.length).toBeGreaterThanOrEqual(1);
    });
  });
});
