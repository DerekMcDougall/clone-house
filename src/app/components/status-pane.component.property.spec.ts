import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GUEST_TYPE_DEFAULTS } from '../models/guest.model';
import { GameStore } from '../stores/game.store';
import { StatusPaneComponent } from './status-pane.component';

/**
 * Property-Based Tests for StatusPaneComponent
 * 
 * These tests use fast-check to verify status pane component properties across
 * a wide range of generated game states, ensuring the component behaves
 * correctly for all possible valid configurations.
 */
describe('StatusPaneComponent - Property-Based Tests', () => {
  let component: StatusPaneComponent;
  let fixture: ComponentFixture<StatusPaneComponent>;
  let store: InstanceType<typeof GameStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPaneComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(StatusPaneComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
  });

  /**
   * Property 6: Status Pane Visibility Invariant
   * 
   * **Validates: Requirements 3.2**
   * 
   * For any game state in either Buy_Phase or Party_Phase, the status pane
   * component should be present in the rendered DOM.
   * 
   * This property test generates random game states (different turns and phases),
   * initializes GameStore with random configurations, creates StatusPaneComponent
   * fixture, and verifies the status-pane element is present in the DOM.
   * It runs at least 100 iterations to ensure the status pane is always visible
   * regardless of game state.
   */
  describe('Property 6: Status Pane Visibility Invariant', () => {
    it('should always render status pane element in any game state', () => {
      // Feature: turn-based-gameplay-phases, Property 6: Status Pane Visibility Invariant
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalTurns
          fc.integer({ min: 0, max: 50 }),  // advanceCount
          (totalTurns, advanceCount) => {
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Advance to a random game state
            // Limit advances to avoid going past game completion
            const maxAdvances = (totalTurns * 2) - 1; // Max phases before completion
            const actualAdvances = Math.min(advanceCount, maxAdvances);
            
            for (let i = 0; i < actualAdvances; i++) {
              if (!store.isGameComplete()) {
                store.advancePhase();
              }
            }
            
            // Verify we're in a valid phase (BUY or PARTY)
            const currentPhase = store.currentPhase();
            expect([GamePhase.BUY, GamePhase.PARTY]).toContain(currentPhase);
            
            // Trigger change detection to render the component
            fixture.detectChanges();
            
            // Query for the status-pane element
            const statusPaneElement = fixture.nativeElement.querySelector('.status-pane');
            
            // Verify the status pane element is present in the DOM
            expect(statusPaneElement).toBeTruthy();
            expect(statusPaneElement).not.toBeNull();
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 7: Remaining Turns Display Accuracy
   * 
   * **Validates: Requirements 3.3**
   * 
   * For any game state, the remaining turns displayed in the status pane
   * should equal (totalTurns - currentTurn + 1).
   * 
   * This property test generates random game states with different turn counts
   * and current turns, initializes GameStore and advances to various states,
   * queries the turn-count element in the status pane, and verifies the
   * displayed value equals store.remainingTurns() and matches the formula.
   * It runs at least 100 iterations to ensure accuracy across all game states.
   */
  describe('Property 7: Remaining Turns Display Accuracy', () => {
    it('should display remaining turns equal to (totalTurns - currentTurn + 1)', () => {
      // Feature: turn-based-gameplay-phases, Property 7: Remaining Turns Display Accuracy
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalTurns
          fc.integer({ min: 0, max: 50 }),  // advanceCount
          (totalTurns, advanceCount) => {
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Advance to a random game state
            // Limit advances to avoid going past game completion
            const maxAdvances = (totalTurns * 2) - 1; // Max phases before completion
            const actualAdvances = Math.min(advanceCount, maxAdvances);
            
            for (let i = 0; i < actualAdvances; i++) {
              if (!store.isGameComplete()) {
                store.advancePhase();
              }
            }
            
            // Skip verification if game is complete (no remaining turns to display)
            if (store.isGameComplete()) {
              store.resetGame();
              return;
            }
            
            // Get expected values from store
            const currentTurn = store.currentTurn();
            const expectedRemainingTurns = store.remainingTurns();
            const expectedByFormula = totalTurns - currentTurn + 1;
            
            // Verify store's computed value matches formula
            expect(expectedRemainingTurns).toBe(expectedByFormula);
            
            // Trigger change detection to render the component
            fixture.detectChanges();
            
            // Query for the turn-count element
            const turnCountElement = fixture.nativeElement.querySelector('.turn-count');
            expect(turnCountElement).toBeTruthy();
            
            // Get displayed value and parse as number
            const displayedValue = parseInt(turnCountElement.textContent.trim(), 10);
            
            // Verify displayed value matches store's remainingTurns
            expect(displayedValue).toBe(expectedRemainingTurns);
            
            // Verify displayed value matches formula
            expect(displayedValue).toBe(expectedByFormula);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 8: Remaining Turns Update on Turn Completion
   * 
   * **Validates: Requirements 3.4**
   * 
   * For any game state where a turn completes (Party phase advances), the
   * displayed remaining turn count should decrease by exactly 1.
   * 
   * This property test generates random game states, captures the remaining
   * turns before advancing from Party phase, advances the phase to complete
   * the turn, and verifies the remaining turns decreased by exactly 1.
   * It runs at least 100 iterations to ensure turn completion always updates
   * the count correctly.
   */
  describe('Property 8: Remaining Turns Update on Turn Completion', () => {
    it('should decrease remaining turns by 1 when Party phase advances to next turn', () => {
      // Feature: turn-based-gameplay-phases, Property 8: Remaining Turns Update on Turn Completion
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }), // totalTurns (min 2 to allow turn completion)
          fc.integer({ min: 1, max: 50 }),  // currentTurn (starting turn)
          (totalTurns, startTurn) => {
            // Ensure we're not on the final turn (so we can complete a turn)
            const actualStartTurn = Math.min(startTurn, totalTurns - 1);
            
            // Initialize game
            store.initializeGame(totalTurns);
            
            // Advance to the desired turn and Party phase
            // Each turn has 2 phases: BUY -> PARTY
            // To get to turn N in PARTY phase: (N-1)*2 + 1 advances
            const advancesToReachTurn = (actualStartTurn - 1) * 2 + 1;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }
            
            // Verify we're in PARTY phase and not on final turn
            expect(store.currentPhase()).toBe(GamePhase.PARTY);
            expect(store.currentTurn()).toBe(actualStartTurn);
            expect(store.isFinalTurn()).toBe(false);
            
            // Capture remaining turns before advancing
            fixture.detectChanges();
            const turnCountElementBefore = fixture.nativeElement.querySelector('.turn-count');
            const remainingTurnsBefore = parseInt(turnCountElementBefore.textContent.trim(), 10);
            
            // Advance phase (complete the turn)
            store.advancePhase();
            
            // Verify we moved to next turn's BUY phase
            expect(store.currentPhase()).toBe(GamePhase.BUY);
            expect(store.currentTurn()).toBe(actualStartTurn + 1);
            
            // Capture remaining turns after advancing
            fixture.detectChanges();
            const turnCountElementAfter = fixture.nativeElement.querySelector('.turn-count');
            const remainingTurnsAfter = parseInt(turnCountElementAfter.textContent.trim(), 10);
            
            // Verify remaining turns decreased by exactly 1
            expect(remainingTurnsAfter).toBe(remainingTurnsBefore - 1);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 10: Buy Phase Button Label
   * 
   * **Validates: Requirements 4.2**
   * 
   * For any game state where the current phase is Buy_Phase, the phase button
   * label should be "Start Party".
   * 
   * This property test generates random game states in BUY phase, initializes
   * GameStore with various turn counts and advances to BUY phase states,
   * queries the phase button element, and verifies the button text is
   * "Start Party". It runs at least 100 iterations to ensure the label is
   * correct across all BUY phase states.
   */
  describe('Property 10: Buy Phase Button Label', () => {
    it('should display "Start Party" button label when in BUY phase', () => {
      // Feature: turn-based-gameplay-phases, Property 10: Buy Phase Button Label
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalTurns
          fc.integer({ min: 1, max: 50 }),  // targetTurn
          (totalTurns, targetTurn) => {
            // Ensure target turn is within bounds
            const actualTargetTurn = Math.min(targetTurn, totalTurns);
            
            // Initialize game
            store.initializeGame(totalTurns);
            
            // Advance to the desired turn in BUY phase
            // To get to turn N in BUY phase: (N-1)*2 advances
            const advancesToReachTurn = (actualTargetTurn - 1) * 2;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }
            
            // Verify we're in BUY phase
            expect(store.currentPhase()).toBe(GamePhase.BUY);
            expect(store.currentTurn()).toBe(actualTargetTurn);
            
            // Trigger change detection
            fixture.detectChanges();
            
            // Query for the phase button
            const phaseButton = fixture.nativeElement.querySelector('.phase-button');
            expect(phaseButton).toBeTruthy();
            
            // Verify button label is "Start Party"
            const buttonText = phaseButton.textContent.trim();
            expect(buttonText).toBe('Start Party');
            
            // Also verify the store's computed value
            expect(store.phaseButtonLabel()).toBe('Start Party');
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 12: Party Phase Button Label on Non-Final Turn
   * 
   * **Validates: Requirements 5.2**
   * 
   * For any game state where the current phase is Party_Phase and the current
   * turn is not the final turn, the phase button label should be "End Party".
   * 
   * This property test generates random game states in PARTY phase (non-final),
   * initializes GameStore with various turn counts, advances to PARTY phase
   * states that are not the final turn, queries the phase button element, and
   * verifies the button text is "End Party". It runs at least 100 iterations
   * to ensure the label is correct across all non-final PARTY phase states.
   */
  describe('Property 12: Party Phase Button Label on Non-Final Turn', () => {
    it('should display "End Party" button label when in PARTY phase on non-final turn', () => {
      // Feature: turn-based-gameplay-phases, Property 12: Party Phase Button Label on Non-Final Turn
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }), // totalTurns (min 2 to have non-final turns)
          fc.integer({ min: 1, max: 50 }),  // targetTurn
          (totalTurns, targetTurn) => {
            // Ensure target turn is not the final turn
            const actualTargetTurn = Math.min(targetTurn, totalTurns - 1);
            
            // Initialize game
            store.initializeGame(totalTurns);
            
            // Advance to the desired turn in PARTY phase
            // To get to turn N in PARTY phase: (N-1)*2 + 1 advances
            const advancesToReachTurn = (actualTargetTurn - 1) * 2 + 1;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }
            
            // Verify we're in PARTY phase and not on final turn
            expect(store.currentPhase()).toBe(GamePhase.PARTY);
            expect(store.currentTurn()).toBe(actualTargetTurn);
            expect(store.isFinalTurn()).toBe(false);
            
            // Trigger change detection
            fixture.detectChanges();
            
            // Query for the phase button
            const phaseButton = fixture.nativeElement.querySelector('.phase-button');
            expect(phaseButton).toBeTruthy();
            
            // Verify button label is "End Party"
            const buttonText = phaseButton.textContent.trim();
            expect(buttonText).toBe('End Party');
            
            // Also verify the store's computed value
            expect(store.phaseButtonLabel()).toBe('End Party');
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 13: Final Turn Button Label
   * 
   * **Validates: Requirements 6.1**
   * 
   * For any game state where the current phase is Party_Phase and the current
   * turn is the final turn, the phase button label should be "Game Over".
   * 
   * This property test generates random game states with various turn counts,
   * advances to the final turn's PARTY phase, queries the phase button element,
   * and verifies the button text is "Game Over". It runs at least 100 iterations
   * to ensure the label is correct for all final turn scenarios.
   */
  describe('Property 13: Final Turn Button Label', () => {
    it('should display "Game Over" button label when in PARTY phase on final turn', () => {
      // Feature: turn-based-gameplay-phases, Property 13: Final Turn Button Label
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalTurns
          (totalTurns) => {
            // Initialize game
            store.initializeGame(totalTurns);
            
            // Advance to the final turn in PARTY phase
            // To get to final turn (totalTurns) in PARTY phase: (totalTurns-1)*2 + 1 advances
            const advancesToReachFinalParty = (totalTurns - 1) * 2 + 1;
            for (let i = 0; i < advancesToReachFinalParty; i++) {
              store.advancePhase();
            }
            
            // Verify we're in PARTY phase on the final turn
            expect(store.currentPhase()).toBe(GamePhase.PARTY);
            expect(store.currentTurn()).toBe(totalTurns);
            expect(store.isFinalTurn()).toBe(true);
            
            // Trigger change detection
            fixture.detectChanges();
            
            // Query for the phase button
            const phaseButton = fixture.nativeElement.querySelector('.phase-button');
            expect(phaseButton).toBeTruthy();
            
            // Verify button label is "Game Over"
            const buttonText = phaseButton.textContent.trim();
            expect(buttonText).toBe('Game Over');
            
            // Also verify the store's computed value
            expect(store.phaseButtonLabel()).toBe('Game Over');
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 2: Status Pane Displays Current Popularity
   * 
   * **Validates: Requirements 3.1, 3.3**
   * 
   * For any game state with a popularity value, the StatusPaneComponent should
   * display that exact popularity value in its rendered output.
   * 
   * This property test generates random game states by simulating multiple turns
   * with party phases that accumulate popularity. It verifies that the displayed
   * popularity value in the status pane always matches the store's popularity value.
   * It runs at least 100 iterations to ensure the display is accurate across
   * all possible popularity values.
   */
  describe('Property 2: Status Pane Displays Current Popularity', () => {
    it('should display the exact popularity value from the store', () => {
      // Feature: popularity-resource-system, Property 2: Status Pane Displays Current Popularity
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),  // totalTurns
          fc.integer({ min: 0, max: 20 }),  // number of turns to complete
          (totalTurns, turnsToComplete) => {
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Complete a random number of turns to accumulate popularity
            // Each turn: BUY phase -> PARTY phase (with guests) -> advance (calculate popularity)
            const actualTurns = Math.min(turnsToComplete, totalTurns);
            
            for (let turn = 0; turn < actualTurns; turn++) {
              // Advance to PARTY phase
              if (store.currentPhase() === GamePhase.BUY) {
                store.advancePhase();
              }
              
              // Invite random number of guests (0 to deck size)
              const deckSize = store.deck().length;
              const guestsToInvite = turn % (deckSize + 1); // Varies by turn
              
              for (let i = 0; i < guestsToInvite; i++) {
                if (store.deck().length > 0) {
                  store.inviteGuest();
                }
              }
              
              // Advance from PARTY phase to calculate popularity
              if (!store.isGameComplete()) {
                store.advancePhase();
              }
            }
            
            // Skip if game is complete
            if (store.isGameComplete()) {
              store.resetGame();
              return;
            }
            
            // Get the current popularity from the store
            const expectedPopularity = store.popularity();
            
            // Trigger change detection to render the component
            fixture.detectChanges();
            
            // Query for the popularity-count element
            const popularityElement = fixture.nativeElement.querySelector('.popularity-count');
            expect(popularityElement).toBeTruthy();
            
            // Get displayed value and parse as number
            const displayedValue = parseInt(popularityElement.textContent.trim(), 10);
            
            // Verify displayed value matches store's popularity
            expect(displayedValue).toBe(expectedPopularity);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 5: Status Pane Displays Current Money
   * 
   * **Validates: Requirements 7.1, 7.3**
   * 
   * For any game state with a money value, the StatusPaneComponent SHALL display
   * that exact money value in its rendered output.
   * 
   * This property test generates random non-negative money values, sets them
   * directly in the store via patchState, renders the component, and verifies
   * the .money-count element displays the exact value from the store.
   * It runs at least 100 iterations.
   */
  describe('Property 5: Status Pane Displays Current Money', () => {
    it('should display the exact money value from the store', () => {
      // Feature: rich-pal-money-resource, Property 5: Status Pane Displays Current Money
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }), // random non-negative money value
          (moneyValue) => {
            // Initialize game so the component has a valid state
            store.initializeGame();

            // Set money to the generated value
            patchState(store, { money: moneyValue });

            // Trigger change detection to render the component
            fixture.detectChanges();

            // Query for the money-count element
            const moneyElement = fixture.nativeElement.querySelector('.money-count');
            expect(moneyElement).toBeTruthy();

            // Get displayed value and parse as number
            const displayedValue = parseInt(moneyElement.textContent.trim(), 10);

            // Verify displayed value matches the store's money
            expect(displayedValue).toBe(store.money());
            expect(displayedValue).toBe(moneyValue);

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 3: Trouble Displayed During Party Phase
   * 
   * **Validates: Requirements 6.1, 6.3**
   * 
   * For any game state where the current phase is PARTY, the StatusPaneComponent
   * SHALL render an element displaying the current trouble value.
   * 
   * This property test generates random game states during Party phase with
   * varying numbers of invited guests, renders StatusPaneComponent, and verifies
   * the trouble-count element is present and displays the correct trouble value
   * matching store.trouble(). It runs at least 100 iterations.
   */
  describe('Property 3: Trouble Displayed During Party Phase', () => {
    it('should display trouble value element during Party phase matching store.trouble()', () => {
      // Feature: wild-buddy-trouble-resource, Property 3: Trouble Displayed During Party Phase
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),  // totalTurns
          fc.integer({ min: 1, max: 50 }),  // targetTurn
          fc.integer({ min: 0, max: 10 }),   // number of guests to invite
          (totalTurns, targetTurn, guestsToInvite) => {
            // Ensure target turn is within bounds
            const actualTargetTurn = Math.min(targetTurn, totalTurns);

            // Initialize game
            store.initializeGame(totalTurns);

            // Advance to the desired turn in PARTY phase
            // To get to turn N in PARTY phase: (N-1)*2 + 1 advances
            const advancesToReachTurn = (actualTargetTurn - 1) * 2 + 1;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }

            // Verify we're in PARTY phase
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Invite a random number of guests
            const actualInvites = Math.min(guestsToInvite, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Trigger change detection to render the component
            fixture.detectChanges();

            // Query for the trouble-count element
            const troubleElement = fixture.nativeElement.querySelector('.trouble-count');

            // Verify the trouble-count element is present in the DOM
            expect(troubleElement).toBeTruthy();
            expect(troubleElement).not.toBeNull();

            // Verify the displayed trouble value matches store.trouble()
            const displayedValue = parseInt(troubleElement.textContent.trim(), 10);
            expect(displayedValue).toBe(store.trouble());

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 4: Trouble Hidden During Buy Phase
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any game state where the current phase is BUY, the StatusPaneComponent
   * SHALL NOT render the trouble display element.
   * 
   * This property test generates random game states during Buy phase with
   * varying turn counts, renders StatusPaneComponent, and verifies the
   * trouble-count element is NOT present in the DOM. It runs at least 100
   * iterations.
   */
  describe('Property 4: Trouble Hidden During Buy Phase', () => {
    it('should not display trouble-count element during Buy phase', () => {
      // Feature: wild-buddy-trouble-resource, Property 4: Trouble Hidden During Buy Phase
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),  // totalTurns
          fc.integer({ min: 1, max: 50 }),  // targetTurn
          (totalTurns, targetTurn) => {
            // Ensure target turn is within bounds
            const actualTargetTurn = Math.min(targetTurn, totalTurns);

            // Initialize game
            store.initializeGame(totalTurns);

            // Advance to the desired turn in BUY phase
            // To get to turn N in BUY phase: (N-1)*2 advances
            const advancesToReachTurn = (actualTargetTurn - 1) * 2;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }

            // Verify we're in BUY phase
            expect(store.currentPhase()).toBe(GamePhase.BUY);

            // Trigger change detection to render the component
            fixture.detectChanges();

            // Query for the trouble-count element
            const troubleElement = fixture.nativeElement.querySelector('.trouble-count');

            // Verify the trouble-count element is NOT present in the DOM
            expect(troubleElement).toBeNull();

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 7: Button Visibility Matches Phase
   * 
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any game state, the "Invite Guest" button should be visible if and only
   * if the current phase is PARTY.
   * 
   * This property test generates random game states with different phases,
   * initializes GameStore and advances to various states, queries the invite
   * button element, and verifies it's present when phase is PARTY and absent
   * otherwise. It runs at least 100 iterations to ensure button visibility
   * correctly matches the game phase.
   */
  describe('Property 7: Button Visibility Matches Phase', () => {
    it('should show Invite Guest button if and only if current phase is PARTY', () => {
      // Feature: party-guest-deck-system, Property 7: Button Visibility Matches Phase
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalTurns
          fc.integer({ min: 0, max: 50 }),  // advanceCount
          (totalTurns, advanceCount) => {
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Advance to a random game state
            // Limit advances to avoid going past game completion
            const maxAdvances = (totalTurns * 2) - 1; // Max phases before completion
            const actualAdvances = Math.min(advanceCount, maxAdvances);
            
            for (let i = 0; i < actualAdvances; i++) {
              if (!store.isGameComplete()) {
                store.advancePhase();
              }
            }
            
            // Skip if game is complete
            if (store.isGameComplete()) {
              store.resetGame();
              return;
            }
            
            // Get current phase
            const currentPhase = store.currentPhase();
            
            // Trigger change detection to render the component
            fixture.detectChanges();
            
            // Query for the invite button
            const inviteButton = fixture.nativeElement.querySelector('.invite-button');
            
            // Verify button visibility matches phase
            if (currentPhase === GamePhase.PARTY) {
              // Button should be visible during PARTY phase
              expect(inviteButton).toBeTruthy();
              expect(inviteButton).not.toBeNull();
              expect(inviteButton.textContent.trim()).toBe('Invite Guest');
            } else {
              // Button should not be visible during other phases
              expect(inviteButton).toBeNull();
            }
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 9: Status Pane Buttons Disabled During Shutdown
   *
   * **Validates: Requirements 6.6**
   *
   * For any game state where isPartyShutdown is true, the phase button and
   * invite button in the StatusPaneComponent SHALL be disabled.
   */
  describe('Property 9: Status Pane Buttons Disabled During Shutdown', () => {
    it('should disable phase button and invite button when isPartyShutdown is true', () => {
      // Feature: trouble-limit-party-shutdown, Property 9: Status Pane Buttons Disabled During Shutdown
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // totalTurns
          fc.integer({ min: 1, max: 50 }), // targetTurn
          (totalTurns, targetTurn) => {
            const actualTurn = Math.min(targetTurn, totalTurns);

            // Initialize game and advance to PARTY phase at the target turn
            store.initializeGame(totalTurns);
            const advancesToReachTurn = (actualTurn - 1) * 2;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }
            // BUY -> PARTY
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Set shutdown state
            patchState(store, { isPartyShutdown: true });
            fixture.detectChanges();

            // Verify phase button is disabled
            const phaseButton = fixture.nativeElement.querySelector('.phase-button');
            expect(phaseButton).toBeTruthy();
            expect(phaseButton.disabled).toBe(true);

            // Verify invite button is disabled
            const inviteButton = fixture.nativeElement.querySelector('.invite-button');
            expect(inviteButton).toBeTruthy();
            expect(inviteButton.disabled).toBe(true);

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 10: Trouble Display Format During Party Phase
   *
   * **Validates: Requirements 7.1, 7.3**
   *
   * For any game state during the Party phase with trouble value T and effective
   * trouble limit L, the StatusPaneComponent SHALL display the trouble as
   * "{T} / {L}".
   */
  /**
   * Property 5: Status Pane Buttons Disabled During Ban Selection
   *
   * **Validates: Requirements 3.5**
   *
   * For any game state where isBanSelectionActive is true, the phase button and
   * invite button in the StatusPaneComponent SHALL be disabled.
   */
  describe('Property 5: Status Pane Buttons Disabled During Ban Selection', () => {
    it('should disable phase button and invite button when isBanSelectionActive is true', () => {
      // Feature: ban-guest-after-bust, Property 5: Status Pane Buttons Disabled During Ban Selection
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // totalTurns
          fc.integer({ min: 1, max: 50 }), // targetTurn
          (totalTurns, targetTurn) => {
            const actualTurn = Math.min(targetTurn, totalTurns);

            // Initialize game and advance to PARTY phase at the target turn
            store.initializeGame(totalTurns);
            const advancesToReachTurn = (actualTurn - 1) * 2;
            for (let i = 0; i < advancesToReachTurn; i++) {
              store.advancePhase();
            }
            // BUY -> PARTY
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Set ban selection active state
            patchState(store, { isBanSelectionActive: true });
            fixture.detectChanges();

            // Verify phase button is disabled
            const phaseButton = fixture.nativeElement.querySelector('.phase-button');
            expect(phaseButton).toBeTruthy();
            expect(phaseButton.disabled).toBe(true);

            // Verify invite button is disabled
            const inviteButton = fixture.nativeElement.querySelector('.invite-button');
            expect(inviteButton).toBeTruthy();
            expect(inviteButton.disabled).toBe(true);

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  describe('Property 10: Trouble Display Format During Party Phase', () => {
    it('should display trouble in "{trouble} / {effectiveLimit}" format during Party phase', () => {
      // Feature: trouble-limit-party-shutdown, Property 10: Trouble Display Format During Party Phase
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),  // baseTroubleLimit
          fc.integer({ min: 0, max: 5 }),   // peaceGuestCount (replaces partyTroubleLimitModifier)
          fc.integer({ min: 0, max: 10 }),  // number of guests to invite
          (baseTroubleLimit, peaceGuestCount, guestsToInvite) => {
            // Initialize game and advance to PARTY phase
            store.initializeGame();
            store.advancePhase(); // BUY -> PARTY
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Invite some guests to generate trouble
            const actualInvites = Math.min(guestsToInvite, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Set base trouble limit and add peace guests to party
            const currentParty = store.party();
            const peaceGuests: Guest[] = Array.from({ length: peaceGuestCount }, (_, i) => ({
              type: 'HIPPY' as const,
              name: `Hippy${i}`,
              properties: { ...GUEST_TYPE_DEFAULTS['HIPPY'] }
            }));
            patchState(store, { baseTroubleLimit, party: [...currentParty, ...peaceGuests] });
            fixture.detectChanges();

            // Read the expected values from the store
            const expectedTrouble = store.trouble();
            const expectedLimit = store.effectiveTroubleLimit();

            // Query the trouble-count element
            const troubleElement = fixture.nativeElement.querySelector('.trouble-count');
            expect(troubleElement).toBeTruthy();

            // Verify the displayed text matches "{trouble} / {limit}" format
            const displayedText = troubleElement.textContent.trim();
            expect(displayedText).toBe(`${expectedTrouble} / ${expectedLimit}`);

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });
});
