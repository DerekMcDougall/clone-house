import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaService } from './pwa.service';

/**
 * Feature: angular-pwa-setup, Example 18: PWA Service Interface
 * 
 * These tests verify that the PWA service provides installation management
 * and update handling capabilities as specified in Requirements 8.1-8.5.
 */
describe('PwaService', () => {
  let service: PwaService;
  let swUpdateMock: any;
  let versionUpdatesSubject: Subject<VersionReadyEvent>;
  let beforeInstallPromptEvent: any;

  beforeEach(() => {
    // Create a subject for version updates
    versionUpdatesSubject = new Subject<VersionReadyEvent>();

    // Create SwUpdate mock
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable(),
      checkForUpdate: vi.fn().mockResolvedValue(true),
      activateUpdate: vi.fn().mockResolvedValue(true)
    };

    service = new PwaService(swUpdateMock as SwUpdate);
  });

  afterEach(() => {
    // Clean up any event listeners
    versionUpdatesSubject.complete();
  });

  describe('isInstalled', () => {
    it('should return true when running in standalone mode', () => {
      // Mock matchMedia to return standalone mode
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true
      } as MediaQueryList);

      expect(service.isInstalled()).toBe(true);
    });

    it('should return false when not running in standalone mode', () => {
      // Mock matchMedia to return non-standalone mode
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false
      } as MediaQueryList);

      // Ensure navigator.standalone is not set
      (window.navigator as any).standalone = undefined;

      expect(service.isInstalled()).toBe(false);
    });

    it('should return true when navigator.standalone is true (iOS)', () => {
      // Mock matchMedia to return non-standalone mode
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false
      } as MediaQueryList);

      // Set iOS standalone mode
      (window.navigator as any).standalone = true;

      expect(service.isInstalled()).toBe(true);
    });
  });

  describe('beforeinstallprompt event capture', () => {
    it('should capture beforeinstallprompt event', async () => {
      // Create a mock beforeinstallprompt event
      const mockEvent = new Event('beforeinstallprompt');
      (mockEvent as any).prompt = vi.fn();
      (mockEvent as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      
      const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

      // Dispatch the event
      window.dispatchEvent(mockEvent);

      // Give the event listener time to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('promptInstall', () => {
    beforeEach(() => {
      // Create a mock beforeinstallprompt event
      beforeInstallPromptEvent = new Event('beforeinstallprompt');
      beforeInstallPromptEvent.prompt = vi.fn().mockResolvedValue(undefined);
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
      
      // Dispatch the event to capture it
      window.dispatchEvent(beforeInstallPromptEvent);
    });

    it('should call prompt() on the stored beforeinstallprompt event', async () => {
      await service.promptInstall();

      expect(beforeInstallPromptEvent.prompt).toHaveBeenCalled();
    });

    it('should return true when user accepts the install prompt', async () => {
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

      const result = await service.promptInstall();

      expect(result).toBe(true);
    });

    it('should return false when user dismisses the install prompt', async () => {
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'dismissed' });

      const result = await service.promptInstall();

      expect(result).toBe(false);
    });

    it('should return false when no install prompt is available', async () => {
      // Create a new service instance without triggering beforeinstallprompt
      const newService = new PwaService(swUpdateMock as SwUpdate);

      const result = await newService.promptInstall();

      expect(result).toBe(false);
    });

    it('should clear the deferred prompt after use', async () => {
      await service.promptInstall();

      // Try to prompt again - should return false as prompt is cleared
      const result = await service.promptInstall();

      expect(result).toBe(false);
    });
  });

  describe('checkForUpdates', () => {
    it('should call SwUpdate.checkForUpdate()', async () => {
      await service.checkForUpdates();

      expect(swUpdateMock.checkForUpdate).toHaveBeenCalled();
    });

    it('should return true when update is available', async () => {
      (swUpdateMock.checkForUpdate as any).mockResolvedValue(true);

      const result = await service.checkForUpdates();

      expect(result).toBe(true);
    });

    it('should return false when no update is available', async () => {
      (swUpdateMock.checkForUpdate as any).mockResolvedValue(false);

      const result = await service.checkForUpdates();

      expect(result).toBe(false);
    });

    it('should return false when service worker is not enabled', async () => {
      swUpdateMock.isEnabled = false;

      const result = await service.checkForUpdates();

      expect(result).toBe(false);
      expect(swUpdateMock.checkForUpdate).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (swUpdateMock.checkForUpdate as any).mockRejectedValue(new Error('Update check failed'));

      const result = await service.checkForUpdates();

      expect(result).toBe(false);
    });
  });

  describe('onUpdateAvailable', () => {
    it('should emit when a new version is available', async () => {
      const promise = new Promise<void>((resolve) => {
        const subscription = service.onUpdateAvailable().subscribe(() => {
          expect(true).toBe(true);
          subscription.unsubscribe();
          resolve();
        });

        // Emit a VERSION_READY event
        versionUpdatesSubject.next({
          type: 'VERSION_READY',
          currentVersion: { hash: 'old' },
          latestVersion: { hash: 'new' }
        } as VersionReadyEvent);
      });

      await promise;
    });

    it('should not emit for non-VERSION_READY events', async () => {
      let emitted = false;

      const subscription = service.onUpdateAvailable().subscribe(() => {
        emitted = true;
      });

      // Emit a different event type
      versionUpdatesSubject.next({
        type: 'VERSION_DETECTED',
        version: { hash: 'new' }
      } as any);

      // Wait a bit to ensure no emission
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(emitted).toBe(false);
      subscription.unsubscribe();
    });
  });

  describe('applyUpdate', () => {
    it('should call SwUpdate.activateUpdate()', async () => {
      (swUpdateMock.activateUpdate as any).mockResolvedValue(true);
      const reloadMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: reloadMock });

      await service.applyUpdate();

      expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('should reload the page after activating update', async () => {
      (swUpdateMock.activateUpdate as any).mockResolvedValue(true);
      const reloadMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: reloadMock });

      await service.applyUpdate();

      expect(reloadMock).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('should not activate update when service worker is not enabled', async () => {
      swUpdateMock.isEnabled = false;

      await service.applyUpdate();

      expect(swUpdateMock.activateUpdate).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (swUpdateMock.activateUpdate as any).mockRejectedValue(new Error('Activation failed'));
      const reloadMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: reloadMock });

      await service.applyUpdate();

      // Should not reload on error
      expect(reloadMock).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe('appinstalled event tracking', () => {
    it('should handle appinstalled event', async () => {
      // Trigger beforeinstallprompt first
      const mockEvent = new Event('beforeinstallprompt');
      (mockEvent as any).prompt = vi.fn();
      window.dispatchEvent(mockEvent);

      // Then trigger appinstalled
      const installedEvent = new Event('appinstalled');
      window.dispatchEvent(installedEvent);

      // Give the event listener time to process
      await new Promise(resolve => setTimeout(resolve, 10));

      // After installation, prompt should not be available
      const result = await service.promptInstall();
      expect(result).toBe(false);
    });
  });
});
