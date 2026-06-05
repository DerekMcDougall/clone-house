import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaService } from '../services/pwa.service';
import { PwaDemoComponent } from './pwa-demo.component';

describe('PwaDemoComponent', () => {
  let component: PwaDemoComponent;
  let fixture: ComponentFixture<PwaDemoComponent>;
  let mockPwaService: any;
  let updateAvailableSubject: Subject<void>;

  beforeEach(async () => {
    // Create a subject to control update notifications
    updateAvailableSubject = new Subject<void>();

    // Create mock PWA service
    mockPwaService = {
      isInstalled: vi.fn().mockReturnValue(false),
      promptInstall: vi.fn().mockResolvedValue(false),
      checkForUpdates: vi.fn().mockResolvedValue(false),
      onUpdateAvailable: vi.fn().mockReturnValue(updateAvailableSubject.asObservable()),
      applyUpdate: vi.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [PwaDemoComponent],
      providers: [
        { provide: PwaService, useValue: mockPwaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PwaDemoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    updateAvailableSubject.complete();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Installation Status Display', () => {
    it('should display "Not Installed" when app is not installed', () => {
      mockPwaService.isInstalled.mockReturnValue(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusValue = compiled.querySelector('.status-item .status-value');
      
      expect(statusValue?.textContent?.trim()).toBe('Not Installed');
      expect(component['isInstalled']()).toBe(false);
    });

    it('should display "Installed" when app is installed', () => {
      mockPwaService.isInstalled.mockReturnValue(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusValue = compiled.querySelector('.status-item .status-value');
      
      expect(statusValue?.textContent?.trim()).toBe('Installed');
      expect(component['isInstalled']()).toBe(true);
    });

    it('should check installation status on init', () => {
      fixture.detectChanges();
      
      expect(mockPwaService.isInstalled).toHaveBeenCalled();
    });
  });

  describe('Install Button', () => {
    it('should call PWA service promptInstall() when install button is clicked', async () => {
      mockPwaService.isInstalled.mockReturnValue(false);
      mockPwaService.promptInstall.mockResolvedValue(true);
      
      fixture.detectChanges();
      
      // Trigger beforeinstallprompt to show install button
      component['canInstall'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const installButton = compiled.querySelector('.install-button') as HTMLButtonElement;
      
      expect(installButton).toBeTruthy();
      
      installButton.click();
      await fixture.whenStable();

      expect(mockPwaService.promptInstall).toHaveBeenCalled();
    });

    it('should update installation status when user accepts install prompt', async () => {
      mockPwaService.isInstalled.mockReturnValue(false);
      mockPwaService.promptInstall.mockResolvedValue(true);
      
      fixture.detectChanges();
      component['canInstall'].set(true);
      fixture.detectChanges();

      await component['onInstallClick']();
      
      expect(component['isInstalled']()).toBe(true);
      expect(component['canInstall']()).toBe(false);
    });

    it('should not update installation status when user dismisses install prompt', async () => {
      mockPwaService.isInstalled.mockReturnValue(false);
      mockPwaService.promptInstall.mockResolvedValue(false);
      
      fixture.detectChanges();
      component['canInstall'].set(true);
      fixture.detectChanges();

      await component['onInstallClick']();
      
      expect(component['isInstalled']()).toBe(false);
    });

    it('should not show install button when app is already installed', () => {
      mockPwaService.isInstalled.mockReturnValue(true);
      fixture.detectChanges();
      component['canInstall'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const installButton = compiled.querySelector('.install-button');
      
      expect(installButton).toBeFalsy();
    });

    it('should show info text when app is already installed', () => {
      mockPwaService.isInstalled.mockReturnValue(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const infoText = compiled.querySelector('.info-text');
      
      expect(infoText?.textContent?.trim()).toBe('App is already installed');
    });
  });

  describe('Update Notifications', () => {
    it('should respond to update notifications from PWA service', async () => {
      fixture.detectChanges();

      expect(component['updateAvailable']()).toBe(false);

      // Emit update available notification
      updateAvailableSubject.next();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component['updateAvailable']()).toBe(true);
    });

    it('should display update notification when update is available', () => {
      fixture.detectChanges();
      
      component['updateAvailable'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const updateNotification = compiled.querySelector('.update-notification');
      
      expect(updateNotification).toBeTruthy();
      expect(updateNotification?.textContent).toContain('A new version is available!');
    });

    it('should not display update notification when no update is available', () => {
      fixture.detectChanges();
      
      component['updateAvailable'].set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const updateNotification = compiled.querySelector('.update-notification');
      
      expect(updateNotification).toBeFalsy();
    });

    it('should call applyUpdate when update button is clicked', async () => {
      fixture.detectChanges();
      
      component['updateAvailable'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const updateButton = compiled.querySelector('.update-button') as HTMLButtonElement;
      
      expect(updateButton).toBeTruthy();
      
      updateButton.click();
      await fixture.whenStable();

      expect(mockPwaService.applyUpdate).toHaveBeenCalled();
    });
  });

  describe('Online/Offline Status', () => {
    it('should display online status when navigator is online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      });
      
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusValues = compiled.querySelectorAll('.status-item .status-value');
      const connectionStatus = statusValues[1]; // Second status item is connection
      
      expect(connectionStatus?.textContent?.trim()).toBe('Online');
      expect(component['isOnline']()).toBe(true);
    });

    it('should display offline status when navigator is offline', () => {
      // Manually set the component's isOnline signal to false
      component['isOnline'].set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusValues = compiled.querySelectorAll('.status-item .status-value');
      const connectionStatus = statusValues[1];
      
      expect(connectionStatus?.textContent?.trim()).toBe('Offline');
      expect(component['isOnline']()).toBe(false);
    });

    it('should update status when online event fires', () => {
      // Start with offline status
      component['isOnline'].set(false);
      fixture.detectChanges();
      expect(component['isOnline']()).toBe(false);

      // Simulate going online - the event handler will read navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
      fixture.detectChanges();

      expect(component['isOnline']()).toBe(true);
    });

    it('should update status when offline event fires', () => {
      // Start with online status
      component['isOnline'].set(true);
      fixture.detectChanges();
      expect(component['isOnline']()).toBe(true);

      // Simulate going offline - the event handler will read navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();

      expect(component['isOnline']()).toBe(false);
    });
  });

  describe('Check for Updates', () => {
    it('should call checkForUpdates when check updates button is clicked', async () => {
      mockPwaService.checkForUpdates.mockResolvedValue(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const checkUpdatesButton = compiled.querySelector('.check-updates-button') as HTMLButtonElement;
      
      expect(checkUpdatesButton).toBeTruthy();
      
      checkUpdatesButton.click();
      await fixture.whenStable();

      expect(mockPwaService.checkForUpdates).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should subscribe to update notifications on init', () => {
      fixture.detectChanges();
      
      expect(mockPwaService.onUpdateAvailable).toHaveBeenCalled();
    });

    it('should clean up event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      fixture.detectChanges();
      component.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    });
  });

  describe('beforeinstallprompt Event', () => {
    it('should show install button when beforeinstallprompt event fires', () => {
      fixture.detectChanges();
      
      expect(component['canInstall']()).toBe(false);

      // Simulate beforeinstallprompt event
      window.dispatchEvent(new Event('beforeinstallprompt'));
      fixture.detectChanges();

      expect(component['canInstall']()).toBe(true);
    });
  });
});
