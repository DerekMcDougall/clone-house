import { Component, Input, inject, signal } from '@angular/core';
import { GamePhase } from '../models';
import { GUEST_TYPE_LABELS, GuestType } from '../models/guest.model';
import { GameStore } from '../stores/game.store';
import { GuestCardComponent } from './guest-card.component';

@Component({
  selector: 'app-phase-content',
  imports: [GuestCardComponent],
  template: `
<div class="phase-content">
  @if (phase === GamePhase.BUY) {
    <h2>Shop</h2>
    <div class="shop-cards-container">
      @for (item of gameStore.purchasableShopItems(); track item.type) {
        <button
          class="shop-card"
          (click)="onPurchaseGuest(item.type)"
          [attr.aria-label]="'Buy ' + GUEST_TYPE_LABELS[item.type]">
          <div class="card-header">{{ GUEST_TYPE_LABELS[item.type] }}</div>
          <div class="card-image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="currentColor" aria-hidden="true">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div class="shop-price">Price: {{ item.cost }}</div>
          <div class="shop-stock">Available: {{ item.guests.length }}</div>
          @if (shopAddedFeedback() === item.type) {
            <div class="added-feedback">Added!</div>
          }
        </button>
      }
      @if (gameStore.expansionStock() > 0) {
        <button
          class="shop-card expand-house-card"
          (click)="onPurchaseExpansion()"
          aria-label="Expand House">
          <div class="card-header">Expand House</div>
          <div class="card-image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="currentColor" aria-hidden="true">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div class="shop-price">{{ '$' + gameStore.expansionCost() }}</div>
          <div class="shop-stock">Available: {{ gameStore.expansionStock() }}</div>
        </button>
      }
    </div>
  } @else {
    <h2>Party</h2>
    @if (phase === GamePhase.PARTY) {
      <div class="guest-cards-container">
        @for (guest of reversedParty(); track guest.name) {
          <app-guest-card [guest]="guest" />
        }
        @for (i of emptySlotArray(); track i) {
          <div class="card-shadow" aria-hidden="true"></div>
        }
      </div>
      @if (showEmptyDeckMessage()) {
        <div class="empty-deck-message">No more guests!</div>
      }
    }
  }
</div>
@if (gameStore.isPartyShutdown()) {
  <div class="shutdown-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="shutdown-title">
    <div class="shutdown-modal">
      <p id="shutdown-title">The party has gotten out of control and has been shut down!</p>
      <button
        class="shutdown-button"
        (click)="gameStore.acknowledgeShutdown()"
        [attr.aria-label]="gameStore.isFinalTurn() ? 'Game Over' : 'End Party'">
        {{ gameStore.isFinalTurn() ? 'Game Over' : 'End Party' }}
      </button>
    </div>
  </div>
}
@if (gameStore.isBanSelectionActive()) {
  <div class="ban-selection">
    <h3 class="blame-prompt">Who takes the blame?</h3>
    <div class="guest-cards-container">
      @for (guest of gameStore.bustPartySnapshot(); track $index) {
        <button
          class="ban-guest-button"
          (click)="gameStore.selectGuestToBan($index)"
          [attr.aria-label]="'Ban ' + guest.name">
          <app-guest-card [guest]="guest" />
        </button>
      }
    </div>
  </div>
}
@if (gameStore.selectedBanGuest()) {
  <div class="ban-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ban-title">
    <div class="ban-modal">
      <p id="ban-title">{{ gameStore.banConfirmationMessage() }}</p>
      <button
        class="ban-confirm-button"
        (click)="gameStore.confirmBan()"
        aria-label="OK">
        OK
      </button>
    </div>
  </div>
}
@if (shopErrorMessage()) {
  <div class="shop-error-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-error-title">
    <div class="shop-error-modal">
      <p id="shop-error-title">{{ shopErrorMessage() }}</p>
      <button
        class="shop-error-button"
        (click)="dismissShopError()"
        aria-label="OK">
        OK
      </button>
    </div>
  </div>
}
@if (gameStore.showHouseFullMessage()) {
  <div class="house-full-overlay" role="dialog" aria-modal="true" aria-labelledby="house-full-title">
    <div class="house-full-modal">
      <p id="house-full-title">The house is full!</p>
      <button class="house-full-button" (click)="dismissHouseFullMessage()" aria-label="OK">OK</button>
    </div>
  </div>
}
@if (expansionErrorMessage()) {
  <div class="expansion-error-overlay" role="dialog" aria-modal="true" aria-labelledby="expansion-error-title">
    <div class="expansion-error-modal">
      <p id="expansion-error-title">{{ expansionErrorMessage() }}</p>
      <button class="expansion-error-button" (click)="dismissExpansionError()" aria-label="OK">OK</button>
    </div>
  </div>
}
  `,
  styles: [`
.phase-content {
  padding: 2rem;
}

.phase-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 2rem;
  font-weight: 600;
  color: #333;
}

.guest-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.card-shadow {
  min-width: 150px;
  max-width: 200px;
  min-height: 140px;
  padding: 1rem;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background-color: #f5f5f5;
  box-sizing: border-box;
}

.empty-deck-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-weight: 500;
  text-align: center;
}

.shutdown-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.shutdown-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.shutdown-modal p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.shutdown-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.shutdown-button:hover {
  background-color: #c82333;
}

.shutdown-button:focus {
  outline: 2px solid #c82333;
  outline-offset: 2px;
}

.ban-selection {
  padding: 2rem;
}

.blame-prompt {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.ban-guest-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ban-guest-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ban-guest-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.ban-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ban-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.ban-modal p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.ban-confirm-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ban-confirm-button:hover {
  background-color: #c82333;
}

.ban-confirm-button:focus {
  outline: 2px solid #c82333;
  outline-offset: 2px;
}

.shop-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.shop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 120px;
  position: relative;
}

.shop-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.shop-card:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.shop-card .card-header {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.shop-card .card-image {
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
  color: #666;
}

.shop-price {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.25rem;
}

.shop-stock {
  font-size: 0.85rem;
  color: #888;
}

.shop-error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.shop-error-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.shop-error-modal p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.shop-error-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.shop-error-button:hover {
  background-color: #c82333;
}

.shop-error-button:focus {
  outline: 2px solid #c82333;
  outline-offset: 2px;
}

.house-full-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.house-full-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.house-full-modal p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.house-full-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.house-full-button:hover {
  background-color: #c82333;
}

.house-full-button:focus {
  outline: 2px solid #c82333;
  outline-offset: 2px;
}

.expansion-error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.expansion-error-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.expansion-error-modal p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.expansion-error-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.expansion-error-button:hover {
  background-color: #c82333;
}

.expansion-error-button:focus {
  outline: 2px solid #c82333;
  outline-offset: 2px;
}

.added-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(40, 167, 69, 0.9);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  animation: fadeOut 1.5s ease-out forwards;
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}
  `]
})
export class PhaseContentComponent {
  @Input({ required: true }) phase!: GamePhase;
  readonly GamePhase = GamePhase;
  readonly GUEST_TYPE_LABELS = GUEST_TYPE_LABELS;
  
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
