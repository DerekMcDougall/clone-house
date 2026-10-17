import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PwaService } from '../services/pwa.service';

@Component({
  selector: 'app-pwa-demo',
  imports: [CommonModule],
  templateUrl: './pwa-demo.component.html',
  styleUrl: './pwa-demo.component.scss'
})
export class PwaDemoComponent implements OnInit, OnDestroy {
  private readonly pwaService = inject(PwaService);
  
  protected readonly isInstalled = signal(false);
  protected readonly isOnline = signal(navigator.onLine);
  protected readonly updateAvailable = signal(false);
  protected readonly canInstall = signal(false);
  
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Check installation status
    this.isInstalled.set(this.pwaService.isInstalled());
    
    // Listen for update notifications
    this.pwaService.onUpdateAvailable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateAvailable.set(true);
      });
    
    // Listen for online/offline status changes
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);
    
    // Listen for beforeinstallprompt to show install button
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
  }

  private handleOnlineStatus = (): void => {
    this.isOnline.set(navigator.onLine);
  };

  private handleBeforeInstallPrompt = (): void => {
    this.canInstall.set(true);
  };

  protected async onInstallClick(): Promise<void> {
    const accepted = await this.pwaService.promptInstall();
    if (accepted) {
      this.canInstall.set(false);
      this.isInstalled.set(true);
    }
  }

  protected async onUpdateClick(): Promise<void> {
    await this.pwaService.applyUpdate();
  }

  protected async onCheckUpdatesClick(): Promise<void> {
    const hasUpdate = await this.pwaService.checkForUpdates();
    if (!hasUpdate) {
      alert('No updates available');
    }
  }
}
