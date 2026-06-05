/**
 * Manifest Configuration Tests
 * Feature: angular-pwa-setup
 * 
 * These tests validate that the web app manifest is correctly configured
 * with all required fields, proper display mode, icon sizes, and HTML linking.
 */

import * as fs from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

let manifest: any;

beforeAll(() => {
  const manifestPath = path.resolve(__dirname, '../../public/manifest.webmanifest');
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  manifest = JSON.parse(manifestContent);
});

describe('Manifest Configuration Tests', () => {
  describe('Example 9: Manifest Required Fields', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
     * 
     * Verify that manifest.webmanifest contains required fields:
     * - name field exists and is non-empty
     * - short_name field exists and is non-empty
     * - theme_color field exists
     * - background_color field exists
     * - display field equals "standalone"
     * - start_url field exists
     * - icons array exists and is non-empty
     */
    it('should have name field defined and non-empty', () => {
      expect(manifest.name).toBeDefined();
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
    });

    it('should have short_name field defined and non-empty', () => {
      expect(manifest.short_name).toBeDefined();
      expect(typeof manifest.short_name).toBe('string');
      expect(manifest.short_name.length).toBeGreaterThan(0);
    });

    it('should have theme_color field defined', () => {
      expect(manifest.theme_color).toBeDefined();
      expect(typeof manifest.theme_color).toBe('string');
    });

    it('should have background_color field defined', () => {
      expect(manifest.background_color).toBeDefined();
      expect(typeof manifest.background_color).toBe('string');
    });

    it('should have display field set to standalone', () => {
      expect(manifest.display).toBeDefined();
      expect(manifest.display).toBe('standalone');
    });

    it('should have start_url field defined', () => {
      expect(manifest.start_url).toBeDefined();
      expect(typeof manifest.start_url).toBe('string');
    });

    it('should have icons array defined and non-empty', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });
  });

  describe('Example 10: Manifest Icon Sizes', () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * Verify that manifest includes required icon sizes:
     * - icons array contains entry with sizes "192x192"
     * - icons array contains entry with sizes "512x512"
     */
    it('should have 192x192 icon defined', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      
      const icon192 = manifest.icons.find(
        (icon: any) => icon.sizes === '192x192'
      );
      
      expect(icon192).toBeDefined();
      expect(icon192?.src).toBeDefined();
      expect(icon192?.type).toBeDefined();
    });

    it('should have 512x512 icon defined', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      
      const icon512 = manifest.icons.find(
        (icon: any) => icon.sizes === '512x512'
      );
      
      expect(icon512).toBeDefined();
      expect(icon512?.src).toBeDefined();
      expect(icon512?.type).toBeDefined();
    });

    it('should have all icons with required properties', () => {
      expect(manifest.icons).toBeDefined();
      
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toBeDefined();
        expect(typeof icon.src).toBe('string');
        expect(icon.sizes).toBeDefined();
        expect(typeof icon.sizes).toBe('string');
        expect(icon.type).toBeDefined();
        expect(typeof icon.type).toBe('string');
      });
    });
  });

  describe('Example 11: Manifest Link in HTML', () => {
    /**
     * **Validates: Requirements 3.6**
     * 
     * Verify that index.html links to manifest:
     * - index.html contains <link rel="manifest" href="manifest.webmanifest">
     */
    it('should have manifest link in index.html', () => {
      const indexHtmlPath = path.resolve(__dirname, '../../src/index.html');
      const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
      
      expect(indexHtmlContent).toContain('rel="manifest"');
      expect(indexHtmlContent).toContain('href="manifest.webmanifest"');
    });

    it('should have manifest link in head section', () => {
      const indexHtmlPath = path.resolve(__dirname, '../../src/index.html');
      const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
      
      // Extract head section
      const headMatch = indexHtmlContent.match(/<head>([\s\S]*?)<\/head>/i);
      expect(headMatch).toBeTruthy();
      
      if (headMatch) {
        const headContent = headMatch[1];
        expect(headContent).toContain('rel="manifest"');
        expect(headContent).toContain('manifest.webmanifest');
      }
    });

    it('should have properly formatted manifest link tag', () => {
      const indexHtmlPath = path.resolve(__dirname, '../../src/index.html');
      const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
      
      // Check for the complete link tag
      const manifestLinkRegex = /<link\s+rel="manifest"\s+href="manifest\.webmanifest"\s*\/?>/i;
      const hasManifestLink = manifestLinkRegex.test(indexHtmlContent);
      
      expect(hasManifestLink).toBe(true);
    });
  });
});
