/**
 * App Shell Validation Tests
 * Feature: angular-pwa-setup
 * 
 * These tests validate that the index.html contains the minimal required
 * structure for the app shell including app-root element, noscript fallback,
 * and meta viewport tag.
 */

import * as fs from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

let indexHtmlContent: string;

beforeAll(() => {
  const indexHtmlPath = path.resolve(__dirname, '../index.html');
  indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
});

describe('App Shell Validation Tests', () => {
  describe('Example 14: App Shell HTML Structure', () => {
    /**
     * **Validates: Requirements 6.1**
     * 
     * Verify that index.html contains minimal required structure:
     * - Contains <app-root> element
     * - Contains <noscript> fallback message
     * - Contains meta viewport tag
     */
    it('should contain app-root element', () => {
      expect(indexHtmlContent).toContain('<app-root>');
      expect(indexHtmlContent).toContain('</app-root>');
    });

    it('should contain app-root element in body section', () => {
      // Extract body section
      const bodyMatch = indexHtmlContent.match(/<body>([\s\S]*?)<\/body>/i);
      expect(bodyMatch).toBeTruthy();
      
      if (bodyMatch) {
        const bodyContent = bodyMatch[1];
        expect(bodyContent).toContain('<app-root>');
      }
    });

    it('should contain noscript fallback', () => {
      expect(indexHtmlContent).toContain('<noscript>');
      expect(indexHtmlContent).toContain('</noscript>');
    });

    it('should contain noscript with meaningful message', () => {
      const noscriptMatch = indexHtmlContent.match(/<noscript>([\s\S]*?)<\/noscript>/i);
      expect(noscriptMatch).toBeTruthy();
      
      if (noscriptMatch) {
        const noscriptContent = noscriptMatch[1].trim();
        expect(noscriptContent.length).toBeGreaterThan(0);
        // Should contain some indication about JavaScript requirement
        expect(noscriptContent.toLowerCase()).toMatch(/javascript|enable|continue|application/);
      }
    });

    it('should contain meta viewport tag', () => {
      expect(indexHtmlContent).toContain('name="viewport"');
    });

    it('should contain meta viewport tag in head section', () => {
      // Extract head section
      const headMatch = indexHtmlContent.match(/<head>([\s\S]*?)<\/head>/i);
      expect(headMatch).toBeTruthy();
      
      if (headMatch) {
        const headContent = headMatch[1];
        expect(headContent).toContain('name="viewport"');
      }
    });

    it('should have properly configured viewport meta tag', () => {
      // Check for viewport meta tag with width and initial-scale
      const viewportRegex = /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*"/i;
      expect(viewportRegex.test(indexHtmlContent)).toBe(true);
      
      // Should also include initial-scale
      const viewportWithScaleRegex = /<meta\s+name="viewport"\s+content="[^"]*initial-scale=1[^"]*"/i;
      expect(viewportWithScaleRegex.test(indexHtmlContent)).toBe(true);
    });

    it('should have minimal HTML structure with required elements', () => {
      // Verify all three critical elements are present
      const hasAppRoot = indexHtmlContent.includes('<app-root>');
      const hasNoscript = indexHtmlContent.includes('<noscript>');
      const hasViewport = indexHtmlContent.includes('name="viewport"');
      
      expect(hasAppRoot).toBe(true);
      expect(hasNoscript).toBe(true);
      expect(hasViewport).toBe(true);
    });
  });
});
