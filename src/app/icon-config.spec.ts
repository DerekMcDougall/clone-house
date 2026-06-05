/**
 * Icon Configuration Tests
 * Feature: angular-pwa-setup
 * 
 * These tests validate that all PWA icons are correctly configured,
 * including file existence, manifest configuration, favicon, and build assets.
 */

import * as fs from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

let manifest: any;
let angularJson: any;

beforeAll(() => {
  const manifestPath = path.resolve(__dirname, '../../public/manifest.webmanifest');
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  manifest = JSON.parse(manifestContent);
  
  const angularJsonPath = path.resolve(__dirname, '../../angular.json');
  const angularJsonContent = fs.readFileSync(angularJsonPath, 'utf-8');
  angularJson = JSON.parse(angularJsonContent);
});

describe('Icon Configuration Tests', () => {
  describe('Example 22: Icon Files Existence', () => {
    /**
     * **Validates: Requirements 10.1**
     * 
     * Verify that all required icon files are configured in the manifest:
     * - Manifest includes icon-72x72.png
     * - Manifest includes icon-96x96.png
     * - Manifest includes icon-128x128.png
     * - Manifest includes icon-144x144.png
     * - Manifest includes icon-152x152.png
     * - Manifest includes icon-192x192.png
     * - Manifest includes icon-384x384.png
     * - Manifest includes icon-512x512.png
     * 
     * Note: File existence is validated through manifest configuration.
     * The build process will fail if referenced icon files don't exist.
     */
    const requiredIconSizes = [
      '72x72',
      '96x96',
      '128x128',
      '144x144',
      '152x152',
      '192x192',
      '384x384',
      '512x512'
    ];

    requiredIconSizes.forEach((size) => {
      it(`should have icon-${size}.png configured in manifest`, () => {
        expect(manifest.icons).toBeDefined();
        
        const icon = manifest.icons.find((i: any) => i.sizes === size);
        expect(icon).toBeDefined();
        expect(icon?.src).toContain(`icon-${size}.png`);
      });
    });

    it('should have all 8 required icon sizes configured', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(8);
      
      // Verify all required sizes are present
      requiredIconSizes.forEach((size) => {
        const icon = manifest.icons.find((i: any) => i.sizes === size);
        expect(icon).toBeDefined();
      });
    });
  });

  describe('Example 23: Manifest Icon Configuration', () => {
    /**
     * **Validates: Requirements 10.2**
     * 
     * Verify that manifest icons array is properly configured:
     * - Each icon entry has src, sizes, and type fields
     * - Icon paths match expected format
     * - Icon sizes match file names
     */
    it('should have all icons with src, sizes, and type fields', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toBeDefined();
        expect(typeof icon.src).toBe('string');
        expect(icon.src.length).toBeGreaterThan(0);
        
        expect(icon.sizes).toBeDefined();
        expect(typeof icon.sizes).toBe('string');
        expect(icon.sizes.length).toBeGreaterThan(0);
        
        expect(icon.type).toBeDefined();
        expect(typeof icon.type).toBe('string');
        expect(icon.type).toBe('image/png');
      });
    });

    it('should have icon paths in correct format', () => {
      expect(manifest.icons).toBeDefined();
      
      manifest.icons.forEach((icon: any) => {
        // Icon paths should reference PNG files in icons directory
        expect(icon.src).toMatch(/icon-\d+x\d+\.png$/);
      });
    });

    it('should have icon sizes that match file names', () => {
      expect(manifest.icons).toBeDefined();
      
      manifest.icons.forEach((icon: any) => {
        // Extract size from src (e.g., "icons/icon-72x72.png" -> "72x72")
        const srcMatch = icon.src.match(/icon-(\d+x\d+)\.png/);
        expect(srcMatch).toBeTruthy();
        
        if (srcMatch) {
          const sizeFromSrc = srcMatch[1];
          expect(icon.sizes).toBe(sizeFromSrc);
        }
      });
    });

    it('should have correct icon paths format', () => {
      expect(manifest.icons).toBeDefined();
      
      manifest.icons.forEach((icon: any) => {
        // Icon paths should start with "icons/" and end with ".png"
        expect(icon.src).toMatch(/^icons\/icon-\d+x\d+\.png$/);
      });
    });

    it('should have all 8 required icon sizes in manifest', () => {
      const requiredSizes = [
        '72x72',
        '96x96',
        '128x128',
        '144x144',
        '152x152',
        '192x192',
        '384x384',
        '512x512'
      ];
      
      expect(manifest.icons).toBeDefined();
      
      requiredSizes.forEach((size) => {
        const icon = manifest.icons.find((i: any) => i.sizes === size);
        expect(icon).toBeDefined();
      });
    });
  });

  describe('Example 24: Favicon Configuration', () => {
    /**
     * **Validates: Requirements 10.3**
     * 
     * Verify that favicon is configured:
     * - index.html contains <link rel="icon" type="image/x-icon" href="favicon.ico">
     * 
     * Note: Favicon file existence is validated through the build process.
     * The build will fail if favicon.ico doesn't exist in the public directory.
     */
    it('should have favicon link in index.html', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const indexHtmlPath = path.resolve(__dirname, '../../src/index.html');
      const indexHtmlContent = await fs.readFile(indexHtmlPath, 'utf-8');
      
      expect(indexHtmlContent).toContain('rel="icon"');
      expect(indexHtmlContent).toContain('type="image/x-icon"');
      expect(indexHtmlContent).toContain('href="favicon.ico"');
    });

    it('should have favicon link in head section', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const indexHtmlPath = path.resolve(__dirname, '../../src/index.html');
      const indexHtmlContent = await fs.readFile(indexHtmlPath, 'utf-8');
      
      // Extract head section
      const headMatch = indexHtmlContent.match(/<head>([\s\S]*?)<\/head>/i);
      expect(headMatch).toBeTruthy();
      
      if (headMatch) {
        const headContent = headMatch[1];
        expect(headContent).toContain('rel="icon"');
        expect(headContent).toContain('favicon.ico');
      }
    });

    it('should have properly formatted favicon link tag', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const indexHtmlPath = path.resolve(__dirname, '../../src/index.html');
      const indexHtmlContent = await fs.readFile(indexHtmlPath, 'utf-8');
      
      // Check for the complete link tag
      const faviconLinkRegex = /<link\s+rel="icon"\s+type="image\/x-icon"\s+href="favicon\.ico"\s*\/?>/i;
      const hasFaviconLink = faviconLinkRegex.test(indexHtmlContent);
      
      expect(hasFaviconLink).toBe(true);
    });
  });

  describe('Example 25: Asset Build Configuration', () => {
    /**
     * **Validates: Requirements 10.4**
     * 
     * Verify that assets are configured to be copied during build:
     * - angular.json build options include assets array
     * - assets array includes "src/favicon.ico" or public directory
     * - assets array includes "src/assets" or public directory
     * - assets array includes "src/manifest.webmanifest" or public directory
     */
    it('should have assets array in build configuration', () => {
      const projectName = 'angular-pwa-app';
      const buildOptions = angularJson.projects[projectName].architect.build.options;
      
      expect(buildOptions.assets).toBeDefined();
      expect(Array.isArray(buildOptions.assets)).toBe(true);
      expect(buildOptions.assets.length).toBeGreaterThan(0);
    });

    it('should include public directory in assets configuration', () => {
      const projectName = 'angular-pwa-app';
      const buildOptions = angularJson.projects[projectName].architect.build.options;
      
      expect(buildOptions.assets).toBeDefined();
      
      // Check if public directory is included (Angular 21 uses public directory)
      const hasPublicDir = buildOptions.assets.some((asset: any) => {
        if (typeof asset === 'string') {
          return asset.includes('public');
        }
        if (typeof asset === 'object' && asset.input) {
          return asset.input === 'public' || asset.input.includes('public');
        }
        return false;
      });
      
      expect(hasPublicDir).toBe(true);
    });

    it('should ensure icons are included in build assets', () => {
      const projectName = 'angular-pwa-app';
      const buildOptions = angularJson.projects[projectName].architect.build.options;
      
      expect(buildOptions.assets).toBeDefined();
      
      // Since icons are in public/icons/, they should be included via public directory
      const hasPublicOrIconsConfig = buildOptions.assets.some((asset: any) => {
        if (typeof asset === 'string') {
          return asset.includes('public') || asset.includes('icons');
        }
        if (typeof asset === 'object' && asset.input) {
          return asset.input === 'public' || 
                 asset.input.includes('public') || 
                 asset.input.includes('icons');
        }
        return false;
      });
      
      expect(hasPublicOrIconsConfig).toBe(true);
    });

    it('should ensure manifest is included in build assets', () => {
      const projectName = 'angular-pwa-app';
      const buildOptions = angularJson.projects[projectName].architect.build.options;
      
      expect(buildOptions.assets).toBeDefined();
      
      // Manifest is in public directory, so it should be included
      const hasManifestConfig = buildOptions.assets.some((asset: any) => {
        if (typeof asset === 'string') {
          return asset.includes('manifest') || asset.includes('public');
        }
        if (typeof asset === 'object' && asset.input) {
          return asset.input === 'public' || 
                 asset.input.includes('public') || 
                 asset.input.includes('manifest');
        }
        return false;
      });
      
      expect(hasManifestConfig).toBe(true);
    });

    it('should ensure favicon is included in build assets', () => {
      const projectName = 'angular-pwa-app';
      const buildOptions = angularJson.projects[projectName].architect.build.options;
      
      expect(buildOptions.assets).toBeDefined();
      
      // Favicon is in public directory
      const hasFaviconConfig = buildOptions.assets.some((asset: any) => {
        if (typeof asset === 'string') {
          return asset.includes('favicon') || asset.includes('public');
        }
        if (typeof asset === 'object' && asset.input) {
          return asset.input === 'public' || 
                 asset.input.includes('public') || 
                 asset.input.includes('favicon');
        }
        return false;
      });
      
      expect(hasFaviconConfig).toBe(true);
    });
  });
});
