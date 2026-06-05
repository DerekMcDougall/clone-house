import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PwaService } from '../services/pwa.service';

@Component({
  selector: 'app-pwa-demo',
  imports: [CommonModule],
  template: `
<div class="pwa-demo">
  <h2>PWA Features Demo</h2>
  
  <div class="status-section">
    <h3>Status</h3>
    
    <div class="status-item">
      <span class="status-label">Installation:</span>
      <span class="status-value" [class.installed]="isInstalled()">
        {{ isInstalled() ? 'Installed' : 'Not Installed' }}
      </span>
    </div>
    
    <div class="status-item">
      <span class="status-label">Connection:</span>
      <span class="status-value" [class.online]="isOnline()" [class.offline]="!isOnline()">
        {{ isOnline() ? 'Online' : 'Offline' }}
      </span>
    </div>
  </div>
  
  <div class="actions-section">
    <h3>Actions</h3>
    
    @if (canInstall() && !isInstalled()) {
      <button 
        class="install-button" 
        (click)="onInstallClick()"
        aria-label="Install PWA">
        Install App
      </button>
    }
    
    @if (isInstalled()) {
      <p class="info-text">App is already installed</p>
    }
    
    <button 
      class="check-updates-button" 
      (click)="onCheckUpdatesClick()"
      aria-label="Check for updates">
      Check for Updates
    </button>
    
    @if (updateAvailable()) {
      <div class="update-notification">
        <p>A new version is available!</p>
        <button 
          class="update-button" 
          (click)="onUpdateClick()"
          aria-label="Apply update">
          Update Now
        </button>
      </div>
    }
  </div>
</div>
  `,
  styles: [`
.pwa-demo {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pwa-demo h2 {
  margin-top: 0;
  color: #1976d2;
  font-size: 1.75rem;
}

.pwa-demo h3 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.25rem;
}

.status-section {
  margin-bottom: 2rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.status-value {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.status-value.installed {
  background: #4caf50;
  color: white;
}

.status-value.online {
  background: #4caf50;
  color: white;
}

.status-value.offline {
  background: #f44336;
  color: white;
}

.actions-section button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.actions-section button:hover {
  opacity: 0.9;
}

.actions-section button:active {
  transform: translateY(1px);
}

.install-button {
  background: #1976d2;
  color: white;
}

.install-button:hover {
  background: #1565c0;
}

.check-updates-button {
  background: #757575;
  color: white;
}

.check-updates-button:hover {
  background: #616161;
}

.update-button {
  background: #ff9800;
  color: white;
}

.update-button:hover {
  background: #f57c00;
}

.info-text {
  color: #666;
  font-style: italic;
  margin: 1rem 0;
}

.update-notification {
  padding: 1rem;
  margin-top: 1rem;
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  border-radius: 4px;
}

.update-notification p {
  margin: 0 0 0.75rem 0;
  color: #e65100;
  font-weight: 500;
}
  `]
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
