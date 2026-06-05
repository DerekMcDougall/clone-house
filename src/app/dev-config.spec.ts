/**
 * Development Configuration Tests
 * Feature: angular-pwa-setup
 * 
 * These tests validate that the development server and testing configurations
 * are properly set up with serve configuration, npm scripts, HTTPS support,
 * and test framework configuration.
 */

import * as fs from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

let angularJson: any;
let packageJson: any;

beforeAll(() => {
  const angularJsonPath = path.resolve(__dirname, '../../angular.json');
  const angularJsonContent = fs.readFileSync(angularJsonPath, 'utf-8');
  angularJson = JSON.parse(angularJsonContent);

  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
  packageJson = JSON.parse(packageJsonContent);
});

describe('Development Configuration Tests', () => {
  describe('Example 19: Development Server Configuration', () => {
    /**
     * **Validates: Requirements 9.1**
     * 
     * Verify that development server is configured:
     * - angular.json has serve configuration
     * - package.json has "start" script that runs ng serve
     */
    it('should have serve configuration in angular.json', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      expect(serveConfig).toBeDefined();
      expect(serveConfig.builder).toBeDefined();
      expect(serveConfig.builder).toContain('dev-server');
    });

    it('should have development configuration for serve', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      expect(serveConfig.configurations).toBeDefined();
      expect(serveConfig.configurations.development).toBeDefined();
      expect(serveConfig.configurations.development.buildTarget).toBeDefined();
    });

    it('should have production configuration for serve', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      expect(serveConfig.configurations).toBeDefined();
      expect(serveConfig.configurations.production).toBeDefined();
      expect(serveConfig.configurations.production.buildTarget).toBeDefined();
    });

    it('should have default configuration set for serve', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      expect(serveConfig.defaultConfiguration).toBeDefined();
      expect(serveConfig.defaultConfiguration).toBe('development');
    });

    it('should have start script in package.json', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts.start).toContain('ng serve');
    });

    it('should have build script in package.json', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.build).toContain('ng build');
    });

    it('should have test script in package.json', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.test).toContain('vitest');
    });
  });

  describe('Example 20: HTTPS Development Support', () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * Verify that HTTPS can be enabled for development:
     * - angular.json serve options support ssl configuration
     */
    it('should support ssl configuration in serve builder', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      // The @angular/build:dev-server builder supports ssl configuration
      // We verify that the builder is the correct one that supports ssl
      expect(serveConfig.builder).toBe('@angular/build:dev-server');
    });

    it('should allow ssl options to be added to serve configurations', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      // Verify that configurations object exists where ssl can be added
      expect(serveConfig.configurations).toBeDefined();
      expect(typeof serveConfig.configurations).toBe('object');
      
      // The dev-server builder accepts ssl, sslKey, and sslCert options
      // We verify the structure allows these options to be added
      expect(serveConfig.configurations.development).toBeDefined();
    });

    it('should have serve builder that supports HTTPS options', () => {
      const serveConfig = angularJson.projects['angular-pwa-app'].architect.serve;
      
      // The @angular/build:dev-server supports:
      // - ssl: boolean
      // - sslKey: string (path to key file)
      // - sslCert: string (path to cert file)
      expect(serveConfig.builder).toContain('dev-server');
    });
  });

  describe('Example 21: Test Configuration', () => {
    /**
     * **Validates: Requirements 9.5**
     * 
     * Verify that testing is configured:
     * - angular.json has test configuration
     * - package.json has "test" script
     * - test config file exists (vitest.config.ts or karma.conf.js)
     */
    it('should have test configuration in angular.json', () => {
      const testConfig = angularJson.projects['angular-pwa-app'].architect.test;
      
      expect(testConfig).toBeDefined();
      expect(testConfig.builder).toBeDefined();
    });

    it('should have test builder configured', () => {
      const testConfig = angularJson.projects['angular-pwa-app'].architect.test;
      
      // Angular 21+ uses @angular/build:unit-test or similar
      expect(testConfig.builder).toContain('test');
    });

    it('should have test script in package.json', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(typeof packageJson.scripts.test).toBe('string');
    });

    it('should have test configuration file', () => {
      // Check for vitest.config.ts
      const vitestConfigPath = path.resolve(__dirname, '../../vitest.config.ts');
      const vitestConfigExists = fs.existsSync(vitestConfigPath);
      
      // Check for karma.conf.js as alternative
      const karmaConfigPath = path.resolve(__dirname, '../../karma.conf.js');
      const karmaConfigExists = fs.existsSync(karmaConfigPath);
      
      // At least one test config should exist
      expect(vitestConfigExists || karmaConfigExists).toBe(true);
    });

    it('should have test configuration with proper settings', () => {
      const vitestConfigPath = path.resolve(__dirname, '../../vitest.config.ts');
      
      if (fs.existsSync(vitestConfigPath)) {
        const vitestConfigContent = fs.readFileSync(vitestConfigPath, 'utf-8');
        
        // Verify vitest config has basic structure
        expect(vitestConfigContent).toContain('defineConfig');
        expect(vitestConfigContent).toContain('test');
      }
    });

    it('should have TypeScript test configuration', () => {
      const tsconfigSpecPath = path.resolve(__dirname, '../../tsconfig.spec.json');
      const tsconfigSpecExists = fs.existsSync(tsconfigSpecPath);
      
      expect(tsconfigSpecExists).toBe(true);
    });

    it('should have test files pattern configured', () => {
      const vitestConfigPath = path.resolve(__dirname, '../../vitest.config.ts');
      
      if (fs.existsSync(vitestConfigPath)) {
        const vitestConfigContent = fs.readFileSync(vitestConfigPath, 'utf-8');
        
        // Verify test file pattern is configured
        expect(vitestConfigContent).toContain('include');
        expect(vitestConfigContent).toContain('.spec.ts');
      }
    });
  });
});
