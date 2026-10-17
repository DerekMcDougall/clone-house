import { Component, OnInit, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStore } from '../stores/game.store';
import { PhaseContentComponent } from './phase-content.component';
import { StatusPaneComponent } from './status-pane.component';

@Component({
  selector: 'app-gameplay',
  imports: [StatusPaneComponent, PhaseContentComponent],
  templateUrl: './gameplay.component.html',
  styleUrl: './gameplay.component.scss'
})
export class GameplayComponent implements OnInit {
  protected readonly gameStore = inject(GameStore);
  private readonly router = inject(Router);
  
  constructor() {
    // Watch for game completion - effect must be in constructor
    effect(() => {
      if (this.gameStore.isGameComplete()) {
        this.router.navigate(['/']);
      }
    });
  }
  
  ngOnInit(): void {
    this.gameStore.initializeGame();
  }
}
