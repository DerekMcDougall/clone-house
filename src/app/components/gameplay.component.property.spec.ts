import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import * as fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameStore } from '../stores/game.store';
import { GameplayComponent } from './gameplay.component';

/**
 * Property-Based Tests for GameplayComponent
 * 
 * These tests use fast-check to verify gameplay component properties across
 * a wide range of generated inputs, ensuring the component behaves correctly
 * for all possible valid game configurations.
 */
describe('GameplayComponent - Property-Based Tests', () => {
  let component: GameplayComponent;
  let store: InstanceType<typeof GameStore>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameplayComponent],
      providers: [
        provideRouter([
          { path: '', component: GameplayComponent },
          { path: 'gameplay', component: GameplayComponent }
        ])
      ]
    }).compileComponents();
    
    store = TestBed.inject(GameStore);
    router = TestBed.inject(Router);
    
    // Spy on router.navigate
    vi.spyOn(router, 'navigate');
  });

  /**
   * Property 14: Navigation on Game Completion
   * 
   * **Validates: Requirements 6.3**
   * 
   * For any game state that transitions to isGameComplete = true, the application
   * should navigate to the landing page route ('/').
   * 
   * This property test generates random turn counts, completes games by advancing
   * through all turns, and verifies that navigation to '/' is triggered when the
   * game completes. The test ensures that regardless of the number of turns,
   * game completion always triggers the correct navigation behavior.
   */
  describe('Property 14: Navigation on Game Completion', () => {
    it('should navigate to landing page when game completes for any turn count', async () => {
      // Feature: turn-based-gameplay-phases, Property 14: Navigation on Game Completion
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }),
          async (totalTurns) => {
            // Reset store and router spy for each iteration
            store.resetGame();
            vi.clearAllMocks();
            
            // Initialize with random turn count BEFORE creating component
            store.initializeGame(totalTurns);
            
            // Create a fresh component instance
            const fixture = TestBed.createComponent(GameplayComponent);
            component = fixture.componentInstance;
            
            // Trigger component initialization (this calls ngOnInit in proper context)
            // Note: ngOnInit will call initializeGame() again, resetting to default 25 turns
            // We need to re-initialize after component creation
            fixture.detectChanges();
            
            // Re-initialize with our test turn count after component init
            store.initializeGame(totalTurns);
            
            // Verify game is not complete initially
            expect(store.isGameComplete()).toBe(false);
            expect(router.navigate).not.toHaveBeenCalled();
            
            // Advance through all turns to complete the game
            for (let turn = 1; turn <= totalTurns; turn++) {
              // BUY -> PARTY
              store.advancePhase();
              expect(store.currentPhase()).toBe('PARTY');
              
              // PARTY -> next turn or completion
              store.advancePhase();
              
              if (turn < totalTurns) {
                // Not final turn yet
                expect(store.isGameComplete()).toBe(false);
                expect(store.currentTurn()).toBe(turn + 1);
                expect(store.currentPhase()).toBe('BUY');
              } else {
                // Final turn completed
                expect(store.isGameComplete()).toBe(true);
                expect(store.currentTurn()).toBe(totalTurns);
              }
            }
            
            // Wait for effect to trigger (effects run asynchronously)
            // Use longer timeout to ensure effect has time to run
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify navigation was called with correct route
            expect(router.navigate).toHaveBeenCalledWith(['/']);
            
            // Clean up
            fixture.destroy();
          }
        ),
        {
          numRuns: 100,
          timeout: 30000 // Increase timeout for async property test with fixture creation
        }
      );
    }, 30000); // Increase Vitest test timeout to 30 seconds
  });
});
