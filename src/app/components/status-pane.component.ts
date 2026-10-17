import { Component, inject } from '@angular/core';
import { GamePhase } from '../models/game-phase.enum';
import { WINNING_STAR_COUNT } from '../models/guest.model';
import { GameStore } from '../stores/game.store';

@Component({
  selector: 'app-status-pane',
  imports: [],
  templateUrl: './status-pane.component.html',
  styleUrl: './status-pane.component.scss'
})
export class StatusPaneComponent {
  protected readonly gameStore = inject(GameStore);
  protected readonly GamePhase = GamePhase;
  protected readonly WINNING_STAR_COUNT = WINNING_STAR_COUNT;

  onInviteGuest(): void {
    this.gameStore.inviteGuest();
  }

}
