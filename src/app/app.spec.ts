/**
 * App Component Tests
 * Feature: game-routes-landing-gameplay
 * 
 * These tests validate that the App component is properly configured
 * with RouterOutlet for routing functionality.
 */

import * as fs from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from './app';

describe('App Component', () => {
  let appHtmlContent: string;

  beforeAll(() => {
    const appHtmlPath = path.resolve(__dirname, './app.html');
    appHtmlContent = fs.readFileSync(appHtmlPath, 'utf-8');
  });

  /**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Verify that the App component is properly configured with RouterOutlet
   */
  it('should import RouterOutlet in component', () => {
    // Read the component source file to verify RouterOutlet is imported
    const appTsPath = path.resolve(__dirname, './app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');
    
    // Check that RouterOutlet is imported from @angular/router
    expect(appTsContent).toContain('import');
    expect(appTsContent).toContain('RouterOutlet');
    expect(appTsContent).toContain('@angular/router');
    
    // Check that RouterOutlet is in the imports array
    expect(appTsContent).toContain('imports:');
    expect(appTsContent).toMatch(/imports:\s*\[.*RouterOutlet.*\]/s);
  });

  it('should have router-outlet element in template', () => {
    expect(appHtmlContent).toContain('<router-outlet');
  });

  it('should have properly closed router-outlet tag', () => {
    // Check for either self-closing or separate closing tag
    const hasSelfClosing = appHtmlContent.includes('<router-outlet />') || 
                          appHtmlContent.includes('<router-outlet/>');
    const hasClosingTag = appHtmlContent.includes('</router-outlet>');
    
    expect(hasSelfClosing || hasClosingTag).toBe(true);
  });

  it('should have app component class defined', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('should have title property', () => {
    const component = new App();
    expect(component.title).toBeDefined();
  });
});
