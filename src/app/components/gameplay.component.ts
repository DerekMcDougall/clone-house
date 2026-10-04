import { Component, OnInit, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStore } from '../stores/game.store';
import { PhaseContentComponent } from './phase-content.component';
import { StatusPaneComponent } from './status-pane.component';

@Component({
  selector: 'app-gameplay',
  imports: [StatusPaneComponent, PhaseContentComponent],
  template: `
<main class="gameplay-layout">
  <app-phase-content 
    [phase]="gameStore.currentPhase()" 
    class="main-content" />
  <app-status-pane class="status-pane" />
</main>
  `,
  styles: [`
.gameplay-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.status-pane {
  flex-shrink: 0;
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
}
  `]
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
