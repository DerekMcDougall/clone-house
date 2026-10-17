import { Component, Input, inject, signal } from '@angular/core';
import { GamePhase } from '../models';
import { formatMoney, GuestType } from '../models/guest.model';
import { getGuestType, guestTypeLabel } from '../models/guest-type-registry';
import { GameStore } from '../stores/game.store';
import { ChoicePanelComponent } from './choice-panel.component';
import { GuestCardComponent } from './guest-card.component';
import { GuestDetailsComponent } from './guest-details.component';

@Component({
  selector: 'app-phase-content',
  imports: [ChoicePanelComponent, GuestCardComponent, GuestDetailsComponent],
  templateUrl: './phase-content.component.html',
  styleUrl: './phase-content.component.scss'
})
export class PhaseContentComponent {
  @Input({ required: true }) phase!: GamePhase;
  readonly GamePhase = GamePhase;
  readonly guestTypeLabel = guestTypeLabel;
  readonly getGuestType = getGuestType;
  readonly formatMoney = formatMoney;
  
  // Inject GameStore to access party and showEmptyDeckMessage signals
  protected readonly gameStore = inject(GameStore);
  
  // Local signals for transient shop UI state
  shopErrorMessage = signal<string | null>(null);
  shopAddedFeedback = signal<GuestType | null>(null);
  expansionErrorMessage = signal<string | null>(null);
  
  // Use store signal for empty deck message
  showEmptyDeckMessage = this.gameStore.showEmptyDeckMessage;
  
  // Computed signal to get party guests in reverse order (newest first)
  reversedParty = () => {
    return [...this.gameStore.party()].reverse();
  };

  // Helper to generate an array of indices for empty party slots
  emptySlotArray = () => Array.from({ length: this.gameStore.emptySlots() }, (_, i) => i);

  onPurchaseGuest(type: GuestType): void {
    const result = this.gameStore.purchaseGuest(type);
    if (result.success) {
      this.shopAddedFeedback.set(result.guestType);
      setTimeout(() => {
        this.shopAddedFeedback.set(null);
      }, 1500);
    } else {
      this.shopErrorMessage.set(result.message);
    }
  }

  onPurchaseExpansion(): void {
    const result = this.gameStore.purchaseExpansion();
    if (!result.success) {
      this.expansionErrorMessage.set(result.message);
    }
  }

  dismissShopError(): void {
    this.shopErrorMessage.set(null);
  }

  dismissHouseFullMessage(): void {
    this.gameStore.dismissHouseFullMessage();
  }

  dismissExpansionError(): void {
    this.expansionErrorMessage.set(null);
  }
}
