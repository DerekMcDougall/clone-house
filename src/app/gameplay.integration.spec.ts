import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { patchState } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameplayComponent } from './components/gameplay.component';
import { LandingPageComponent } from './components/landing-page.component';
import { GamePhase } from './models';
import { Guest } from './models/guest.model';
import { GameStore } from './stores/game.store';

const sortByPopularityDescending = (deck: Guest[]): Guest[] =>
  [...deck].sort((a, b) => b.properties.popularityValue - a.properties.popularityValue);

/**
 * Integration Tests for Turn-Based Gameplay System
 * 
 * These tests verify the complete turn-based gameplay system works correctly
 * end-to-end, including the interaction between GameStore, GameplayComponent,
 * PhaseContentComponent, and StatusPaneComponent.
 * 
 * **Validates: All requirements**
 */
describe('Turn-Based Gameplay Integration Tests', () => {
  let component: GameplayComponent;
  let fixture: ComponentFixture<GameplayComponent>;
  let store: InstanceType<typeof GameStore>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameplayComponent, LandingPageComponent],
      providers: [
        provideRouter([
          { path: '', component: LandingPageComponent },
          { path: 'game', component: GameplayComponent }
        ])
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(GameplayComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
    router = TestBed.inject(Router);
    
    // Reset store to initial state before each test
    store.resetGame();
  });

  describe('Complete Game Flow from Start to Finish', () => {
    it('should complete a single-turn game from initialization to navigation', async () => {
      // Initialize component
      fixture.detectChanges();
      
      // Initialize with 1 turn
      store.initializeGame(1);
      fixture.detectChanges();
      
      // Verify initial state
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.remainingTurns()).toBe(1);
      expect(store.isGameComplete()).toBe(false);
      
      // Verify UI shows Shop heading
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Verify button shows "Start Party"
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Click button to advance to Party phase
      button.click();
      fixture.detectChanges();
      
      // Verify Party phase
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('Game Over');
      
      // Click button to complete game
      const navigateSpy = vi.spyOn(router, 'navigate');
      button.click();
      fixture.detectChanges();
      
      // Verify game completion
      expect(store.isGameComplete()).toBe(true);
      
      // Wait for navigation effect
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify navigation to landing page
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should complete a multi-turn game (3 turns) from start to finish', async () => {
      fixture.detectChanges();
      store.initializeGame(3);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      
      // Turn 1 - Buy Phase
      expect(store.currentTurn()).toBe(1);
      expect(store.remainingTurns()).toBe(3);
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Turn 1 - Party Phase
      button.click();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('End Party');
      
      // Turn 2 - Buy Phase
      button.click();
      fixture.detectChanges();
      expect(store.currentTurn()).toBe(2);
      expect(store.remainingTurns()).toBe(2);
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Turn 2 - Party Phase
      button.click();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      
      // Turn 3 - Buy Phase
      button.click();
      fixture.detectChanges();
      expect(store.currentTurn()).toBe(3);
      expect(store.remainingTurns()).toBe(1);
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Turn 3 - Party Phase (final)
      button.click();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('Game Over');
      
      // Complete game
      const navigateSpy = vi.spyOn(router, 'navigate');
      button.click();
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should handle default 25-turn game initialization and progression', async () => {
      fixture.detectChanges();
      
      // Initialize with default turns
      store.initializeGame();
      fixture.detectChanges();
      
      expect(store.totalTurns()).toBe(25);
      expect(store.remainingTurns()).toBe(25);
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Progress through first few turns
      for (let turn = 1; turn <= 3; turn++) {
        expect(store.currentTurn()).toBe(turn);
        expect(store.remainingTurns()).toBe(26 - turn);
        
        // Buy phase
        button.click();
        fixture.detectChanges();
        
        // Party phase
        expect(store.currentPhase()).toBe(GamePhase.PARTY);
        button.click();
        fixture.detectChanges();
      }
      
      // Should be on turn 4 now
      expect(store.currentTurn()).toBe(4);
      expect(store.remainingTurns()).toBe(22);
      expect(store.isGameComplete()).toBe(false);
    });
  });

  describe('Full Turn Cycle (Buy → Party → next Buy)', () => {
    it('should correctly cycle through Buy → Party → Buy phases', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Initial: Turn 1 Buy
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(turnCount.textContent.trim()).toBe('5');
      
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Advance to Party
      button.click();
      fixture.detectChanges();
      
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(turnCount.textContent.trim()).toBe('5'); // Same turn
      
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('End Party');
      
      // Advance to next turn's Buy phase
      button.click();
      fixture.detectChanges();
      
      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(turnCount.textContent.trim()).toBe('4'); // Decremented
      
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      expect(button.textContent.trim()).toBe('Start Party');
    });

    it('should maintain turn count during Buy → Party transition', async () => {
      fixture.detectChanges();
      store.initializeGame(10);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Turn 1 Buy
      expect(store.currentTurn()).toBe(1);
      expect(turnCount.textContent.trim()).toBe('10');
      
      // Advance to Party (same turn)
      button.click();
      fixture.detectChanges();
      
      expect(store.currentTurn()).toBe(1);
      expect(turnCount.textContent.trim()).toBe('10'); // Should not change
    });

    it('should decrement turn count on Party → Buy transition', async () => {
      fixture.detectChanges();
      store.initializeGame(10);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Turn 1 Buy → Party
      button.click();
      fixture.detectChanges();
      expect(turnCount.textContent.trim()).toBe('10');
      
      // Party → Turn 2 Buy
      button.click();
      fixture.detectChanges();
      expect(store.currentTurn()).toBe(2);
      expect(turnCount.textContent.trim()).toBe('9'); // Decremented
    });
  });

  describe('Game Completion and Navigation', () => {
    it('should show "Game Over" button on final turn Party phase', async () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Progress to final turn
      button.click(); // Turn 1: Buy → Party
      fixture.detectChanges();
      expect(button.textContent.trim()).toBe('End Party');
      
      button.click(); // Turn 2: Buy
      fixture.detectChanges();
      expect(button.textContent.trim()).toBe('Start Party');
      
      button.click(); // Turn 2: Party (final)
      fixture.detectChanges();
      expect(button.textContent.trim()).toBe('Game Over');
    });

    it('should navigate to landing page when "Game Over" is clicked', async () => {
      fixture.detectChanges();
      store.initializeGame(1);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      // Complete the game
      button.click(); // Buy → Party
      fixture.detectChanges();
      
      expect(button.textContent.trim()).toBe('Game Over');
      
      button.click(); // Complete
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(true);
      
      // Wait for effect
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(navigateSpy).toHaveBeenCalledTimes(1);
    });

    it('should not navigate before game completion', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      // Progress through several phases but don't complete
      button.click(); // Turn 1: Buy → Party
      fixture.detectChanges();
      button.click(); // Turn 2: Buy
      fixture.detectChanges();
      button.click(); // Turn 2: Party
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(false);
      
      // Wait to ensure no navigation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should complete game and navigate after exact number of turns', async () => {
      fixture.detectChanges();
      store.initializeGame(3);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      // Complete exactly 3 turns
      for (let turn = 1; turn <= 3; turn++) {
        button.click(); // Buy → Party
        fixture.detectChanges();
        button.click(); // Party → next turn or complete
        fixture.detectChanges();
      }
      
      expect(store.isGameComplete()).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('UI Updates in Response to State Changes', () => {
    it('should update phase heading when phase changes', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Initial: Shop
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Change to Party
      button.click();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      
      // Change back to Shop (next turn)
      button.click();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
    });

    it('should update button label when phase changes', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Buy phase
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Party phase
      button.click();
      fixture.detectChanges();
      expect(button.textContent.trim()).toBe('End Party');
      
      // Next turn Buy phase
      button.click();
      fixture.detectChanges();
      expect(button.textContent.trim()).toBe('Start Party');
    });

    it('should update remaining turns display when turn advances', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Turn 1
      expect(turnCount.textContent.trim()).toBe('5');
      
      // Advance to Party (same turn)
      button.click();
      fixture.detectChanges();
      expect(turnCount.textContent.trim()).toBe('5');
      
      // Advance to Turn 2
      button.click();
      fixture.detectChanges();
      expect(turnCount.textContent.trim()).toBe('4');
      
      // Advance to Party (same turn)
      button.click();
      fixture.detectChanges();
      expect(turnCount.textContent.trim()).toBe('4');
      
      // Advance to Turn 3
      button.click();
      fixture.detectChanges();
      expect(turnCount.textContent.trim()).toBe('3');
    });

    it('should update all UI elements simultaneously on state change', async () => {
      fixture.detectChanges();
      store.initializeGame(3);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Verify all elements update together: Buy → Party
      button.click();
      fixture.detectChanges();
      
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('End Party');
      expect(turnCount.textContent.trim()).toBe('3');
      
      // Verify all elements update together: Party → next Buy
      button.click();
      fixture.detectChanges();
      
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      expect(button.textContent.trim()).toBe('Start Party');
      expect(turnCount.textContent.trim()).toBe('2');
    });

    it('should update button label to "Game Over" on final turn', async () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Progress to final turn Party phase
      button.click(); // Turn 1: Buy → Party
      fixture.detectChanges();
      button.click(); // Turn 2: Buy
      fixture.detectChanges();
      button.click(); // Turn 2: Party
      fixture.detectChanges();
      
      expect(button.textContent.trim()).toBe('Game Over');
    });

    it('should maintain status pane visibility throughout game', async () => {
      fixture.detectChanges();
      store.initializeGame(3);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Check visibility at each phase
      for (let i = 0; i < 6; i++) { // 3 turns × 2 phases
        const statusPane = fixture.nativeElement.querySelector('app-status-pane');
        expect(statusPane).toBeTruthy();
        
        if (i < 5) { // Don't click after last phase
          button.click();
          fixture.detectChanges();
        }
      }
    });
  });

  describe('Multi-Turn Game Scenarios', () => {
    it('should handle 10-turn game progression correctly', async () => {
      fixture.detectChanges();
      store.initializeGame(10);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Progress through all 10 turns
      for (let turn = 1; turn <= 10; turn++) {
        expect(store.currentTurn()).toBe(turn);
        expect(turnCount.textContent.trim()).toBe(String(11 - turn));
        
        // Buy → Party
        button.click();
        fixture.detectChanges();
        expect(store.currentPhase()).toBe(GamePhase.PARTY);
        
        // Party → next turn or complete
        button.click();
        fixture.detectChanges();
      }
      
      expect(store.isGameComplete()).toBe(true);
    });

    it('should correctly track progress through 5-turn game', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      
      const expectedSequence = [
        { turn: 1, phase: GamePhase.BUY, heading: 'Shop', button: 'Start Party', remaining: 5 },
        { turn: 1, phase: GamePhase.PARTY, heading: 'Party', button: 'End Party', remaining: 5 },
        { turn: 2, phase: GamePhase.BUY, heading: 'Shop', button: 'Start Party', remaining: 4 },
        { turn: 2, phase: GamePhase.PARTY, heading: 'Party', button: 'End Party', remaining: 4 },
        { turn: 3, phase: GamePhase.BUY, heading: 'Shop', button: 'Start Party', remaining: 3 },
        { turn: 3, phase: GamePhase.PARTY, heading: 'Party', button: 'End Party', remaining: 3 },
        { turn: 4, phase: GamePhase.BUY, heading: 'Shop', button: 'Start Party', remaining: 2 },
        { turn: 4, phase: GamePhase.PARTY, heading: 'Party', button: 'End Party', remaining: 2 },
        { turn: 5, phase: GamePhase.BUY, heading: 'Shop', button: 'Start Party', remaining: 1 },
        { turn: 5, phase: GamePhase.PARTY, heading: 'Party', button: 'Game Over', remaining: 1 }
      ];
      
      for (let i = 0; i < expectedSequence.length; i++) {
        const expected = expectedSequence[i];
        const heading = phaseContent.querySelector('h2');
        const turnCount = fixture.nativeElement.querySelector('.turn-count');
        
        expect(store.currentTurn()).toBe(expected.turn);
        expect(store.currentPhase()).toBe(expected.phase);
        expect(heading.textContent.trim()).toBe(expected.heading);
        expect(button.textContent.trim()).toBe(expected.button);
        expect(turnCount.textContent.trim()).toBe(String(expected.remaining));
        
        button.click();
        fixture.detectChanges();
      }
      
      expect(store.isGameComplete()).toBe(true);
    });

    it('should handle rapid phase transitions correctly', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Rapidly click through multiple phases
      for (let i = 0; i < 10; i++) { // 5 turns × 2 phases
        button.click();
        fixture.detectChanges();
      }
      
      expect(store.isGameComplete()).toBe(true);
      expect(store.currentTurn()).toBe(5);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
    });

    it('should maintain consistency across long game (25 turns)', async () => {
      fixture.detectChanges();
      store.initializeGame(25);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Progress through first 5 turns
      for (let turn = 1; turn <= 5; turn++) {
        expect(store.currentTurn()).toBe(turn);
        expect(store.remainingTurns()).toBe(26 - turn);
        
        button.click(); // Buy → Party
        fixture.detectChanges();
        button.click(); // Party → next turn
        fixture.detectChanges();
      }
      
      // Verify state after 5 turns
      expect(store.currentTurn()).toBe(6);
      expect(store.remainingTurns()).toBe(20);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.isGameComplete()).toBe(false);
    });
  });

  describe('Component Integration', () => {
    it('should integrate GameStore, GameplayComponent, PhaseContentComponent, and StatusPaneComponent', async () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      // Verify all components are present
      const gameplayLayout = fixture.nativeElement.querySelector('.gameplay-layout');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      const statusPane = fixture.nativeElement.querySelector('app-status-pane');
      
      expect(gameplayLayout).toBeTruthy();
      expect(phaseContent).toBeTruthy();
      expect(statusPane).toBeTruthy();
      
      // Verify store integration
      expect(component['gameStore']).toBe(store);
      
      // Verify components respond to store changes
      const button = fixture.nativeElement.querySelector('.phase-button');
      button.click();
      fixture.detectChanges();
      
      const heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('End Party');
    });

    it('should pass phase signal from GameplayComponent to PhaseContentComponent', async () => {
      fixture.detectChanges();
      store.initializeGame(3);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      
      // Verify phase signal is passed and rendered
      for (let i = 0; i < 6; i++) {
        const heading = phaseContent.querySelector('h2');
        const expectedHeading = store.currentPhase() === GamePhase.BUY ? 'Shop' : 'Party';
        expect(heading.textContent.trim()).toBe(expectedHeading);
        
        if (i < 5) {
          button.click();
          fixture.detectChanges();
        }
      }
    });

    it('should allow StatusPaneComponent to directly access GameStore', async () => {
      fixture.detectChanges();
      store.initializeGame(5);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Verify StatusPaneComponent reads from store
      expect(turnCount.textContent.trim()).toBe('5');
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Verify StatusPaneComponent calls store methods
      button.click();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(button.textContent.trim()).toBe('End Party');
    });

    it('should maintain reactive updates across all components', async () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      
      // Make a state change
      button.click();
      fixture.detectChanges();
      
      // Verify all components updated
      const heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(button.textContent.trim()).toBe('End Party');
      expect(turnCount.textContent.trim()).toBe('2');
      
      // Make another state change
      button.click();
      fixture.detectChanges();
      
      // Verify all components updated again (re-query heading)
      const updatedHeading = phaseContent.querySelector('h2');
      expect(updatedHeading.textContent.trim()).toBe('Shop');
      expect(button.textContent.trim()).toBe('Start Party');
      expect(turnCount.textContent.trim()).toBe('1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle component initialization before store initialization', async () => {
      // Don't call initializeGame manually
      fixture.detectChanges();
      
      // Component should call initializeGame in ngOnInit
      expect(store.totalTurns()).toBe(25);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
    });

    it('should not allow phase advancement after game completion', async () => {
      fixture.detectChanges();
      store.initializeGame(1);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      // Complete the game
      button.click(); // Buy → Party
      fixture.detectChanges();
      button.click(); // Complete
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(true);
      
      // Try to advance again (should be ignored)
      const turnBefore = store.currentTurn();
      const phaseBefore = store.currentPhase();
      
      button.click();
      fixture.detectChanges();
      
      expect(store.currentTurn()).toBe(turnBefore);
      expect(store.currentPhase()).toBe(phaseBefore);
      expect(store.isGameComplete()).toBe(true);
    });

    it('should handle single-turn edge case correctly', async () => {
      fixture.detectChanges();
      store.initializeGame(1);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      
      expect(store.remainingTurns()).toBe(1);
      expect(button.textContent.trim()).toBe('Start Party');
      
      button.click();
      fixture.detectChanges();
      
      expect(button.textContent.trim()).toBe('Game Over');
    });
  });
});


/**
 * Integration Tests for Party Guest Deck System
 * 
 * These tests verify the complete guest invitation system works correctly
 * end-to-end, including deck management, guest cards display, invite button
 * functionality, and guest return to deck on phase transitions.
 * 
 * **Validates: party-guest-deck-system requirements**
 */
describe('Party Guest Deck System Integration Tests', () => {
  let component: GameplayComponent;
  let fixture: ComponentFixture<GameplayComponent>;
  let store: InstanceType<typeof GameStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameplayComponent, LandingPageComponent],
      providers: [
        provideRouter([
          { path: '', component: LandingPageComponent },
          { path: 'game', component: GameplayComponent }
        ])
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(GameplayComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
    
    // Reset store to initial state before each test
    store.resetGame();
  });

  describe('Complete Guest Flow: Initialize → Invite → Phase Transition', () => {
    it('should initialize with 10 guests in deck and empty party', () => {
      fixture.detectChanges();
      store.initializeGame();
      fixture.detectChanges();
      
      // Verify initial state
      expect(store.deck().length).toBe(10);
      expect(store.party().length).toBe(0);
      
      // Verify all 10 unique names are present
      const guestNames = store.deck().map(g => g.name);
      expect(guestNames).toContain('Brian');
      expect(guestNames).toContain('Colin');
      expect(guestNames).toContain('Anthony');
      expect(guestNames).toContain('Emily');
      expect(guestNames).toContain('Rachelle');
      expect(guestNames).toContain('Teresa');
      expect(guestNames).toContain('Jacco');
      expect(guestNames).toContain('Jodie');
      expect(guestNames).toContain('Khalil');
      expect(guestNames).toContain('Renata');
      
      // Verify guest type composition
      const oldFriends = store.deck().filter(g => g.type === 'OLD_FRIEND');
      const wildBuddies = store.deck().filter(g => g.type === 'WILD_BUDDY');
      const richPals = store.deck().filter(g => g.type === 'RICH_PAL');
      expect(oldFriends.length).toBe(4);
      expect(wildBuddies.length).toBe(4);
      expect(richPals.length).toBe(2);
    });

    it('should show invite button during Party phase and hide during Buy phase', () => {
      fixture.detectChanges();
      store.initializeGame();
      fixture.detectChanges();
      
      // Buy phase - no invite button
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeNull();
      
      // Advance to Party phase
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      phaseButton.click();
      fixture.detectChanges();
      
      // Party phase - invite button appears
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
      expect(inviteButton.textContent.trim()).toBe('Invite Guest');
    });

    it('should invite guest from deck to party when button clicked', () => {
      fixture.detectChanges();
      store.initializeGame();
      
      // Advance to Party phase
      store.advancePhase();
      fixture.detectChanges();
      
      // Capture initial state
      const initialDeckSize = store.deck().length;
      const initialPartySize = store.party().length;
      const topGuest = store.deck()[0];
      
      // Click invite button
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      fixture.detectChanges();
      
      // Verify deck decreased and party increased
      expect(store.deck().length).toBe(initialDeckSize - 1);
      expect(store.party().length).toBe(initialPartySize + 1);
      
      // Verify the top guest was moved to party
      expect(store.party()[0]).toEqual(topGuest);
    });

    it('should display guest cards for all invited guests', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite 3 guests
      for (let i = 0; i < 3; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      // Verify 3 guest cards are displayed
      const guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(3);
      
      // Verify party has 3 guests
      expect(store.party().length).toBe(3);
    });

    it('should return all guests to deck when Party phase ends', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite 4 guests
      for (let i = 0; i < 4; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      // Verify state before phase transition
      expect(store.deck().length).toBe(6);
      expect(store.party().length).toBe(4);
      
      // End Party phase
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      phaseButton.click();
      fixture.detectChanges();
      
      // Verify all guests returned to deck
      expect(store.deck().length).toBe(10);
      expect(store.party().length).toBe(0);
      
      // Verify no guest cards displayed
      const guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(0);
    });

    it('should complete full cycle: invite guests → end party → invite again', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Turn 1: Party phase
      phaseButton.click();
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite 3 guests
      for (let i = 0; i < 3; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      expect(store.party().length).toBe(3);
      expect(store.deck().length).toBe(7);
      
      // End party - guests return to deck
      phaseButton.click();
      fixture.detectChanges();
      
      expect(store.party().length).toBe(0);
      expect(store.deck().length).toBe(10);
      
      // Turn 2: Party phase
      phaseButton.click();
      fixture.detectChanges();
      
      // Invite 2 guests
      const inviteButton2 = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 2; i++) {
        inviteButton2.click();
        fixture.detectChanges();
      }
      
      expect(store.party().length).toBe(2);
      expect(store.deck().length).toBe(8);
    });
  });

  describe('Guest Card Display and Ordering', () => {
    it('should display guest cards in reverse chronological order (newest first)', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Capture guest names as we invite them
      const invitedNames: string[] = [];
      for (let i = 0; i < 3; i++) {
        const topGuest = store.deck()[0];
        invitedNames.push(topGuest.name);
        inviteButton.click();
        fixture.detectChanges();
      }
      
      // Get displayed guest cards
      const guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      const displayedNames = Array.from(guestCards).map((card: any) => 
        card.querySelector('.card-caption').textContent.trim()
      );
      
      // Verify reverse order (newest first)
      expect(displayedNames).toEqual(invitedNames.reverse());
    });

    it('should display guest name and type header on each card', () => {
      fixture.detectChanges();
      store.initializeGame();
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite one guest
      const topGuest = store.deck()[0];
      const guestName = topGuest.name;
      const expectedHeader = topGuest.type === 'OLD_FRIEND' ? 'Old Friend' : topGuest.type === 'WILD_BUDDY' ? 'Wild Buddy' : 'Rich Pal';
      inviteButton.click();
      fixture.detectChanges();
      
      // Verify card content
      const guestCard = fixture.nativeElement.querySelector('app-guest-card');
      const header = guestCard.querySelector('.card-header');
      const caption = guestCard.querySelector('.card-caption');
      
      expect(header.textContent.trim()).toBe(expectedHeader);
      expect(caption.textContent.trim()).toBe(guestName);
    });

    it('should update guest card display when new guests are invited', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 }); // Prevent shutdown during test
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite first guest
      inviteButton.click();
      fixture.detectChanges();
      
      let guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(1);
      
      // Invite second guest
      inviteButton.click();
      fixture.detectChanges();
      
      guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(2);
      
      // Invite third guest
      inviteButton.click();
      fixture.detectChanges();
      
      guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(3);
    });

    it('should clear guest cards when party phase ends', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 });
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite all 10 guests
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      // Verify cards are displayed
      let guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(10);
      
      // End party phase
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      phaseButton.click();
      fixture.detectChanges();
      
      // Verify cards are cleared
      guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(0);
    });
  });

  describe('Empty Deck Handling', () => {
    it('should show "No more guests!" message when deck is empty and invite clicked', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 });
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite all 10 guests to empty the deck
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      expect(store.deck().length).toBe(0);
      expect(store.canInviteGuest()).toBe(false);
      
      // Try to invite when deck is empty
      inviteButton.click();
      fixture.detectChanges();
      
      // Verify message is displayed
      const message = fixture.nativeElement.querySelector('.empty-deck-message');
      expect(message).toBeTruthy();
      expect(message.textContent.trim()).toBe('No more guests!');
    });

    it('should not add guests to party when deck is empty', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 });
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite all 10 guests
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      expect(store.party().length).toBe(10);
      
      // Try to invite when deck is empty
      inviteButton.click();
      fixture.detectChanges();
      
      // Verify party size unchanged
      expect(store.party().length).toBe(10);
    });

    it('should replenish deck when party phase ends with empty deck', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 });
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Invite all 10 guests to empty the deck
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      expect(store.deck().length).toBe(0);
      expect(store.party().length).toBe(10);
      
      // End party phase
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      phaseButton.click();
      fixture.detectChanges();
      
      // Verify deck is replenished
      expect(store.deck().length).toBe(10);
      expect(store.party().length).toBe(0);
    });
  });

  describe('Guest Conservation Across Multiple Turns', () => {
    it('should maintain total of 10 guests across deck and party throughout game', () => {
      fixture.detectChanges();
      store.initializeGame(3);
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 }); // Prevent shutdown during conservation test
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Progress through 3 turns with random invitations
      for (let turn = 1; turn <= 3; turn++) {
        // Move to Party phase
        phaseButton.click();
        fixture.detectChanges();
        
        const inviteButton = fixture.nativeElement.querySelector('.invite-button');
        
        // Invite random number of guests (0-10)
        const inviteCount = Math.min(turn * 2, 10);
        for (let i = 0; i < inviteCount; i++) {
          if (store.canInviteGuest()) {
            inviteButton.click();
            fixture.detectChanges();
          }
        }
        
        // Verify conservation (deck + party + discard = 10)
        const total = store.deck().length + store.party().length + store.discard().length;
        expect(total).toBe(10);
        
        // End party phase
        phaseButton.click();
        fixture.detectChanges();
        
        // Verify conservation after phase transition
        expect(store.deck().length + store.discard().length).toBe(10);
        expect(store.party().length).toBe(0);
      }
    });

    it('should preserve guest identities across multiple turns', () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      // Capture initial guest names
      const initialNames = new Set(store.deck().map(g => g.name));
      expect(initialNames.size).toBe(10);
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Turn 1: Invite and return guests
      phaseButton.click(); // Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 3; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      phaseButton.click(); // End party
      fixture.detectChanges();
      
      // Verify same names after turn 1 (collect from all locations: deck + party + discard + bustPartySnapshot)
      const allNamesAfterTurn1 = new Set([
        ...store.deck().map(g => g.name),
        ...store.party().map(g => g.name),
        ...store.discard().map(g => g.name),
        ...store.bustPartySnapshot().map(g => g.name)
      ]);
      expect(allNamesAfterTurn1).toEqual(initialNames);
      
      // If a party shutdown occurred, complete the ban flow before continuing
      if (store.isPartyShutdown()) {
        store.acknowledgeShutdown();
        fixture.detectChanges();
      }
      if (store.isBanSelectionActive()) {
        store.selectGuestToBan(0);
        store.confirmBan();
        fixture.detectChanges();
      }
      
      // Turn 2: Invite and return guests
      phaseButton.click(); // Party phase
      fixture.detectChanges();
      
      const inviteButton2 = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 4; i++) {
        inviteButton2.click();
        fixture.detectChanges();
      }
      
      phaseButton.click(); // End party
      fixture.detectChanges();
      
      // Verify same names after turn 2 (collect from all locations: deck + party + discard + bustPartySnapshot)
      const allNamesAfterTurn2 = new Set([
        ...store.deck().map(g => g.name),
        ...store.party().map(g => g.name),
        ...store.discard().map(g => g.name),
        ...store.bustPartySnapshot().map(g => g.name)
      ]);
      expect(allNamesAfterTurn2).toEqual(initialNames);
    });
  });

  describe('UI Integration with Store State', () => {
    it('should synchronize invite button, guest cards, and store state', () => {
      fixture.detectChanges();
      store.initializeGame();
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      store.advancePhase(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      
      // Initial state
      expect(store.deck().length).toBe(10);
      expect(store.party().length).toBe(0);
      let guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(0);
      
      // Invite 1 guest
      inviteButton.click();
      fixture.detectChanges();
      
      expect(store.deck().length).toBe(9);
      expect(store.party().length).toBe(1);
      guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(1);
      
      // Invite 2 more guests
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      expect(store.deck().length).toBe(7);
      expect(store.party().length).toBe(3);
      guestCards = fixture.nativeElement.querySelectorAll('app-guest-card');
      expect(guestCards.length).toBe(3);
    });

    it('should update all UI elements when transitioning between phases', () => {
      fixture.detectChanges();
      store.initializeGame();
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      
      // Buy phase - no invite button, no guest cards
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      expect(fixture.nativeElement.querySelector('.invite-button')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('app-guest-card').length).toBe(0);
      
      // Party phase - invite button appears
      phaseButton.click();
      fixture.detectChanges();
      
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      expect(fixture.nativeElement.querySelector('.invite-button')).toBeTruthy();
      
      // Invite guests
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      expect(fixture.nativeElement.querySelectorAll('app-guest-card').length).toBe(2);
      
      // Back to Buy phase - invite button and cards disappear
      phaseButton.click();
      fixture.detectChanges();
      
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      expect(fixture.nativeElement.querySelector('.invite-button')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('app-guest-card').length).toBe(0);
    });
  });
});


/**
 * Integration Tests for Popularity Resource System
 * 
 * These tests verify the complete popularity system works correctly
 * end-to-end, including initialization, accumulation across turns,
 * and reset behavior.
 * 
 * **Validates: Requirements 1.1, 1.2, 6.3**
 */
describe('Popularity Resource System Integration Tests', () => {
  let component: GameplayComponent;
  let fixture: ComponentFixture<GameplayComponent>;
  let store: InstanceType<typeof GameStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameplayComponent, LandingPageComponent],
      providers: [
        provideRouter([
          { path: '', component: LandingPageComponent },
          { path: 'game', component: GameplayComponent }
        ])
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(GameplayComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
    
    // Reset store to initial state before each test
    store.resetGame();
  });

  describe('Complete Popularity Flow: Initialize → Party → Advance → Verify', () => {
    it('should initialize popularity to 0 and increase after party phase', () => {
      fixture.detectChanges();
      store.initializeGame(3);
      fixture.detectChanges();
      
      // Verify initial popularity is 0 (Requirement 1.1)
      expect(store.popularity()).toBe(0);
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Advance to Party phase
      phaseButton.click();
      fixture.detectChanges();
      
      // Invite 3 guests (mixed types due to shuffled deck)
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 3; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      // Check if a party shutdown was triggered (trouble exceeded limit)
      if (store.isPartyShutdown()) {
        // Shutdown occurred — popularity is NOT calculated on bust
        // Acknowledge shutdown and complete ban flow to advance turn
        store.acknowledgeShutdown();
        if (store.isBanSelectionActive() && store.bustPartySnapshot().length > 0) {
          store.selectGuestToBan(0);
          store.confirmBan();
        }
        fixture.detectChanges();
        
        // Popularity should still be 0 (bust doesn't calculate popularity)
        expect(store.popularity()).toBe(0);
        expect(store.party().length).toBe(0);
      } else {
        // Normal flow — party has 3 guests
        expect(store.party().length).toBe(3);
        
        // Popularity should still be 0 (not calculated yet)
        expect(store.popularity()).toBe(0);
        
        // Calculate expected popularity from actual party composition
        const expectedPopularity = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
        
        // End Party phase - this triggers popularity calculation
        phaseButton.click();
        fixture.detectChanges();
        
        // Verify popularity increased by sum of party guests' popularityValues
        expect(store.popularity()).toBe(expectedPopularity);
        
        // Verify guests returned to deck
        expect(store.party().length).toBe(0);
        expect(store.deck().length).toBe(10);
      }
    });

    it('should accumulate popularity correctly across multiple turns', () => {
      fixture.detectChanges();
      store.initializeGame(3);
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      fixture.detectChanges();
      
      // Initial popularity is 0
      expect(store.popularity()).toBe(0);
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Turn 1: Invite 2 guests
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      expect(store.party().length).toBe(2);
      
      const turn1Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Popularity should equal turn 1 party's total popularityValue
      expect(store.popularity()).toBe(turn1Pop);
      expect(store.currentTurn()).toBe(2);
      
      // Turn 2: Invite 3 guests
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      expect(store.party().length).toBe(3);
      
      const turn2Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Popularity should accumulate (Requirement 6.3)
      expect(store.popularity()).toBe(turn1Pop + turn2Pop);
      expect(store.currentTurn()).toBe(3);
      
      // Turn 3: Invite 1 guest
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      fixture.detectChanges();
      
      expect(store.party().length).toBe(1);
      
      const turn3Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      
      phaseButton.click(); // End Party phase (game complete)
      fixture.detectChanges();
      
      // Popularity should accumulate (Requirement 6.3)
      expect(store.popularity()).toBe(turn1Pop + turn2Pop + turn3Pop);
      expect(store.isGameComplete()).toBe(true);
    });

    it('should reset popularity to 0 when game is reset', () => {
      fixture.detectChanges();
      store.initializeGame(2);
      patchState(store, { baseTroubleLimit: 100 });
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Build up some popularity
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 4; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Verify popularity increased
      expect(store.popularity()).toBeGreaterThan(0);
      
      // Reset the game (Requirement 1.2)
      store.resetGame();
      fixture.detectChanges();
      
      // Verify popularity is back to 0
      expect(store.popularity()).toBe(0);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
    });

    it('should handle empty party (no guests invited) without changing popularity', () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Initial popularity is 0
      expect(store.popularity()).toBe(0);
      
      // Turn 1: Don't invite any guests
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      expect(store.party().length).toBe(0);
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Popularity should remain 0 (no guests = no change)
      expect(store.popularity()).toBe(0);
      
      // Turn 2: Invite 2 guests
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();

      // Put the most popular guests on top so the 2 invited guests always grant popularity
      patchState(store, { deck: sortByPopularityDescending(store.deck()) });

      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Popularity should now be non-zero
      const popAfterTurn1 = store.popularity();
      expect(popAfterTurn1).toBeGreaterThan(0);
    });

    it('should preserve popularity during Buy → Party phase transition', () => {
      fixture.detectChanges();
      store.initializeGame(3);
      patchState(store, { baseTroubleLimit: 100 }); // Prevent shutdown during test
      // Put the most popular guests on top so the 2 invited guests always grant popularity
      patchState(store, { deck: sortByPopularityDescending(store.deck()) });
      fixture.detectChanges();

      const phaseButton = fixture.nativeElement.querySelector('.phase-button');

      // Build up some popularity in turn 1
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      const popAfterTurn1 = store.popularity();
      expect(popAfterTurn1).toBeGreaterThan(0);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      
      // Advance to Party phase (should not change popularity)
      phaseButton.click();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.popularity()).toBe(popAfterTurn1); // Should remain unchanged
    });
  });

  describe('Popularity Display in Status Pane', () => {
    it('should display popularity value in status pane throughout game', () => {
      fixture.detectChanges();
      store.initializeGame(2);
      fixture.detectChanges();
      
      // Check initial display
      let popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityDisplay.textContent.trim()).toBe('0');
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Turn 1: Invite 3 guests
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      // Popularity display should still show 0 (not calculated yet)
      popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityDisplay.textContent.trim()).toBe('0');
      
      const turn1Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Popularity display should now show turn 1 popularity
      popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityDisplay.textContent.trim()).toBe(turn1Pop.toString());
      
      // Turn 2: Invite 2 guests
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();
      
      // Display should still show turn 1 popularity
      popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityDisplay.textContent.trim()).toBe(turn1Pop.toString());
      
      const inviteButton2 = fixture.nativeElement.querySelector('.invite-button');
      inviteButton2.click();
      inviteButton2.click();
      fixture.detectChanges();
      
      const turn2Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Popularity display should now show accumulated popularity
      popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityDisplay.textContent.trim()).toBe((turn1Pop + turn2Pop).toString());
    });

    it('should update popularity display when game is reset', () => {
      fixture.detectChanges();
      store.initializeGame(1);
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      
      // Build up popularity
      phaseButton.click(); // Move to Party phase
      fixture.detectChanges();

      // Put the most popular guests on top so the 2 invited guests always grant popularity
      patchState(store, { deck: sortByPopularityDescending(store.deck()) });

      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      inviteButton.click();
      fixture.detectChanges();
      
      phaseButton.click(); // End Party phase
      fixture.detectChanges();
      
      // Verify popularity display shows non-zero value
      let popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      const popValue = store.popularity();
      expect(popValue).toBeGreaterThan(0);
      expect(popularityDisplay.textContent.trim()).toBe(popValue.toString());
      
      // Reset game
      store.resetGame();
      fixture.detectChanges();
      
      // Verify popularity display shows 0
      popularityDisplay = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityDisplay.textContent.trim()).toBe('0');
    });
  });

  describe('Long Game Popularity Accumulation', () => {
    it('should correctly accumulate popularity over 5 turns with varying party sizes', () => {
      fixture.detectChanges();
      store.initializeGame(5);
      patchState(store, { baseTroubleLimit: 100 });
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      const guestCounts = [1, 2, 3, 4, 5]; // Guests to invite each turn
      let expectedPopularity = 0;
      
      for (let turn = 0; turn < 5; turn++) {
        // Move to Party phase
        phaseButton.click();
        fixture.detectChanges();
        
        // Invite specified number of guests
        const inviteButton = fixture.nativeElement.querySelector('.invite-button');
        for (let i = 0; i < guestCounts[turn]; i++) {
          inviteButton.click();
          fixture.detectChanges();
        }
        
        // Calculate expected popularity from actual party composition
        const turnPop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
        
        // End Party phase
        phaseButton.click();
        fixture.detectChanges();
        
        // Update expected popularity
        expectedPopularity += turnPop;
        
        // Verify popularity accumulated correctly
        expect(store.popularity()).toBe(expectedPopularity);
      }
      
      // Final popularity should match accumulated total
      expect(store.popularity()).toBe(expectedPopularity);
      expect(store.isGameComplete()).toBe(true);
    });

    it('should maintain popularity across 10 turns', () => {
      fixture.detectChanges();
      store.initializeGame(10);
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      let totalPopularity = 0;
      
      // Progress through 10 turns, inviting 2 guests each turn
      for (let turn = 1; turn <= 10; turn++) {
        phaseButton.click(); // Move to Party phase
        fixture.detectChanges();
        
        const inviteButton = fixture.nativeElement.querySelector('.invite-button');
        inviteButton.click();
        inviteButton.click();
        fixture.detectChanges();
        
        const turnPop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
        
        phaseButton.click(); // End Party phase
        fixture.detectChanges();
        
        totalPopularity += turnPop;
        expect(store.popularity()).toBe(totalPopularity);
      }
      
      // Final popularity should match accumulated total
      expect(store.popularity()).toBe(totalPopularity);
      expect(store.isGameComplete()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all guests invited every turn', () => {
      fixture.detectChanges();
      store.initializeGame(3);
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 });
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      let totalPopularity = 0;
      
      // Turn 1: Invite all 10 guests
      phaseButton.click();
      fixture.detectChanges();
      
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      // All 10 guests: 4 OLD_FRIEND(1) + 4 WILD_BUDDY(2) + 2 RICH_PAL(0) = 12
      const turn1Popularity = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      totalPopularity += turn1Popularity;
      
      phaseButton.click();
      fixture.detectChanges();
      
      expect(store.popularity()).toBe(totalPopularity);
      
      // Turn 2: Invite all 10 guests again
      phaseButton.click();
      fixture.detectChanges();
      
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      const turn2Popularity = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      totalPopularity += turn2Popularity;
      
      phaseButton.click();
      fixture.detectChanges();
      
      expect(store.popularity()).toBe(totalPopularity);
      
      // Turn 3: Invite all 10 guests again
      phaseButton.click();
      fixture.detectChanges();
      
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      const turn3Popularity = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      totalPopularity += turn3Popularity;
      
      phaseButton.click();
      fixture.detectChanges();
      
      expect(store.popularity()).toBe(totalPopularity);
      expect(store.isGameComplete()).toBe(true);
    });

    it('should handle alternating between empty and full parties', () => {
      fixture.detectChanges();
      store.initializeGame(4);
      patchState(store, { baseTroubleLimit: 100, houseCapacity: 100 });
      fixture.detectChanges();
      
      const phaseButton = fixture.nativeElement.querySelector('.phase-button');
      let totalPopularity = 0;
      
      // Turn 1: Empty party
      phaseButton.click();
      fixture.detectChanges();
      phaseButton.click();
      fixture.detectChanges();
      expect(store.popularity()).toBe(0);
      
      // Turn 2: Full party (10 guests)
      phaseButton.click();
      fixture.detectChanges();
      
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 10; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      const turn2Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      totalPopularity += turn2Pop;
      
      phaseButton.click();
      fixture.detectChanges();
      expect(store.popularity()).toBe(totalPopularity);
      
      // Turn 3: Empty party
      phaseButton.click();
      fixture.detectChanges();
      phaseButton.click();
      fixture.detectChanges();
      expect(store.popularity()).toBe(totalPopularity); // Should remain unchanged
      
      // Turn 4: Partial party (3 guests)
      phaseButton.click();
      fixture.detectChanges();
      
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      for (let i = 0; i < 3; i++) {
        inviteButton.click();
        fixture.detectChanges();
      }
      
      const turn4Pop = store.party().reduce((sum, g) => sum + g.properties.popularityValue, 0);
      totalPopularity += turn4Pop;
      
      phaseButton.click();
      fixture.detectChanges();
      expect(store.popularity()).toBe(totalPopularity);
      expect(store.isGameComplete()).toBe(true);
    });
  });
});
