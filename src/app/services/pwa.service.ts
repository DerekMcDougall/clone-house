import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Observable, Subject, filter, map } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private updateAvailableSubject = new Subject<void>();

  constructor(private swUpdate: SwUpdate) {
    this.captureInstallPrompt();
    this.listenForUpdates();
    this.trackInstallation();
  }

  /**
   * Check if the app is running as an installed PWA
   */
  isInstalled(): boolean {
    // Check if running in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Prompt the user to install the PWA
   * Returns true if the user accepted, false if dismissed
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for the user's response
      const choiceResult = await this.deferredPrompt.userChoice;
      
      // Clear the deferred prompt as it can only be used once
      this.deferredPrompt = null;
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Observable that emits when a new version is available
   */
  onUpdateAvailable(): Observable<void> {
    return this.updateAvailableSubject.asObservable();
  }

  /**
   * Apply pending service worker updates
   */
  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      // Reload the page to apply the update
      window.location.reload();
    } catch (error) {
      console.error('Error applying update:', error);
    }
  }

  /**
   * Capture the beforeinstallprompt event for later use
   */
  private captureInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      // Prevent the default browser install prompt
      event.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      
      console.log('Install prompt captured');
    });
  }

  /**
   * Listen for service worker updates
   */
  private listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Listen for version ready events (new version available)
    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        map(() => void 0)
      )
      .subscribe(() => {
        console.log('New version available');
        this.updateAvailableSubject.next();
      });
  }

  /**
   * Track when the app is installed
   */
  private trackInstallation(): void {
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      // Clear the deferred prompt as it's no longer needed
      this.deferredPrompt = null;
    });
  }
}
