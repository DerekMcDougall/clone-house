import { Component, inject } from '@angular/core';
import { GamePhase } from '../models/game-phase.enum';
import { GameStore } from '../stores/game.store';

@Component({
  selector: 'app-status-pane',
  imports: [],
  template: `
<aside class="status-pane">
  <div class="status-info">
    <h3>Popularity</h3>
    <p class="popularity-count">{{ gameStore.popularity() }}</p>
  </div>
  <div class="status-info">
    <h3>Money</h3>
    <p class="money-count">{{ gameStore.money() }}</p>
  </div>
  <div class="status-info">
    <h3>Turns Remaining</h3>
    <p class="turn-count">{{ gameStore.remainingTurns() }}</p>
  </div>
  @if (gameStore.currentPhase() === GamePhase.PARTY) {
    <div class="status-info">
      <h3>Trouble</h3>
      <p class="trouble-count">{{ gameStore.trouble() }} / {{ gameStore.effectiveTroubleLimit() }}</p>
    </div>
    <button 
      class="invite-button"
      (click)="onInviteGuest()"
      [disabled]="gameStore.isPartyShutdown() || gameStore.isBanSelectionActive()"
      aria-label="Invite Guest">
      Invite Guest
    </button>
  }
  <button 
    class="phase-button"
    (click)="gameStore.advancePhase()"
    [disabled]="gameStore.isPartyShutdown() || gameStore.isBanSelectionActive()"
    [attr.aria-label]="gameStore.phaseButtonLabel()">
    {{ gameStore.phaseButtonLabel() }}
  </button>
</aside>
  `,
  styles: [`
.status-pane {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #f5f5f5;
  border-left: 1px solid #ddd;
  min-width: 200px;
  height: 100%;
  box-sizing: border-box;
}

.status-info {
  flex: 1;
}

.status-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.status-info .turn-count,
.status-info .popularity-count,
.status-info .trouble-count,
.status-info .money-count {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.invite-button {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.invite-button:hover {
  background-color: #218838;
}

.invite-button:focus {
  outline: 2px solid #218838;
  outline-offset: 2px;
}

.invite-button:active {
  background-color: #1e7e34;
}

.phase-button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.phase-button:hover {
  background-color: #0056b3;
}

.phase-button:focus {
  outline: 2px solid #0056b3;
  outline-offset: 2px;
}

.phase-button:active {
  background-color: #004085;
}
  `]
})
export class StatusPaneComponent {
  protected readonly gameStore = inject(GameStore);
  protected readonly GamePhase = GamePhase;

  onInviteGuest(): void {
    this.gameStore.inviteGuest();
  }

}
