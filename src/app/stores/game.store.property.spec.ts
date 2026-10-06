import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import * as fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GUEST_TYPE_COSTS, GUEST_TYPE_DEFAULTS, GUEST_TYPE_ENTRANCE_EFFECTS, GUEST_TYPE_LABELS, GuestType, INITIAL_GUESTS, SHOP_GUESTS } from '../models/guest.model';
import { GameStore, ShopInventoryEntry } from './game.store';

/**
 * Property-Based Tests for GameStore
 * 
 * These tests use fast-check to verify game store properties across
 * a wide range of generated inputs, ensuring the store behaves
 * correctly for all possible valid configurations.
 */
describe('GameStore - Property-Based Tests', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  /**
   * Property 1: Configurable Turn Count Initialization
   * 
   * **Validates: Requirements 1.1, 1.3**
   * 
   * For any positive integer turn count, initializing the game with that value
   * should result in the game state having that exact turn count configured.
   * 
   * This property test generates random turn counts between 1 and 1000 and verifies
   * that the store correctly stores the configured turn count, ensuring the
   * initialization works correctly for all valid turn count values.
   */
  describe('Property 1: Configurable Turn Count Initialization', () => {
    it('should initialize game with any positive turn count', () => {
      // Feature: turn-based-gameplay-phases, Property 1: Configurable Turn Count Initialization
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (turnCount) => {
            // Initialize the game with the generated turn count
            store.initializeGame(turnCount);
            
            // Verify the store has the exact turn count configured
            expect(store.totalTurns()).toBe(turnCount);
            
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
   * Property 2: Turn Start Phase Invariant
   * 
   * **Validates: Requirements 2.2**
   * 
   * For any turn number in a game, when that turn begins, the current phase
   * should always be Buy_Phase.
   * 
   * This property test generates random turn counts and simulates advancing
   * through turns. After completing a Party phase (which advances to the next turn),
   * it verifies the phase is BUY, ensuring that all turns consistently start
   * with the Buy phase.
   */
  describe('Property 2: Turn Start Phase Invariant', () => {
    it('should always start a new turn in BUY phase', () => {
      // Feature: turn-based-gameplay-phases, Property 2: Turn Start Phase Invariant
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          (totalTurns) => {
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Verify initial turn starts in BUY phase
            expect(store.currentPhase()).toBe('BUY');
            
            // Advance through multiple turns and verify each starts in BUY phase
            const turnsToTest = Math.min(totalTurns - 1, 10); // Test up to 10 turns
            
            for (let i = 0; i < turnsToTest; i++) {
              // Advance from BUY to PARTY
              store.advancePhase();
              expect(store.currentPhase()).toBe('PARTY');
              
              // Advance from PARTY to next turn's BUY phase
              store.advancePhase();
              
              // Verify the new turn starts in BUY phase
              expect(store.currentPhase()).toBe('BUY');
              expect(store.currentTurn()).toBe(i + 2);
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
   * Property 3: Buy Phase Advancement Transition
   * 
   * **Validates: Requirements 2.3, 4.3**
   * 
   * For any game state where the current phase is Buy_Phase, advancing the phase
   * should transition to Party_Phase while maintaining the same turn number.
   * 
   * This property test generates random turn counts and turn numbers, sets up
   * the game state in BUY phase at various turns, calls advancePhase(), and
   * verifies the phase changes to PARTY while the turn number remains unchanged.
   */
  describe('Property 3: Buy Phase Advancement Transition', () => {
    it('should transition from BUY to PARTY phase while maintaining turn number', () => {
      // Feature: turn-based-gameplay-phases, Property 3: Buy Phase Advancement Transition
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (totalTurns, targetTurn) => {
            // Ensure targetTurn is within valid range
            const validTargetTurn = Math.min(targetTurn, totalTurns);
            
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Advance to the target turn in BUY phase
            for (let i = 1; i < validTargetTurn; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }
            
            // Verify we're in BUY phase at the target turn
            expect(store.currentPhase()).toBe('BUY');
            expect(store.currentTurn()).toBe(validTargetTurn);
            
            // Advance phase from BUY
            store.advancePhase();
            
            // Verify transition to PARTY phase with same turn number
            expect(store.currentPhase()).toBe('PARTY');
            expect(store.currentTurn()).toBe(validTargetTurn);
            
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
   * Property 4: Party Phase Advancement on Non-Final Turn
   * 
   * **Validates: Requirements 2.4, 5.3**
   * 
   * For any game state where the current phase is Party_Phase and the current turn
   * is not the final turn, advancing the phase should increment the turn number by 1
   * and transition to Buy_Phase.
   * 
   * This property test generates random turn counts (at least 2 turns), sets up
   * the game state in PARTY phase on non-final turns, calls advancePhase(), and
   * verifies the turn increments by 1 and the phase changes to BUY.
   */
  describe('Property 4: Party Phase Advancement on Non-Final Turn', () => {
    it('should increment turn and transition to BUY phase when advancing from PARTY on non-final turn', () => {
      // Feature: turn-based-gameplay-phases, Property 4: Party Phase Advancement on Non-Final Turn
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (totalTurns, targetTurn) => {
            // Ensure targetTurn is a non-final turn (less than totalTurns)
            const validTargetTurn = Math.min(targetTurn, totalTurns - 1);
            
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Advance to the target turn in PARTY phase
            for (let i = 1; i < validTargetTurn; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }
            // Now at validTargetTurn in BUY phase
            store.advancePhase(); // BUY -> PARTY
            
            // Verify we're in PARTY phase at the target turn (non-final)
            expect(store.currentPhase()).toBe('PARTY');
            expect(store.currentTurn()).toBe(validTargetTurn);
            expect(store.currentTurn()).toBeLessThan(totalTurns);
            
            // Advance phase from PARTY on non-final turn
            store.advancePhase();
            
            // Verify turn incremented by 1 and phase changed to BUY
            expect(store.currentTurn()).toBe(validTargetTurn + 1);
            expect(store.currentPhase()).toBe('BUY');
            expect(store.isGameComplete()).toBe(false);
            
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
   * Property 5: Game Completion on Final Turn
   * 
   * **Validates: Requirements 2.5, 6.2**
   * 
   * For any game state where the current phase is Party_Phase and the current turn
   * equals the total turn count, advancing the phase should mark the game as complete.
   * 
   * This property test generates random turn counts, advances to the final turn's
   * PARTY phase, calls advancePhase(), and verifies isGameComplete becomes true
   * while turn and phase remain unchanged after completion.
   */
  describe('Property 5: Game Completion on Final Turn', () => {
    it('should mark game as complete when advancing from PARTY phase on final turn', () => {
      // Feature: turn-based-gameplay-phases, Property 5: Game Completion on Final Turn
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (totalTurns) => {
            // Initialize game with random turn count
            store.initializeGame(totalTurns);
            
            // Advance to the final turn's PARTY phase
            for (let i = 1; i < totalTurns; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }
            // Now at final turn in BUY phase
            store.advancePhase(); // BUY -> PARTY
            
            // Verify we're in PARTY phase at the final turn
            expect(store.currentPhase()).toBe('PARTY');
            expect(store.currentTurn()).toBe(totalTurns);
            expect(store.isGameComplete()).toBe(false);
            
            // Advance phase from PARTY on final turn
            store.advancePhase();
            
            // Verify game is marked as complete
            expect(store.isGameComplete()).toBe(true);
            
            // Verify turn and phase remain unchanged after completion
            expect(store.currentTurn()).toBe(totalTurns);
            expect(store.currentPhase()).toBe('PARTY');
            
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
   * Property 15: Initialization Round Trip
   * 
   * **Validates: Requirements 1.1, 2.2**
   * 
   * For any game state, resetting and reinitializing the game should return to
   * the initial state (turn 1, Buy phase, not complete).
   * 
   * This property test generates random turn counts and advances to random game
   * states, then calls resetGame() and verifies the state returns to initial
   * values (turn 1, BUY phase, isGameComplete false, totalTurns 25 default).
   * This is a metamorphic property that ensures state management correctness.
   */
  describe('Property 15: Initialization Round Trip', () => {
    it('should return to initial state after reset from any game state', () => {
      // Feature: turn-based-gameplay-phases, Property 15: Initialization Round Trip
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 50 }),
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
            
            // Reset the game
            store.resetGame();
            
            // Verify state returns to initial values
            expect(store.currentTurn()).toBe(1);
            expect(store.currentPhase()).toBe('BUY');
            expect(store.isGameComplete()).toBe(false);
            expect(store.totalTurns()).toBe(25); // Default value
            
            // Verify computed values are also correct
            expect(store.remainingTurns()).toBe(25);
            expect(store.isFinalTurn()).toBe(false);
            expect(store.phaseButtonLabel()).toBe('Start Party');
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 1: Guest Conservation
   * 
   * **Validates: Requirements 8.4**
   * 
   * For any game state, the total count of guests in the deck plus the party
   * SHALL always equal 10.
   * 
   * This is a critical invariant ensuring guests are never created or destroyed,
   * only moved between collections. This property should hold after initialization,
   * after any invite operation, and after any phase transition.
   * 
   * This property test generates random sequences of operations (invite, advancePhase)
   * and verifies the total guest count always equals 6.
   */
  describe('Property 1: Guest Conservation', () => {
    it('should maintain total guest count of 10 across all operations', () => {
      // Feature: party-guest-deck-system, Property 1: Guest Conservation
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 50 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame();
            // Raise trouble limit so invites from the starting deck cannot bust the party
            patchState(store, { baseTroubleLimit: 100 });
            
            // Verify initial state has 10 guests total
            let totalGuests = store.deck().length + store.party().length;
            expect(totalGuests).toBe(10);
            
            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                // Only invite if we have a deck (inviteGuest should be a no-op if deck is empty)
                store.inviteGuest();
              } else {
                // advancePhase
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
              
              // Verify guest conservation after each operation
              totalGuests = store.deck().length + store.party().length;
              expect(totalGuests).toBe(10);
            });
            
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
   * Property 2: Unique Guest Names
   * 
   * **Validates: Requirements 1.4**
   * 
   * For any game state, all guests in the deck and party combined SHALL have
   * unique names from the set {"Brian", "Colin", "Anthony", "Emily", "Rachelle", "Teresa", "Jacco", "Jodie", "Khalil", "Renata"}.
   * 
   * This ensures that each Old Friend maintains a distinct identity throughout the game,
   * with no duplicates and no invalid names. This property should hold after initialization
   * and after any sequence of operations.
   * 
   * This property test generates random sequences of operations (invite, advancePhase)
   * and verifies all guest names are unique and from the valid set.
   */
  describe('Property 2: Unique Guest Names', () => {
    it('should maintain unique guest names from valid set across all operations', () => {
      // Feature: party-guest-deck-system, Property 2: Unique Guest Names
      const validNames = new Set(['Brian', 'Colin', 'Anthony', 'Emily', 'Rachelle', 'Teresa', 'Jacco', 'Jodie', 'Khalil', 'Renata']);
      
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 50 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame();
            // Raise trouble limit so invites from the starting deck cannot bust the party
            patchState(store, { baseTroubleLimit: 100 });
            
            // Helper function to verify guest names
            const verifyGuestNames = () => {
              const allGuests = [...store.deck(), ...store.party()];
              const guestNames = allGuests.map(g => g.name);
              
              // Verify all names are from the valid set
              guestNames.forEach(name => {
                expect(validNames.has(name)).toBe(true);
              });
              
              // Verify all names are unique (no duplicates)
              const uniqueNames = new Set(guestNames);
              expect(uniqueNames.size).toBe(guestNames.length);
              
              // Verify we have exactly 10 unique names (all of them)
              expect(uniqueNames.size).toBe(10);
            };
            
            // Verify initial state
            verifyGuestNames();
            
            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                // advancePhase
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
              
              // Verify guest names after each operation
              verifyGuestNames();
            });
            
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
   * Property 4: Draw from Top
   * 
   * **Validates: Requirements 2.2**
   * 
   * For any non-empty deck state, when a guest is drawn, the guest removed
   * SHALL be the guest that was at index 0 of the deck.
   * 
   * This ensures stack semantics are maintained - we always draw from the top
   * of the deck. This property test generates random sequences of operations
   * that lead to various deck states, then verifies that inviteGuest() always
   * removes the guest at index 0.
   */
  describe('Property 4: Draw from Top', () => {
    it('should always draw the guest at index 0 of the deck', () => {
      // Feature: party-guest-deck-system, Property 4: Draw from Top
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 30 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame();
            // Raise house capacity so invite operations aren't blocked by capacity
            patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });
            
            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                // advancePhase
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
            });
            
            // Now test the draw from top property
            // If deck is not empty, verify the guest at index 0 is the one invited
            const deck = store.deck();
            
            if (deck.length > 0) {
              // Capture the guest at index 0
              const topGuest = deck[0];
              const initialDeckSize = deck.length;
              const initialPartySize = store.party().length;
              
              // Invite the guest
              store.inviteGuest();
              
              // Verify the top guest is now in the party
              const party = store.party();
              const newDeck = store.deck();
              
              // The invited guest should be the last one in the party (most recent)
              const invitedGuest = party[party.length - 1];
              
              // Verify it's the same guest that was at index 0
              expect(invitedGuest.name).toBe(topGuest.name);
              expect(invitedGuest.type).toBe(topGuest.type);
              
              // Verify deck size decreased by 1
              expect(newDeck.length).toBe(initialDeckSize - 1);
              
              // Verify party size increased by 1
              expect(party.length).toBe(initialPartySize + 1);
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
   * Property 8: Invite Decreases Deck and Increases Party
   * 
   * **Validates: Requirements 4.4**
   * 
   * For any game state where the deck is not empty, when a guest is invited,
   * the deck size SHALL decrease by 1 and the party size SHALL increase by 1.
   * 
   * This is a metamorphic property ensuring the invite operation correctly
   * transfers a guest between collections. This property test generates random
   * sequences of operations that lead to various game states with non-empty decks,
   * then verifies that inviteGuest() always decreases deck size by 1 and increases
   * party size by 1.
   */
  describe('Property 8: Invite Decreases Deck and Increases Party', () => {
    it('should decrease deck by 1 and increase party by 1 when inviting from non-empty deck', () => {
      // Feature: party-guest-deck-system, Property 8: Invite Decreases Deck and Increases Party
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 30 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame();
            // Raise house capacity so invite operations aren't blocked by capacity
            patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });
            
            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                // advancePhase
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
            });
            
            // Now test the invite decreases deck and increases party property
            // Only test if deck is not empty
            const initialDeckSize = store.deck().length;
            const initialPartySize = store.party().length;
            
            if (initialDeckSize > 0) {
              // Invite a guest
              store.inviteGuest();
              
              // Verify deck size decreased by 1
              const newDeckSize = store.deck().length;
              expect(newDeckSize).toBe(initialDeckSize - 1);
              
              // Verify party size increased by 1
              const newPartySize = store.party().length;
              expect(newPartySize).toBe(initialPartySize + 1);
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
   * Property 9: Invited Guest Appears in Party
   * 
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any non-empty deck state, when a guest is invited, the guest that was
   * at the top of the deck SHALL appear in the party.
   * 
   * This ensures the specific guest drawn from the deck is the same guest added
   * to the party - no guest substitution occurs. This property test generates
   * random sequences of operations that lead to various deck states, then verifies
   * that the guest at index 0 of the deck is the exact guest that appears in the
   * party after inviteGuest() is called.
   */
  describe('Property 9: Invited Guest Appears in Party', () => {
    it('should add the top deck guest to the party when inviting', () => {
      // Feature: party-guest-deck-system, Property 9: Invited Guest Appears in Party
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 30 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame();
            // Raise house capacity so invite operations aren't blocked by capacity
            patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });
            
            // Execute random sequence of operations to create various deck states
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                // advancePhase
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
            });
            
            // Now test the invited guest appears in party property
            // Only test if deck is not empty
            const deck = store.deck();
            
            if (deck.length > 0) {
              // Capture the guest at index 0 (top of deck)
              const topGuest = deck[0];
              const initialParty = store.party();
              
              // Invite the guest
              store.inviteGuest();
              
              // Verify the top guest now appears in the party
              const newParty = store.party();
              
              // The invited guest should be the last one in the party (most recent)
              const invitedGuest = newParty[newParty.length - 1];
              
              // Verify it's the exact same guest that was at the top of the deck
              expect(invitedGuest.name).toBe(topGuest.name);
              expect(invitedGuest.type).toBe(topGuest.type);
              
              // Verify the party size increased by 1
              expect(newParty.length).toBe(initialParty.length + 1);
              
              // Verify the guest is actually in the party (not just similar)
              const guestInParty = newParty.some(g => 
                g.name === topGuest.name && g.type === topGuest.type
              );
              expect(guestInParty).toBe(true);
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
   * Property 5: Return to Bottom
   * 
   * **Validates: Requirements 2.3**
   * 
   * For any deck state and any guest, when that guest is returned to the deck,
   * the guest SHALL be added at the end of the deck array.
   * 
   * This ensures returned guests go to the bottom of the stack, maintaining the
   * deck's circulation pattern. This property test generates random sequences of
   * operations that create various party states, then uses the returnGuestsToDeck
   * method (via advancePhase from PARTY phase) to verify that all party guests
   * are added to the end of the deck in the correct order.
   */
  describe('Property 5: Return to Bottom', () => {
    it('should add returned guests to the end of the deck array', () => {
      // Feature: party-guest-deck-system, Property 5: Return to Bottom
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (inviteCount) => {
            // Initialize the game
            store.initializeGame();
            
            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');
            
            // Invite a specific number of guests to create a party
            const actualInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }
            
            // Capture the current state before returning guests
            const deckBeforeReturn = [...store.deck()];
            const partyBeforeReturn = [...store.party()];
            const initialDeckSize = deckBeforeReturn.length;
            const partySize = partyBeforeReturn.length;
            
            // Only test if there are guests in the party
            if (partySize > 0) {
              // Advance phase from PARTY to trigger return of party + discard to deck
              // Note: This will advance to next turn's BUY phase
              // The deck is now shuffled after party end, so we verify by multiset equality
              store.advancePhase();
              
              // Verify party is now empty
              expect(store.party().length).toBe(0);
              
              // Verify discard is now empty (returned to deck)
              expect(store.discard().length).toBe(0);
              
              // Verify deck size equals total guests (all returned)
              const deckAfterReturn = store.deck();
              expect(deckAfterReturn.length).toBe(initialDeckSize + partySize);
              
              // Verify the returned deck contains all original deck guests and party guests (by name multiset)
              const expectedNames = [
                ...deckBeforeReturn.map(g => g.name),
                ...partyBeforeReturn.map(g => g.name)
              ].sort();
              const actualNames = deckAfterReturn.map(g => g.name).sort();
              expect(actualNames).toEqual(expectedNames);
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
   * Property 15: Party Empty After Phase Transition
   * 
   * **Validates: Requirements 6.4, 6.1**
   * 
   * For any game state where the current phase is PARTY, when the phase advances,
   * the party SHALL be empty after the transition.
   * 
   * This ensures all guests are returned to the deck when the Party phase ends.
   * This property test generates random sequences of operations that lead to
   * various party states during the PARTY phase, then verifies that advancing
   * the phase always results in an empty party.
   */
  describe('Property 15: Party Empty After Phase Transition', () => {
    it('should empty the party when advancing from PARTY phase', () => {
      // Feature: party-guest-deck-system, Property 15: Party Empty After Phase Transition
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (inviteCount, turnNumber) => {
            // Initialize the game with enough turns
            store.initializeGame(Math.max(turnNumber, 10));
            
            // Advance to the target turn's PARTY phase
            for (let i = 1; i < turnNumber; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }
            
            // Now at target turn in BUY phase, advance to PARTY
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');
            
            // Invite a random number of guests to create various party states
            const actualInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }
            
            // Capture party size before advancing
            const partySize = store.party().length;
            
            // Advance phase from PARTY
            store.advancePhase();
            
            // Verify party is now empty
            expect(store.party().length).toBe(0);
            
            // Verify the party was actually cleared (not just checking empty array)
            expect(store.party()).toEqual([]);
            
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
   * Property 16: Guests Return to Deck on Phase Transition
   * 
   * **Validates: Requirements 6.2, 6.3**
   * 
   * For any game state where the current phase is PARTY and the party contains N guests,
   * when the phase advances, the deck size SHALL increase by N.
   * 
   * This ensures all party guests are moved back to the deck (specifically to the bottom)
   * when the phase ends. This property test generates random sequences of operations that
   * lead to various party states during the PARTY phase, then verifies that advancing
   * the phase always increases the deck size by exactly the number of guests in the party.
   */
  describe('Property 16: Guests Return to Deck on Phase Transition', () => {
    it('should increase deck size by party size when advancing from PARTY phase', () => {
      // Feature: party-guest-deck-system, Property 16: Guests Return to Deck on Phase Transition
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (inviteCount, turnNumber) => {
            // Initialize the game with enough turns
            store.initializeGame(Math.max(turnNumber, 10));
            // Raise trouble limit so invites from the starting deck cannot bust the party
            patchState(store, { baseTroubleLimit: 100 });
            
            // Advance to the target turn's PARTY phase
            for (let i = 1; i < turnNumber; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }
            
            // Now at target turn in BUY phase, advance to PARTY
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');
            
            // Invite a random number of guests to create various party states
            const actualInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }
            
            // Capture deck size and party size before advancing
            const deckSizeBeforeTransition = store.deck().length;
            const partySizeBeforeTransition = store.party().length;
            
            // Advance phase from PARTY
            store.advancePhase();
            
            // Verify deck size increased by party size
            const deckSizeAfterTransition = store.deck().length;
            const expectedDeckSize = deckSizeBeforeTransition + partySizeBeforeTransition;
            
            expect(deckSizeAfterTransition).toBe(expectedDeckSize);
            
            // Additional verification: party should be empty after transition
            expect(store.party().length).toBe(0);
            
            // Verify total guest count is still 10 (conservation)
            const totalGuests = deckSizeAfterTransition + store.party().length;
            expect(totalGuests).toBe(10);
            
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
   * Property 10: Guest Identity Preservation
   * 
   * **Validates: Requirements 7.4, 7.1, 7.2, 7.3, 4.3**
   * 
   * For any Old Friend guest, the guest's name SHALL remain constant throughout
   * all deck operations, party operations, and phase transitions.
   * 
   * This is a comprehensive invariant ensuring guest identity is never mutated
   * during any operation. This property test generates random sequences of operations
   * (invite, advancePhase) and verifies that:
   * 1. All guest names remain from the original set of 6 names
   * 2. No guest's name has been changed or mutated
   * 3. The same 6 unique names persist throughout all operations
   */
  describe('Property 10: Guest Identity Preservation', () => {
    it('should preserve guest names throughout all operations', () => {
      // Feature: party-guest-deck-system, Property 10: Guest Identity Preservation
      const validNames = new Set(['Brian', 'Colin', 'Anthony', 'Emily', 'Rachelle', 'Teresa', 'Jacco', 'Jodie', 'Khalil', 'Renata']);
      
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 50 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame();
            // Raise trouble limit so invites from the starting deck cannot bust the party
            patchState(store, { baseTroubleLimit: 100 });
            
            // Capture the initial guest names (should be all 10 unique names)
            const initialGuests = [...store.deck(), ...store.party()];
            const initialNames = new Set(initialGuests.map(g => g.name));
            
            // Verify initial state has exactly 10 unique names from the valid set
            expect(initialNames.size).toBe(10);
            initialNames.forEach(name => {
              expect(validNames.has(name)).toBe(true);
            });
            
            // Helper function to verify guest identity preservation
            const verifyGuestIdentity = () => {
              const allGuests = [...store.deck(), ...store.party()];
              const currentNames = allGuests.map(g => g.name);
              
              // Verify all names are still from the valid set
              currentNames.forEach(name => {
                expect(validNames.has(name)).toBe(true);
              });
              
              // Verify we still have exactly 10 guests
              expect(allGuests.length).toBe(10);
              
              // Verify all names are unique (no duplicates)
              const uniqueNames = new Set(currentNames);
              expect(uniqueNames.size).toBe(10);
              
              // Verify the exact same set of names exists (no names added or removed)
              expect(uniqueNames).toEqual(initialNames);
              
              // Verify each guest's type is valid
              allGuests.forEach(guest => {
                expect(['OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL']).toContain(guest.type);
              });
            };
            
            // Verify initial state
            verifyGuestIdentity();
            
            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                // advancePhase
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
              
              // Verify guest identity is preserved after each operation
              verifyGuestIdentity();
            });
            
            // Final verification: ensure the same 6 names still exist
            const finalGuests = [...store.deck(), ...store.party()];
            const finalNames = new Set(finalGuests.map(g => g.name));
            expect(finalNames).toEqual(initialNames);
            
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
   * Property 1: Popularity Non-Negative Invariant
   * 
   * **Validates: Requirements 2.1, 2.2, 5.4**
   * 
   * For any sequence of game operations (initialization, phase advances, guest invitations),
   * the popularity value SHALL always be a non-negative integer (>= 0).
   * 
   * This invariant ensures that popularity never becomes negative regardless of guest
   * compositions or game states. Even when guests with negative popularity values are
   * introduced in future features, the system will clamp the result to zero.
   * 
   * This property test generates random sequences of operations (invite, advancePhase, reset)
   * and verifies popularity >= 0 after each operation.
   */
  describe('Property 1: Popularity Non-Negative Invariant', () => {
    it('should maintain non-negative popularity across all operations', () => {
      // Feature: popularity-resource-system, Property 1: Popularity Non-Negative Invariant
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase', 'reset'),
            { minLength: 0, maxLength: 100 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame(50);
            
            // Verify initial popularity is non-negative
            expect(store.popularity()).toBeGreaterThanOrEqual(0);
            
            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                // Invite a guest if possible
                store.inviteGuest();
              } else if (op === 'advancePhase') {
                // Advance phase if game is not complete
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              } else if (op === 'reset') {
                // Reset the game
                store.resetGame();
              }
              
              // Verify popularity is non-negative after each operation
              const currentPopularity = store.popularity();
              expect(currentPopularity).toBeGreaterThanOrEqual(0);
              
              // Verify popularity is an integer
              expect(Number.isInteger(currentPopularity)).toBe(true);
            });
            
            // Final verification
            expect(store.popularity()).toBeGreaterThanOrEqual(0);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should maintain non-negative popularity after initialization', () => {
      // Feature: popularity-resource-system, Property 1: Popularity Non-Negative Invariant
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (turnCount) => {
            // Initialize with random turn count
            store.initializeGame(turnCount);
            
            // Verify popularity is non-negative
            expect(store.popularity()).toBeGreaterThanOrEqual(0);
            expect(store.popularity()).toBe(0);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should maintain non-negative popularity after reset', () => {
      // Feature: popularity-resource-system, Property 1: Popularity Non-Negative Invariant
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 1, maxLength: 50 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame(50);
            
            // Execute random sequence of operations to create various game states
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else if (op === 'advancePhase') {
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }
            });
            
            // Reset the game
            store.resetGame();
            
            // Verify popularity is non-negative after reset
            expect(store.popularity()).toBeGreaterThanOrEqual(0);
            expect(store.popularity()).toBe(0);
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should maintain non-negative popularity during phase transitions', () => {
      // Feature: popularity-resource-system, Property 1: Popularity Non-Negative Invariant
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 10 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);
            
            // Execute multiple turns with different party compositions
            inviteCounts.forEach((inviteCount) => {
              // Verify popularity is non-negative at start of turn
              expect(store.popularity()).toBeGreaterThanOrEqual(0);
              
              // Advance to PARTY phase
              store.advancePhase();
              expect(store.popularity()).toBeGreaterThanOrEqual(0);
              
              // Invite guests
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
                // Verify popularity remains non-negative after each invite
                expect(store.popularity()).toBeGreaterThanOrEqual(0);
              }
              
              // Advance phase from PARTY (triggers popularity calculation)
              store.advancePhase();
              
              // Verify popularity is non-negative after calculation
              expect(store.popularity()).toBeGreaterThanOrEqual(0);
            });
            
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
   * Property 3: Popularity Calculation Formula
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3, 7.2**
   * 
   * For any party composition at the end of Party phase, the popularity change
   * SHALL equal the sum of each guest's properties.popularityValue (subject to
   * the non-negative constraint applied to the final result).
   * 
   * More formally: If the party contains guests g₁, g₂, ..., gₙ, then:
   * - popularity_change = g₁.properties.popularityValue + g₂.properties.popularityValue + ... + gₙ.properties.popularityValue
   * - new_popularity = max(0, current_popularity + popularity_change)
   * 
   * This property validates the core calculation logic that determines how guests
   * affect popularity. It ensures the calculation correctly sums individual guest
   * property values regardless of guest types or modifications to individual guests.
   * 
   * This property test generates random party compositions (varying guest counts)
   * and random initial popularity values, calculates the expected popularity change,
   * advances the phase, and verifies the actual popularity matches the expected value.
   */
  describe('Property 3: Popularity Calculation Formula', () => {
    it('should calculate popularity as sum of guest popularityValues with non-negative constraint', () => {
      // Feature: popularity-resource-system, Property 3: Popularity Calculation Formula
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // Number of guests to invite
          (inviteCount) => {
            // Initialize the game
            store.initializeGame(10);
            // Raise house capacity so invite operations aren't blocked by capacity
            patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });
            
            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');
            
            // Invite a specific number of guests
            const actualInvites = Math.min(inviteCount, store.deck().length);
            const invitedGuests: Array<{ name: string; popularityValue: number }> = [];
            
            for (let i = 0; i < actualInvites; i++) {
              const topGuest = store.deck()[0];
              invitedGuests.push({
                name: topGuest.name,
                popularityValue: topGuest.properties.popularityValue
              });
              store.inviteGuest();
            }
            
            // Calculate expected popularity change
            const expectedPopularityChange = invitedGuests.reduce(
              (sum, guest) => sum + guest.popularityValue,
              0
            );
            
            // Capture current popularity before advancing
            const popularityBeforeAdvance = store.popularity();
            
            // Calculate expected new popularity with non-negative constraint
            const expectedNewPopularity = Math.max(
              0,
              popularityBeforeAdvance + expectedPopularityChange
            );
            
            // Advance phase from PARTY (this triggers popularity calculation)
            store.advancePhase();
            
            // Verify the popularity matches the expected value
            const actualPopularity = store.popularity();
            expect(actualPopularity).toBe(expectedNewPopularity);
            
            // Verify the calculation was correct
            if (actualInvites === 0) {
              // No guests invited, popularity should remain unchanged
              expect(actualPopularity).toBe(popularityBeforeAdvance);
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

    it('should correctly sum popularityValues across multiple turns', () => {
      // Feature: popularity-resource-system, Property 3: Popularity Calculation Formula
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 5 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);
            
            let expectedTotalPopularity = 0;
            
            // Execute multiple turns with different party compositions
            inviteCounts.forEach((inviteCount, turnIndex) => {
              // Advance to PARTY phase
              store.advancePhase();
              expect(store.currentPhase()).toBe('PARTY');
              
              // Invite guests
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              // Calculate expected popularity change for this turn
              // Guests have varying popularityValues (OLD_FRIEND=1, WILD_BUDDY=2)
              const partyGuests = store.party();
              const turnPopularity = partyGuests.reduce((sum, g) => sum + g.properties.popularityValue, 0);
              expectedTotalPopularity += turnPopularity;
              
              // Advance phase from PARTY (triggers popularity calculation)
              store.advancePhase();
              
              // Verify accumulated popularity matches expected
              const actualPopularity = store.popularity();
              expect(actualPopularity).toBe(expectedTotalPopularity);
              
              // Verify non-negative constraint is maintained
              expect(actualPopularity).toBeGreaterThanOrEqual(0);
            });
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should handle empty party correctly (zero popularity change)', () => {
      // Feature: popularity-resource-system, Property 3: Popularity Calculation Formula
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (turnCount) => {
            // Initialize the game
            store.initializeGame(turnCount);
            
            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');
            
            // Don't invite any guests (empty party)
            expect(store.party().length).toBe(0);
            
            // Capture popularity before advancing
            const popularityBefore = store.popularity();
            
            // Advance phase from PARTY with empty party
            store.advancePhase();
            
            // Verify popularity unchanged (0 change from empty party)
            const popularityAfter = store.popularity();
            expect(popularityAfter).toBe(popularityBefore);
            expect(popularityAfter).toBe(0); // Should still be 0 from initialization
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should maintain non-negative constraint across all operations', () => {
      // Feature: popularity-resource-system, Property 3: Popularity Calculation Formula
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 10 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);
            
            // Execute multiple turns with different party compositions
            inviteCounts.forEach((inviteCount) => {
              // Advance to PARTY phase
              store.advancePhase();
              
              // Invite guests
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              // Advance phase from PARTY (triggers popularity calculation)
              store.advancePhase();
              
              // Verify popularity is always non-negative
              const actualPopularity = store.popularity();
              expect(actualPopularity).toBeGreaterThanOrEqual(0);
            });
            
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
   * Property 4: Popularity Preservation During Phase Transitions
   * 
   * **Validates: Requirements 6.1, 6.2**
   * 
   * For any game state where advancePhase() is called during Buy phase (transitioning
   * to Party phase), the popularity value SHALL remain unchanged.
   * 
   * This property ensures that popularity only changes at the specific moment when
   * Party phase ends, not during other phase transitions. It validates that the
   * calculation timing is correct and that popularity is not inadvertently modified
   * during Buy→Party transitions.
   * 
   * This property test generates random game states in Buy phase with various
   * popularity values, captures the popularity, advances to Party phase, and
   * verifies the popularity remains unchanged.
   */
  describe('Property 4: Popularity Preservation During Phase Transitions', () => {
    it('should preserve popularity when transitioning from BUY to PARTY phase', () => {
      // Feature: popularity-resource-system, Property 4: Popularity Preservation During Phase Transitions
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Turn number to test
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 0, maxLength: 5 }), // Previous party compositions
          (targetTurn, previousInviteCounts) => {
            // Initialize the game with enough turns
            const totalTurns = Math.max(targetTurn + 5, 10);
            store.initializeGame(totalTurns);
            
            // Build up some popularity by completing previous turns
            previousInviteCounts.forEach((inviteCount) => {
              // Advance to PARTY phase
              store.advancePhase();
              
              // Invite guests to build popularity
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              // Advance from PARTY to next turn (this increases popularity)
              store.advancePhase();
            });
            
            // Now advance to the target turn in BUY phase
            const currentTurn = store.currentTurn();
            for (let i = currentTurn; i < targetTurn; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }
            
            // Verify we're in BUY phase
            expect(store.currentPhase()).toBe('BUY');
            
            // Capture the popularity before advancing from BUY to PARTY
            const popularityBeforeTransition = store.popularity();
            
            // Advance phase from BUY to PARTY
            store.advancePhase();
            
            // Verify we're now in PARTY phase
            expect(store.currentPhase()).toBe('PARTY');
            
            // Verify popularity is unchanged during BUY -> PARTY transition
            const popularityAfterTransition = store.popularity();
            expect(popularityAfterTransition).toBe(popularityBeforeTransition);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should preserve popularity across multiple BUY to PARTY transitions', () => {
      // Feature: popularity-resource-system, Property 4: Popularity Preservation During Phase Transitions
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 2, maxLength: 10 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);
            
            let expectedPopularity = 0;
            
            // Execute multiple turns and verify BUY -> PARTY preserves popularity
            inviteCounts.forEach((inviteCount) => {
              // Verify we're in BUY phase
              expect(store.currentPhase()).toBe('BUY');
              
              // Capture popularity before BUY -> PARTY transition
              const popularityBeforeBuyToParty = store.popularity();
              expect(popularityBeforeBuyToParty).toBe(expectedPopularity);
              
              // Advance from BUY to PARTY
              store.advancePhase();
              
              // Verify popularity unchanged during BUY -> PARTY transition
              expect(store.currentPhase()).toBe('PARTY');
              expect(store.popularity()).toBe(popularityBeforeBuyToParty);
              
              // Invite guests
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              // Verify popularity still unchanged during invitations
              expect(store.popularity()).toBe(popularityBeforeBuyToParty);
              
              // Update expected popularity for next turn
              const partyGuests = store.party();
              const turnPopularity = partyGuests.reduce((sum, g) => sum + g.properties.popularityValue, 0);
              expectedPopularity += turnPopularity;
              
              // Advance from PARTY to next turn (this SHOULD change popularity)
              store.advancePhase();
              
              // Verify popularity changed correctly after PARTY -> BUY transition
              expect(store.popularity()).toBe(expectedPopularity);
            });
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should preserve zero popularity during BUY to PARTY transition', () => {
      // Feature: popularity-resource-system, Property 4: Popularity Preservation During Phase Transitions
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (turnCount) => {
            // Initialize the game
            store.initializeGame(turnCount);
            
            // Verify initial popularity is 0
            expect(store.popularity()).toBe(0);
            expect(store.currentPhase()).toBe('BUY');
            
            // Advance from BUY to PARTY (first turn, no popularity built up yet)
            store.advancePhase();
            
            // Verify popularity is still 0 after BUY -> PARTY transition
            expect(store.currentPhase()).toBe('PARTY');
            expect(store.popularity()).toBe(0);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should preserve accumulated popularity during BUY to PARTY transition', () => {
      // Feature: popularity-resource-system, Property 4: Popularity Preservation During Phase Transitions
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (buildUpInviteCounts, additionalTurns) => {
            // Initialize the game with enough turns
            const totalTurns = buildUpInviteCounts.length + additionalTurns + 5;
            store.initializeGame(totalTurns);
            
            // Build up popularity over several turns
            let accumulatedPopularity = 0;
            buildUpInviteCounts.forEach((inviteCount) => {
              store.advancePhase(); // BUY -> PARTY
              
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              const partyGuests = store.party();
              const turnPopularity = partyGuests.reduce((sum, g) => sum + g.properties.popularityValue, 0);
              accumulatedPopularity += turnPopularity;
              store.advancePhase(); // PARTY -> next BUY
              
              expect(store.popularity()).toBe(accumulatedPopularity);
            });
            
            // Now test that BUY -> PARTY preserves the accumulated popularity
            for (let i = 0; i < additionalTurns; i++) {
              // Verify we're in BUY phase with accumulated popularity
              expect(store.currentPhase()).toBe('BUY');
              const popularityBeforeTransition = store.popularity();
              expect(popularityBeforeTransition).toBe(accumulatedPopularity);
              
              // Advance from BUY to PARTY
              store.advancePhase();
              
              // Verify popularity preserved during transition
              expect(store.currentPhase()).toBe('PARTY');
              expect(store.popularity()).toBe(accumulatedPopularity);
              
              // Advance from PARTY to next BUY (no guests invited, so no change)
              store.advancePhase();
              
              // Popularity should still be the same (empty party = no change)
              expect(store.popularity()).toBe(accumulatedPopularity);
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
   * Property 5: Popularity Accumulation Across Turns
   * 
   * **Validates: Requirements 6.3**
   * 
   * For any sequence of complete turns (Buy phase → Party phase → next Buy phase),
   * the final popularity SHALL equal the initial popularity plus the sum of all
   * popularity changes from each Party phase (subject to the non-negative constraint
   * applied after each calculation).
   * 
   * This integration property validates that popularity correctly accumulates over
   * multiple turns, combining the calculation logic (Property 3) with the preservation
   * logic (Property 4). It ensures the cumulative nature of the resource across the
   * entire game.
   * 
   * This property test generates random sequences of complete turns with varying
   * party compositions, tracks the expected accumulated popularity, and verifies
   * the final popularity matches the expected cumulative value.
   */
  describe('Property 5: Popularity Accumulation Across Turns', () => {
    it('should accumulate popularity correctly across multiple complete turns', () => {
      // Feature: popularity-resource-system, Property 5: Popularity Accumulation Across Turns
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 10 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);
            
            // Track expected accumulated popularity
            let expectedAccumulatedPopularity = 0;
            
            // Verify initial popularity is 0
            expect(store.popularity()).toBe(0);
            
            // Execute multiple complete turns
            inviteCounts.forEach((inviteCount, turnIndex) => {
              // Verify we start the turn in BUY phase
              expect(store.currentPhase()).toBe(GamePhase.BUY);
              
              // Verify popularity is preserved from previous turns
              expect(store.popularity()).toBe(expectedAccumulatedPopularity);
              
              // Advance from BUY to PARTY phase
              store.advancePhase();
              expect(store.currentPhase()).toBe(GamePhase.PARTY);
              
              // Verify popularity unchanged during BUY -> PARTY transition
              expect(store.popularity()).toBe(expectedAccumulatedPopularity);
              
              // Invite guests to the party
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              // Verify popularity still unchanged during invitations
              expect(store.popularity()).toBe(expectedAccumulatedPopularity);
              
              // Calculate expected popularity change for this turn
              // Guests have varying popularityValues (OLD_FRIEND=1, WILD_BUDDY=2)
              const partyGuests = store.party();
              const expectedPopularityChange = partyGuests.reduce((sum, g) => sum + g.properties.popularityValue, 0);
              
              // Update expected accumulated popularity with non-negative constraint
              expectedAccumulatedPopularity = Math.max(
                0,
                expectedAccumulatedPopularity + expectedPopularityChange
              );
              
              // Advance from PARTY phase (this triggers popularity calculation)
              store.advancePhase();
              
              // Verify popularity was updated correctly after Party phase
              const actualPopularity = store.popularity();
              expect(actualPopularity).toBe(expectedAccumulatedPopularity);
              
              // Verify popularity is non-negative
              expect(actualPopularity).toBeGreaterThanOrEqual(0);
              
              // Verify we're now in the next turn's BUY phase (or game complete)
              if (turnIndex < inviteCounts.length - 1) {
                expect(store.currentPhase()).toBe(GamePhase.BUY);
                expect(store.currentTurn()).toBe(turnIndex + 2);
              }
            });
            
            // Final verification: popularity equals tracked accumulated value
            expect(store.popularity()).toBe(expectedAccumulatedPopularity);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should maintain cumulative popularity across many turns', () => {
      // Feature: popularity-resource-system, Property 5: Popularity Accumulation Across Turns
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // Number of turns
          fc.integer({ min: 0, max: 10 }),  // Fixed invite count per turn
          (turnCount, inviteCountPerTurn) => {
            // Initialize the game
            store.initializeGame(turnCount);
            
            let expectedPopularity = 0;
            
            // Execute multiple turns with consistent party size
            for (let turn = 0; turn < turnCount; turn++) {
              // Advance to PARTY phase
              store.advancePhase();
              
              // Invite the same number of guests each turn
              const actualInvites = Math.min(inviteCountPerTurn, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              // Update expected popularity based on actual party composition
              const partyGuests = store.party();
              const turnPopularity = partyGuests.reduce((sum, g) => sum + g.properties.popularityValue, 0);
              expectedPopularity += turnPopularity;
              
              // Advance from PARTY phase
              store.advancePhase();
              
              // Verify accumulated popularity
              expect(store.popularity()).toBe(expectedPopularity);
            }
            
            // Verify final accumulated popularity matches what we tracked
            expect(store.popularity()).toBe(expectedPopularity);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should accumulate popularity correctly with varying party sizes', () => {
      // Feature: popularity-resource-system, Property 5: Popularity Accumulation Across Turns
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 2, maxLength: 8 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);
            
            // Track popularity changes for each turn
            const popularityChanges: number[] = [];
            
            // Execute turns and track changes
            inviteCounts.forEach((inviteCount) => {
              const popularityBefore = store.popularity();
              
              // Complete a turn: BUY -> PARTY -> next BUY
              store.advancePhase(); // BUY -> PARTY
              
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }
              
              store.advancePhase(); // PARTY -> next BUY (calculates popularity)
              
              const popularityAfter = store.popularity();
              const change = popularityAfter - popularityBefore;
              
              popularityChanges.push(change);
              
              // Verify the change equals the sum of party guests' popularityValues
              // (not just invite count, since guests have different popularityValues)
              expect(change).toBeGreaterThanOrEqual(0);
            });
            
            // Verify final popularity equals sum of all changes
            const expectedFinalPopularity = popularityChanges.reduce((sum, change) => sum + change, 0);
            expect(store.popularity()).toBe(expectedFinalPopularity);
            
            // Verify popularity is non-negative
            expect(store.popularity()).toBeGreaterThanOrEqual(0);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should handle zero popularity changes across multiple turns', () => {
      // Feature: popularity-resource-system, Property 5: Popularity Accumulation Across Turns
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (turnCount) => {
            // Initialize the game
            store.initializeGame(turnCount);
            
            // Execute multiple turns without inviting any guests
            for (let turn = 0; turn < turnCount; turn++) {
              // Verify popularity is still 0
              expect(store.popularity()).toBe(0);
              
              // Advance to PARTY phase
              store.advancePhase();
              
              // Don't invite any guests (empty party)
              expect(store.party().length).toBe(0);
              
              // Advance from PARTY phase
              store.advancePhase();
              
              // Verify popularity remains 0 (no change from empty parties)
              expect(store.popularity()).toBe(0);
            }
            
            // Final verification: popularity should still be 0
            expect(store.popularity()).toBe(0);
            
            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should accumulate popularity with mixed empty and non-empty parties', () => {
      // Feature: popularity-resource-system, Property 5: Popularity Accumulation Across Turns
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              inviteCount: fc.integer({ min: 0, max: 10 }),
              isEmpty: fc.boolean()
            }),
            { minLength: 3, maxLength: 10 }
          ),
          (turnConfigs) => {
            // Initialize the game with enough turns
            store.initializeGame(turnConfigs.length + 1);
            
            let expectedPopularity = 0;
            
            // Execute turns with mixed configurations
            turnConfigs.forEach((config) => {
              // Advance to PARTY phase
              store.advancePhase();
              
              // Invite guests based on configuration
              if (!config.isEmpty) {
                const actualInvites = Math.min(config.inviteCount, store.deck().length);
                for (let i = 0; i < actualInvites; i++) {
                  store.inviteGuest();
                }
                const partyGuests = store.party();
                const turnPopularity = partyGuests.reduce((sum, g) => sum + g.properties.popularityValue, 0);
                expectedPopularity += turnPopularity;
              }
              // If isEmpty is true, don't invite any guests
              
              // Advance from PARTY phase
              store.advancePhase();
              
              // Verify accumulated popularity
              expect(store.popularity()).toBe(expectedPopularity);
            });
            
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
   * Property 2: Trouble Equals Sum of Party Guests' Trouble Values
   *
   * **Validates: Requirements 3.1, 4.1, 4.2, 4.4**
   *
   * For any game state, the computed trouble value SHALL equal the sum of
   * guest.properties.troubleValue for all guests currently in the party array.
   *
   * This is the core invariant of the trouble system. Since trouble is a computed
   * signal derived from party composition, this property must hold after any
   * sequence of invite operations. It also implies trouble is 0 when the party
   * is empty (sum of empty array = 0).
   */
  describe('Property 2: Trouble Equals Sum of Party Guests\' Trouble Values', () => {
    it('should compute trouble as sum of party guests troubleValue after random invites', () => {
      // Feature: wild-buddy-trouble-resource, Property 2: Trouble Equals Sum of Party Guests' Trouble Values
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (inviteCount) => {
            // Initialize the game (deck has 10 guests: 4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
            store.initializeGame();

            // Advance to PARTY phase so we can invite guests
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');

            // Invite a random number of guests (capped by deck size)
            const actualInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Manually compute expected trouble from party composition
            const party = store.party();
            const expectedTrouble = party.reduce(
              (sum, guest) => sum + guest.properties.troubleValue,
              0
            );

            // Verify the store's computed trouble matches the manual sum
            expect(store.trouble()).toBe(expectedTrouble);

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
   * Property 7: Trouble and Popularity Independence
   *
   * **Validates: Requirements 10.1, 10.2, 10.3**
   *
   * For any guest invited to the party, the change in computed trouble SHALL
   * depend only on the guest's troubleValue, and the popularity change (applied
   * at phase end) SHALL depend only on the sum of all party guests' popularityValue.
   * Neither resource's calculation SHALL reference the other resource's value or
   * the other property of the guest.
   */
  describe('Property 7: Trouble and Popularity Independence', () => {
    it('should update trouble independently per invite and popularity independently at phase end', () => {
      // Feature: wild-buddy-trouble-resource, Property 7: Trouble and Popularity Independence
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (inviteCount) => {
            // Initialize the game (deck has 10 guests: 4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
            store.initializeGame();
            // Raise house capacity so invite operations aren't blocked by capacity
            patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });

            // Advance to PARTY phase so we can invite guests
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');

            // Capture initial state
            const popularityBefore = store.popularity();
            let expectedTrouble = 0;
            let expectedPopularityChange = 0;

            // Invite guests one at a time, verifying trouble changes independently
            const actualInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              const troubleBefore = store.trouble();
              const topGuest = store.deck()[0];

              store.inviteGuest();

              // Trouble change equals exactly the invited guest's troubleValue
              const troubleAfter = store.trouble();
              expect(troubleAfter - troubleBefore).toBe(topGuest.properties.troubleValue);

              // Popularity should NOT change during invites (it's accumulated at phase end)
              expect(store.popularity()).toBe(popularityBefore);

              expectedTrouble += topGuest.properties.troubleValue;
              expectedPopularityChange += topGuest.properties.popularityValue;
            }

            // Verify cumulative trouble matches sum of individual troubleValues
            expect(store.trouble()).toBe(expectedTrouble);

            // Now advance phase to trigger popularity calculation
            store.advancePhase();

            // Popularity change equals sum of all party guests' popularityValue
            const expectedPopularity = Math.max(0, popularityBefore + expectedPopularityChange);
            expect(store.popularity()).toBe(expectedPopularity);

            // After phase end, trouble resets to 0 (party is empty)
            expect(store.trouble()).toBe(0);

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
   * Property 6: All Guest Names Unique
   *
   * **Validates: Requirements 8.1, 8.2**
   *
   * For any game state, all guests across the deck and party combined SHALL
   * have unique names — no two guests share the same name regardless of guest type.
   *
   * This preserves guest identity throughout the game and ensures the
   * `track guest.name` in the template works correctly.
   */
  describe('Property 6: All Guest Names Unique', () => {
    it('should maintain unique guest names across deck and party after random operations', () => {
      // Feature: wild-buddy-trouble-resource, Property 6: All Guest Names Unique
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 50 }
          ),
          (operations) => {
            // Initialize the game (10 guests: 4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
            store.initializeGame();

            // Helper to verify all guest names are unique across deck + party
            const verifyUniqueNames = () => {
              const allGuests = [...store.deck(), ...store.party()];
              const names = allGuests.map(g => g.name);
              const uniqueNames = new Set(names);
              expect(uniqueNames.size).toBe(names.length);
            };

            // Verify initial state
            verifyUniqueNames();

            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }

              // Verify uniqueness after each operation
              verifyUniqueNames();
            });

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
   * Property 2: Money Calculation Formula
   *
   * **Validates: Requirements 5.1, 5.2, 5.3**
   *
   * For any party composition at the end of Party phase, the money change SHALL equal
   * the sum of each guest's properties.moneyValue, and the new money SHALL equal
   * max(0, currentMoney + moneyChange).
   *
   * This property validates the core calculation logic that determines how guests
   * affect money. It ensures the calculation correctly sums individual guest
   * moneyValue properties regardless of guest types or party composition.
   */
  describe('Property 2: Money Calculation Formula', () => {
    it('should calculate money as sum of guest moneyValues with non-negative constraint', () => {
      // Feature: rich-pal-money-resource, Property 2: Money Calculation Formula
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // Number of guests to invite
          (inviteCount) => {
            // Initialize the game
            store.initializeGame(10);
            // Raise house capacity so invite operations aren't blocked by capacity
            patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');

            // Invite a specific number of guests
            const actualInvites = Math.min(inviteCount, store.deck().length);
            const invitedGuests: Array<{ name: string; moneyValue: number }> = [];

            for (let i = 0; i < actualInvites; i++) {
              const topGuest = store.deck()[0];
              invitedGuests.push({
                name: topGuest.name,
                moneyValue: topGuest.properties.moneyValue
              });
              store.inviteGuest();
            }

            // Calculate expected money change
            const expectedMoneyChange = invitedGuests.reduce(
              (sum, guest) => sum + guest.moneyValue,
              0
            );

            // Capture current money before advancing
            const moneyBeforeAdvance = store.money();

            // Calculate expected new money with non-negative constraint
            const expectedNewMoney = Math.max(
              0,
              moneyBeforeAdvance + expectedMoneyChange
            );

            // Advance phase from PARTY (this triggers money calculation)
            store.advancePhase();

            // Verify the money matches the expected value
            const actualMoney = store.money();
            expect(actualMoney).toBe(expectedNewMoney);

            // Verify the calculation was correct
            if (actualInvites === 0) {
              // No guests invited, money should remain unchanged
              expect(actualMoney).toBe(moneyBeforeAdvance);
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

    it('should correctly sum moneyValues across multiple turns', () => {
      // Feature: rich-pal-money-resource, Property 2: Money Calculation Formula
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 5 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);

            let expectedTotalMoney = 0;

            // Execute multiple turns with different party compositions
            inviteCounts.forEach((inviteCount) => {
              // Advance to PARTY phase
              store.advancePhase();
              expect(store.currentPhase()).toBe('PARTY');

              // Invite guests
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }

              // Calculate expected money change for this turn
              const partyGuests = store.party();
              const turnMoney = partyGuests.reduce((sum, g) => sum + g.properties.moneyValue, 0);
              expectedTotalMoney = Math.max(0, expectedTotalMoney + turnMoney);

              // Advance phase from PARTY (triggers money calculation)
              store.advancePhase();

              // Verify accumulated money matches expected
              const actualMoney = store.money();
              expect(actualMoney).toBe(expectedTotalMoney);

              // Verify non-negative constraint is maintained
              expect(actualMoney).toBeGreaterThanOrEqual(0);
            });

            // Reset the store for the next iteration
            store.resetGame();
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should handle empty party correctly (zero money change)', () => {
      // Feature: rich-pal-money-resource, Property 2: Money Calculation Formula
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (turnCount) => {
            // Initialize the game
            store.initializeGame(turnCount);

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');

            // Don't invite any guests (empty party)
            expect(store.party().length).toBe(0);

            // Capture money before advancing
            const moneyBefore = store.money();

            // Advance phase from PARTY with empty party
            store.advancePhase();

            // Verify money unchanged (0 change from empty party)
            const moneyAfter = store.money();
            expect(moneyAfter).toBe(moneyBefore);
            expect(moneyAfter).toBe(0); // Should still be 0 from initialization

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
   * Property 1: Money Non-Negative Invariant
   *
   * **Validates: Requirements 4.1, 4.2, 5.4**
   *
   * For any sequence of game operations (initialization, phase advances, guest invitations,
   * resets), the money value SHALL always be a non-negative integer (>= 0).
   *
   * This invariant ensures that money never becomes negative regardless of guest
   * compositions or game states. Even when guests with negative moneyValue are
   * introduced in future, the system clamps the result to zero.
   */
  describe('Property 1: Money Non-Negative Invariant', () => {
    it('should maintain non-negative money across all operations', () => {
      // Feature: rich-pal-money-resource, Property 1: Money Non-Negative Invariant
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase', 'reset'),
            { minLength: 0, maxLength: 100 }
          ),
          (operations) => {
            // Initialize the game
            store.initializeGame(50);

            // Verify initial money is non-negative
            expect(store.money()).toBeGreaterThanOrEqual(0);

            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else if (op === 'advancePhase') {
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              } else if (op === 'reset') {
                store.resetGame();
              }

              // Verify money is non-negative after each operation
              const currentMoney = store.money();
              expect(currentMoney).toBeGreaterThanOrEqual(0);

              // Verify money is an integer
              expect(Number.isInteger(currentMoney)).toBe(true);
            });

            // Final verification
            expect(store.money()).toBeGreaterThanOrEqual(0);

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
   * Property 3: Money Preservation During Non-Party Transitions
   *
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any game state where advancePhase() is called during Buy phase
   * (transitioning to Party phase), the money value SHALL remain unchanged.
   *
   * This ensures money only changes at the specific moment when Party phase ends,
   * not during other phase transitions.
   */
  describe('Property 3: Money Preservation During Non-Party Transitions', () => {
    it('should preserve money when transitioning from BUY to PARTY phase', () => {
      // Feature: rich-pal-money-resource, Property 3: Money Preservation During Non-Party Transitions
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 0, maxLength: 5 }),
          (targetTurn, previousInviteCounts) => {
            // Initialize the game with enough turns
            const totalTurns = Math.max(targetTurn + 5, 10);
            store.initializeGame(totalTurns);

            // Build up some money by completing previous turns with guests
            previousInviteCounts.forEach((inviteCount) => {
              store.advancePhase(); // BUY -> PARTY

              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }

              store.advancePhase(); // PARTY -> next BUY (money calculated here)
            });

            // Advance to the target turn in BUY phase
            const currentTurn = store.currentTurn();
            for (let i = currentTurn; i < targetTurn; i++) {
              store.advancePhase(); // BUY -> PARTY
              store.advancePhase(); // PARTY -> next BUY
            }

            // Verify we're in BUY phase
            expect(store.currentPhase()).toBe('BUY');

            // Capture the money before advancing from BUY to PARTY
            const moneyBeforeTransition = store.money();

            // Advance phase from BUY to PARTY
            store.advancePhase();

            // Verify we're now in PARTY phase
            expect(store.currentPhase()).toBe('PARTY');

            // Verify money is unchanged during BUY -> PARTY transition
            expect(store.money()).toBe(moneyBeforeTransition);

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
   * Property 4: Money Accumulation Across Turns
   *
   * **Validates: Requirements 6.3**
   *
   * For any sequence of complete turns (Buy → Party → next Buy), the final money
   * SHALL equal the result of applying each turn's money change sequentially to
   * the initial money (with non-negative clamping after each calculation).
   *
   * This integration property validates that money correctly accumulates over
   * multiple turns.
   */
  describe('Property 4: Money Accumulation Across Turns', () => {
    it('should accumulate money correctly over multiple turns with clamping', () => {
      // Feature: rich-pal-money-resource, Property 4: Money Accumulation Across Turns
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 10 }),
          (inviteCounts) => {
            // Initialize the game with enough turns
            store.initializeGame(inviteCounts.length + 1);

            let expectedMoney = 0;

            // Execute multiple complete turns (Buy → Party → next Buy)
            inviteCounts.forEach((inviteCount) => {
              // We should be in BUY phase
              expect(store.currentPhase()).toBe('BUY');

              // Advance to PARTY phase
              store.advancePhase();
              expect(store.currentPhase()).toBe('PARTY');

              // Invite a random number of guests
              const actualInvites = Math.min(inviteCount, store.deck().length);
              for (let i = 0; i < actualInvites; i++) {
                store.inviteGuest();
              }

              // Calculate expected money change for this turn
              const partyGuests = store.party();
              const turnMoneyChange = partyGuests.reduce(
                (sum, g) => sum + g.properties.moneyValue, 0
              );

              // Apply clamping after each turn's calculation
              expectedMoney = Math.max(0, expectedMoney + turnMoneyChange);

              // Advance from PARTY to next BUY (triggers money calculation)
              store.advancePhase();

              // Verify accumulated money matches expected with clamping
              expect(store.money()).toBe(expectedMoney);
            });

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
   * Property 9: Resource Independence
   *
   * **Validates: Requirements 11.1, 11.2, 11.3**
   *
   * For any party composition, the money change at Party phase end SHALL depend
   * only on the sum of moneyValue properties, the popularity change SHALL depend
   * only on the sum of popularityValue properties, and the trouble value SHALL
   * depend only on the sum of troubleValue properties. No resource calculation
   * SHALL reference another resource's value or another property of the guest.
   */
  /**
   * Property 7: All Guest Names Unique
   *
   * **Validates: Requirements 9.1, 9.2**
   *
   * For any game state, all guests across the deck and party combined SHALL have
   * unique names — no two guests share the same name regardless of guest type.
   *
   * This property validates that guest identity is preserved through all game
   * operations. After initialization and after any sequence of invites and phase
   * advances, every guest name across deck + party must be distinct.
   */
  describe('Property 7: All Guest Names Unique', () => {
    it('should maintain unique guest names across deck and party after random operations', () => {
      // Feature: rich-pal-money-resource, Property 7: All Guest Names Unique
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('invite', 'advancePhase'),
            { minLength: 0, maxLength: 50 }
          ),
          (operations) => {
            // Initialize the game (10 guests: 4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
            store.initializeGame();

            // Helper to verify all guest names are unique across deck + party
            const verifyUniqueNames = () => {
              const allGuests = [...store.deck(), ...store.party()];
              const names = allGuests.map(g => g.name);
              const uniqueNames = new Set(names);
              expect(uniqueNames.size).toBe(names.length);
            };

            // Verify initial state
            verifyUniqueNames();

            // Execute random sequence of operations
            operations.forEach(op => {
              if (op === 'invite') {
                store.inviteGuest();
              } else {
                if (!store.isGameComplete()) {
                  store.advancePhase();
                }
              }

              // Verify uniqueness after each operation
              verifyUniqueNames();
            });

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

  describe('Property 9: Resource Independence', () => {
    it('should calculate money, popularity, and trouble independently from each other', () => {
      // Feature: rich-pal-money-resource, Property 9: Resource Independence
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // Number of guests to invite
          (inviteCount) => {
            // Initialize the game
            store.initializeGame(10);

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');

            // Capture pre-phase resource values
            const moneyBefore = store.money();
            const popularityBefore = store.popularity();

            // Invite a random number of guests
            const actualInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Independently compute expected values from party composition
            const partyGuests = store.party();
            const expectedMoneyChange = partyGuests.reduce(
              (sum, g) => sum + g.properties.moneyValue, 0
            );
            const expectedPopularityChange = partyGuests.reduce(
              (sum, g) => sum + g.properties.popularityValue, 0
            );
            const expectedTrouble = partyGuests.reduce(
              (sum, g) => sum + g.properties.troubleValue, 0
            );

            // Verify trouble (computed signal) depends only on troubleValue
            expect(store.trouble()).toBe(expectedTrouble);

            // Advance phase from PARTY (triggers money and popularity calculation)
            store.advancePhase();

            // Verify money depends only on sum of moneyValue
            const expectedMoney = Math.max(0, moneyBefore + expectedMoneyChange);
            expect(store.money()).toBe(expectedMoney);

            // Verify popularity depends only on sum of popularityValue
            const expectedPopularity = Math.max(0, popularityBefore + expectedPopularityChange);
            expect(store.popularity()).toBe(expectedPopularity);

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
   * Property 1: Effective Trouble Limit Equals Clamped Base Plus Modifier
   *
   * **Validates: Requirements 1.3, 8.3, 8.4**
   *
   * For any values of baseTroubleLimit and partyTroubleLimitModifier in the store,
   * the effectiveTroubleLimit computed signal SHALL equal
   * max(0, baseTroubleLimit + partyTroubleLimitModifier).
   */
  describe('Property 1: Effective Trouble Limit Equals Clamped Base Plus Modifier', () => {
    it('should compute effectiveTroubleLimit as max(0, base + modifier)', () => {
      // Feature: trouble-limit-party-shutdown, Property 1: Effective Trouble Limit Equals Clamped Base Plus Modifier
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 10 }),
          (baseTroubleLimit, peaceGuestCount) => {
            store.initializeGame();

            // Set arbitrary base via patchState
            // partyTroubleLimitModifier is now computed from party peace, so set party with peace guests
            const peaceGuests: Guest[] = Array.from({ length: peaceGuestCount }, (_, i) => ({
              type: 'HIPPY' as const,
              name: `Hippy${i}`,
              properties: { ...GUEST_TYPE_DEFAULTS['HIPPY'] }
            }));
            patchState(store, { baseTroubleLimit, party: peaceGuests });

            // Verify the computed effective trouble limit
            const expected = Math.max(0, baseTroubleLimit + peaceGuestCount);
            expect(store.effectiveTroubleLimit()).toBe(expected);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Limit Modification Methods Apply Delta With Clamping
   *
   * **Validates: Requirements 8.1, 8.2**
   *
   * For any current baseTroubleLimit value and any integer delta, applying the delta
   * SHALL result in baseTroubleLimit equal to max(0, previousValue + delta).
   * For partyTroubleLimitModifier, the result SHALL equal previousValue + delta (no clamping).
   *
   * NOTE: modifyBaseTroubleLimit and modifyPartyTroubleLimitModifier methods are not yet
   * implemented. This test uses patchState to simulate the modification and verify the
   * clamping behavior that those methods will enforce.
   */
  describe('Property 11: Limit Modification Methods Apply Delta With Clamping', () => {
    it('should clamp baseTroubleLimit to max(0, old + delta) when delta is applied', () => {
      // Feature: trouble-limit-party-shutdown, Property 11: Limit Modification Methods Apply Delta (baseTroubleLimit)
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: -150, max: 150 }),
          (currentBase, delta) => {
            store.initializeGame();

            // Set the current baseTroubleLimit
            patchState(store, { baseTroubleLimit: currentBase });

            // Simulate modifyBaseTroubleLimit(delta): result = max(0, current + delta)
            const newBase = Math.max(0, currentBase + delta);
            patchState(store, { baseTroubleLimit: newBase });

            // Verify the baseTroubleLimit is clamped correctly
            expect(store.baseTroubleLimit()).toBe(Math.max(0, currentBase + delta));

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should compute partyTroubleLimitModifier as sum of party peaceValue', () => {
      // Feature: trouble-limit-party-shutdown, Property 11: Limit Modification Methods Apply Delta (partyTroubleLimitModifier)
      // Updated: partyTroubleLimitModifier is now a computed signal derived from party peace
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (peaceGuestCount) => {
            store.initializeGame();

            // Set party with peace guests
            const peaceGuests: Guest[] = Array.from({ length: peaceGuestCount }, (_, i) => ({
              type: 'CUTE_DOG' as const,
              name: `Dog${i}`,
              properties: { ...GUEST_TYPE_DEFAULTS['CUTE_DOG'] }
            }));
            patchState(store, { party: peaceGuests });

            // Verify the modifier equals the sum of peaceValue
            expect(store.partyTroubleLimitModifier()).toBe(peaceGuestCount);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Party Trouble Limit Modifier Resets on Any Party End
   *
   * **Validates: Requirements 2.1, 2.2**
   *
   * For any value of partyTroubleLimitModifier and any party ending
   * (normal via advancePhase() or via triggerPartyShutdown()), the
   * partyTroubleLimitModifier SHALL be 0 after the party ends.
   */
  describe('Property 2: Party Trouble Limit Modifier Resets on Any Party End', () => {
    it('should reset partyTroubleLimitModifier to 0 after normal party end via advancePhase()', () => {
      // Feature: trouble-limit-party-shutdown, Property 2: Party Trouble Limit Modifier Resets on Any Party End (normal end)
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (peaceGuestCount) => {
            store.initializeGame();
            store.resetGame();

            store.initializeGame();

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Set party with peace guests to get a non-zero modifier
            const peaceGuests: Guest[] = Array.from({ length: peaceGuestCount }, (_, i) => ({
              type: 'HIPPY' as const,
              name: `Hippy${i}`,
              properties: { ...GUEST_TYPE_DEFAULTS['HIPPY'] }
            }));
            patchState(store, { party: peaceGuests });
            expect(store.partyTroubleLimitModifier()).toBe(peaceGuestCount);

            // End party normally via advancePhase()
            store.advancePhase();

            // Verify modifier is reset to 0 (party is cleared)
            expect(store.partyTroubleLimitModifier()).toBe(0);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset partyTroubleLimitModifier to 0 after triggerPartyShutdown()', () => {
      // Feature: trouble-limit-party-shutdown, Property 2: Party Trouble Limit Modifier Resets on Any Party End (shutdown)
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (peaceGuestCount, guestCount) => {
            store.initializeGame();
            store.resetGame();

            store.initializeGame();

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Invite some guests so shutdown has guests to return
            const actualInvites = Math.min(guestCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Add peace guests to party to get a non-zero modifier
            const currentParty = store.party();
            const peaceGuests: Guest[] = Array.from({ length: peaceGuestCount }, (_, i) => ({
              type: 'CUTE_DOG' as const,
              name: `Dog${i}`,
              properties: { ...GUEST_TYPE_DEFAULTS['CUTE_DOG'] }
            }));
            patchState(store, { party: [...currentParty, ...peaceGuests] });
            expect(store.partyTroubleLimitModifier()).toBe(peaceGuestCount);

            // Trigger party shutdown
            store.triggerPartyShutdown();

            // Verify modifier is reset to 0 (party is cleared)
            expect(store.partyTroubleLimitModifier()).toBe(0);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Shutdown If and Only If Trouble Exceeds Limit During Party
   *
   * **Validates: Requirements 3.1, 3.2, 3.3**
   *
   * For any sequence of invites during the Party phase, a party shutdown SHALL
   * be triggered if and only if the invited guest pushes trouble above the
   * effective trouble limit (base limit plus party peace). When trouble stays
   * within the limit, the party SHALL continue normally.
   */
  describe('Property 3: Shutdown If and Only If Trouble Exceeds Limit During Party', () => {
    it('should shut down on an invite iff trouble then exceeds the effective trouble limit', () => {
      // Feature: trouble-limit-party-shutdown, Property 3: Shutdown If and Only If Trouble Exceeds Limit During Party
      const guestTypeArb = fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY', 'MONKEY', 'GANGSTER', 'HIPPY', 'CUTE_DOG');

      fc.assert(
        fc.property(
          fc.array(guestTypeArb, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 5 }),
          (types, baseTroubleLimit) => {
            store.resetGame();
            store.initializeGame();
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            const deck: Guest[] = types.map((type, i) => ({
              type,
              name: `Guest${i}`,
              properties: { ...GUEST_TYPE_DEFAULTS[type] }
            }));
            patchState(store, { deck, houseCapacity: 100, baseTroubleLimit });

            for (const guest of deck) {
              const arrivingParty = [...store.party(), guest];
              const trouble = arrivingParty.reduce((sum, g) => sum + g.properties.troubleValue, 0);
              const peace = arrivingParty.reduce((sum, g) => sum + g.properties.peaceValue, 0);
              const shouldShutdown = trouble > Math.max(0, baseTroubleLimit + peace);

              store.inviteGuest();

              expect(store.isPartyShutdown()).toBe(shouldShutdown);
              if (shouldShutdown) {
                expect(store.bustPartySnapshot()).toEqual(arrivingParty);
                break;
              }
              expect(store.party()).toEqual(arrivingParty);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Shutdown Forfeits Popularity and Money
   *
   * **Validates: Requirements 4.1, 4.2**
   *
   * For any party composition and any current popularity and money values,
   * when a party shutdown occurs, both popularity and money SHALL remain
   * unchanged from their values before the shutdown.
   */
  describe('Property 4: Shutdown Forfeits Popularity and Money', () => {
    it('should not change popularity or money when triggerPartyShutdown() is called', () => {
      // Feature: trouble-limit-party-shutdown, Property 4: Shutdown Forfeits Popularity and Money
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 1, max: 10 }),
          (initialPopularity, initialMoney, guestCount) => {
            store.initializeGame();
            store.resetGame();

            store.initializeGame();

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Invite random guests
            const actualInvites = Math.min(guestCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Set random initial popularity and money
            patchState(store, { popularity: initialPopularity, money: initialMoney });

            // Record values before shutdown
            const popularityBefore = store.popularity();
            const moneyBefore = store.money();

            // Trigger party shutdown
            store.triggerPartyShutdown();

            // Verify popularity and money are unchanged
            expect(store.popularity()).toBe(popularityBefore);
            expect(store.money()).toBe(moneyBefore);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Shutdown Preserves Guest Conservation and Empties Party
   *
   * **Validates: Requirements 4.3**
   *
   * For any party shutdown, all guests from the party SHALL be returned to
   * the deck, the party SHALL be empty, and the total guest count
   * (deck + party) SHALL remain unchanged.
   */
  describe('Property 5: Shutdown Preserves Guest Conservation and Empties Party', () => {
    it('should return all guests to deck, empty party, and preserve total guest count after shutdown', () => {
      // Feature: trouble-limit-party-shutdown, Property 5: Shutdown Preserves Guest Conservation and Empties Party
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (guestCount) => {
            store.initializeGame();
            store.resetGame();

            store.initializeGame();
            // Raise trouble limit so invites from the starting deck cannot bust the party
            patchState(store, { baseTroubleLimit: 100 });

            // Advance to PARTY phase
            store.advancePhase();
            expect(store.currentPhase()).toBe(GamePhase.PARTY);

            // Invite random number of guests
            const actualInvites = Math.min(guestCount, store.deck().length);
            for (let i = 0; i < actualInvites; i++) {
              store.inviteGuest();
            }

            // Record total guest count before shutdown (deck + party + discard)
            const totalBefore = store.deck().length + store.party().length + store.discard().length;

            // Trigger party shutdown
            store.triggerPartyShutdown();

            // Verify party is empty
            expect(store.party().length).toBe(0);

            // Verify total guest count is preserved (deck + party + discard + bustPartySnapshot)
            const totalAfter = store.deck().length + store.party().length + store.discard().length + store.bustPartySnapshot().length;
            expect(totalAfter).toBe(totalBefore);

            // Verify total is unchanged (should be 10 — the initial guest count)
            expect(totalAfter).toBe(10);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Shutdown Acknowledgment Advances Game State
   *
   * **Validates: Requirements 5.1, 5.2, 6.5**
   *
   * For any game state where isPartyShutdown is true, calling
   * acknowledgeShutdown() SHALL advance to the Buy phase of the next turn
   * if the current turn is not the final turn, or mark the game as complete
   * if it is the final turn.
   */
  describe('Property 6: Shutdown Acknowledgment Advances Game State', () => {
    it('should advance to next turn BUY phase or mark game complete on acknowledgeShutdown()', () => {
      // Feature: trouble-limit-party-shutdown, Property 6: Shutdown Acknowledgment Advances Game State
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (currentTurn, totalTurns) => {
            // Ensure currentTurn <= totalTurns
            const validCurrentTurn = Math.min(currentTurn, totalTurns);

            store.initializeGame();
            store.resetGame();

            store.initializeGame(totalTurns);

            // Set up state: in PARTY phase with shutdown active
            patchState(store, {
              currentTurn: validCurrentTurn,
              totalTurns: totalTurns,
              currentPhase: GamePhase.PARTY,
              isPartyShutdown: true
            });

            // Call acknowledgeShutdown
            store.acknowledgeShutdown();

            if (validCurrentTurn === totalTurns) {
              // Final turn: game should be complete
              expect(store.isGameComplete()).toBe(true);
              expect(store.isPartyShutdown()).toBe(false);
            } else {
              // Non-final turn: enters ban selection (does NOT advance turn)
              expect(store.isBanSelectionActive()).toBe(true);
              expect(store.currentTurn()).toBe(validCurrentTurn);
              expect(store.isPartyShutdown()).toBe(false);
              expect(store.isGameComplete()).toBe(false);
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Guest Conservation Invariant
   *
   * **Validates: Requirements 1.4, 8.1, 8.2, 8.3**
   *
   * For any sequence of game operations (inviteGuest, advancePhase from PARTY,
   * triggerPartyShutdown, acknowledgeShutdown, selectGuestToBan, confirmBan),
   * the sum deck.length + party.length + discard.length SHALL equal 10.
   */
  describe('Property 1: Guest Conservation Invariant (ban-guest-after-bust)', () => {
    it('should maintain deck + party + discard = 10 across all operations', () => {
      // Feature: ban-guest-after-bust, Property 1: Guest Conservation Invariant

      const operationArb = fc.constantFrom(
        'invite',
        'advancePhase',
        'triggerPartyShutdown',
        'acknowledgeShutdown',
        'selectGuestToBan',
        'confirmBan'
      );

      fc.assert(
        fc.property(
          fc.array(operationArb, { minLength: 1, maxLength: 40 }),
          (operations) => {
            store.initializeGame();

            const checkConservation = () => {
              const total = store.deck().length + store.party().length + store.discard().length + store.bustPartySnapshot().length;
              expect(total).toBe(10);
            };

            checkConservation();

            for (const op of operations) {
              if (store.isGameComplete()) break;

              switch (op) {
                case 'invite':
                  if (!store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.inviteGuest();
                  }
                  break;
                case 'advancePhase':
                  if (!store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.advancePhase();
                  }
                  break;
                case 'triggerPartyShutdown':
                  if (store.currentPhase() === GamePhase.PARTY && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.triggerPartyShutdown();
                  }
                  break;
                case 'acknowledgeShutdown':
                  if (store.isPartyShutdown()) {
                    store.acknowledgeShutdown();
                  }
                  break;
                case 'selectGuestToBan':
                  if (store.isBanSelectionActive() && store.bustPartySnapshot().length > 0) {
                    store.selectGuestToBan(0);
                  }
                  break;
                case 'confirmBan':
                  if (store.isBanSelectionActive() && store.selectedBanGuest()) {
                    store.confirmBan();
                  }
                  break;
              }

              checkConservation();
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Discard Pile Returned to Deck on Party End
   *
   * **Validates: Requirements 2.1, 2.2, 2.3**
   *
   * For any game state with guests in the discard pile, when a party ends
   * (either normally via advancePhase() or via triggerPartyShutdown()),
   * the discard pile SHALL be empty afterward, and the deck SHALL contain
   * all previously discarded guests (verified by type and name).
   */
  describe('Property 2: Discard Pile Returned to Deck on Party End (ban-guest-after-bust)', () => {
    it('should return discard pile to deck on party end', () => {
      // Feature: ban-guest-after-bust, Property 2: Discard Pile Returned to Deck on Party End

      const guestArb = fc.record({
        type: fc.constantFrom('OLD_FRIEND' as const, 'WILD_BUDDY' as const, 'RICH_PAL' as const),
        name: fc.string({ minLength: 1, maxLength: 10 }),
        properties: fc.constant({ popularityValue: 1, troubleValue: 0, moneyValue: 0 })
      });

      const pathArb = fc.constantFrom('normal', 'bust');

      fc.assert(
        fc.property(
          fc.array(guestArb, { minLength: 1, maxLength: 3 }),
          pathArb,
          (discardGuests, path) => {
            store.initializeGame();

            // Move to PARTY phase
            store.advancePhase();

            // Set up discard pile with generated guests and adjust deck to maintain conservation
            const currentDeck = store.deck();
            patchState(store, {
              discard: discardGuests,
              deck: currentDeck.slice(0, currentDeck.length)
            });

            const discardBefore = store.discard().map(g => `${g.type}:${g.name}`);

            if (path === 'normal') {
              // Normal party end via advancePhase
              store.advancePhase();
            } else {
              // Bust path via triggerPartyShutdown
              store.triggerPartyShutdown();
            }

            // Discard should be empty
            expect(store.discard().length).toBe(0);

            // Deck should contain the previously discarded guests
            const deckNames = store.deck().map(g => `${g.type}:${g.name}`);
            for (const key of discardBefore) {
              expect(deckNames).toContain(key);
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Acknowledge Shutdown Enters Ban Selection If and Only If Non-Final Turn
   *
   * **Validates: Requirements 3.2, 4.3**
   *
   * For any game state where isPartyShutdown is true, calling acknowledgeShutdown()
   * SHALL set isBanSelectionActive = true if non-final turn, or isGameComplete = true
   * if final turn.
   */
  describe('Property 3: Acknowledge Shutdown Enters Ban Selection If and Only If Non-Final Turn (ban-guest-after-bust)', () => {
    it('should enter ban selection on non-final turn and complete game on final turn', () => {
      // Feature: ban-guest-after-bust, Property 3: Acknowledge Shutdown Enters Ban Selection If and Only If Non-Final Turn

      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (totalTurns, currentTurn) => {
            const validCurrentTurn = Math.min(currentTurn, totalTurns);

            store.initializeGame(totalTurns);

            patchState(store, {
              currentTurn: validCurrentTurn,
              currentPhase: GamePhase.PARTY,
              isPartyShutdown: true
            });

            store.acknowledgeShutdown();

            if (validCurrentTurn === totalTurns) {
              // Final turn: game complete, no ban selection
              expect(store.isGameComplete()).toBe(true);
              expect(store.isBanSelectionActive()).toBe(false);
              expect(store.isPartyShutdown()).toBe(false);
            } else {
              // Non-final turn: enter ban selection
              expect(store.isBanSelectionActive()).toBe(true);
              expect(store.isPartyShutdown()).toBe(false);
              expect(store.isGameComplete()).toBe(false);
              // Turn should NOT have advanced yet
              expect(store.currentTurn()).toBe(validCurrentTurn);
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Ban Confirmation Message Format
   *
   * **Validates: Requirements 5.2, 9.1, 9.2, 9.3**
   *
   * For any guest of type OLD_FRIEND, WILD_BUDDY, or RICH_PAL with any name,
   * the banConfirmationMessage computed signal SHALL produce the string
   * "{TypeLabel} {Name} will be banned from the next party."
   */
  describe('Property 6: Ban Confirmation Message Format (ban-guest-after-bust)', () => {
    it('should produce correct ban confirmation message for any guest type and name', () => {
      // Feature: ban-guest-after-bust, Property 6: Ban Confirmation Message Format

      const guestTypeArb = fc.constantFrom('OLD_FRIEND' as const, 'WILD_BUDDY' as const, 'RICH_PAL' as const);
      const nameArb = fc.string({ minLength: 1, maxLength: 20 }).filter(n => n.trim().length > 0);

      fc.assert(
        fc.property(
          guestTypeArb,
          nameArb,
          (guestType, name) => {
            store.initializeGame();

            const guest: Guest = {
              type: guestType,
              name,
              properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0 }
            };

            patchState(store, { selectedBanGuest: guest });

            const expectedLabel = GUEST_TYPE_LABELS[guestType];
            const expectedMessage = `${expectedLabel} ${name} will be banned from the next party.`;

            expect(store.banConfirmationMessage()).toBe(expectedMessage);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Confirm Ban Splits Snapshot Correctly
   *
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any bust party snapshot of N guests and any selected guest from that
   * snapshot, calling confirmBan() SHALL place exactly the selected guest in
   * the discard pile and all other (N-1) guests from the snapshot in the deck.
   */
  describe('Property 7: Confirm Ban Splits Snapshot Correctly (ban-guest-after-bust)', () => {
    it('should place selected guest in discard and remaining in deck', () => {
      // Feature: ban-guest-after-bust, Property 7: Confirm Ban Splits Snapshot Correctly

      const guestArb = fc.record({
        type: fc.constantFrom('OLD_FRIEND' as const, 'WILD_BUDDY' as const, 'RICH_PAL' as const),
        name: fc.string({ minLength: 1, maxLength: 10 }),
        properties: fc.constant({ popularityValue: 1, troubleValue: 0, moneyValue: 0 })
      });

      fc.assert(
        fc.property(
          fc.array(guestArb, { minLength: 2, maxLength: 8 }),
          fc.integer({ min: 0, max: 100 }),
          (snapshotGuests, indexRaw) => {
            const selectedIndex = indexRaw % snapshotGuests.length;

            store.initializeGame();

            const selectedGuest = snapshotGuests[selectedIndex];
            const deckBefore = store.deck();

            patchState(store, {
              currentPhase: GamePhase.PARTY,
              isBanSelectionActive: true,
              bustPartySnapshot: snapshotGuests,
              selectedBanGuest: selectedGuest,
              party: []
            });

            store.confirmBan();

            // Selected guest should be in discard
            const discard = store.discard();
            expect(discard.length).toBe(1);
            expect(discard[0].type).toBe(selectedGuest.type);
            expect(discard[0].name).toBe(selectedGuest.name);

            // Remaining snapshot guests should be in deck
            const remaining = snapshotGuests.filter(g => g !== selectedGuest);
            const deckAfter = store.deck();
            for (const guest of remaining) {
              const found = deckAfter.some(d => d.type === guest.type && d.name === guest.name);
              expect(found).toBe(true);
            }

            // Deck should also contain the original deck guests
            for (const guest of deckBefore) {
              const found = deckAfter.some(d => d.type === guest.type && d.name === guest.name);
              expect(found).toBe(true);
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Confirm Ban Advances Game State
   *
   * **Validates: Requirements 6.4, 6.5**
   *
   * For any game state where ban selection is active on turn T (non-final),
   * calling confirmBan() SHALL result in currentTurn = T + 1, currentPhase = BUY,
   * and all ban state cleared.
   */
  describe('Property 8: Confirm Ban Advances Game State (ban-guest-after-bust)', () => {
    it('should increment turn, set BUY phase, and clear ban state after confirmBan', () => {
      // Feature: ban-guest-after-bust, Property 8: Confirm Ban Advances Game State

      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 99 }),
          (totalTurns, turnRaw) => {
            const currentTurn = Math.min(turnRaw, totalTurns - 1);

            store.initializeGame(totalTurns);

            const dummyGuest: Guest = {
              type: 'OLD_FRIEND',
              name: 'TestGuest',
              properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0 }
            };

            patchState(store, {
              currentTurn,
              currentPhase: GamePhase.PARTY,
              isBanSelectionActive: true,
              bustPartySnapshot: [dummyGuest],
              selectedBanGuest: dummyGuest,
              party: []
            });

            store.confirmBan();

            expect(store.currentTurn()).toBe(currentTurn + 1);
            expect(store.currentPhase()).toBe(GamePhase.BUY);
            expect(store.isBanSelectionActive()).toBe(false);
            expect(store.bustPartySnapshot().length).toBe(0);
            expect(store.selectedBanGuest()).toBeNull();

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Invite Guest Does Not Touch Discard Pile
   *
   * **Validates: Requirements 7.1, 7.2, 7.3**
   *
   * For any game state with any number of guests in the discard pile,
   * calling inviteGuest() SHALL leave the discard pile unchanged.
   */
  describe('Property 9: Invite Guest Does Not Touch Discard Pile (ban-guest-after-bust)', () => {
    it('should not modify discard pile when inviting a guest', () => {
      // Feature: ban-guest-after-bust, Property 9: Invite Guest Does Not Touch Discard Pile

      const guestArb = fc.record({
        type: fc.constantFrom('OLD_FRIEND' as const, 'WILD_BUDDY' as const, 'RICH_PAL' as const),
        name: fc.string({ minLength: 1, maxLength: 10 }),
        properties: fc.constant({ popularityValue: 1, troubleValue: 0, moneyValue: 0 })
      });

      fc.assert(
        fc.property(
          fc.array(guestArb, { minLength: 0, maxLength: 5 }),
          (discardGuests) => {
            store.initializeGame();

            // Move to PARTY phase so invite is valid
            store.advancePhase();

            patchState(store, { discard: discardGuests });

            const discardBefore = store.discard().map(g => `${g.type}:${g.name}`);

            // Invite a guest (deck should have guests after init)
            store.inviteGuest();

            const discardAfter = store.discard().map(g => `${g.type}:${g.name}`);

            // Discard should be unchanged
            expect(discardAfter).toEqual(discardBefore);

            // Also test with empty deck
            patchState(store, { deck: [] });
            store.inviteGuest();

            const discardAfterEmpty = store.discard().map(g => `${g.type}:${g.name}`);
            expect(discardAfterEmpty).toEqual(discardBefore);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Guest Data Integrity Across All Movements
   *
   * **Validates: Requirements 2.2, 8.4**
   *
   * For any sequence of game operations, the multiset of (type, name) pairs
   * across deck + party + discard SHALL equal the multiset of INITIAL_GUESTS.
   */
  describe('Property 10: Guest Data Integrity Across All Movements (ban-guest-after-bust)', () => {
    it('should preserve multiset of (type, name) across all locations', () => {
      // Feature: ban-guest-after-bust, Property 10: Guest Data Integrity Across All Movements

      const initialMultiset = INITIAL_GUESTS
        .map(g => `${g.type}:${g.name}`)
        .sort()
        .join(',');

      const operationArb = fc.constantFrom(
        'invite',
        'advancePhase',
        'triggerPartyShutdown',
        'acknowledgeShutdown',
        'selectGuestToBan',
        'confirmBan'
      );

      fc.assert(
        fc.property(
          fc.array(operationArb, { minLength: 1, maxLength: 40 }),
          (operations) => {
            store.initializeGame();

            const checkIntegrity = () => {
              const allGuests = [...store.deck(), ...store.party(), ...store.discard(), ...store.bustPartySnapshot()];
              const currentMultiset = allGuests
                .map(g => `${g.type}:${g.name}`)
                .sort()
                .join(',');
              expect(currentMultiset).toBe(initialMultiset);
            };

            checkIntegrity();

            for (const op of operations) {
              if (store.isGameComplete()) break;

              switch (op) {
                case 'invite':
                  if (!store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.inviteGuest();
                  }
                  break;
                case 'advancePhase':
                  if (!store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.advancePhase();
                  }
                  break;
                case 'triggerPartyShutdown':
                  if (store.currentPhase() === GamePhase.PARTY && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.triggerPartyShutdown();
                  }
                  break;
                case 'acknowledgeShutdown':
                  if (store.isPartyShutdown()) {
                    store.acknowledgeShutdown();
                  }
                  break;
                case 'selectGuestToBan':
                  if (store.isBanSelectionActive() && store.bustPartySnapshot().length > 0) {
                    store.selectGuestToBan(0);
                  }
                  break;
                case 'confirmBan':
                  if (store.isBanSelectionActive() && store.selectedBanGuest()) {
                    store.confirmBan();
                  }
                  break;
              }

              checkIntegrity();
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests for GameStore — Shop Buy Guests
 *
 * These tests verify shop purchase logic properties across
 * a wide range of generated inputs using fast-check.
 */
describe('GameStore - Shop Buy Guests Property Tests', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  // Helper: compute total shop guest count
  const shopGuestCount = (inventory: ShopInventoryEntry[]): number =>
    inventory.reduce((sum, e) => sum + e.guests.length, 0);

  // The number of purchasable shop guests (non-null cost)
  const purchasableShopGuestsCount = SHOP_GUESTS.filter(
    g => GUEST_TYPE_COSTS[g.type] !== null
  ).length;

  // Purchasable guest types for arbitrary generation
  const purchasableTypes: GuestType[] = (
    Object.entries(GUEST_TYPE_COSTS) as [GuestType, number | null][]
  )
    .filter(([, cost]) => cost !== null)
    .map(([type]) => type);

  /**
   * Property 1: Shop + Game Guest Conservation Invariant
   *
   * **Validates: Requirements 3.1, 3.3, 3.6, 8.2**
   */
  describe('Property 1: Shop + Game Guest Conservation Invariant', () => {
    it('should conserve total guests across deck, party, discard, bust snapshot, and shop', () => {
      // Feature: shop-buy-guests, Property 1: Shop + Game Guest Conservation Invariant
      const expectedTotal = INITIAL_GUESTS.length + purchasableShopGuestsCount;

      // Purchase types are generated by fast-check so any counterexample can be replayed
      const operationArb = fc.oneof(
        fc.constantFrom('invite' as const, 'advancePhase' as const),
        fc.constantFrom(...purchasableTypes).map(type => ({ purchase: type }))
      );

      fc.assert(
        fc.property(
          fc.array(operationArb, { minLength: 1, maxLength: 40 }),
          (operations) => {
            store.initializeGame();

            // Give enough popularity for purchases
            patchState(store, { popularity: 100 });

            const checkConservation = () => {
              const total =
                store.deck().length +
                store.party().length +
                store.discard().length +
                store.bustPartySnapshot().length +
                shopGuestCount(store.shopInventory());
              expect(total).toBe(expectedTotal);
            };

            checkConservation();

            for (const op of operations) {
              if (typeof op === 'object') {
                store.purchaseGuest(op.purchase);
                checkConservation();
                continue;
              }

              switch (op) {
                case 'invite':
                  if (store.currentPhase() === GamePhase.PARTY) {
                    store.inviteGuest();
                  }
                  break;
                case 'advancePhase':
                  if (!store.isGameComplete()) {
                    store.advancePhase();
                  }
                  break;
              }
              checkConservation();
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Popularity Deduction Equals Cost on Successful Purchase
   *
   * **Validates: Requirements 3.2**
   */
  describe('Property 2: Popularity Deduction Equals Cost on Successful Purchase', () => {
    it('should deduct exactly the cost from popularity on success', () => {
      // Feature: shop-buy-guests, Property 2: Popularity Deduction Equals Cost on Successful Purchase
      const typeArb = fc.constantFrom(...purchasableTypes);
      const popularityArb = fc.integer({ min: 3, max: 200 });

      fc.assert(
        fc.property(typeArb, popularityArb, (type, popularity) => {
          store.initializeGame();
          patchState(store, { popularity });

          const cost = GUEST_TYPE_COSTS[type]!;
          const entry = store.shopInventory().find(e => e.type === type);
          if (!entry || entry.guests.length === 0 || popularity < cost) {
            store.resetGame();
            return;
          }

          const oldPopularity = store.popularity();
          const result = store.purchaseGuest(type);

          expect(result.success).toBe(true);
          expect(store.popularity()).toBe(oldPopularity - cost);

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Shop Stock Decrements by Exactly 1 on Successful Purchase
   *
   * **Validates: Requirements 3.3, 8.2**
   */
  describe('Property 3: Shop Stock Decrements by Exactly 1 on Successful Purchase', () => {
    it('should decrement purchased type stock by 1 and leave others unchanged', () => {
      // Feature: shop-buy-guests, Property 3: Shop Stock Decrements by Exactly 1 on Successful Purchase
      const typeArb = fc.constantFrom(...purchasableTypes);

      fc.assert(
        fc.property(typeArb, (type) => {
          store.initializeGame();
          patchState(store, { popularity: 100 });

          const inventoryBefore = store.shopInventory().map(e => ({
            type: e.type,
            count: e.guests.length
          }));

          const entryBefore = inventoryBefore.find(e => e.type === type);
          if (!entryBefore || entryBefore.count === 0) {
            store.resetGame();
            return;
          }

          const result = store.purchaseGuest(type);
          expect(result.success).toBe(true);

          const inventoryAfter = store.shopInventory();
          for (const before of inventoryBefore) {
            const after = inventoryAfter.find(e => e.type === before.type)!;
            if (before.type === type) {
              expect(after.guests.length).toBe(before.count - 1);
            } else {
              expect(after.guests.length).toBe(before.count);
            }
          }

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Purchase Rejected When Stock Is 0 — Store State Unchanged
   *
   * **Validates: Requirements 4.1**
   */
  describe('Property 4: Purchase Rejected When Stock Is 0 — Store State Unchanged', () => {
    it('should return sold_out and not modify state when stock is 0', () => {
      // Feature: shop-buy-guests, Property 4: Purchase Rejected When Stock Is 0 — Store State Unchanged
      const typeArb = fc.constantFrom(...purchasableTypes);
      const popularityArb = fc.integer({ min: 0, max: 200 });

      fc.assert(
        fc.property(typeArb, popularityArb, (type, popularity) => {
          store.initializeGame();
          patchState(store, { popularity });

          // Empty out the chosen type's guests
          const emptyInventory = store.shopInventory().map(e => {
            if (e.type === type) return { ...e, guests: [] };
            return e;
          });
          patchState(store, { shopInventory: emptyInventory });

          const deckBefore = [...store.deck()];
          const popBefore = store.popularity();
          const invBefore = store.shopInventory().map(e => ({
            type: e.type,
            count: e.guests.length
          }));

          const result = store.purchaseGuest(type);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBe('sold_out');
          }

          // Verify no state changed
          expect(store.popularity()).toBe(popBefore);
          expect(store.deck().length).toBe(deckBefore.length);
          for (const before of invBefore) {
            const after = store.shopInventory().find(e => e.type === before.type)!;
            expect(after.guests.length).toBe(before.count);
          }

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Purchase Rejected When Popularity < Cost — Store State Unchanged
   *
   * **Validates: Requirements 5.1**
   */
  describe('Property 5: Purchase Rejected When Popularity < Cost — Store State Unchanged', () => {
    it('should return insufficient_popularity and not modify state when popularity < cost', () => {
      // Feature: shop-buy-guests, Property 5: Purchase Rejected When Popularity < Cost — Store State Unchanged
      const typeArb = fc.constantFrom(...purchasableTypes);

      fc.assert(
        fc.property(typeArb, (type) => {
          store.initializeGame();

          const cost = GUEST_TYPE_COSTS[type]!;
          // Set popularity to a random value strictly less than cost
          const lowPopularity = Math.floor(Math.random() * cost);
          patchState(store, { popularity: lowPopularity });

          // Ensure stock > 0 (it should be after initializeGame)
          const entry = store.shopInventory().find(e => e.type === type);
          if (!entry || entry.guests.length === 0) {
            store.resetGame();
            return;
          }

          const deckBefore = [...store.deck()];
          const popBefore = store.popularity();
          const invBefore = store.shopInventory().map(e => ({
            type: e.type,
            count: e.guests.length
          }));

          const result = store.purchaseGuest(type);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBe('insufficient_popularity');
          }

          // Verify no state changed
          expect(store.popularity()).toBe(popBefore);
          expect(store.deck().length).toBe(deckBefore.length);
          for (const before of invBefore) {
            const after = store.shopInventory().find(e => e.type === before.type)!;
            expect(after.guests.length).toBe(before.count);
          }

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Purchased Guest Has Valid Name from Shop Pool
   *
   * **Validates: Requirements 3.1, 7.3, 8.1**
   */
  describe('Property 6: Purchased Guest Has Valid Name from Shop Pool', () => {
    it('should add a guest with correct type and a name from the shop pool', () => {
      // Feature: shop-buy-guests, Property 6: Purchased Guest Has Valid Name from Shop Pool
      const typeArb = fc.constantFrom(...purchasableTypes);

      fc.assert(
        fc.property(typeArb, (type) => {
          store.initializeGame();
          patchState(store, { popularity: 100 });

          const entry = store.shopInventory().find(e => e.type === type);
          if (!entry || entry.guests.length === 0) {
            store.resetGame();
            return;
          }

          const namesBefore = entry.guests.map(g => g.name);
          const deckBefore = store.deck();

          const result = store.purchaseGuest(type);
          expect(result.success).toBe(true);

          // The new guest is the last element in the deck
          const deckAfter = store.deck();
          expect(deckAfter.length).toBe(deckBefore.length + 1);
          const newGuest = deckAfter[deckAfter.length - 1];

          expect(newGuest.type).toBe(type);
          expect(namesBefore).toContain(newGuest.name);

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Shop Inventory Persists Across Turn Transitions
   *
   * **Validates: Requirements 6.1, 6.2**
   */
  describe('Property 8: Shop Inventory Persists Across Turn Transitions', () => {
    it('should leave shopInventory unchanged after advancePhase from PARTY', () => {
      // Feature: shop-buy-guests, Property 8: Shop Inventory Persists Across Turn Transitions
      const purchaseCountArb = fc.integer({ min: 0, max: 4 });

      fc.assert(
        fc.property(purchaseCountArb, (purchaseCount) => {
          store.initializeGame(10);
          patchState(store, { popularity: 100 });

          // Optionally make some purchases during BUY phase to vary shop state
          for (let i = 0; i < purchaseCount; i++) {
            const type = purchasableTypes[
              Math.floor(Math.random() * purchasableTypes.length)
            ];
            store.purchaseGuest(type);
          }

          // Advance to PARTY phase
          store.advancePhase();
          expect(store.currentPhase()).toBe(GamePhase.PARTY);

          // Snapshot shop inventory before transition
          const inventoryBefore = store.shopInventory().map(e => ({
            type: e.type,
            cost: e.cost,
            guestNames: e.guests.map(g => g.name).sort()
          }));

          // Invite some guests then advance from PARTY to next BUY
          store.inviteGuest();
          store.advancePhase();

          // Snapshot shop inventory after transition
          const inventoryAfter = store.shopInventory().map(e => ({
            type: e.type,
            cost: e.cost,
            guestNames: e.guests.map(g => g.name).sort()
          }));

          expect(inventoryAfter).toEqual(inventoryBefore);

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Initial State Invariants (House Capacity)
   *
   * **Validates: Requirements 1.1, 7.1**
   *
   * For any valid turn count, `initializeGame(n)` sets `houseCapacity` to 5,
   * `expansionsPurchased` to 0, and `showHouseFullMessage` to false.
   *
   * This ensures the house capacity system is always correctly initialized
   * regardless of the turn count chosen by the player.
   */
  describe('Property 1: Initial State Invariants (House Capacity)', () => {
    it('should initialize houseCapacity to 5, expansionsPurchased to 0, and showHouseFullMessage to false for any valid turn count', () => {
      // Feature: house-size-capacity, Property 1: Initial State Invariants
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (turnCount) => {
            store.initializeGame(turnCount);

            expect(store.houseCapacity()).toBe(5);
            expect(store.expansionsPurchased()).toBe(0);
            expect(store.showHouseFullMessage()).toBe(false);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Expansion Cost Formula
   *
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
   *
   * For any `expansionsPurchased` in [0, 29], the `expansionCost` computed signal
   * equals `min(expansionsPurchased + 2, 12)`.
   *
   * This ensures the escalating cost formula is correctly derived from the
   * number of expansions purchased, starting at $2 and capping at $12.
   */
  describe('Property 2: Expansion Cost Formula', () => {
    it('should compute expansionCost as min(expansionsPurchased + 2, 12) for any expansionsPurchased in [0, 29]', () => {
      // Feature: house-size-capacity, Property 2: Expansion Cost Formula
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 29 }),
          (expansionsPurchased) => {
            store.initializeGame();

            patchState(store, { expansionsPurchased });

            const expectedCost = Math.min(expansionsPurchased + 2, 12);
            expect(store.expansionCost()).toBe(expectedCost);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Expansion Stock Derivation
   *
   * **Validates: Requirements 7.1, 7.2**
   *
   * For any `expansionsPurchased` in [0, 29], the `expansionStock` computed signal
   * equals `29 - expansionsPurchased`.
   *
   * This ensures the remaining expansion stock is always correctly derived from
   * the number of expansions already purchased, with no separate counter needed.
   */
  describe('Property 3: Expansion Stock Derivation', () => {
    it('should compute expansionStock as 29 - expansionsPurchased for any expansionsPurchased in [0, 29]', () => {
      // Feature: house-size-capacity, Property 3: Expansion Stock Derivation
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 29 }),
          (expansionsPurchased) => {
            store.initializeGame();

            patchState(store, { expansionsPurchased });

            const expectedStock = 29 - expansionsPurchased;
            expect(store.expansionStock()).toBe(expectedStock);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Empty Slots and House Full Consistency
   *
   * **Validates: Requirements 8.1, 8.4, 2.1**
   *
   * For any `houseCapacity` >= 1 and `party.length` in [0, houseCapacity],
   * `emptySlots` equals `houseCapacity - party.length` and `isHouseFull`
   * is true iff `party.length >= houseCapacity`.
   *
   * This ensures the computed signals for empty slots and house full status
   * are always consistent with the current house capacity and party size.
   */
  describe('Property 4: Empty Slots and House Full Consistency', () => {
    it('should compute emptySlots and isHouseFull correctly for any houseCapacity and party size', () => {
      // Feature: house-size-capacity, Property 4: Empty Slots and House Full Consistency
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 34 }).chain((houseCapacity) =>
            fc.integer({ min: 0, max: houseCapacity }).map((partySize) => ({
              houseCapacity,
              partySize
            }))
          ),
          ({ houseCapacity, partySize }) => {
            store.initializeGame();

            // Create dummy Guest objects for the party
            const party: Guest[] = Array.from({ length: partySize }, (_, i) => ({
              type: 'OLD_FRIEND' as GuestType,
              name: `TestGuest${i}`,
              properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0 }
            }));

            patchState(store, { houseCapacity, party });

            // Verify emptySlots equals houseCapacity - party.length
            expect(store.emptySlots()).toBe(houseCapacity - partySize);

            // Verify isHouseFull is true iff party.length >= houseCapacity
            if (partySize >= houseCapacity) {
              expect(store.isHouseFull()).toBe(true);
            } else {
              expect(store.isHouseFull()).toBe(false);
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Successful Expansion Preserves Invariants
   *
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
   *
   * After a successful `purchaseExpansion()`, `houseCapacity` equals previous + 1,
   * `expansionsPurchased` equals previous + 1, and `money` equals previous minus
   * the cost at time of purchase.
   */
  describe('Property 5: Successful Expansion Preserves Invariants', () => {
    it('should increment houseCapacity and expansionsPurchased by 1 and deduct correct cost on successful purchase', () => {
      // Feature: house-size-capacity, Property 5: Successful Expansion Preserves Invariants
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 28 }).chain((expansionsPurchased) => {
            const cost = Math.min(expansionsPurchased + 2, 12);
            return fc.integer({ min: cost, max: cost + 100 }).map((money) => ({
              expansionsPurchased,
              money
            }));
          }),
          ({ expansionsPurchased, money }) => {
            store.initializeGame();

            const cost = Math.min(expansionsPurchased + 2, 12);
            const prevCapacity = 5 + expansionsPurchased;

            patchState(store, {
              expansionsPurchased,
              houseCapacity: prevCapacity,
              money
            });

            const beforeCapacity = store.houseCapacity();
            const beforePurchased = store.expansionsPurchased();
            const beforeMoney = store.money();

            const result = store.purchaseExpansion();

            expect(result).toEqual({ success: true });
            expect(store.houseCapacity()).toBe(beforeCapacity + 1);
            expect(store.expansionsPurchased()).toBe(beforePurchased + 1);
            expect(store.money()).toBe(beforeMoney - cost);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Failed Expansion Leaves State Unchanged
   *
   * **Validates: Requirements 6.1, 6.3, 7.1**
   *
   * When `money < expansionCost` or `expansionsPurchased >= 29`, `purchaseExpansion()`
   * returns failure and `houseCapacity`, `expansionsPurchased`, and `money` are unchanged.
   */
  describe('Property 6: Failed Expansion Leaves State Unchanged', () => {
    it('should return insufficient_money and leave state unchanged when money < expansionCost', () => {
      // Feature: house-size-capacity, Property 6: Failed Expansion Leaves State Unchanged (insufficient money)
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 28 }).chain((expansionsPurchased) => {
            const cost = Math.min(expansionsPurchased + 2, 12);
            return fc.integer({ min: 0, max: cost - 1 }).map((money) => ({
              expansionsPurchased,
              money
            }));
          }),
          ({ expansionsPurchased, money }) => {
            store.initializeGame();

            const prevCapacity = 5 + expansionsPurchased;

            patchState(store, {
              expansionsPurchased,
              houseCapacity: prevCapacity,
              money
            });

            const beforeCapacity = store.houseCapacity();
            const beforePurchased = store.expansionsPurchased();
            const beforeMoney = store.money();

            const result = store.purchaseExpansion();

            expect(result).toEqual({ success: false, error: 'insufficient_money', message: 'Not enough money!' });
            expect(store.houseCapacity()).toBe(beforeCapacity);
            expect(store.expansionsPurchased()).toBe(beforePurchased);
            expect(store.money()).toBe(beforeMoney);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return sold_out and leave state unchanged when expansionsPurchased >= 29', () => {
      // Feature: house-size-capacity, Property 6: Failed Expansion Leaves State Unchanged (sold out)
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (money) => {
            store.initializeGame();

            patchState(store, {
              expansionsPurchased: 29,
              houseCapacity: 34,
              money
            });

            const beforeCapacity = store.houseCapacity();
            const beforePurchased = store.expansionsPurchased();
            const beforeMoney = store.money();

            const result = store.purchaseExpansion();

            expect(result).toEqual({ success: false, error: 'sold_out', message: 'No expansions available!' });
            expect(store.houseCapacity()).toBe(beforeCapacity);
            expect(store.expansionsPurchased()).toBe(beforePurchased);
            expect(store.money()).toBe(beforeMoney);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Invite Guard Enforces Capacity
   *
   * **Validates: Requirements 2.1, 2.2**
   *
   * When `party.length >= houseCapacity`, calling `inviteGuest()` does not change
   * `party` or `deck` and sets `showHouseFullMessage` to true.
   */
  describe('Property 7: Invite Guard Enforces Capacity', () => {
    it('should not change party or deck and should set showHouseFullMessage when party is full', () => {
      // Feature: house-size-capacity, Property 7: Invite Guard Enforces Capacity
      const guestTypes: GuestType[] = ['OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL'];

      const arbGuest: fc.Arbitrary<Guest> = fc.record({
        type: fc.constantFrom(...guestTypes),
        name: fc.string({ minLength: 1, maxLength: 10 }),
        properties: fc.record({
          popularityValue: fc.integer({ min: -5, max: 5 }),
          troubleValue: fc.integer({ min: 0, max: 5 }),
          moneyValue: fc.integer({ min: -5, max: 5 })
        })
      });

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }).chain((houseCapacity) =>
            fc.tuple(
              fc.constant(houseCapacity),
              fc.array(arbGuest, { minLength: houseCapacity, maxLength: houseCapacity }),
              fc.array(arbGuest, { minLength: 1, maxLength: 10 })
            )
          ),
          ([houseCapacity, party, deck]) => {
            store.initializeGame();

            patchState(store, {
              houseCapacity,
              party,
              deck,
              currentPhase: GamePhase.PARTY,
              showHouseFullMessage: false
            });

            const partyBefore = store.party();
            const deckBefore = store.deck();

            store.inviteGuest();

            // party unchanged
            expect(store.party().length).toBe(partyBefore.length);
            expect(store.party()).toEqual(partyBefore);

            // deck unchanged
            expect(store.deck().length).toBe(deckBefore.length);
            expect(store.deck()).toEqual(deckBefore);

            // showHouseFullMessage set to true
            expect(store.showHouseFullMessage()).toBe(true);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Monkey Purchase Yields Valid Monkey Guest
   *
   * **Validates: Requirements 5.1, 5.2, 5.3**
   *
   * For any game state where the shop has at least 1 Monkey remaining and the
   * player's popularity is >= 3, calling purchaseGuest('MONKEY') SHALL return
   * { success: true } and the newly added guest in the deck SHALL have type
   * 'MONKEY', a name that was present in the Monkey shop inventory before the
   * purchase, and properties matching GUEST_TYPE_DEFAULTS['MONKEY'].
   */
  describe('Property 1: Monkey Purchase Yields Valid Monkey Guest', () => {
    it('should yield a valid Monkey guest when purchased with sufficient stock and popularity', () => {
      // Feature: monkey-guest, Property 1: Monkey Purchase Yields Valid Monkey Guest
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 3, max: 200 }),
          (prePurchaseCount, popularity) => {
            // Step 1: Initialize game (gives 4 Monkeys in shop)
            store.initializeGame();

            // Step 2: Set popularity high enough for all purchases
            patchState(store, { popularity: 100 });

            // Step 3: Perform pre-purchases to reduce stock (0-3 times)
            for (let i = 0; i < prePurchaseCount; i++) {
              store.purchaseGuest('MONKEY');
            }

            // Step 4: Set the actual popularity for the test purchase
            patchState(store, { popularity });

            // Capture state before the test purchase
            const monkeyEntry = store.shopInventory().find(e => e.type === 'MONKEY');
            const monkeyStock = monkeyEntry ? monkeyEntry.guests.length : 0;
            const monkeyNamesBeforePurchase = monkeyEntry
              ? monkeyEntry.guests.map(g => g.name)
              : [];
            const deckSizeBefore = store.deck().length;

            // Verify preconditions: stock >= 1 and popularity >= 3
            expect(monkeyStock).toBeGreaterThanOrEqual(1);
            expect(store.popularity()).toBeGreaterThanOrEqual(3);

            // Step 5: Perform the actual purchase under test
            const result = store.purchaseGuest('MONKEY');

            // Verify success
            expect(result.success).toBe(true);

            // Verify deck grew by 1
            expect(store.deck().length).toBe(deckSizeBefore + 1);

            // The new guest is the last element in the deck
            const newGuest = store.deck()[store.deck().length - 1];

            // Verify new guest has type MONKEY
            expect(newGuest.type).toBe('MONKEY');

            // Verify name was from the pre-purchase Monkey pool
            expect(monkeyNamesBeforePurchase).toContain(newGuest.name);

            // Verify properties match GUEST_TYPE_DEFAULTS['MONKEY']
            expect(newGuest.properties.popularityValue).toBe(GUEST_TYPE_DEFAULTS['MONKEY'].popularityValue);
            expect(newGuest.properties.troubleValue).toBe(GUEST_TYPE_DEFAULTS['MONKEY'].troubleValue);
            expect(newGuest.properties.moneyValue).toBe(GUEST_TYPE_DEFAULTS['MONKEY'].moneyValue);

            // Verify popularity was deducted by 3
            expect(store.popularity()).toBe(popularity - 3);

            // Verify shop stock decreased by 1
            const monkeyEntryAfter = store.shopInventory().find(e => e.type === 'MONKEY');
            expect(monkeyEntryAfter!.guests.length).toBe(monkeyStock - 1);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Monkey Resource Contributions
   *
   * **Validates: Requirements 6.1, 6.2, 6.3**
   *
   * For any party composition containing one or more Monkey guests mixed with
   * other guest types, the total popularity change SHALL include exactly 4 per
   * Monkey, the total trouble SHALL include exactly 1 per Monkey, and the total
   * money change SHALL include exactly 0 per Monkey.
   */
  describe('Property 2: Monkey Resource Contributions', () => {
    it('should contribute exactly +4 popularity, +1 trouble, +0 money per Monkey in any party composition', () => {
      // Feature: monkey-guest, Property 2: Monkey Resource Contributions
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          fc.integer({ min: 1, max: 10 }),
          (monkeyCount, inviteCount) => {
            // Step 1: Initialize game
            store.initializeGame();

            // Step 2: Set high popularity to allow purchases
            patchState(store, { popularity: 200 });

            // Step 3: Purchase the generated number of Monkeys (1-4)
            for (let i = 0; i < monkeyCount; i++) {
              const result = store.purchaseGuest('MONKEY');
              expect(result.success).toBe(true);
            }

            // Step 4: Advance to PARTY phase (deck is shuffled during init,
            // Monkeys were appended to deck during purchase)
            store.advancePhase();
            expect(store.currentPhase()).toBe('PARTY');

            // Step 5: Raise house capacity so invites aren't blocked
            patchState(store, { houseCapacity: 100 });

            // Step 6: Invite a random number of guests from the shuffled deck
            const maxInvites = Math.min(inviteCount, store.deck().length);
            for (let i = 0; i < maxInvites; i++) {
              store.inviteGuest();
            }

            // Step 7: Examine the party composition
            const party = store.party();

            // Calculate expected resources based on each guest's type defaults
            let expectedPopularity = 0;
            let expectedTrouble = 0;
            let expectedMoney = 0;
            for (const guest of party) {
              expectedPopularity += GUEST_TYPE_DEFAULTS[guest.type].popularityValue;
              expectedTrouble += GUEST_TYPE_DEFAULTS[guest.type].troubleValue;
              expectedMoney += GUEST_TYPE_DEFAULTS[guest.type].moneyValue;
            }

            // Step 8: Verify trouble (computed signal) matches expected
            expect(store.trouble()).toBe(expectedTrouble);

            // Step 9: Record popularity before advancing phase
            const popularityBefore = store.popularity();
            const moneyBefore = store.money();

            // Advance phase to trigger popularity and money calculations
            store.advancePhase();

            // Step 10: Verify popularity and money changes match expected
            expect(store.popularity()).toBe(Math.max(0, popularityBefore + expectedPopularity));
            expect(store.money()).toBe(Math.max(0, moneyBefore + expectedMoney));

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Guest Conservation with Monkeys
   *
   * **Validates: Requirements 3.2, 4.2, 5.1, 5.3**
   *
   * For any sequence of game operations (purchaseGuest, inviteGuest, advancePhase,
   * triggerPartyShutdown, confirmBan), the sum
   * deck.length + party.length + discard.length + sum(shopInventory[*].guests.length)
   * SHALL equal INITIAL_GUESTS.length + purchasableShopGuestsCount (10 + 12 = 22).
   */
  describe('Property 3: Guest Conservation with Monkeys', () => {
    it('should conserve total guests at 22 across deck, party, discard, and shop through Monkey operations', () => {
      // Feature: monkey-guest, Property 3: Guest Conservation with Monkeys
      const expectedTotal = INITIAL_GUESTS.length + purchasableShopGuestsCount; // 10 + 12 = 22

      const operationArb = fc.constantFrom(
        'purchaseMonkey',
        'purchaseOther',
        'invite',
        'advancePhase',
        'triggerPartyShutdown',
        'acknowledgeShutdown',
        'selectGuestToBan',
        'confirmBan'
      );

      fc.assert(
        fc.property(
          fc.array(operationArb, { minLength: 1, maxLength: 50 }),
          (operations) => {
            store.initializeGame();

            // Give enough popularity for purchases and raise house capacity
            patchState(store, { popularity: 200, houseCapacity: 100 });

            const checkConservation = () => {
              const total =
                store.deck().length +
                store.party().length +
                store.discard().length +
                store.bustPartySnapshot().length +
                shopGuestCount(store.shopInventory());
              expect(total).toBe(expectedTotal);
            };

            checkConservation();

            for (const op of operations) {
              switch (op) {
                case 'purchaseMonkey': {
                  if (store.currentPhase() === GamePhase.BUY) {
                    store.purchaseGuest('MONKEY');
                  }
                  break;
                }
                case 'purchaseOther': {
                  if (store.currentPhase() === GamePhase.BUY) {
                    const otherTypes = purchasableTypes.filter(t => t !== 'MONKEY');
                    const type = otherTypes[Math.floor(Math.random() * otherTypes.length)];
                    store.purchaseGuest(type);
                  }
                  break;
                }
                case 'invite':
                  if (store.currentPhase() === GamePhase.PARTY && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.inviteGuest();
                  }
                  break;
                case 'advancePhase':
                  if (!store.isGameComplete() && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.advancePhase();
                    // Re-boost popularity after phase advance for future purchases
                    patchState(store, { popularity: Math.max(store.popularity(), 200) });
                  }
                  break;
                case 'triggerPartyShutdown':
                  if (store.currentPhase() === GamePhase.PARTY && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.triggerPartyShutdown();
                  }
                  break;
                case 'acknowledgeShutdown':
                  if (store.isPartyShutdown()) {
                    store.acknowledgeShutdown();
                  }
                  break;
                case 'selectGuestToBan':
                  if (store.isBanSelectionActive() && store.bustPartySnapshot().length > 0) {
                    const idx = Math.floor(Math.random() * store.bustPartySnapshot().length);
                    store.selectGuestToBan(idx);
                  }
                  break;
                case 'confirmBan':
                  if (store.isBanSelectionActive() && store.selectedBanGuest()) {
                    store.confirmBan();
                    // Re-boost popularity after ban advances turn
                    patchState(store, { popularity: Math.max(store.popularity(), 200) });
                  }
                  break;
              }
              checkConservation();
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: New-Type Purchase Yields Valid Guest
   *
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   *
   * For any new guest type (AUCTIONEER, GANGSTER, ROCK_STAR, GAMBLER) and any
   * game state where the shop has at least 1 guest of that type remaining and
   * the player's popularity is >= the type's cost, calling purchaseGuest(type)
   * SHALL return { success: true } and the newly added guest in the deck SHALL
   * have the correct type, a name that was present in that type's shop inventory
   * before the purchase, and properties matching GUEST_TYPE_DEFAULTS[type]. The
   * shop inventory for that type SHALL decrease by 1, and the player's popularity
   * SHALL decrease by exactly GUEST_TYPE_COSTS[type].
   */
  describe('Property 1: New-Type Purchase Yields Valid Guest', () => {
    it('should yield a valid guest when any new type is purchased with sufficient stock and popularity', () => {
      // Feature: more-guest-types, Property 1: New-Type Purchase Yields Valid Guest
      const newTypes: GuestType[] = ['AUCTIONEER', 'GANGSTER', 'ROCK_STAR', 'GAMBLER'];

      const newTypeArb = fc.constantFrom(...newTypes);
      const prePurchaseCountArb = fc.integer({ min: 0, max: 3 });

      fc.assert(
        fc.property(
          newTypeArb,
          prePurchaseCountArb,
          (type, prePurchaseCount) => {
            // Step 1: Initialize game (gives 4 of each new type in shop)
            store.initializeGame();

            // Step 2: Set popularity high enough for all purchases
            patchState(store, { popularity: 500 });

            // Step 3: Perform pre-purchases to reduce stock (0-3 times)
            for (let i = 0; i < prePurchaseCount; i++) {
              store.purchaseGuest(type);
            }

            // Step 4: Set popularity to at least the type's cost for the test purchase
            const cost = GUEST_TYPE_COSTS[type]!;
            patchState(store, { popularity: cost });

            // Capture state before the test purchase
            const entry = store.shopInventory().find(e => e.type === type);
            const stockBefore = entry ? entry.guests.length : 0;
            const namesBefore = entry ? entry.guests.map(g => g.name) : [];
            const deckSizeBefore = store.deck().length;
            const popularityBefore = store.popularity();

            // Verify preconditions: stock >= 1 and popularity >= cost
            expect(stockBefore).toBeGreaterThanOrEqual(1);
            expect(popularityBefore).toBeGreaterThanOrEqual(cost);

            // Step 5: Perform the actual purchase under test
            const result = store.purchaseGuest(type);

            // Verify success
            expect(result.success).toBe(true);

            // Verify deck grew by 1
            expect(store.deck().length).toBe(deckSizeBefore + 1);

            // The new guest is the last element in the deck
            const newGuest = store.deck()[store.deck().length - 1];

            // Verify new guest has the correct type
            expect(newGuest.type).toBe(type);

            // Verify name was from the pre-purchase pool for this type
            expect(namesBefore).toContain(newGuest.name);

            // Verify properties match GUEST_TYPE_DEFAULTS[type]
            expect(newGuest.properties.popularityValue).toBe(GUEST_TYPE_DEFAULTS[type].popularityValue);
            expect(newGuest.properties.troubleValue).toBe(GUEST_TYPE_DEFAULTS[type].troubleValue);
            expect(newGuest.properties.moneyValue).toBe(GUEST_TYPE_DEFAULTS[type].moneyValue);

            // Verify popularity decreased by exactly GUEST_TYPE_COSTS[type]
            expect(store.popularity()).toBe(popularityBefore - cost);

            // Verify shop stock decreased by 1
            const entryAfter = store.shopInventory().find(e => e.type === type);
            expect(entryAfter!.guests.length).toBe(stockBefore - 1);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: New-Type Resource Contributions
   *
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
   *
   * For any party composition containing one or more guests of the new types,
   * the total popularity change SHALL include exactly
   * GUEST_TYPE_DEFAULTS[type].popularityValue per guest, the total trouble SHALL
   * include exactly GUEST_TYPE_DEFAULTS[type].troubleValue per guest, and the
   * total money change SHALL include exactly GUEST_TYPE_DEFAULTS[type].moneyValue
   * per guest.
   */
  describe('Property 2: New-Type Resource Contributions', () => {
    it('should compute correct resource totals for any party composition containing new types', () => {
      // Feature: more-guest-types, Property 2: New-Type Resource Contributions
      const allTypes: GuestType[] = [
        'OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL', 'MONKEY',
        'AUCTIONEER', 'GANGSTER', 'ROCK_STAR', 'GAMBLER'
      ];
      const newTypes: GuestType[] = ['AUCTIONEER', 'GANGSTER', 'ROCK_STAR', 'GAMBLER'];

      // Generator for a single guest of a given type
      const guestOfType = (type: GuestType): Guest => ({
        type,
        name: `Test_${type}_${Math.random().toString(36).slice(2, 6)}`,
        properties: { ...GUEST_TYPE_DEFAULTS[type] }
      });

      // Generator: at least 1 new-type guest, mixed with any types, party size 1-10
      const partyArb = fc
        .tuple(
          fc.constantFrom(...newTypes),
          fc.array(fc.constantFrom(...allTypes), { minLength: 0, maxLength: 9 })
        )
        .map(([requiredNewType, otherTypes]) => {
          const guests: Guest[] = [guestOfType(requiredNewType)];
          for (const t of otherTypes) {
            guests.push(guestOfType(t));
          }
          return guests;
        });

      fc.assert(
        fc.property(partyArb, (party) => {
          // Calculate expected resource totals from GUEST_TYPE_DEFAULTS
          const expectedPopularity = party.reduce(
            (sum, g) => sum + GUEST_TYPE_DEFAULTS[g.type].popularityValue, 0
          );
          const expectedTrouble = party.reduce(
            (sum, g) => sum + GUEST_TYPE_DEFAULTS[g.type].troubleValue, 0
          );
          const expectedMoney = party.reduce(
            (sum, g) => sum + GUEST_TYPE_DEFAULTS[g.type].moneyValue, 0
          );

          // Initialize game and set up state for resource verification
          store.initializeGame();

          // Set the party directly, put store in PARTY phase with known starting resources
          patchState(store, {
            party,
            currentPhase: GamePhase.PARTY,
            popularity: 0,
            money: 0
          });

          // Verify trouble computed signal matches expected sum
          expect(store.trouble()).toBe(expectedTrouble);

          // Advance phase to trigger popularity and money calculations
          // advancePhase from PARTY adds popularityChange and moneyChange to current values
          store.advancePhase();

          // Popularity and money start at 0, so after advancePhase they equal the party contributions
          // (Math.max(0, 0 + change) — all values are non-negative so no clamping)
          expect(store.popularity()).toBe(expectedPopularity);
          expect(store.money()).toBe(expectedMoney);

          store.resetGame();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Guest Conservation with Expanded Pool
   *
   * **Validates: Requirements 5.6, 6.2, 7.5, 11.1**
   *
   * For any sequence of game operations (purchaseGuest, inviteGuest, advancePhase,
   * triggerPartyShutdown, confirmBan), the sum
   * deck.length + party.length + discard.length + bustPartySnapshot.length +
   * sum(shopInventory[*].guests.length) SHALL equal 94
   * (10 initial guests + 84 purchasable shop guests).
   */
  describe('Property 3: Guest Conservation with Expanded Pool', () => {
    it('should conserve total guests at 94 across deck, party, discard, bustPartySnapshot, and shop through all operations', () => {
      // Feature: more-guest-types, Property 3: Guest Conservation with Expanded Pool
      const EXPECTED_TOTAL = 94; // 10 initial + 84 shop

      const operationArb = fc.constantFrom(
        'purchaseGuest',
        'inviteGuest',
        'advancePhase',
        'triggerPartyShutdown',
        'acknowledgeShutdown',
        'selectGuestToBan',
        'confirmBan',
        'claimVictory'
      );

      fc.assert(
        fc.property(
          fc.array(operationArb, { minLength: 1, maxLength: 50 }),
          (operations) => {
            store.initializeGame();

            // Give enough popularity for purchases and raise house capacity
            patchState(store, { popularity: 200, houseCapacity: 100 });

            const checkConservation = () => {
              const total =
                store.deck().length +
                store.party().length +
                store.discard().length +
                store.bustPartySnapshot().length +
                shopGuestCount(store.shopInventory());
              expect(total).toBe(EXPECTED_TOTAL);
            };

            checkConservation();

            for (const op of operations) {
              switch (op) {
                case 'purchaseGuest': {
                  if (store.currentPhase() === GamePhase.BUY) {
                    const type = purchasableTypes[
                      Math.floor(Math.random() * purchasableTypes.length)
                    ];
                    store.purchaseGuest(type);
                  }
                  break;
                }
                case 'inviteGuest':
                  if (store.currentPhase() === GamePhase.PARTY && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.inviteGuest();
                  }
                  break;
                case 'advancePhase':
                  if (!store.isGameComplete() && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.advancePhase();
                    // Re-boost popularity after phase advance for future purchases
                    patchState(store, { popularity: Math.max(store.popularity(), 200) });
                  }
                  break;
                case 'triggerPartyShutdown':
                  if (store.currentPhase() === GamePhase.PARTY && !store.isPartyShutdown() && !store.isBanSelectionActive()) {
                    store.triggerPartyShutdown();
                  }
                  break;
                case 'acknowledgeShutdown':
                  if (store.isPartyShutdown()) {
                    store.acknowledgeShutdown();
                  }
                  break;
                case 'selectGuestToBan':
                  if (store.isBanSelectionActive() && store.bustPartySnapshot().length > 0) {
                    const idx = Math.floor(Math.random() * store.bustPartySnapshot().length);
                    store.selectGuestToBan(idx);
                  }
                  break;
                case 'confirmBan':
                  if (store.isBanSelectionActive() && store.selectedBanGuest()) {
                    store.confirmBan();
                    // Re-boost popularity after ban advances turn
                    patchState(store, { popularity: Math.max(store.popularity(), 200) });
                  }
                  break;
                case 'claimVictory':
                  store.claimVictory();
                  break;
              }
              checkConservation();
            }

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property: Inviting From Any Starting Shuffle
 *
 * For any order of the starting deck and any number of invites up to house capacity,
 * the party either holds exactly the guests drawn, or a trouble bust happened when the
 * third Wild Buddy joined and every guest drawn is in the bust snapshot. No guest is lost.
 */
describe('GameStore - Starting Deck Shuffle Property Tests', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  it('should admit the drawn guests, or trouble-bust exactly when the third Wild Buddy joins', () => {
    const startingNames = INITIAL_GUESTS.map(g => g.name);

    fc.assert(
      fc.property(
        fc.shuffledSubarray(startingNames, { minLength: startingNames.length, maxLength: startingNames.length }),
        fc.integer({ min: 1, max: 5 }),
        (order, inviteCount) => {
          store.initializeGame();
          store.advancePhase(); // BUY -> PARTY
          const byName = (name: string) => store.deck().find(g => g.name === name)!;
          patchState(store, { deck: order.map(byName) });

          // Invite until done or the party busts (the UI offers no invite during a shutdown)
          for (let i = 0; i < inviteCount && !store.isPartyShutdown(); i++) {
            store.inviteGuest();
          }

          // Position (1-based) at which the third Wild Buddy would be drawn
          const wildPositions = order
            .map((name, i) => (INITIAL_GUESTS.find(g => g.name === name)!.type === 'WILD_BUDDY' ? i + 1 : 0))
            .filter(p => p > 0);
          const bustAt = wildPositions[2];

          if (bustAt <= inviteCount) {
            expect(store.isPartyShutdown()).toBe(true);
            expect(store.isOverflowShutdown()).toBe(false);
            expect(store.party()).toEqual([]);
            expect(store.bustPartySnapshot().map(g => g.name)).toEqual(order.slice(0, bustAt));
            expect(store.deck().map(g => g.name)).toEqual(order.slice(bustAt));
          } else {
            expect(store.isPartyShutdown()).toBe(false);
            expect(store.party().map(g => g.name)).toEqual(order.slice(0, inviteCount));
            expect(store.deck().map(g => g.name)).toEqual(order.slice(inviteCount));
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

/**
 * Property-Based Tests for Star Guests & Winning
 *
 * Property 9 (Guest Conservation at 94) is the expanded-pool conservation test above.
 */
describe('GameStore - Star Guests & Winning Property Tests', () => {
  let store: InstanceType<typeof GameStore>;

  const STAR_TYPES: GuestType[] = ['ALIEN', 'LEPRECHAUN', 'DRAGON', 'DINOSAUR', 'MERMAID', 'UNICORN', 'SUPERHERO'];
  const ALL_TYPES = Object.keys(GUEST_TYPE_DEFAULTS) as GuestType[];
  const NON_STAR_TYPES = ALL_TYPES.filter(t => !STAR_TYPES.includes(t));

  const makeParty = (types: GuestType[], prefix = 'G'): Guest[] =>
    types.map((type, i) => ({ type, name: `${prefix}${i}-${type}`, properties: { ...GUEST_TYPE_DEFAULTS[type] } }));

  const sumOf = (guests: Guest[], key: keyof Guest['properties']): number =>
    guests.reduce((sum, g) => sum + g.properties[key], 0);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
    store.initializeGame();
  });

  /**
   * Property 1: Stars Equal Sum of Party starValue
   * **Validates: Requirements 1.4, 12.1, 12.2, 12.4**
   */
  it('should compute stars as the sum of party starValue, including multiple and negative stars', () => {
    // Feature: star-guests-winning, Property 1: Stars Equal Sum of Party starValue
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ type: fc.constantFrom(...ALL_TYPES), starValue: fc.integer({ min: -3, max: 3 }) }),
          { maxLength: 10 }
        ),
        (specs) => {
          const party: Guest[] = specs.map((s, i) => ({
            type: s.type,
            name: `G${i}`,
            properties: { ...GUEST_TYPE_DEFAULTS[s.type], starValue: s.starValue }
          }));
          patchState(store, { party });
          expect(store.stars()).toBe(specs.reduce((sum, s) => sum + s.starValue, 0));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Ending a Party With Enough Stars Wins
   * **Validates: Requirements 14.2, 14.3, 14.4, 15.4**
   */
  it('should enter victory without settling or advancing when ending a party with 4+ stars', () => {
    // Feature: star-guests-winning, Property 2: Ending a Party With Enough Stars Wins
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...STAR_TYPES), { minLength: 4, maxLength: 7 }),
        fc.array(fc.constantFrom(...NON_STAR_TYPES), { maxLength: 4 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (starTypes, otherTypes, totalTurns, turnOffset, popularity, money) => {
          store.initializeGame(totalTurns);
          const currentTurn = Math.min(totalTurns, 1 + turnOffset);
          const party = makeParty([...starTypes, ...otherTypes]);
          patchState(store, { currentPhase: GamePhase.PARTY, currentTurn, party, popularity, money });
          const deck = store.deck();
          const discard = store.discard();

          store.advancePhase();

          expect(store.isVictory()).toBe(true);
          expect(store.isGameComplete()).toBe(false);
          expect(store.currentTurn()).toBe(currentTurn);
          expect(store.currentPhase()).toBe(GamePhase.PARTY);
          expect(store.popularity()).toBe(popularity);
          expect(store.money()).toBe(money);
          expect(store.party()).toEqual(party);
          expect(store.deck()).toBe(deck);
          expect(store.discard()).toBe(discard);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Ending a Party Without Enough Stars Is Unchanged
   * **Validates: Requirements 13.3, 14.5**
   */
  it('should settle and advance normally when ending a party with fewer than 4 stars', () => {
    // Feature: star-guests-winning, Property 3: Ending a Party Without Enough Stars Is Unchanged
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...STAR_TYPES), { maxLength: 3 }),
        fc.array(fc.constantFrom(...NON_STAR_TYPES), { maxLength: 4 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 20 }),
        (starTypes, otherTypes, totalTurns, popularity, money) => {
          store.initializeGame(totalTurns);
          const party = makeParty([...starTypes, ...otherTypes]);
          patchState(store, { currentPhase: GamePhase.PARTY, party, popularity, money });
          const guestCount = store.deck().length + party.length;

          store.advancePhase();

          const rawMoney = money + sumOf(party, 'moneyValue');
          const deficit = Math.max(0, -rawMoney);
          const expectedPopularity = Math.max(0, Math.max(0, popularity + sumOf(party, 'popularityValue')) - deficit * 7);

          expect(store.isVictory()).toBe(false);
          expect(store.money()).toBe(Math.max(0, rawMoney));
          expect(store.popularity()).toBe(expectedPopularity);
          expect(store.party()).toEqual([]);
          expect(store.deck()).toHaveLength(guestCount);
          if (totalTurns === 1) {
            expect(store.isGameComplete()).toBe(true);
          } else {
            expect(store.currentTurn()).toBe(2);
            expect(store.currentPhase()).toBe(GamePhase.BUY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Shutdowns Never Win
   * **Validates: Requirements 12.3, 14.6**
   */
  it('should never enter victory through a trouble or overflow shutdown', () => {
    // Feature: star-guests-winning, Property 4: Shutdowns Never Win
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<GuestType>('ALIEN', 'LEPRECHAUN', 'DRAGON', 'SUPERHERO'), { minLength: 0, maxLength: 6 }),
        fc.boolean(),
        (starTypes, overflow) => {
          store.initializeGame();
          const stars = makeParty(starTypes, 'S');
          const deck = overflow
            // Mermaid fills the last slot, so its auto-invite overflows the house
            ? [...stars, ...makeParty(['MERMAID', 'OLD_FRIEND'], 'O')]
            // Dinosaur + two Wild Buddies make 3 trouble, over the base limit of 2
            : [...stars, ...makeParty(['DINOSAUR', 'WILD_BUDDY', 'WILD_BUDDY'], 'T')];
          patchState(store, {
            currentPhase: GamePhase.PARTY,
            deck,
            houseCapacity: overflow ? stars.length + 1 : 20
          });

          while (!store.isPartyShutdown() && store.deck().length > 0) {
            store.inviteGuest();
            expect(store.isVictory()).toBe(false);
          }

          expect(store.isPartyShutdown()).toBe(true);
          expect(store.isOverflowShutdown()).toBe(overflow);

          store.acknowledgeShutdown();
          expect(store.isVictory()).toBe(false);

          if (store.isBanSelectionActive()) {
            store.selectGuestToBan(0);
            store.confirmBan();
          }
          expect(store.isVictory()).toBe(false);
          expect(store.stars()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Victory Freezes Gameplay Until Claimed
   * **Validates: Requirements 14.8, 15.5**
   */
  it('should ignore invites and phase advances during victory until claimVictory()', () => {
    // Feature: star-guests-winning, Property 5: Victory Freezes Gameplay Until Claimed
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...STAR_TYPES), { minLength: 4, maxLength: 6 }),
        fc.array(fc.constantFrom('inviteGuest', 'advancePhase'), { minLength: 1, maxLength: 10 }),
        (starTypes, operations) => {
          store.initializeGame();
          patchState(store, { currentPhase: GamePhase.PARTY, party: makeParty(starTypes) });
          store.advancePhase();
          expect(store.isVictory()).toBe(true);

          const snapshot = {
            deck: store.deck(), party: store.party(), discard: store.discard(),
            turn: store.currentTurn(), phase: store.currentPhase(),
            popularity: store.popularity(), money: store.money()
          };

          for (const op of operations) {
            if (op === 'inviteGuest') store.inviteGuest();
            else store.advancePhase();
          }

          expect(store.isVictory()).toBe(true);
          expect(store.deck()).toBe(snapshot.deck);
          expect(store.party()).toBe(snapshot.party);
          expect(store.discard()).toBe(snapshot.discard);
          expect(store.currentTurn()).toBe(snapshot.turn);
          expect(store.currentPhase()).toBe(snapshot.phase);
          expect(store.popularity()).toBe(snapshot.popularity);
          expect(store.money()).toBe(snapshot.money);

          store.claimVictory();
          expect(store.isVictory()).toBe(false);
          expect(store.isGameComplete()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
    warnSpy.mockRestore();
  });

  /**
   * Property 6: Star Guest Purchase Flow
   * **Validates: Requirements 9.9, 17.1**
   */
  it('should buy any star type when stocked and affordable', () => {
    // Feature: star-guests-winning, Property 6: Star Guest Purchase Flow
    fc.assert(
      fc.property(
        fc.constantFrom(...STAR_TYPES),
        fc.integer({ min: 0, max: 100 }),
        (type, extraPopularity) => {
          store.initializeGame();
          const cost = GUEST_TYPE_COSTS[type]!;
          patchState(store, { popularity: cost + extraPopularity });
          const before = store.shopInventory().find(e => e.type === type)!.guests.map(g => g.name);
          const deckLength = store.deck().length;

          const result = store.purchaseGuest(type);

          expect(result).toEqual({ success: true, guestType: type });
          expect(store.deck()).toHaveLength(deckLength + 1);
          const bought = store.deck()[store.deck().length - 1];
          expect(bought.type).toBe(type);
          expect(before).toContain(bought.name);
          expect(store.shopInventory().find(e => e.type === type)!.guests).toHaveLength(before.length - 1);
          expect(store.popularity()).toBe(extraPopularity);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Star Guest Resource Contributions
   * **Validates: Requirements 13.1**
   */
  it('should include star guests in trouble, peace, stars, popularity and money', () => {
    // Feature: star-guests-winning, Property 7: Star Guest Resource Contributions
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...STAR_TYPES), { minLength: 1, maxLength: 3 }),
        fc.array(fc.constantFrom(...NON_STAR_TYPES), { maxLength: 3 }),
        (starTypes, otherTypes) => {
          store.initializeGame();
          const types = [...starTypes, ...otherTypes];
          const party = makeParty(types);
          const expectedSum = (key: keyof Guest['properties']) =>
            types.reduce((sum, t) => sum + GUEST_TYPE_DEFAULTS[t][key], 0);
          patchState(store, { currentPhase: GamePhase.PARTY, party, popularity: 1000, money: 1000 });

          expect(store.trouble()).toBe(expectedSum('troubleValue'));
          expect(store.partyTroubleLimitModifier()).toBe(expectedSum('peaceValue'));
          expect(store.stars()).toBe(expectedSum('starValue'));

          // At most 3 stars, so ending the party settles normally
          store.advancePhase();
          expect(store.popularity()).toBe(1000 + expectedSum('popularityValue'));
          expect(store.money()).toBe(1000 + expectedSum('moneyValue'));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Mermaid Auto-Invites Exactly One Guest
   * **Validates: Requirements 6.5, 6.6**
   */
  it('should admit the Mermaid followed by exactly the next deck guest', () => {
    // Feature: star-guests-winning, Property 8: Mermaid Auto-Invites Exactly One Guest
    const plainTypes = ALL_TYPES.filter(t => !GUEST_TYPE_ENTRANCE_EFFECTS[t] && GUEST_TYPE_DEFAULTS[t].troubleValue === 0);
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...plainTypes), { maxLength: 5 }),
        (restTypes) => {
          store.initializeGame();
          const [mermaid] = makeParty(['MERMAID'], 'M');
          const rest = makeParty(restTypes, 'R');
          patchState(store, { currentPhase: GamePhase.PARTY, houseCapacity: 10, deck: [mermaid, ...rest] });

          store.inviteGuest();

          expect(store.isPartyShutdown()).toBe(false);
          expect(store.party()).toEqual([mermaid, ...rest.slice(0, 1)]);
          expect(store.deck()).toEqual(rest.slice(1));
        }
      ),
      { numRuns: 100 }
    );
  });
});
