import { Component, inject } from '@angular/core';
import { GameStore } from '../stores/game.store';
import { GuestCardComponent } from './guest-card.component';

// Shows the choice the player has to make, if any: the prompt, one button per option, and
// the confirmation dialog once an option that needs confirming is picked.
@Component({
  selector: 'app-choice-panel',
  imports: [GuestCardComponent],
  templateUrl: './choice-panel.component.html',
  styleUrl: './choice-panel.component.scss'
})
export class ChoicePanelComponent {
  protected readonly gameStore = inject(GameStore);
}
