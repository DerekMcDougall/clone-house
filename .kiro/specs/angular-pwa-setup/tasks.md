# Implementation Plan: Angular PWA Setup

## Overview

This implementation plan guides the setup of an Angular Progressive Web App from scratch using the latest stable version of Angular. The approach follows a sequential setup process: initialize the Angular project, add PWA capabilities, configure the service worker and manifest, set up icons and assets, implement PWA services, and configure build and testing infrastructure.

## Tasks

- [x] 1. Initialize Angular project with Angular 21
  - Install Angular CLI globally if not present: `npm install -g @angular/cli@latest`
  - Run `ng new angular-pwa-app --routing --style=scss --standalone` command
  - When prompted for package manager, select yarn (or run `ng config -g cli.packageManager yarn` first)
  - Verify package.json contains Angular 21
  - Verify tsconfig.json has strict mode enabled
  - Verify project structure includes src/, src/app/, src/assets/, src/environments/
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write configuration validation tests
  - Test that tsconfig.json has strict: true
  - Test that angular.json has correct project structure
  - Test that routing is configured
  - **Feature: angular-pwa-setup, Example 2: TypeScript Strict Mode Configuration**
  - **Feature: angular-pwa-setup, Example 3: Routing Configuration**

- [x] 2. Add PWA support using Angular CLI
  - Run `ng add @angular/pwa` command
  - Verify @angular/pwa and @angular/service-worker are in package.json
  - Verify ngsw-config.json is created at project root
  - Verify app.config.ts includes provideServiceWorker
  - Verify angular.json production config has serviceWorker: true and ngswConfigPath
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Write PWA configuration validation tests
  - Test that @angular/pwa is installed
  - Test that ngsw-config.json exists and has correct structure
  - Test that service worker is registered in app.config.ts
  - Test that production build config enables service worker
  - **Feature: angular-pwa-setup, Example 4: PWA Package Installation**
  - **Feature: angular-pwa-setup, Example 5: Service Worker Configuration File**
  - **Feature: angular-pwa-setup, Example 6: Service Worker Registration**
  - **Feature: angular-pwa-setup, Example 7: Production Build Service Worker Configuration**

- [x] 3. Configure service worker caching strategies
  - Edit ngsw-config.json to define app shell asset group (prefetch mode)
  - Configure app shell to cache index.html, CSS, and JS files
  - Add assets asset group (lazy mode) for images and other assets
  - Configure cache query options if needed
  - _Requirements: 4.1, 4.2, 4.3, 6.4_

- [x] 3.1 Write service worker configuration tests
  - Test that ngsw-config.json has app shell asset group with prefetch
  - Test that app shell caches index.html, CSS, and JS
  - Test that multiple asset groups are defined
  - **Feature: angular-pwa-setup, Example 12: Service Worker App Shell Caching**
  - **Feature: angular-pwa-setup, Example 13: Service Worker Asset Groups**

- [x] 4. Configure web app manifest
  - Edit manifest.webmanifest with application name and short_name
  - Set theme_color and background_color
  - Set display mode to "standalone"
  - Set start_url to "./"
  - Configure icons array with all required sizes
  - Verify index.html links to manifest in head section
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4.1 Write manifest configuration tests
  - Test that manifest has required fields (name, short_name, theme_color, background_color, display, start_url)
  - Test that display mode is "standalone"
  - Test that icons array includes 192x192 and 512x512 sizes
  - Test that index.html links to manifest
  - **Feature: angular-pwa-setup, Example 9: Manifest Required Fields**
  - **Feature: angular-pwa-setup, Example 10: Manifest Icon Sizes**
  - **Feature: angular-pwa-setup, Example 11: Manifest Link in HTML**

- [x] 5. Create and configure PWA icons
  - Create src/assets/icons/ directory
  - Generate or add icon files for all required sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
  - Ensure all icons are PNG format
  - Update manifest.webmanifest icons array with correct paths and sizes
  - Add favicon.ico to src/ directory
  - Verify angular.json assets array includes icons and favicon
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.1 Write icon configuration tests
  - Test that all required icon files exist in assets/icons/
  - Test that manifest icons array has correct paths and sizes
  - Test that favicon.ico exists
  - Test that angular.json assets configuration includes icons
  - **Feature: angular-pwa-setup, Example 22: Icon Files Existence**
  - **Feature: angular-pwa-setup, Example 23: Manifest Icon Configuration**
  - **Feature: angular-pwa-setup, Example 24: Favicon Configuration**
  - **Feature: angular-pwa-setup, Example 25: Asset Build Configuration**

- [x] 6. Configure environment files for service worker
  - Edit src/environments/environment.ts to set enableServiceWorker: false
  - Edit src/environments/environment.prod.ts to set enableServiceWorker: true
  - Update app.config.ts to conditionally register service worker based on environment
  - _Requirements: 2.5, 9.2_

- [x] 6.1 Write environment configuration tests
  - Test that environment.ts has enableServiceWorker: false
  - Test that environment.prod.ts has enableServiceWorker: true
  - **Feature: angular-pwa-setup, Example 8: Service Worker Environment Configuration**

- [x] 7. Implement PWA service for installation management
  - Create src/app/services/pwa.service.ts
  - Implement isInstalled() method to check if app is running as PWA
  - Implement promptInstall() method to trigger installation prompt
  - Capture beforeinstallprompt event and store for later use
  - Implement checkForUpdates() method using SwUpdate service
  - Implement onUpdateAvailable() observable for update notifications
  - Implement applyUpdate() method to activate updates
  - Handle appinstalled event to track installations
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.1 Write PWA service unit tests
  - Test that service captures beforeinstallprompt event
  - Test that promptInstall() calls prompt() on stored event
  - Test that isInstalled() correctly detects standalone mode
  - Test that checkForUpdates() calls SwUpdate.checkForUpdate()
  - Mock browser APIs and SwUpdate service
  - **Feature: angular-pwa-setup, Example 18: PWA Service Interface**

- [x] 8. Configure app shell architecture
  - Verify index.html has minimal structure (app-root, noscript, meta viewport)
  - Add critical CSS to index.html or styles.scss for above-the-fold content
  - Ensure app shell is included in service worker prefetch asset group
  - _Requirements: 6.1, 6.2_

- [x] 8.1 Write app shell validation tests
  - Test that index.html contains app-root element
  - Test that index.html contains noscript fallback
  - Test that index.html contains meta viewport tag
  - **Feature: angular-pwa-setup, Example 14: App Shell HTML Structure**

- [x] 9. Configure production build optimizations
  - Verify angular.json production config has optimization: true
  - Verify angular.json production config has aot: true
  - Verify angular.json production config has outputHashing: "all"
  - Verify angular.json production config has extractLicenses: true
  - Configure build budgets for bundle size warnings
  - Verify outputPath is set to dist/[app-name]
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [x] 9.1 Write build configuration tests
  - Test that production config has optimization: true
  - Test that production config has aot: true
  - Test that production config has serviceWorker: true
  - Test that outputPath starts with "dist/"
  - **Feature: angular-pwa-setup, Example 15: Production Build Optimization**
  - **Feature: angular-pwa-setup, Example 16: Production Build Service Worker Generation**
  - **Feature: angular-pwa-setup, Example 17: Build Output Configuration**

- [x] 10. Configure development server and testing
  - Verify angular.json has serve configuration
  - Add package.json scripts: "start": "ng serve", "build": "ng build", "test": "ng test"
  - Configure serve options to support HTTPS (ssl: true option available)
  - Verify test configuration exists in angular.json
  - Set up Karma configuration for unit tests
  - Install and configure Playwright for e2e tests
  - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [x] 10.1 Write development configuration tests
  - Test that angular.json has serve configuration
  - Test that package.json has start, build, and test scripts
  - Test that HTTPS can be configured for development
  - Test that test configuration exists
  - **Feature: angular-pwa-setup, Example 19: Development Server Configuration**
  - **Feature: angular-pwa-setup, Example 20: HTTPS Development Support**
  - **Feature: angular-pwa-setup, Example 21: Test Configuration**

- [x] 11. Create sample component demonstrating PWA features
  - Create a component that displays installation status
  - Add button to trigger installation prompt (using PWA service)
  - Display update notification when new version is available
  - Show online/offline status indicator
  - Wire component to PWA service methods
  - _Requirements: 8.2, 8.3, 8.4_

- [x] 11.1 Write component unit tests
  - Test that component displays installation status
  - Test that install button calls PWA service promptInstall()
  - Test that component responds to update notifications
  - Mock PWA service

- [x] 12. Checkpoint - Verify build and test
  - Run `yarn build --configuration=production` and verify success
  - Verify dist/ directory contains ngsw.json and ngsw-worker.js
  - Run `yarn test` and verify all tests pass
  - Serve production build locally and test service worker registration
  - Test that app meets PWA criteria using Lighthouse
  - Ensure all tests pass, ask the user if questions arise

- [x] 13. Create documentation
  - Create README.md with setup instructions
  - Document how to run development server
  - Document how to build for production
  - Document how to test PWA features locally
  - Document how to generate new icons
  - Document service worker caching strategies
  - Include troubleshooting section for common issues

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The setup follows Angular CLI conventions and best practices
- Service worker only works over HTTPS (except localhost)
- Use Chrome DevTools Application tab to debug service worker and manifest
- Run Lighthouse audits to verify PWA criteria are met
- Consider using tools like PWA Asset Generator for creating icons
