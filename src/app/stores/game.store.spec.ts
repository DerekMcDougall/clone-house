import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GUEST_TYPE_DEFAULTS, GuestType, INITIAL_GUESTS } from '../models/guest.model';
import { getGuestType, resetGuestTypesForTesting } from '../models/guest-type-registry';
import { runEffect } from '../models/action-kinds';
import { GameStore, ShopInventoryEntry } from './game.store';
import { customEntrance, registerTestGuestType, testGuest } from '../../testing/guests';
import { isChoosingBan, pickBan, pickedBan, startBanSelection } from '../../testing/ban';

const TEST_ICON = { symbol: '🧪', label: 'Test effect' };

/**
 * Unit Tests for GameStore
 * 
 * These tests verify specific examples and edge cases for the GameStore,
 * complementing the property-based tests with concrete scenarios.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.2, 2.3, 2.4, 2.5**
 */
describe('GameStore - Unit Tests', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  describe('Initialization', () => {
    /**
     * Test default 25 turn initialization
     * **Validates: Requirements 1.2**
     */
    it('should initialize with default 25 turns when no parameter provided', () => {
      store.initializeGame();

      expect(store.totalTurns()).toBe(25);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test custom turn count initialization
     * **Validates: Requirements 1.1, 1.3**
     */
    it('should initialize with custom turn count', () => {
      store.initializeGame(10);

      expect(store.totalTurns()).toBe(10);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test single turn game initialization
     * **Validates: Requirements 1.1, 1.3**
     */
    it('should initialize with single turn game', () => {
      store.initializeGame(1);

      expect(store.totalTurns()).toBe(1);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test popularity initialization to 0
     * **Validates: Requirements 1.1 (Popularity Resource System)**
     */
    it('should initialize popularity to 0', () => {
      store.initializeGame();

      expect(store.popularity()).toBe(0);
    });

    /**
     * Test deck initialization creates 10 guests (4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should initialize deck with 10 guests (4 Old Friends + 4 Wild Buddies + 2 Rich Pals)', () => {
      store.initializeGame();

      const deck = store.deck();
      expect(deck.length).toBe(10);
      
      // Verify guest type composition
      const oldFriends = deck.filter(g => g.type === 'OLD_FRIEND');
      const wildBuddies = deck.filter(g => g.type === 'WILD_BUDDY');
      const richPals = deck.filter(g => g.type === 'RICH_PAL');
      expect(oldFriends.length).toBe(4);
      expect(wildBuddies.length).toBe(4);
      expect(richPals.length).toBe(2);
    });

    /**
     * Test deck initialization uses correct names
     * **Validates: Requirements 1.2**
     */
    it('should initialize deck with correct guest names', () => {
      store.initializeGame();

      const deck = store.deck();
      const deckNames = deck.map(g => g.name).sort();
      const expectedNames = [...INITIAL_GUESTS.map(g => g.name)].sort();
      
      expect(deckNames).toEqual(expectedNames);
    });

    /**
     * Test deck is shuffled after initialization
     * **Validates: Requirements 1.3**
     */
    it('should shuffle deck after initialization', () => {
      // Run multiple initializations and check if order varies
      const orders: string[] = [];
      
      for (let i = 0; i < 10; i++) {
        store.initializeGame();
        const order = store.deck().map(g => g.name).join(',');
        orders.push(order);
      }
      
      // At least one order should be different (extremely high probability with 10 shuffles)
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });

    /**
     * Test party is empty after initialization
     * **Validates: Requirements 1.1**
     */
    it('should initialize party as empty', () => {
      store.initializeGame();

      expect(store.party()).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test error handling for zero turn count
     * **Validates: Requirements 1.3**
     */
    it('should throw error when initializing with zero turns', () => {
      expect(() => store.initializeGame(0)).toThrow('Turn count must be greater than zero');
    });

    /**
     * Test error handling for negative turn count
     * **Validates: Requirements 1.3**
     */
    it('should throw error when initializing with negative turns', () => {
      expect(() => store.initializeGame(-5)).toThrow('Turn count must be greater than zero');
    });

    /**
     * Test warning when advancing phase on completed game
     * **Validates: Requirements 2.5**
     */
    it('should log warning and not change state when advancing phase on completed game', () => {
      // Setup: Complete a single-turn game
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store.initializeGame(1);
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> Complete

      expect(store.isGameComplete()).toBe(true);
      const turnBeforeAdvance = store.currentTurn();
      const phaseBeforeAdvance = store.currentPhase();

      // Attempt to advance on completed game
      store.advancePhase();

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot advance phase: game is already complete');

      // Verify state unchanged
      expect(store.currentTurn()).toBe(turnBeforeAdvance);
      expect(store.currentPhase()).toBe(phaseBeforeAdvance);
      expect(store.isGameComplete()).toBe(true);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Phase Transitions', () => {
    /**
     * Test Buy to Party phase transition
     * **Validates: Requirements 2.3**
     */
    it('should transition from BUY to PARTY phase on same turn', () => {
      store.initializeGame(5);

      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.currentTurn()).toBe(1);

      store.advancePhase();

      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.currentTurn()).toBe(1);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test popularity calculation when advancing from PARTY phase
     * **Validates: Requirements 5.1, 5.3 (Popularity Resource System)**
     */
    it('should calculate and apply popularity change when advancing from PARTY phase', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Invite 3 guests (mixed types due to shuffled deck)
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();

      const party = store.party();
      const expectedPopularity = party.reduce((sum, g) => sum + g.properties.popularityValue, 0);

      expect(store.popularity()).toBe(0); // Popularity not yet calculated

      // Advance from PARTY phase
      store.advancePhase();

      // Verify popularity increased by sum of party guests' popularityValues
      expect(store.popularity()).toBe(expectedPopularity);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.currentTurn()).toBe(2);
    });

    /**
     * Test popularity accumulates across multiple turns
     * **Validates: Requirements 6.3 (Popularity Resource System)**
     */
    it('should accumulate popularity across multiple turns', () => {
      store.initializeGame(5);

      // Turn 1: Invite 2 guests
      store.advancePhase(); // BUY -> PARTY
      store.inviteGuest();
      store.inviteGuest();
      const turn1Party = store.party();
      const turn1Expected = turn1Party.reduce((sum, g) => sum + g.properties.popularityValue, 0);
      store.advancePhase(); // PARTY -> BUY (turn 2)

      expect(store.popularity()).toBe(turn1Expected);

      // Turn 2: Invite 4 guests
      store.advancePhase(); // BUY -> PARTY
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();
      const turn2Party = store.party();
      const turn2Expected = turn2Party.reduce((sum, g) => sum + g.properties.popularityValue, 0);
      store.advancePhase(); // PARTY -> BUY (turn 3)

      // Verify popularity accumulated
      expect(store.popularity()).toBe(turn1Expected + turn2Expected);
    });

    /**
     * Test empty party results in no popularity change
     * **Validates: Requirements 5.1, 5.2 (Popularity Resource System)**
     */
    it('should not change popularity when party is empty', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Don't invite any guests
      expect(store.party().length).toBe(0);

      store.advancePhase(); // PARTY -> BUY (turn 2)

      // Verify popularity remains 0
      expect(store.popularity()).toBe(0);
    });

    /**
     * Test Party to Buy phase transition on non-final turn
     * **Validates: Requirements 2.4**
     */
    it('should transition from PARTY to BUY phase and increment turn on non-final turn', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY (turn 1)

      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.currentTurn()).toBe(1);

      store.advancePhase(); // PARTY -> BUY (turn 2)

      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.currentTurn()).toBe(2);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test game completion on final turn
     * **Validates: Requirements 2.5**
     */
    it('should mark game as complete when advancing from PARTY on final turn', () => {
      store.initializeGame(2);

      // Advance to turn 2 PARTY phase
      store.advancePhase(); // Turn 1: BUY -> PARTY
      store.advancePhase(); // Turn 1 PARTY -> Turn 2 BUY
      store.advancePhase(); // Turn 2: BUY -> PARTY

      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.isGameComplete()).toBe(false);

      // Advance from final PARTY phase
      store.advancePhase();

      expect(store.isGameComplete()).toBe(true);
      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
    });

    /**
     * Test complete game flow through multiple turns
     * **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
     */
    it('should correctly progress through complete 3-turn game', () => {
      store.initializeGame(3);

      // Turn 1
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);

      store.advancePhase();
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);

      store.advancePhase();
      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.BUY);

      // Turn 2
      store.advancePhase();
      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);

      store.advancePhase();
      expect(store.currentTurn()).toBe(3);
      expect(store.currentPhase()).toBe(GamePhase.BUY);

      // Turn 3 (final)
      store.advancePhase();
      expect(store.currentTurn()).toBe(3);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);

      store.advancePhase();
      expect(store.isGameComplete()).toBe(true);
    });
  });

  describe('Popularity Calculation Examples', () => {
    /**
     * Test 4 guests increase popularity by sum of their popularityValues
     * **Validates: Requirements 7.1 (Popularity Resource System)**
     */
    it('should increase popularity by sum of popularityValues when party contains 4 guests', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Fix the draw order: one of each starting type plus a second Wild Buddy
      // (two Wild Buddies keep trouble at the limit without busting)
      const byName = (name: string) => store.deck().find(g => g.name === name)!;
      const top = ['Brian', 'Anthony', 'Teresa', 'Khalil'];
      patchState(unprotected(store), {
        deck: [...top.map(byName), ...store.deck().filter(g => !top.includes(g.name))]
      });

      // Invite 4 guests: Old Friend (1) + Wild Buddy (2) + Wild Buddy (2) + Rich Pal (0)
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();

      expect(store.party().length).toBe(4);
      const expectedPopularity = 5;
      expect(store.popularity()).toBe(0); // Popularity not yet calculated

      // Advance from PARTY phase to trigger popularity calculation
      store.advancePhase();

      // Verify popularity increased by sum of party guests' popularityValues
      expect(store.popularity()).toBe(expectedPopularity);
    });

    /**
     * Test single guest increases popularity correctly
     * **Validates: Requirements 7.2 (Popularity Resource System)**
     */
    it('should increase popularity by guest popularityValue when party contains 1 guest', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Invite 1 guest
      store.inviteGuest();

      expect(store.party().length).toBe(1);
      const expectedPopularity = store.party()[0].properties.popularityValue;
      expect(store.popularity()).toBe(0); // Popularity not yet calculated

      // Advance from PARTY phase to trigger popularity calculation
      store.advancePhase();

      // Verify popularity increased by the guest's popularityValue
      expect(store.popularity()).toBe(expectedPopularity);
    });

    /**
     * Test empty party results in no popularity change
     * **Validates: Requirements 7.2 (Popularity Resource System)**
     */
    it('should not change popularity when party is empty at end of PARTY phase', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Don't invite any guests - party remains empty
      expect(store.party().length).toBe(0);
      expect(store.popularity()).toBe(0);

      // Advance from PARTY phase with empty party
      store.advancePhase();

      // Verify popularity remains 0 (no change from empty party)
      expect(store.popularity()).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    /**
     * Test resetGame returns to initial state
     * **Validates: Requirements 1.1, 2.2**
     */
    it('should reset to initial state after game progression', () => {
      store.initializeGame(10);

      // Progress through several turns
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 2)
      store.advancePhase(); // BUY -> PARTY

      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);

      // Reset game
      store.resetGame();

      // Verify initial state restored
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.totalTurns()).toBe(25); // Default value
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test resetGame from completed game state
     * **Validates: Requirements 1.1, 2.2**
     */
    it('should reset from completed game state', () => {
      store.initializeGame(1);

      // Complete the game
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> Complete

      expect(store.isGameComplete()).toBe(true);

      // Reset game
      store.resetGame();

      // Verify initial state restored
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.totalTurns()).toBe(25);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test resetGame sets popularity to 0
     * **Validates: Requirements 1.2 (Popularity Resource System)**
     */
    it('should reset popularity to 0', () => {
      store.initializeGame();

      // Manually set popularity to a non-zero value to simulate game progression
      // Note: This will be set properly once popularity calculation is implemented
      patchState(unprotected(store), { popularity: 10 });

      expect(store.popularity()).toBe(10);

      // Reset game
      store.resetGame();

      // Verify popularity is reset to 0
      expect(store.popularity()).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    /**
     * Test remainingTurns calculation at game start
     * **Validates: Requirements 3.3**
     */
    it('should calculate remainingTurns correctly at game start', () => {
      store.initializeGame(10);

      expect(store.remainingTurns()).toBe(10);
    });

    /**
     * Test remainingTurns calculation during game
     * **Validates: Requirements 3.3, 3.4**
     */
    it('should calculate remainingTurns correctly as game progresses', () => {
      store.initializeGame(5);

      expect(store.remainingTurns()).toBe(5); // Turn 1

      store.advancePhase(); // BUY -> PARTY
      expect(store.remainingTurns()).toBe(5); // Still turn 1

      store.advancePhase(); // PARTY -> BUY (turn 2)
      expect(store.remainingTurns()).toBe(4); // Turn 2

      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 3)
      expect(store.remainingTurns()).toBe(3); // Turn 3
    });

    /**
     * Test remainingTurns on final turn
     * **Validates: Requirements 3.3**
     */
    it('should calculate remainingTurns as 1 on final turn', () => {
      store.initializeGame(3);

      // Advance to final turn
      store.advancePhase(); // Turn 1: BUY -> PARTY
      store.advancePhase(); // Turn 2: BUY
      store.advancePhase(); // Turn 2: PARTY
      store.advancePhase(); // Turn 3: BUY

      expect(store.currentTurn()).toBe(3);
      expect(store.remainingTurns()).toBe(1);
    });

    /**
     * Test isFinalTurn on non-final turns
     * **Validates: Requirements 2.4**
     */
    it('should return false for isFinalTurn on non-final turns', () => {
      store.initializeGame(5);

      expect(store.isFinalTurn()).toBe(false); // Turn 1

      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 2)
      expect(store.isFinalTurn()).toBe(false); // Turn 2

      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 3)
      expect(store.isFinalTurn()).toBe(false); // Turn 3
    });

    /**
     * Test isFinalTurn on final turn
     * **Validates: Requirements 2.5**
     */
    it('should return true for isFinalTurn on final turn', () => {
      store.initializeGame(2);

      // Advance to final turn
      store.advancePhase(); // Turn 1: BUY -> PARTY
      store.advancePhase(); // Turn 2: BUY

      expect(store.currentTurn()).toBe(2);
      expect(store.isFinalTurn()).toBe(true);
    });

    /**
     * Test phaseButtonLabel in BUY phase
     * **Validates: Requirements 4.2**
     */
    it('should return "Start Party" for phaseButtonLabel in BUY phase', () => {
      store.initializeGame(5);

      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.phaseButtonLabel()).toBe('Start Party');
    });

    /**
     * Test phaseButtonLabel in PARTY phase on non-final turn
     * **Validates: Requirements 5.2**
     */
    it('should return "End Party" for phaseButtonLabel in PARTY phase on non-final turn', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.isFinalTurn()).toBe(false);
      expect(store.phaseButtonLabel()).toBe('End Party');
    });

    /**
     * Test phaseButtonLabel in PARTY phase on final turn
     * **Validates: Requirements 6.1**
     */
    it('should return "Game Over" for phaseButtonLabel in PARTY phase on final turn', () => {
      store.initializeGame(1);
      store.advancePhase(); // BUY -> PARTY (final turn)

      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.isFinalTurn()).toBe(true);
      expect(store.phaseButtonLabel()).toBe('Game Over');
    });

    /**
     * Test all computed signals update correctly together
     * **Validates: Requirements 3.3, 4.2, 5.2, 6.1**
     */
    it('should update all computed signals correctly during game progression', () => {
      store.initializeGame(2);

      // Turn 1 BUY
      expect(store.remainingTurns()).toBe(2);
      expect(store.isFinalTurn()).toBe(false);
      expect(store.phaseButtonLabel()).toBe('Start Party');

      store.advancePhase();

      // Turn 1 PARTY
      expect(store.remainingTurns()).toBe(2);
      expect(store.isFinalTurn()).toBe(false);
      expect(store.phaseButtonLabel()).toBe('End Party');

      store.advancePhase();

      // Turn 2 BUY (final turn)
      expect(store.remainingTurns()).toBe(1);
      expect(store.isFinalTurn()).toBe(true);
      expect(store.phaseButtonLabel()).toBe('Start Party');

      store.advancePhase();

      // Turn 2 PARTY (final turn)
      expect(store.remainingTurns()).toBe(1);
      expect(store.isFinalTurn()).toBe(true);
      expect(store.phaseButtonLabel()).toBe('Game Over');
    });

    /**
     * Test canInviteGuest returns true when deck has guests
     * **Validates: Requirements 3.3**
     */
    it('should return true for canInviteGuest when deck is not empty', () => {
      store.initializeGame();

      expect(store.deck().length).toBe(10);
      expect(store.canInviteGuest()).toBe(true);
    });

    /**
     * Test canInviteGuest returns false when deck is empty
     * **Validates: Requirements 3.3, 8.1**
     */
    it('should return false for canInviteGuest when deck is empty', () => {
      store.initializeGame();
      // Raise house capacity and trouble limit so all 10 guests can be invited without a bust
      patchState(unprotected(store), { houseCapacity: 10, baseTroubleLimit: 100 });

      // Invite all 10 guests
      for (let i = 0; i < 10; i++) {
        store.inviteGuest();
      }

      expect(store.deck().length).toBe(0);
      expect(store.canInviteGuest()).toBe(false);
    });

    /**
     * Test canInviteGuest updates as guests are invited
     * **Validates: Requirements 3.3, 4.1**
     */
    it('should update canInviteGuest as guests are invited and returned', () => {
      store.initializeGame();
      // Raise house capacity and trouble limit so all 10 guests can be invited without a bust
      patchState(unprotected(store), { houseCapacity: 10, baseTroubleLimit: 100 });
      store.advancePhase(); // Move to PARTY phase

      expect(store.canInviteGuest()).toBe(true);

      // Invite all guests
      for (let i = 0; i < 10; i++) {
        store.inviteGuest();
      }

      expect(store.canInviteGuest()).toBe(false);

      // Return guests to deck by advancing phase
      store.advancePhase();

      expect(store.canInviteGuest()).toBe(true);
      expect(store.deck().length).toBe(10);
    });

    /**
     * Test canInviteGuest becomes false when the house is full, even with guests left in the deck
     */
    it('should set canInviteGuest to false when the house is full', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase

      // Draw only non-trouble guests so the party fills the house without a bust
      const byName = (name: string) => store.deck().find(g => g.name === name)!;
      const top = ['Brian', 'Colin', 'Emily', 'Rachelle', 'Khalil'];
      patchState(unprotected(store), {
        deck: [...top.map(byName), ...store.deck().filter(g => !top.includes(g.name))]
      });

      for (let i = 0; i < store.houseCapacity() - 1; i++) {
        store.inviteGuest();
      }
      expect(store.canInviteGuest()).toBe(true);

      store.inviteGuest();

      expect(store.party().length).toBe(5);
      expect(store.deck().length).toBe(5);
      expect(store.canInviteGuest()).toBe(false);
    });
  });

  describe('Deck and Party Methods', () => {
    /**
     * Test inviteGuest with empty deck is no-op
     * **Validates: Requirements 8.2**
     */
    it('should not modify state when inviting from empty deck', () => {
      store.initializeGame();
      store.advancePhase(); // BUY -> PARTY

      // Start from an empty deck with a couple of guests already at the party
      const [first, second] = store.deck();
      patchState(unprotected(store), { deck: [], party: [first, second] });

      // Attempt to invite from empty deck
      store.inviteGuest();

      // Verify no state change (no-op) other than showing the empty-deck message
      expect(store.deck()).toEqual([]);
      expect(store.party()).toEqual([first, second]);
      expect(store.isPartyShutdown()).toBe(false);
      expect(store.showEmptyDeckMessage()).toBe(true);
    });

    /**
     * Test inviteGuest is a no-op while a bust is being resolved (shutdown modal or ban selection)
     */
    describe('inviting while a bust is being resolved', () => {
      const bustOnThirdWildBuddy = () => {
        store.initializeGame();
        store.advancePhase(); // BUY -> PARTY

        const byName = (name: string) => store.deck().find(g => g.name === name)!;
        const top = ['Anthony', 'Teresa', 'Jacco', 'Brian'];
        patchState(unprotected(store), {
          deck: [...top.map(byName), ...store.deck().filter(g => !top.includes(g.name))]
        });

        store.inviteGuest();
        store.inviteGuest();
        store.inviteGuest(); // Jacco: trouble 3 > limit 2
        expect(store.isPartyShutdown()).toBe(true);
      };

      it('should not invite a guest during a party shutdown', () => {
        bustOnThirdWildBuddy();
        const deckBefore = store.deck();
        const snapshotBefore = store.bustPartySnapshot();
        expect(store.canInviteGuest()).toBe(false);

        store.inviteGuest();

        expect(store.party()).toEqual([]);
        expect(store.deck()).toEqual(deckBefore);
        expect(store.bustPartySnapshot()).toEqual(snapshotBefore);
      });

      it('should not invite a guest during ban selection', () => {
        bustOnThirdWildBuddy();
        store.acknowledgeShutdown();
        expect(isChoosingBan(store)).toBe(true);
        expect(store.canInviteGuest()).toBe(false);
        const deckBefore = store.deck();

        store.inviteGuest();

        expect(store.party()).toEqual([]);
        expect(store.deck()).toEqual(deckBefore);
      });
    });

    /**
     * Test all guests return to deck on phase transition
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
     */
    it('should return all guests to deck when transitioning from PARTY phase', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase

      // Fix the draw order so no trouble bust can occur (bust needs 3 Wild Buddies)
      const byName = (name: string) => store.deck().find(g => g.name === name)!;
      const top = ['Brian', 'Anthony', 'Khalil'];
      patchState(unprotected(store), {
        deck: [...top.map(byName), ...store.deck().filter(g => !top.includes(g.name))]
      });

      // Invite 3 guests
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();
      
      expect(store.deck().length).toBe(7);
      expect(store.party().length).toBe(3);
      
      // Store party guest names before transition
      const partyGuestNames = store.party().map(g => g.name);
      
      // Advance phase (PARTY -> BUY)
      store.advancePhase();
      
      // Verify all guests returned to deck (deck is shuffled, so check by name set)
      expect(store.party().length).toBe(0);
      expect(store.deck().length).toBe(10);
      
      // Verify the returned guests are present in the deck
      const deckNames = store.deck().map(g => g.name);
      for (const name of partyGuestNames) {
        expect(deckNames).toContain(name);
      }
    });

    /**
     * Test all guests return to deck when all are in party
     * **Validates: Requirements 6.1, 6.2, 6.3, 8.3**
     */
    it('should return all 10 guests to deck when entire party transitions', () => {
      store.initializeGame();
      // Raise house capacity and trouble limit so all 10 guests can be invited without a bust
      patchState(unprotected(store), { houseCapacity: 10, baseTroubleLimit: 100 });
      store.advancePhase(); // Move to PARTY phase
      
      // Invite all 10 guests
      for (let i = 0; i < 10; i++) {
        store.inviteGuest();
      }
      
      expect(store.deck().length).toBe(0);
      expect(store.party().length).toBe(10);
      
      // Advance phase (PARTY -> BUY)
      store.advancePhase();
      
      // Verify all guests returned to deck
      expect(store.party().length).toBe(0);
      expect(store.deck().length).toBe(10);
    });

    /**
     * Test deck shuffle produces different order
     * **Validates: Requirements 1.3**
     */
    it('should produce different deck orders across multiple initializations', () => {
      const orders: string[] = [];
      
      // Run 20 initializations to ensure we get different orders
      for (let i = 0; i < 20; i++) {
        store.initializeGame();
        const order = store.deck().map(g => g.name).join(',');
        orders.push(order);
      }
      
      // Verify we have multiple unique orders (shuffle is working)
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });

    /**
     * Test inviteGuest removes from top of deck
     * **Validates: Requirements 2.2, 4.1**
     */
    it('should remove guest from top of deck when inviting', () => {
      store.initializeGame();
      
      const topGuest = store.deck()[0];
      
      store.inviteGuest();
      
      // Verify top guest was removed from deck
      expect(store.deck().length).toBe(9);
      expect(store.deck()[0]).not.toEqual(topGuest);
      
      // Verify top guest was added to party
      expect(store.party().length).toBe(1);
      expect(store.party()[0]).toEqual(topGuest);
    });

    /**
     * Test guests maintain identity through operations
     * **Validates: Requirements 7.1, 7.2, 7.3**
     */
    it('should preserve guest names through invite and return operations', () => {
      store.initializeGame();
      patchState(unprotected(store), { baseTroubleLimit: 100 }); // Prevent a bust while inviting
      store.advancePhase(); // Move to PARTY phase
      
      // Get initial deck names
      const initialDeckNames = store.deck().map(g => g.name).sort();
      
      // Capture guests before inviting
      const guest1 = store.deck()[0];
      store.inviteGuest();
      
      const guest2 = store.deck()[0];
      store.inviteGuest();
      
      const guest3 = store.deck()[0];
      store.inviteGuest();
      
      // Verify invited guests maintain their names in party
      const partyNames = store.party().map(g => g.name);
      expect(partyNames[0]).toBe(guest1.name);
      expect(partyNames[1]).toBe(guest2.name);
      expect(partyNames[2]).toBe(guest3.name);
      
      // Return guests to deck
      store.advancePhase();
      
      // Verify all original names still present
      const finalDeckNames = store.deck().map(g => g.name).sort();
      expect(finalDeckNames).toEqual(initialDeckNames);
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test single turn game completion
     * **Validates: Requirements 2.5**
     */
    it('should handle single turn game correctly', () => {
      store.initializeGame(1);

      expect(store.currentTurn()).toBe(1);
      expect(store.isFinalTurn()).toBe(true);
      expect(store.remainingTurns()).toBe(1);

      store.advancePhase(); // BUY -> PARTY
      expect(store.phaseButtonLabel()).toBe('Game Over');

      store.advancePhase(); // PARTY -> Complete
      expect(store.isGameComplete()).toBe(true);
    });

    /**
     * Test large turn count game
     * **Validates: Requirements 1.1, 1.3**
     */
    it('should handle large turn count correctly', () => {
      store.initializeGame(1000);

      expect(store.totalTurns()).toBe(1000);
      expect(store.remainingTurns()).toBe(1000);
      expect(store.isFinalTurn()).toBe(false);

      // Progress a few turns
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 2)

      expect(store.currentTurn()).toBe(2);
      expect(store.remainingTurns()).toBe(999);
      expect(store.isFinalTurn()).toBe(false);
    });

    /**
     * Test re-initialization during active game
     * **Validates: Requirements 1.1**
     */
    it('should allow re-initialization during active game', () => {
      store.initializeGame(10);

      // Progress through game
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 2)
      store.advancePhase(); // BUY -> PARTY

      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);

      // Re-initialize with different turn count
      store.initializeGame(5);

      // Verify state reset to new configuration
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.totalTurns()).toBe(5);
      expect(store.isGameComplete()).toBe(false);
    });
  });

  /**
   * Wild Buddy / Trouble Resource Tests
   *
   * These tests verify the Wild Buddy guest type integration in the GameStore
   * and the computed trouble signal behavior.
   *
   * **Validates: Requirements 3.1, 3.3, 4.1, 5.1, 9.1, 10.1**
   */
  describe('Wild Buddy / Trouble', () => {
    /**
     * Test deck has 10 guests after initialization
     * **Validates: Requirements 9.1**
     */
    it('should have 10 guests in deck after initializeGame()', () => {
      store.initializeGame();

      expect(store.deck().length).toBe(10);
    });

    /**
     * Test deck contains both Old Friends and Wild Buddies
     * **Validates: Requirements 9.1**
     */
    it('should contain 4 Old Friends and 4 Wild Buddies in deck', () => {
      store.initializeGame();

      const deck = store.deck();
      const oldFriends = deck.filter(g => g.type === 'OLD_FRIEND');
      const wildBuddies = deck.filter(g => g.type === 'WILD_BUDDY');
      const richPals = deck.filter(g => g.type === 'RICH_PAL');

      expect(oldFriends.length).toBe(4);
      expect(wildBuddies.length).toBe(4);
      expect(richPals.length).toBe(2);
    });

    /**
     * Test trouble is 0 when party is empty
     * **Validates: Requirements 3.3**
     */
    it('should have trouble of 0 when party is empty', () => {
      store.initializeGame();

      expect(store.party().length).toBe(0);
      expect(store.trouble()).toBe(0);
    });

    /**
     * Test trouble increases when Wild Buddies are invited
     * **Validates: Requirements 3.1, 4.1**
     */
    it('should increase trouble when a Wild Buddy is invited', () => {
      store.initializeGame();

      // Find a Wild Buddy in the deck and move it to the top
      const deck = store.deck();
      const wildBuddyIndex = deck.findIndex(g => g.type === 'WILD_BUDDY');
      // Swap Wild Buddy to top of deck so inviteGuest picks it
      const reordered = [...deck];
      [reordered[0], reordered[wildBuddyIndex]] = [reordered[wildBuddyIndex], reordered[0]];
      patchState(unprotected(store), { deck: reordered });

      store.inviteGuest();

      expect(store.trouble()).toBe(GUEST_TYPE_DEFAULTS['WILD_BUDDY'].troubleValue);
    });

    /**
     * Test trouble does not increase when Old Friends are invited
     * **Validates: Requirements 4.1, 10.1**
     */
    it('should not increase trouble when an Old Friend is invited', () => {
      store.initializeGame();

      // Find an Old Friend in the deck and move it to the top
      const deck = store.deck();
      const oldFriendIndex = deck.findIndex(g => g.type === 'OLD_FRIEND');
      const reordered = [...deck];
      [reordered[0], reordered[oldFriendIndex]] = [reordered[oldFriendIndex], reordered[0]];
      patchState(unprotected(store), { deck: reordered });

      store.inviteGuest();

      expect(store.trouble()).toBe(0);
    });

    /**
     * Test trouble resets to 0 when party ends (advancePhase from Party)
     * **Validates: Requirements 5.1**
     */
    it('should reset trouble to 0 when party ends via advancePhase', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Invite guests to generate some trouble
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();

      // Trouble may be > 0 depending on which guests were invited
      // Advance from PARTY -> returns guests to deck, party empties
      store.advancePhase();

      // Party is now empty, so trouble must be 0
      expect(store.party().length).toBe(0);
      expect(store.trouble()).toBe(0);
    });

    /**
     * Test the third Wild Buddy from the starting deck pushes trouble past the limit
     */
    it('should trouble-bust when a third Wild Buddy joins the party', () => {
      store.initializeGame();
      store.advancePhase(); // BUY -> PARTY

      const byName = (name: string) => store.deck().find(g => g.name === name)!;
      const top = ['Anthony', 'Brian', 'Teresa', 'Jacco'];
      patchState(unprotected(store), {
        deck: [...top.map(byName), ...store.deck().filter(g => !top.includes(g.name))]
      });

      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();
      expect(store.isPartyShutdown()).toBe(false);
      expect(store.trouble()).toBe(2);

      store.inviteGuest(); // Jacco: third Wild Buddy, trouble 3 > limit 2

      expect(store.isPartyShutdown()).toBe(true);
      expect(store.isOverflowShutdown()).toBe(false);
      expect(store.party()).toEqual([]);
      expect(store.bustPartySnapshot().map(g => g.name)).toEqual(top);
      expect(store.deck().length).toBe(6);
    });

    /**
     * Test trouble and popularity are independent
     * **Validates: Requirements 10.1**
     */
    it('should track trouble and popularity independently', () => {
      store.initializeGame(5);
      // Raise house capacity and trouble limit so all 10 guests can be invited without a bust
      patchState(unprotected(store), { houseCapacity: 100, baseTroubleLimit: 100 });
      store.advancePhase(); // BUY -> PARTY

      // Invite all 10 guests
      for (let i = 0; i < 10; i++) {
        store.inviteGuest();
      }

      const trouble = store.trouble();
      // Trouble should reflect only troubleValues, popularity should still be 0 (not yet calculated)
      expect(trouble).toBeGreaterThan(0); // At least some Wild Buddies in party
      expect(store.popularity()).toBe(0); // Popularity only applied at phase end

      store.advancePhase(); // PARTY -> BUY, popularity calculated

      // After phase end, popularity should be positive and trouble should be 0 (party empty)
      expect(store.popularity()).toBeGreaterThan(0);
      expect(store.trouble()).toBe(0);
    });
  });

  /**
   * Rich Pal / Money Resource Tests
   *
   * These tests verify the Rich Pal guest type integration in the GameStore
   * and the money resource behavior.
   *
   * **Validates: Requirements 3.1, 3.2, 5.1–5.4, 10.1**
   */
  describe('Rich Pal / Money', () => {
    /**
     * Test deck has 10 guests after initialization (4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
     * **Validates: Requirements 10.1**
     */
    it('should have 10 guests in deck after initializeGame()', () => {
      store.initializeGame();

      expect(store.deck().length).toBe(10);
    });

    /**
     * Test money is 0 after initializeGame()
     * **Validates: Requirements 3.1**
     */
    it('should have money of 0 after initializeGame()', () => {
      store.initializeGame();

      expect(store.money()).toBe(0);
    });

    /**
     * Test money is 0 after resetGame()
     * **Validates: Requirements 3.2**
     */
    it('should have money of 0 after resetGame()', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Invite a Rich Pal to generate money
      const deck = store.deck();
      const richPalIndex = deck.findIndex(g => g.type === 'RICH_PAL');
      if (richPalIndex > 0) {
        const reordered = [...deck];
        [reordered[0], reordered[richPalIndex]] = [reordered[richPalIndex], reordered[0]];
        patchState(unprotected(store), { deck: reordered });
      }
      store.inviteGuest();
      store.advancePhase(); // PARTY -> BUY, money calculated

      // Money should be > 0 now (Rich Pal contributes 1)
      expect(store.money()).toBeGreaterThan(0);

      store.resetGame();

      expect(store.money()).toBe(0);
    });

    /**
     * Test money unchanged when party has no Rich Pals at phase end
     * **Validates: Requirements 5.1, 5.2**
     */
    it('should not change money when party has no Rich Pals at phase end', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Reorder deck so only Old Friends are on top (moneyValue 0)
      const deck = store.deck();
      const oldFriends = deck.filter(g => g.type === 'OLD_FRIEND');
      const rest = deck.filter(g => g.type !== 'OLD_FRIEND');
      patchState(unprotected(store), { deck: [...oldFriends, ...rest] });

      // Invite 2 Old Friends
      store.inviteGuest();
      store.inviteGuest();

      expect(store.party().every(g => g.type === 'OLD_FRIEND')).toBe(true);
      expect(store.money()).toBe(0);

      store.advancePhase(); // PARTY -> BUY, money calculated

      expect(store.money()).toBe(0);
    });

    /**
     * Test money increases by 1 when party has 1 Rich Pal at phase end
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
     */
    it('should increase money by 1 when party has 1 Rich Pal at phase end', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Reorder deck so a Rich Pal is on top
      const deck = store.deck();
      const richPalIndex = deck.findIndex(g => g.type === 'RICH_PAL');
      const reordered = [...deck];
      [reordered[0], reordered[richPalIndex]] = [reordered[richPalIndex], reordered[0]];
      patchState(unprotected(store), { deck: reordered });

      store.inviteGuest();

      expect(store.party().length).toBe(1);
      expect(store.party()[0].type).toBe('RICH_PAL');
      expect(store.money()).toBe(0);

      store.advancePhase(); // PARTY -> BUY, money calculated

      expect(store.money()).toBe(1);
    });
  });

  /**
   * Trouble Limit & Party Shutdown Tests
   *
   * These tests verify the trouble limit system, party shutdown logic,
   * and related state transitions in the GameStore.
   *
   * **Validates: Requirements 1.4, 2.1, 2.2, 4.1, 4.2, 4.3, 5.1, 5.2**
   */
  describe('Trouble Limit & Party Shutdown', () => {
    /**
     * Test triggerPartyShutdown sets isPartyShutdown to true
     * **Validates: Requirements 4.1**
     */
    it('should set isPartyShutdown to true when triggerPartyShutdown is called', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Invite some guests so there's a party to shut down
      store.inviteGuest();
      store.inviteGuest();

      expect(store.isPartyShutdown()).toBe(false);

      store.triggerPartyShutdown();

      expect(store.isPartyShutdown()).toBe(true);
    });

    /**
     * Test triggerPartyShutdown does not change popularity or money
     * **Validates: Requirements 4.1, 4.2**
     */
    it('should not change popularity or money when triggerPartyShutdown is called', () => {
      store.initializeGame(5);

      // Set some initial popularity and money to verify they don't change
      patchState(unprotected(store), { popularity: 7, money: 3 });

      store.advancePhase(); // BUY -> PARTY

      // Invite guests that would normally contribute resources
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();

      const popularityBefore = store.popularity();
      const moneyBefore = store.money();

      store.triggerPartyShutdown();

      expect(store.popularity()).toBe(popularityBefore);
      expect(store.money()).toBe(moneyBefore);
    });

    /**
     * Test triggerPartyShutdown snapshots party, clears party, returns discard to deck
     * **Validates: Requirements 2.1, 3.1**
     */
    it('should snapshot party, clear party, and return discard to deck when triggerPartyShutdown is called', () => {
      store.initializeGame(5);
      patchState(unprotected(store), { baseTroubleLimit: 100 }); // Prevent a bust while inviting
      store.advancePhase(); // BUY -> PARTY

      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();

      const partyBefore = [...store.party()];
      const deckBefore = store.deck().length;
      expect(partyBefore.length).toBe(3);

      // Put a guest in discard to verify it returns to deck
      const discardGuest = partyBefore[0];
      patchState(unprotected(store), { discard: [discardGuest] });

      store.triggerPartyShutdown();

      // Party should be cleared
      expect(store.party().length).toBe(0);
      // bustPartySnapshot should contain the party guests
      expect(store.bustPartySnapshot().length).toBe(3);
      // Discard should be cleared (returned to deck)
      expect(store.discard().length).toBe(0);
      // Deck should have original deck + discard (party goes to snapshot, not deck)
      expect(store.deck().length).toBe(deckBefore + 1);
    });

    /**
     * Test acknowledgeShutdown on non-final turn enters ban selection
     * **Validates: Requirements 3.2**
     */
    it('should enter ban selection when acknowledgeShutdown is called on non-final turn', () => {
      store.initializeGame(5);

      patchState(unprotected(store), {
        currentTurn: 2,
        totalTurns: 5,
        currentPhase: GamePhase.PARTY,
        isPartyShutdown: true,
        bustPartySnapshot: [testGuest('WILD_BUDDY', 'Matt')]
      });

      store.acknowledgeShutdown();

      expect(store.isPartyShutdown()).toBe(false);
      expect(isChoosingBan(store)).toBe(true);
      // Turn should NOT advance — ban selection happens first
      expect(store.currentTurn()).toBe(2);
      expect(store.isGameComplete()).toBe(false);
    });

    /**
     * Test acknowledgeShutdown on final turn marks game complete
     * **Validates: Requirements 5.2**
     */
    it('should mark game complete when acknowledgeShutdown is called on final turn', () => {
      store.initializeGame(5);

      patchState(unprotected(store), {
        currentTurn: 5,
        totalTurns: 5,
        currentPhase: GamePhase.PARTY,
        isPartyShutdown: true
      });

      store.acknowledgeShutdown();

      expect(store.isPartyShutdown()).toBe(false);
      expect(store.isGameComplete()).toBe(true);
    });

    /**
     * Test advancePhase from Party resets partyTroubleLimitModifier to 0
     * **Validates: Requirements 2.1**
     */
    it('should reset partyTroubleLimitModifier to 0 when advancePhase ends Party phase', () => {
      store.initializeGame(5);
      store.advancePhase(); // BUY -> PARTY

      // Add peace guests to party to get a non-zero modifier
      const peaceGuests: Guest[] = [
        testGuest('CUTE_DOG', 'Oreo'),
        testGuest('HIPPY', 'Bob'),
        testGuest('CUTE_DOG', 'Lily'),
      ];
      patchState(unprotected(store), { party: peaceGuests });
      expect(store.partyTroubleLimitModifier()).toBe(3);

      store.advancePhase(); // PARTY -> BUY (turn 2)

      expect(store.partyTroubleLimitModifier()).toBe(0);
    });

    /**
     * Test default values after initializeGame
     * **Validates: Requirements 1.4**
     */
    it('should set default trouble limit values after initializeGame', () => {
      store.initializeGame();

      expect(store.baseTroubleLimit()).toBe(2);
      // partyTroubleLimitModifier is now computed from party (empty party = 0)
      expect(store.partyTroubleLimitModifier()).toBe(0);
      expect(store.isPartyShutdown()).toBe(false);
      expect(store.effectiveTroubleLimit()).toBe(2);
    });

    /**
     * Test default values after resetGame
     * **Validates: Requirements 1.4, 2.2**
     */
    it('should set default trouble limit values after resetGame', () => {
      store.initializeGame(5);

      // Modify state to non-default values
      patchState(unprotected(store), {
        baseTroubleLimit: 5,
        isPartyShutdown: true,
        party: [
          testGuest('HIPPY', 'Bob'),
          testGuest('CUTE_DOG', 'Oreo'),
        ]
      });

      store.resetGame();

      expect(store.baseTroubleLimit()).toBe(2);
      // partyTroubleLimitModifier is now computed from party (empty party = 0)
      expect(store.partyTroubleLimitModifier()).toBe(0);
      expect(store.isPartyShutdown()).toBe(false);
      expect(store.effectiveTroubleLimit()).toBe(2);
    });
  });

  /**
   * Ban Guest After Bust — Unit Tests
   *
   * These tests verify the discard pile, ban selection flow, and ban confirmation
   * logic added by the ban-guest-after-bust feature.
   *
   * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 3.2, 4.3, 5.2, 6.1, 6.2, 6.4, 9.1, 9.2, 9.3**
   */
  describe('Ban Guest After Bust', () => {
    // Helper to create a guest with specific type and name

    describe('Discard Pile Initialization', () => {
      /**
       * Test initializeGame() sets discard to empty array
       * **Validates: Requirements 1.2**
       */
      it('should set discard to empty array after initializeGame()', () => {
        store.initializeGame();

        expect(store.discard()).toEqual([]);
      });

      /**
       * Test resetGame() sets discard to empty array
       * **Validates: Requirements 1.3**
       */
      it('should set discard to empty array after resetGame()', () => {
        store.initializeGame();
        // Put something in discard first
        patchState(unprotected(store), { discard: [testGuest('OLD_FRIEND', 'Brian')] });
        expect(store.discard().length).toBe(1);

        store.resetGame();

        expect(store.discard()).toEqual([]);
      });
    });

    describe('triggerPartyShutdown()', () => {
      /**
       * Test triggerPartyShutdown() snapshots party, clears party, returns discard to deck
       * **Validates: Requirements 2.1, 3.1**
       */
      it('should snapshot party, clear party, and return discard to deck', () => {
        store.initializeGame(5);
        patchState(unprotected(store), { baseTroubleLimit: 100 }); // Prevent a bust while inviting
        store.advancePhase(); // BUY -> PARTY

        // Invite 3 guests
        store.inviteGuest();
        store.inviteGuest();
        store.inviteGuest();

        const partyGuests = [...store.party()];
        expect(partyGuests.length).toBe(3);

        // Place a guest in discard to verify it returns to deck
        const discardGuest = testGuest('OLD_FRIEND', 'TestDiscard');
        patchState(unprotected(store), { discard: [discardGuest] });
        const deckSizeBefore = store.deck().length;

        store.triggerPartyShutdown();

        // Party should be cleared
        expect(store.party()).toEqual([]);
        // Snapshot should contain the party guests
        expect(store.bustPartySnapshot().length).toBe(3);
        expect(store.bustPartySnapshot().map(g => g.name)).toEqual(partyGuests.map(g => g.name));
        // Discard should be cleared
        expect(store.discard()).toEqual([]);
        // Deck should have gained the discard guest
        expect(store.deck().length).toBe(deckSizeBefore + 1);
        // isPartyShutdown should be true
        expect(store.isPartyShutdown()).toBe(true);
      });
    });

    describe('acknowledgeShutdown()', () => {
      /**
       * Test acknowledgeShutdown() on non-final turn starts the ban choice
       * **Validates: Requirements 3.2**
       */
      it('should start the ban choice on non-final turn', () => {
        store.initializeGame(5);
        patchState(unprotected(store), {
          currentTurn: 3,
          currentPhase: GamePhase.PARTY,
          isPartyShutdown: true,
          bustPartySnapshot: [testGuest('WILD_BUDDY', 'Anthony')]
        });

        store.acknowledgeShutdown();

        expect(store.isPartyShutdown()).toBe(false);
        expect(isChoosingBan(store)).toBe(true);
        // Turn should NOT advance yet
        expect(store.currentTurn()).toBe(3);
      });

      /**
       * Test acknowledgeShutdown() on final turn does NOT start the ban choice
       * **Validates: Requirements 4.3**
       */
      it('should NOT start the ban choice on final turn', () => {
        store.initializeGame(5);
        patchState(unprotected(store), {
          currentTurn: 5,
          totalTurns: 5,
          currentPhase: GamePhase.PARTY,
          isPartyShutdown: true,
          bustPartySnapshot: [testGuest('WILD_BUDDY', 'Anthony')]
        });

        store.acknowledgeShutdown();

        expect(store.isPartyShutdown()).toBe(false);
        expect(isChoosingBan(store)).toBe(false);
        expect(store.isGameComplete()).toBe(true);
        expect(store.bustPartySnapshot()).toEqual([]);
        expect(pickedBan(store)).toBeNull();
      });
    });

    describe('picking a guest to ban', () => {
      /**
       * Test picking a bust guest selects them
       * **Validates: Requirements 5.1**
       */
      it('should select the guest at the given index', () => {
        store.initializeGame(5);
        const guests = [
          testGuest('OLD_FRIEND', 'Brian'),
          testGuest('WILD_BUDDY', 'Anthony'),
          testGuest('RICH_PAL', 'Khalil')
        ];
        startBanSelection(store, guests);

        pickBan(store, 1);

        expect(pickedBan(store)).toBe(guests[1]);
        expect(pickedBan(store)!.name).toBe('Anthony');
      });

      /**
       * Test picking an out-of-bounds index is a no-op
       * **Validates: Requirements 5.1**
       */
      it('should be a no-op when index is out of bounds', () => {
        store.initializeGame(5);
        startBanSelection(store, [testGuest('OLD_FRIEND', 'Brian')]);

        pickBan(store, 5);
        expect(pickedBan(store)).toBeNull();

        pickBan(store, -1);
        expect(pickedBan(store)).toBeNull();
      });
    });

    describe('confirming a ban', () => {
      /**
       * Test confirming places selected in discard, returns rest to deck, advances turn
       * **Validates: Requirements 6.1, 6.2, 6.4**
       */
      it('should place selected guest in discard, return rest to deck, and advance turn', () => {
        store.initializeGame(5);
        const guests = [
          testGuest('OLD_FRIEND', 'Brian'),
          testGuest('WILD_BUDDY', 'Anthony'),
          testGuest('RICH_PAL', 'Khalil')
        ];
        patchState(unprotected(store), {
          currentTurn: 2,
          currentPhase: GamePhase.PARTY,
          deck: [testGuest('OLD_FRIEND', 'Emily')]
        });
        startBanSelection(store, guests, 1); // Anthony

        store.confirmChoice();

        // Selected guest should be in discard
        expect(store.discard().length).toBe(1);
        expect(store.discard()[0].name).toBe('Anthony');
        // Remaining guests (Brian, Khalil) + Emily should be in deck
        expect(store.deck().length).toBe(3);
        const deckNames = store.deck().map(g => g.name).sort();
        expect(deckNames).toEqual(['Brian', 'Emily', 'Khalil']);
        // Turn should advance
        expect(store.currentTurn()).toBe(3);
        expect(store.currentPhase()).toBe(GamePhase.BUY);
        // Ban state should be cleared
        expect(isChoosingBan(store)).toBe(false);
        expect(store.bustPartySnapshot()).toEqual([]);
        expect(pickedBan(store)).toBeNull();
      });

      /**
       * Test confirming with no selection is a no-op
       * **Validates: Requirements 6.1**
       */
      it('should be a no-op when no guest is selected', () => {
        store.initializeGame(5);
        patchState(unprotected(store), { currentTurn: 2, currentPhase: GamePhase.PARTY });
        startBanSelection(store, [testGuest('OLD_FRIEND', 'Brian')]);

        store.confirmChoice();

        // Nothing should change
        expect(store.currentTurn()).toBe(2);
        expect(store.currentPhase()).toBe(GamePhase.PARTY);
        expect(isChoosingBan(store)).toBe(true);
        expect(store.bustPartySnapshot().length).toBe(1);
      });
    });

    describe('advancePhase() PARTY branch with discard', () => {
      /**
       * Test advancePhase() PARTY branch returns discard + party to deck after resource calc
       * **Validates: Requirements 2.1, 2.2, 2.3**
       */
      it('should return discard and party guests to deck after calculating resources', () => {
        store.initializeGame(5);
        store.advancePhase(); // BUY -> PARTY

        // Invite 2 guests
        store.inviteGuest();
        store.inviteGuest();

        const partyGuests = [...store.party()];
        const deckSize = store.deck().length;

        // Place a banned guest in discard
        const discardGuest = testGuest('OLD_FRIEND', 'TestBanned');
        patchState(unprotected(store), { discard: [discardGuest] });

        store.advancePhase(); // PARTY -> BUY (turn 2)

        // Discard should be empty
        expect(store.discard()).toEqual([]);
        // Party should be empty
        expect(store.party()).toEqual([]);
        // Deck should contain all guests: original deck + party + discard
        expect(store.deck().length).toBe(deckSize + partyGuests.length + 1);
        // Verify the discard guest is in the deck
        expect(store.deck().map(g => g.name)).toContain('TestBanned');
      });
    });

    describe('ban confirmation message', () => {
      /**
       * Test the ban confirmation message for Old Friend guest
       * **Validates: Requirements 9.1**
       */
      it('should return correct message for Old Friend guest', () => {
        store.initializeGame();
        startBanSelection(store, [testGuest('OLD_FRIEND', 'Brian')], 0);

        expect(store.pendingChoice()?.confirmation).toBe(
          'Old Friend Brian will be banned from the next party.'
        );
      });

      /**
       * Test the ban confirmation message for Wild Buddy guest
       * **Validates: Requirements 9.2**
       */
      it('should return correct message for Wild Buddy guest', () => {
        store.initializeGame();
        startBanSelection(store, [testGuest('WILD_BUDDY', 'Anthony')], 0);

        expect(store.pendingChoice()?.confirmation).toBe(
          'Wild Buddy Anthony will be banned from the next party.'
        );
      });

      /**
       * Test the ban confirmation message for Rich Pal guest
       * **Validates: Requirements 9.3**
       */
      it('should return correct message for Rich Pal guest', () => {
        store.initializeGame();
        startBanSelection(store, [testGuest('RICH_PAL', 'Khalil')], 0);

        expect(store.pendingChoice()?.confirmation).toBe(
          'Rich Pal Khalil will be banned from the next party.'
        );
      });

      /**
       * Test there is no confirmation message when no guest is selected
       * **Validates: Requirements 5.2**
       */
      it('should have no confirmation message when no guest is selected', () => {
        store.initializeGame();
        startBanSelection(store, [testGuest('OLD_FRIEND', 'Brian')]);

        expect(store.pendingChoice()?.confirmation).toBeNull();
      });
    });
  });

  /**
   * House Capacity Initial State Tests
   *
   * These tests verify that house capacity state fields are correctly
   * initialized after initializeGame().
   *
   * **Validates: Requirements 1.1, 7.1 (House Size Capacity)**
   */
  describe('House Capacity Initial State', () => {
    /**
     * Test houseCapacity is 5 after initializeGame()
     * **Validates: Requirements 1.1**
     */
    it('should set houseCapacity to 5 after initializeGame()', () => {
      store.initializeGame();

      expect(store.houseCapacity()).toBe(5);
    });

    /**
     * Test expansionsPurchased is 0 after initializeGame()
     * **Validates: Requirements 7.1**
     */
    it('should set expansionsPurchased to 0 after initializeGame()', () => {
      store.initializeGame();

      expect(store.expansionsPurchased()).toBe(0);
    });

    /**
     * Test showHouseFullMessage is false after initializeGame()
     * **Validates: Requirements 1.1**
     */
    it('should set showHouseFullMessage to false after initializeGame()', () => {
      store.initializeGame();

      expect(store.showHouseFullMessage()).toBe(false);
    });
  });

  /**
   * purchaseExpansion() Edge Cases
   *
   * These tests verify edge-case behavior of the purchaseExpansion() method
   * including exact money thresholds, sold-out stock, and cost cap.
   *
   * **Validates: Requirements 4.4, 5.1, 6.1, 6.3**
   */
  describe('purchaseExpansion() edge cases', () => {
    /**
     * Test purchase with exactly enough money succeeds
     * **Validates: Requirements 5.1**
     */
    it('should succeed when money equals exactly the expansion cost', () => {
      store.initializeGame();
      // First expansion costs min(0 + 2, 12) = $2
      patchState(unprotected(store), { money: 2, expansionsPurchased: 0 });

      const result = store.purchaseExpansion();

      expect(result.success).toBe(true);
      expect(store.money()).toBe(0);
      expect(store.houseCapacity()).toBe(6);
      expect(store.expansionsPurchased()).toBe(1);
    });

    /**
     * Test purchase with 1 money short fails
     * **Validates: Requirements 6.1, 6.3**
     */
    it('should fail with insufficient_money when 1 short of expansion cost', () => {
      store.initializeGame();
      // First expansion costs $2, set money to $1
      patchState(unprotected(store), { money: 1, expansionsPurchased: 0 });

      const capacityBefore = store.houseCapacity();
      const moneyBefore = store.money();
      const purchasedBefore = store.expansionsPurchased();

      const result = store.purchaseExpansion();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('insufficient_money');
        expect(result.message).toBe('Not enough money!');
      }
      // State unchanged
      expect(store.houseCapacity()).toBe(capacityBefore);
      expect(store.money()).toBe(moneyBefore);
      expect(store.expansionsPurchased()).toBe(purchasedBefore);
    });

    /**
     * Test purchase when stock is 0 (29 purchased) returns sold_out
     * **Validates: Requirements 6.1, 6.3**
     */
    it('should return sold_out when all 29 expansions have been purchased', () => {
      store.initializeGame();
      patchState(unprotected(store), { money: 100, expansionsPurchased: 29, houseCapacity: 34 });

      const capacityBefore = store.houseCapacity();
      const moneyBefore = store.money();

      const result = store.purchaseExpansion();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('sold_out');
        expect(result.message).toBe('No expansions available!');
      }
      // State unchanged
      expect(store.houseCapacity()).toBe(capacityBefore);
      expect(store.money()).toBe(moneyBefore);
      expect(store.expansionsPurchased()).toBe(29);
    });

    /**
     * Test cost caps at $12 after 10+ purchases
     * **Validates: Requirements 4.4**
     */
    it('should cap expansion cost at $12 when 10 or more expansions have been purchased', () => {
      store.initializeGame();
      // After 10 purchases, cost = min(10 + 2, 12) = $12
      patchState(unprotected(store), { money: 12, expansionsPurchased: 10, houseCapacity: 15 });

      const result = store.purchaseExpansion();

      expect(result.success).toBe(true);
      expect(store.money()).toBe(0);
      expect(store.houseCapacity()).toBe(16);
      expect(store.expansionsPurchased()).toBe(11);

      // Verify cost stays at $12 for subsequent purchase too
      expect(store.expansionCost()).toBe(12);
    });
  });
});

/**
 * Shop Buy Guests — Unit Tests
 *
 * These tests verify the shop inventory initialization, purchase logic,
 * and reset behavior added by the shop-buy-guests feature.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 3.1, 3.2, 3.3, 4.1, 5.1, 6.1, 8.3**
 */
describe('Shop Buy Guests', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  describe('initializeGame() shop inventory', () => {
    /**
     * Test initializeGame() creates shop entries including OLD_FRIEND, RICH_PAL, and MONKEY
     * **Validates: Requirements 1.1, 1.5**
     */
    it('should create shop entries including OLD_FRIEND, RICH_PAL, and MONKEY with correct names, counts, and costs', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      expect(inventory.length).toBe(28);

      const oldFriendEntry = inventory.find((e: ShopInventoryEntry) => e.type === 'OLD_FRIEND');
      const richPalEntry = inventory.find((e: ShopInventoryEntry) => e.type === 'RICH_PAL');

      expect(oldFriendEntry).toBeDefined();
      expect(richPalEntry).toBeDefined();

      // OLD_FRIEND: 4 guests, cost 2
      expect(oldFriendEntry!.guests.length).toBe(4);
      expect(oldFriendEntry!.cost).toBe(2);
      const ofNames = oldFriendEntry!.guests.map(g => g.name).sort();
      expect(ofNames).toEqual(['Caleb', 'Chad', 'Matt', 'Wes']);

      // RICH_PAL: 4 guests, cost 3
      expect(richPalEntry!.guests.length).toBe(4);
      expect(richPalEntry!.cost).toBe(3);
      const rpNames = richPalEntry!.guests.map(g => g.name).sort();
      expect(rpNames).toEqual(['Arlene', 'Jim', 'Kevin', 'Robert']);
    });

    /**
     * Test no WILD_BUDDY entry exists after initialization
     * **Validates: Requirements 1.5**
     */
    it('should not include a WILD_BUDDY entry in shop inventory', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      const wildBuddyEntry = inventory.find((e: ShopInventoryEntry) => e.type === 'WILD_BUDDY');
      expect(wildBuddyEntry).toBeUndefined();
    });
  });

  describe('purchaseGuest()', () => {
    /**
     * Test purchaseGuest() with valid state returns success and adds guest to deck
     * **Validates: Requirements 3.1, 3.2, 3.3**
     */
    it('should return success and add guest to deck when state is valid', () => {
      store.initializeGame();
      // Give enough popularity to buy an Old Friend (cost 2)
      patchState(unprotected(store), { popularity: 10 });

      const deckSizeBefore = store.deck().length;
      const result = store.purchaseGuest('OLD_FRIEND');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.guestType).toBe('OLD_FRIEND');
      }
      // Deck should have one more guest
      expect(store.deck().length).toBe(deckSizeBefore + 1);
      // Popularity should be deducted by cost (2)
      expect(store.popularity()).toBe(8);
      // Shop stock should decrease by 1
      const entry = store.shopInventory().find((e: ShopInventoryEntry) => e.type === 'OLD_FRIEND');
      expect(entry!.guests.length).toBe(3);
    });

    /**
     * Test purchaseGuest() with 0 stock returns sold_out with correct message
     * **Validates: Requirements 4.1**
     */
    it('should return sold_out when stock is 0', () => {
      store.initializeGame();
      patchState(unprotected(store), { popularity: 10 });

      // Empty the OLD_FRIEND stock
      const inventory = store.shopInventory().map((e: ShopInventoryEntry) =>
        e.type === 'OLD_FRIEND' ? { ...e, guests: [] } : e
      );
      patchState(unprotected(store), { shopInventory: inventory });

      const deckSizeBefore = store.deck().length;
      const popularityBefore = store.popularity();
      const result = store.purchaseGuest('OLD_FRIEND');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('sold_out');
        expect(result.message).toBe('No Old Friend available!');
      }
      // State should be unchanged
      expect(store.deck().length).toBe(deckSizeBefore);
      expect(store.popularity()).toBe(popularityBefore);
    });

    /**
     * Test purchaseGuest() with insufficient popularity returns insufficient_popularity with correct message
     * **Validates: Requirements 5.1**
     */
    it('should return insufficient_popularity when popularity is less than cost', () => {
      store.initializeGame();
      // Set popularity to 1, which is less than OLD_FRIEND cost of 2
      patchState(unprotected(store), { popularity: 1 });

      const deckSizeBefore = store.deck().length;
      const result = store.purchaseGuest('OLD_FRIEND');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('insufficient_popularity');
        expect(result.message).toBe('Not enough popularity!');
      }
      // State should be unchanged
      expect(store.deck().length).toBe(deckSizeBefore);
      expect(store.popularity()).toBe(1);
    });

    /**
     * Test purchaseGuest() with exactly enough popularity succeeds
     * **Validates: Requirements 3.1, 3.2**
     */
    it('should succeed when popularity equals exactly the cost', () => {
      store.initializeGame();
      // Set popularity to exactly 3 (RICH_PAL cost)
      patchState(unprotected(store), { popularity: 3 });

      const result = store.purchaseGuest('RICH_PAL');

      expect(result.success).toBe(true);
      expect(store.popularity()).toBe(0);
    });

    /**
     * Test purchaseGuest() last guest of a type succeeds deterministically
     * **Validates: Requirements 8.3**
     */
    it('should deterministically select the last remaining guest of a type', () => {
      store.initializeGame();
      patchState(unprotected(store), { popularity: 10 });

      // Set up shop with exactly 1 OLD_FRIEND remaining (Matt)
      const singleGuest = testGuest('OLD_FRIEND', 'Matt');
      const inventory = store.shopInventory().map((e: ShopInventoryEntry) =>
        e.type === 'OLD_FRIEND' ? { ...e, guests: [singleGuest] } : e
      );
      patchState(unprotected(store), { shopInventory: inventory });

      const result = store.purchaseGuest('OLD_FRIEND');

      expect(result.success).toBe(true);
      // The last guest added to deck should be Matt
      const deck = store.deck();
      const lastGuest = deck[deck.length - 1];
      expect(lastGuest.name).toBe('Matt');
      expect(lastGuest.type).toBe('OLD_FRIEND');

      // Shop should now have 0 OLD_FRIEND guests
      const entry = store.shopInventory().find((e: ShopInventoryEntry) => e.type === 'OLD_FRIEND');
      expect(entry!.guests.length).toBe(0);
    });
  });

  describe('resetGame() shop state', () => {
    /**
     * Test resetGame() sets shopInventory to empty array
     * **Validates: Requirements 6.1**
     */
    it('should set shopInventory to empty array after resetGame()', () => {
      store.initializeGame();
      // Verify shop has entries (OLD_FRIEND, RICH_PAL, MONKEY, + 4 new types + 2 peace types + 2 negative resource types + CLIMBER + MR_POPULAR + CELEBRITY + 7 star types + WEREWOLF + 5 scoring bonus types + DANCER)
      expect(store.shopInventory().length).toBe(28);

      store.resetGame();

      expect(store.shopInventory()).toEqual([]);
    });
  });
});

/**
 * inviteGuest() Capacity Guard — Unit Tests
 *
 * These tests verify that inviteGuest() enforces house capacity,
 * blocks invites when the party is full, and manages the
 * showHouseFullMessage flag correctly.
 *
 * **Validates: Requirements 2.1, 2.2, 2.4 (House Size Capacity)**
 */
describe('inviteGuest() capacity guard', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  /**
   * Test invite succeeds when party size is below capacity
   * **Validates: Requirements 2.1, 2.4**
   */
  it('should allow invite when party size is below house capacity', () => {
    store.initializeGame();
    // Default houseCapacity is 5, deck has 10 guests, party is empty
    expect(store.party().length).toBe(0);
    expect(store.houseCapacity()).toBe(5);

    store.inviteGuest();

    expect(store.party().length).toBe(1);
    expect(store.deck().length).toBe(9);
    expect(store.showHouseFullMessage()).toBe(false);
  });

  /**
   * Test invite blocked when party size equals capacity
   * **Validates: Requirements 2.1, 2.2**
   */
  it('should block invite and set showHouseFullMessage when party equals capacity', () => {
    store.initializeGame();
    // Set capacity to 3 and fill the party with 3 guests via patchState
    const deck = store.deck();
    patchState(unprotected(store), {
      houseCapacity: 3,
      party: deck.slice(0, 3),
      deck: deck.slice(3)
    });

    expect(store.party().length).toBe(3);
    expect(store.houseCapacity()).toBe(3);

    const partyBefore = [...store.party()];
    const deckBefore = [...store.deck()];

    store.inviteGuest();

    // Party and deck should be unchanged
    expect(store.party().length).toBe(3);
    expect(store.party().map(g => g.name)).toEqual(partyBefore.map(g => g.name));
    expect(store.deck().length).toBe(deckBefore.length);
    // showHouseFullMessage should be set
    expect(store.showHouseFullMessage()).toBe(true);
  });

  /**
   * Test showHouseFullMessage is cleared on successful invite
   * **Validates: Requirements 2.1, 2.4**
   */
  it('should clear showHouseFullMessage on a successful invite', () => {
    store.initializeGame();
    // Manually set the flag to true, then invite with room available
    patchState(unprotected(store), { showHouseFullMessage: true });
    expect(store.showHouseFullMessage()).toBe(true);

    store.inviteGuest();

    expect(store.showHouseFullMessage()).toBe(false);
    expect(store.party().length).toBe(1);
  });

  /**
   * Test showHouseFullMessage stays true after repeated blocked invites
   * **Validates: Requirements 2.1, 2.2**
   */
  it('should keep showHouseFullMessage true on repeated blocked invites', () => {
    store.initializeGame();
    const deck = store.deck();
    patchState(unprotected(store), {
      houseCapacity: 2,
      party: deck.slice(0, 2),
      deck: deck.slice(2)
    });

    store.inviteGuest(); // blocked
    expect(store.showHouseFullMessage()).toBe(true);

    store.inviteGuest(); // blocked again
    expect(store.showHouseFullMessage()).toBe(true);
    expect(store.party().length).toBe(2);
  });
});


/**
 * House Capacity Reset and Persistence Tests
 *
 * These tests verify that house capacity state resets correctly on resetGame()
 * and persists across phase transitions and party shutdowns.
 *
 * **Validates: Requirements 10.1, 10.2, 10.3, 1.2 (House Size Capacity)**
 */
describe('House Capacity Reset and Persistence', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  /**
   * Test resetGame() resets houseCapacity to 5
   * **Validates: Requirements 10.3**
   */
  it('should reset houseCapacity to 5 after resetGame()', () => {
    store.initializeGame();
    // Simulate expanded capacity
    patchState(unprotected(store), { houseCapacity: 12, expansionsPurchased: 7 });
    expect(store.houseCapacity()).toBe(12);

    store.resetGame();

    expect(store.houseCapacity()).toBe(5);
  });

  /**
   * Test resetGame() resets expansionsPurchased to 0
   * **Validates: Requirements 10.3**
   */
  it('should reset expansionsPurchased to 0 after resetGame()', () => {
    store.initializeGame();
    patchState(unprotected(store), { houseCapacity: 12, expansionsPurchased: 7 });
    expect(store.expansionsPurchased()).toBe(7);

    store.resetGame();

    expect(store.expansionsPurchased()).toBe(0);
  });

  /**
   * Test capacity persists across advancePhase() BUY→PARTY→BUY
   * **Validates: Requirements 10.1, 1.2**
   */
  it('should preserve houseCapacity across advancePhase() BUY→PARTY→BUY', () => {
    store.initializeGame(5);
    // Expand house to capacity 8
    patchState(unprotected(store), { houseCapacity: 8, expansionsPurchased: 3 });

    // BUY → PARTY
    store.advancePhase();
    expect(store.currentPhase()).toBe(GamePhase.PARTY);
    expect(store.houseCapacity()).toBe(8);
    expect(store.expansionsPurchased()).toBe(3);

    // PARTY → BUY (next turn)
    store.advancePhase();
    expect(store.currentPhase()).toBe(GamePhase.BUY);
    expect(store.houseCapacity()).toBe(8);
    expect(store.expansionsPurchased()).toBe(3);
  });

  /**
   * Test capacity persists through triggerPartyShutdown()
   * **Validates: Requirements 10.2**
   */
  it('should preserve houseCapacity through triggerPartyShutdown()', () => {
    store.initializeGame(5);
    patchState(unprotected(store), { houseCapacity: 10, expansionsPurchased: 5 });

    store.advancePhase(); // BUY → PARTY
    store.inviteGuest();
    store.inviteGuest();

    store.triggerPartyShutdown();

    expect(store.isPartyShutdown()).toBe(true);
    expect(store.houseCapacity()).toBe(10);
    expect(store.expansionsPurchased()).toBe(5);
  });
});

/**
 * Monkey Guest — Store Initialization & Shop Display Tests
 *
 * These tests verify that the Monkey guest type is correctly handled
 * by the GameStore during initialization and shop display ordering.
 *
 * **Validates: Requirements 3.2, 3.3, 4.2, 7.4 (Monkey Guest)**
 */
describe('Monkey Guest — Store Initialization', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  /**
   * Test initializeGame() creates a shopInventory entry for MONKEY with 4 guests and cost 3
   * **Validates: Requirements 3.2, 3.3**
   */
  it('should create a shopInventory entry for MONKEY with 4 guests and cost 3', () => {
    store.initializeGame();

    const inventory = store.shopInventory();
    const monkeyEntry = inventory.find((e: ShopInventoryEntry) => e.type === 'MONKEY');

    expect(monkeyEntry).toBeDefined();
    expect(monkeyEntry!.guests.length).toBe(4);
    expect(monkeyEntry!.cost).toBe(3);
  });

  /**
   * Test initializeGame() shopInventory MONKEY guest names are George, Punch, Darwin, Diddy
   * **Validates: Requirements 3.2**
   */
  it('should have MONKEY shopInventory guest names George, Punch, Darwin, Diddy', () => {
    store.initializeGame();

    const inventory = store.shopInventory();
    const monkeyEntry = inventory.find((e: ShopInventoryEntry) => e.type === 'MONKEY');

    expect(monkeyEntry).toBeDefined();
    const monkeyNames = monkeyEntry!.guests.map(g => g.name).sort();
    expect(monkeyNames).toEqual(['Darwin', 'Diddy', 'George', 'Punch']);
  });

  /**
   * Test initializeGame() deck contains zero MONKEY guests
   * **Validates: Requirements 4.2**
   */
  it('should have zero MONKEY guests in the deck after initializeGame()', () => {
    store.initializeGame();

    const deck = store.deck();
    const monkeysInDeck = deck.filter(g => g.type === 'MONKEY');

    expect(monkeysInDeck.length).toBe(0);
  });

  /**
   * Test purchasableShopItems() returns Monkey at index 1 (between Old Friend and Rich Pal)
   * **Validates: Requirements 7.4**
   */
  it('should return Monkey at index 1 in purchasableShopItems (between Old Friend and Rich Pal)', () => {
    store.initializeGame();

    const items = store.purchasableShopItems();

    // Cheapest first: Old Friend (2), then Monkey and Rich Pal (3), alphabetically
    expect(items.length).toBe(28);
    expect(items[0].type).toBe('OLD_FRIEND');
    expect(items[1].type).toBe('MONKEY');
    expect(items[2].type).toBe('RICH_PAL');
  });
});


/**
 * More Guest Types — Store Initialization & Shop Display Tests
 *
 * These tests verify that the four new guest types (Auctioneer, Gangster,
 * Rock Star, Gambler) are correctly handled by the GameStore during
 * initialization and shop display ordering.
 *
 * **Validates: Requirements 5.5, 6.2, 9.1, 9.2 (More Guest Types)**
 */
describe('More Guest Types — Store Initialization', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  describe('shopInventory entries for new types', () => {
    /**
     * Test initializeGame() creates a shopInventory entry for AUCTIONEER with 4 guests and cost 9
     * **Validates: Requirements 5.5**
     */
    it('should create a shopInventory entry for AUCTIONEER with 4 guests and cost 9', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      const entry = inventory.find((e: ShopInventoryEntry) => e.type === 'AUCTIONEER');

      expect(entry).toBeDefined();
      expect(entry!.guests.length).toBe(4);
      expect(entry!.cost).toBe(9);
      const names = entry!.guests.map(g => g.name).sort();
      expect(names).toEqual(['Bonham', 'Christie', 'Phillip', 'Sotheby']);
    });

    /**
     * Test initializeGame() creates a shopInventory entry for GANGSTER with 4 guests and cost 6
     * **Validates: Requirements 5.5**
     */
    it('should create a shopInventory entry for GANGSTER with 4 guests and cost 6', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      const entry = inventory.find((e: ShopInventoryEntry) => e.type === 'GANGSTER');

      expect(entry).toBeDefined();
      expect(entry!.guests.length).toBe(4);
      expect(entry!.cost).toBe(6);
      const names = entry!.guests.map(g => g.name).sort();
      expect(names).toEqual(['Johnny', 'Legs', 'Louie', 'Tony']);
    });

    /**
     * Test initializeGame() creates a shopInventory entry for ROCK_STAR with 4 guests and cost 5
     * **Validates: Requirements 5.5**
     */
    it('should create a shopInventory entry for ROCK_STAR with 4 guests and cost 5', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      const entry = inventory.find((e: ShopInventoryEntry) => e.type === 'ROCK_STAR');

      expect(entry).toBeDefined();
      expect(entry!.guests.length).toBe(4);
      expect(entry!.cost).toBe(5);
      const names = entry!.guests.map(g => g.name).sort();
      expect(names).toEqual(['Alanis', 'Gord', 'Neil', 'Randy']);
    });

    /**
     * Test initializeGame() creates a shopInventory entry for GAMBLER with 4 guests and cost 7
     * **Validates: Requirements 5.5**
     */
    it('should create a shopInventory entry for GAMBLER with 4 guests and cost 7', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      const entry = inventory.find((e: ShopInventoryEntry) => e.type === 'GAMBLER');

      expect(entry).toBeDefined();
      expect(entry!.guests.length).toBe(4);
      expect(entry!.cost).toBe(7);
      const names = entry!.guests.map(g => g.name).sort();
      expect(names).toEqual(['Ace', 'Jack', 'Kenny', 'Raymond']);
    });
  });

  describe('deck excludes new types', () => {
    /**
     * Test initializeGame() deck contains zero guests of any new type
     * **Validates: Requirements 6.2**
     */
    it('should have zero AUCTIONEER, GANGSTER, ROCK_STAR, or GAMBLER guests in the deck after initializeGame()', () => {
      store.initializeGame();

      const deck = store.deck();
      const newTypeGuests = deck.filter(g =>
        g.type === 'AUCTIONEER' || g.type === 'GANGSTER' ||
        g.type === 'ROCK_STAR' || g.type === 'GAMBLER'
      );

      expect(newTypeGuests.length).toBe(0);
    });
  });

  describe('purchasableShopItems() ordering', () => {
    /**
     * Test purchasableShopItems() returns all 7 types in correct order:
     * Old Friend (2), Monkey (3), Rich Pal (3), Rock Star (5), Gangster (6), Gambler (7), Auctioneer (9)
     * **Validates: Requirements 9.1, 9.2**
     */
    it('should return all 28 types sorted by ascending cost then alphabetical label', () => {
      store.initializeGame();

      const items = store.purchasableShopItems();

      expect(items.map(i => [i.type, i.cost])).toEqual([
        ['OLD_FRIEND', 2], ['MONKEY', 3], ['RICH_PAL', 3], ['HIPPY', 4], ['INTROVERT', 4], ['TICKET_TAKER', 4],
        ['CATERER', 5], ['COMEDIAN', 5], ['MASCOT', 5], ['MR_POPULAR', 5], ['ROCK_STAR', 5], ['WEREWOLF', 5],
        ['GANGSTER', 6], ['CUTE_DOG', 7], ['DANCER', 7], ['GAMBLER', 7], ['WRITER', 8], ['AUCTIONEER', 9], ['BARTENDER', 11],
        ['CELEBRITY', 11], ['CLIMBER', 12],
        ['DINOSAUR', 25], ['DRAGON', 30], ['MERMAID', 35], ['ALIEN', 40], ['UNICORN', 45],
        ['LEPRECHAUN', 50], ['SUPERHERO', 50]
      ]);
    });
  });
});

/**
 * Climber Entrance Effect — Unit Tests
 *
 * These tests verify the Climber guest type shop inventory, deck exclusion,
 * shop display ordering, and the entrance effect (popularityValue increment)
 * in the GameStore.
 *
 * **Validates: Requirements 2.2, 3.2, 4.1, 4.2, 4.3, 4.4, 5.3, 9.2**
 */
describe('Climber Entrance Effect — GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  describe('initializeGame() Climber shop inventory', () => {
    /**
     * Test initializeGame() creates a shopInventory entry for CLIMBER with 4 guests and cost 12
     * **Validates: Requirements 2.2**
     */
    it('should create a shopInventory entry for CLIMBER with 4 guests and cost 12', () => {
      store.initializeGame();

      const inventory = store.shopInventory();
      const climberEntry = inventory.find((e: ShopInventoryEntry) => e.type === 'CLIMBER');

      expect(climberEntry).toBeDefined();
      expect(climberEntry!.guests.length).toBe(4);
      expect(climberEntry!.cost).toBe(12);
    });

    /**
     * Test initializeGame() deck contains zero CLIMBER guests
     * **Validates: Requirements 3.2**
     */
    it('should have zero CLIMBER guests in the deck after initializeGame()', () => {
      store.initializeGame();

      const deck = store.deck();
      const climbersInDeck = deck.filter(g => g.type === 'CLIMBER');

      expect(climbersInDeck.length).toBe(0);
    });
  });

  describe('purchasableShopItems() ordering', () => {
    /**
     * Test purchasableShopItems() returns CLIMBER last (cost 12, highest)
     * **Validates: Requirements 9.2**
     */
    it('should return CLIMBER last among non-star guests in purchasableShopItems (cost 12)', () => {
      store.initializeGame();

      const items = store.purchasableShopItems();

      expect(items.length).toBe(28);
      // Star guests (cost 25+) follow Climber
      const climberIndex = items.findIndex(i => i.type === 'CLIMBER');
      expect(climberIndex).toBe(20);
      expect(items[climberIndex].cost).toBe(12);
      expect(items.slice(climberIndex + 1).every(i => GUEST_TYPE_DEFAULTS[i.type].starValue > 0)).toBe(true);
    });
  });

  describe('inviteGuest() Climber entrance effect', () => {
    /**
     * Test inviting a Climber with popularityValue 0 results in party guest with popularityValue 1
     * **Validates: Requirements 4.1, 4.4**
     */
    it('should increment popularityValue from 0 to 1 when a Climber is invited', () => {
      store.initializeGame();

      // Patch deck with a Climber at popularityValue 0
      const climber = testGuest('CLIMBER', 'Ascella', { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 });
      patchState(unprotected(store), { deck: [climber] });

      store.inviteGuest();

      expect(store.party().length).toBe(1);
      expect(store.party()[0].type).toBe('CLIMBER');
      expect(store.party()[0].properties.popularityValue).toBe(1);
    });

    /**
     * Test inviting a Climber with popularityValue 9 keeps it at 9 (cap)
     * **Validates: Requirements 4.2**
     */
    it('should keep popularityValue at 9 (cap) when a Climber already at 9 is invited', () => {
      store.initializeGame();

      // Patch deck with a Climber at popularityValue 9 (already at cap)
      const climber = testGuest('CLIMBER', 'Skye', { popularityValue: 9, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 });
      patchState(unprotected(store), { deck: [climber] });

      store.inviteGuest();

      expect(store.party().length).toBe(1);
      expect(store.party()[0].type).toBe('CLIMBER');
      expect(store.party()[0].properties.popularityValue).toBe(9);
    });

    /**
     * Test inviting a non-Climber guest does not change its popularityValue
     * **Validates: Requirements 4.3**
     */
    it('should not modify popularityValue when a non-Climber guest is invited', () => {
      store.initializeGame();

      // Patch deck with an Old Friend (popularityValue 1 by default)
      const oldFriend = testGuest('OLD_FRIEND', 'Brian', { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 });
      patchState(unprotected(store), { deck: [oldFriend] });

      store.inviteGuest();

      expect(store.party().length).toBe(1);
      expect(store.party()[0].type).toBe('OLD_FRIEND');
      expect(store.party()[0].properties.popularityValue).toBe(1);
    });
  });

  describe('popularityValue preservation across party cycles', () => {
    /**
     * Test a Climber's popularityValue is preserved when it returns to the deck after advancePhase()
     * **Validates: Requirements 5.3**
     */
    it('should preserve a Climber\'s popularityValue when it returns to the deck after advancePhase()', () => {
      store.initializeGame(5);

      // Patch deck with a Climber at popularityValue 3
      const climber = testGuest('CLIMBER', 'Icarus', { popularityValue: 3, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 });
      patchState(unprotected(store), { deck: [climber] });

      // Invite the Climber — entrance effect increments popularityValue to 4
      store.inviteGuest();
      expect(store.party()[0].properties.popularityValue).toBe(4);

      // Advance phase from PARTY — Climber returns to deck
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> BUY (turn 2), Climber returns to deck

      // Find the Climber in the deck and verify its popularityValue is preserved at 4
      const deckClimber = store.deck().find(g => g.type === 'CLIMBER' && g.name === 'Icarus');
      expect(deckClimber).toBeDefined();
      expect(deckClimber!.properties.popularityValue).toBe(4);
    });
  });
});

describe('Auto-invite Entrance Effects — GameStore', () => {
  let store: InstanceType<typeof GameStore>;


  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
    store.initializeGame();
    patchState(unprotected(store), { houseCapacity: 10, party: [] });
  });

  it('should admit exactly one extra guest, once, when Mr. Popular is invited', () => {
    patchState(unprotected(store), {
      deck: [testGuest('MR_POPULAR', 'Rowan'), testGuest('OLD_FRIEND', 'Colin'), testGuest('OLD_FRIEND', 'Emily')]
    });

    store.inviteGuest();

    expect(store.party().map(g => g.name)).toEqual(['Rowan', 'Colin']);
    expect(store.deck().map(g => g.name)).toEqual(['Emily']);
  });

  it('should admit exactly two extra guests, once each, when a Celebrity is invited', () => {
    patchState(unprotected(store), {
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle')
      ]
    });

    store.inviteGuest();

    expect(store.party().map(g => g.name)).toEqual(['Troy', 'Colin', 'Emily']);
    expect(store.deck().map(g => g.name)).toEqual(['Rachelle']);
  });

  it('should admit guests in draw order through a chain of auto-invites', () => {
    patchState(unprotected(store), {
      deck: [
        testGuest('MR_POPULAR', 'Rowan'),
        testGuest('MR_POPULAR', 'Oscar'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily')
      ]
    });

    store.inviteGuest();

    expect(store.party().map(g => g.name)).toEqual(['Rowan', 'Oscar', 'Colin']);
    expect(store.deck().map(g => g.name)).toEqual(['Emily']);
  });

  it('should not over-count auto-invited guests against house capacity', () => {
    patchState(unprotected(store), {
      houseCapacity: 2,
      deck: [testGuest('MR_POPULAR', 'Rowan'), testGuest('OLD_FRIEND', 'Colin'), testGuest('OLD_FRIEND', 'Emily')]
    });

    store.inviteGuest();

    expect(store.isOverflowShutdown()).toBe(false);
    expect(store.party().map(g => g.name)).toEqual(['Rowan', 'Colin']);
  });

  it('should run the entrance effect of a second Celebrity invited into the same party', () => {
    patchState(unprotected(store), {
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('CELEBRITY', 'Gemma'),
        testGuest('OLD_FRIEND', 'Rachelle'),
        testGuest('OLD_FRIEND', 'Nadia'),
        testGuest('OLD_FRIEND', 'Pierre')
      ]
    });

    store.inviteGuest();
    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(false);
    expect(store.party().map(g => g.name)).toEqual(['Troy', 'Colin', 'Emily', 'Gemma', 'Rachelle', 'Nadia']);
    expect(store.deck().map(g => g.name)).toEqual(['Pierre']);
  });

  it('should run the entrance effect of a Celebrity auto-invited by another Celebrity', () => {
    patchState(unprotected(store), {
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('CELEBRITY', 'Gemma'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle'),
        testGuest('OLD_FRIEND', 'Pierre')
      ]
    });

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(false);
    expect(store.party().map(g => g.name)).toEqual(['Troy', 'Gemma', 'Colin', 'Emily', 'Rachelle']);
    expect(store.deck().map(g => g.name)).toEqual(['Pierre']);
  });

  it('should run a Celebrity\'s entrance effect again when she returns in a later party', () => {
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY,
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle')
      ]
    });

    store.inviteGuest();
    expect(store.party().map(g => g.name)).toEqual(['Troy', 'Colin', 'Emily']);

    // End the party (guests return to a shuffled deck), then start the next one
    store.advancePhase();
    store.advancePhase();
    expect(store.currentPhase()).toBe(GamePhase.PARTY);

    // Put the same Troy back on top of the deck in a known order
    const byName = (name: string) => store.deck().find(g => g.name === name)!;
    patchState(unprotected(store), { deck: ['Troy', 'Colin', 'Emily', 'Rachelle'].map(byName) });

    store.inviteGuest();

    expect(store.party().map(g => g.name)).toEqual(['Troy', 'Colin', 'Emily']);
    expect(store.deck().map(g => g.name)).toEqual(['Rachelle']);
  });

  it('should return all bust party guests to the deck after acknowledging an overflow shutdown', () => {
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY,
      currentTurn: 1,
      houseCapacity: 2,
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle')
      ]
    });

    store.inviteGuest();
    expect(store.isOverflowShutdown()).toBe(true);

    store.acknowledgeShutdown();

    expect(store.party()).toEqual([]);
    expect(store.bustPartySnapshot()).toEqual([]);
    expect(store.deck().map(g => g.name).sort()).toEqual(['Colin', 'Emily', 'Rachelle', 'Troy']);
  });

  it('should not lose a guest whose admission is still queued when an overflow shutdown occurs', () => {
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY,
      currentTurn: 1,
      houseCapacity: 1,
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle')
      ]
    });

    // Troy fills the house; Colin's admission overflows while Emily's is still queued
    store.inviteGuest();
    expect(store.isOverflowShutdown()).toBe(true);

    store.acknowledgeShutdown();

    expect(store.deck().map(g => g.name).sort()).toEqual(['Colin', 'Emily', 'Rachelle', 'Troy']);
  });

  it('should not lose a guest whose admission is still queued when a trouble shutdown occurs', () => {
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY,
      party: [testGuest('WILD_BUDDY', 'Anthony'), testGuest('WILD_BUDDY', 'Teresa')],
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('WILD_BUDDY', 'Jacco'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle')
      ]
    });

    // Jacco's admission pushes trouble to 3 > 2 while Emily's is still queued
    store.inviteGuest();
    expect(store.isPartyShutdown()).toBe(true);
    expect(store.isOverflowShutdown()).toBe(false);

    const allNames = [...store.deck(), ...store.party(), ...store.discard(), ...store.bustPartySnapshot()]
      .map(g => g.name)
      .sort();
    expect(allNames).toEqual(['Anthony', 'Emily', 'Jacco', 'Rachelle', 'Teresa', 'Troy']);
  });
});

/**
 * Entrance Effect Order — Unit Tests
 *
 * **Validates: Requirements 1.1–1.4, 2.1, 2.2 (entrance-effect-order)**
 */
describe('Entrance Effect Order — GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  afterEach(() => resetGuestTypesForTesting());


  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
    store.initializeGame();
    patchState(unprotected(store), { currentPhase: GamePhase.PARTY, houseCapacity: 10, party: [] });
  });

  it('should run an auto-invited guest\'s entrance effect before Celebrity\'s second auto-invite', () => {
    patchState(unprotected(store), {
      houseCapacity: 2,
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest('CLIMBER', 'Skye'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily')
      ]
    });

    // Colin, Celebrity's second auto-invite, overflows the house. Skye's entrance effect
    // must already have run by then.
    store.inviteGuest();

    expect(store.isOverflowShutdown()).toBe(true);
    expect(store.bustPartySnapshot().map(g => g.name)).toEqual(['Troy', 'Skye', 'Colin']);
    expect(store.bustPartySnapshot()[1].properties.popularityValue).toBe(1);
  });

  it('should bust before Celebrity\'s second auto-invite when an entrance effect raises trouble', () => {
    // Stand-in for an upcoming trouble-raising entrance effect
    const troublemaker = registerTestGuestType({
      id: 'TEST_TROUBLEMAKER',
      effects: customEntrance((ctx, guest) => {
        ctx.updateGuest(guest, g => ({ ...g, properties: { ...g.properties, troubleValue: 3 } }));
      }, [TEST_ICON])
    });

    patchState(unprotected(store), {
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest(troublemaker, 'Colin'),
        testGuest(troublemaker, 'Emily'),
        testGuest(troublemaker, 'Rachelle')
      ]
    });

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(true);
    expect(store.isOverflowShutdown()).toBe(false);
    expect(store.bustPartySnapshot().map(g => g.name)).toEqual(['Troy', 'Colin']);
    // Celebrity's second auto-invite never drew, so Emily is still in the deck
    expect(store.deck().map(g => g.name)).toEqual(['Emily', 'Rachelle']);
  });

  it('should run the effects enqueued by one effect in the order they were enqueued', () => {
    const order: string[] = [];
    const enqueuer = registerTestGuestType({
      id: 'TEST_ENQUEUER',
      effects: customEntrance((ctx) => {
        ctx.enqueue(() => order.push('first'));
        ctx.enqueue(() => order.push('second'));
        ctx.enqueue(() => order.push('third'));
      }, [TEST_ICON])
    });

    patchState(unprotected(store), { deck: [testGuest(enqueuer, 'Colin')] });

    store.inviteGuest();

    expect(order).toEqual(['first', 'second', 'third']);
  });

  it('should finish a nested chain of entrance effects before resuming the interrupted effect', () => {
    // A Mr. Popular that also records the party when its entrance effect runs
    const mrPopular = getGuestType('MR_POPULAR');
    let partyAtRowanEntrance: string[] = [];
    const recordingMrPopular = registerTestGuestType({
      ...mrPopular,
      id: 'TEST_RECORDING_MR_POPULAR',
      effects: customEntrance((ctx, guest) => {
        partyAtRowanEntrance = ctx.getParty().map(g => g.name);
        runEffect(ctx, guest, mrPopular.effects![0]);
      })
    });

    patchState(unprotected(store), {
      deck: [
        testGuest('CELEBRITY', 'Troy'),
        testGuest(recordingMrPopular, 'Rowan'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('OLD_FRIEND', 'Emily'),
        testGuest('OLD_FRIEND', 'Rachelle')
      ]
    });

    store.inviteGuest();

    // Rowan's entrance effect interrupts Troy's, so it runs before Troy's second
    // auto-invite draws; Rowan's guest (Colin) arrives before Troy's second guest (Emily)
    expect(partyAtRowanEntrance).toEqual(['Troy', 'Rowan']);
    expect(store.party().map(g => g.name)).toEqual(['Troy', 'Rowan', 'Colin', 'Emily']);
    expect(store.deck().map(g => g.name)).toEqual(['Rachelle']);
  });
});

/**
 * Star Guests & Winning — Unit Tests
 *
 * **Validates: Requirements 6.6, 9.9, 10.2, 12.1–12.3, 13.2, 13.3, 14.2–14.8, 15.5, 18.1, 18.2 (star-guests-winning)**
 */
describe('Star Guests & Winning — GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  const STAR_TYPES: GuestType[] = ['ALIEN', 'LEPRECHAUN', 'DRAGON', 'DINOSAUR', 'MERMAID', 'UNICORN', 'SUPERHERO'];


  const aliens = (count: number): Guest[] =>
    Array.from({ length: count }, (_, i) => testGuest('ALIEN', `Alien${i}`));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
    store.initializeGame();
  });

  describe('initializeGame()', () => {
    it('should start with isVictory false', () => {
      expect(store.isVictory()).toBe(false);
    });

    it('should stock 4 of each star type at the correct cost', () => {
      const costs: Record<string, number> = {
        ALIEN: 40, LEPRECHAUN: 50, DRAGON: 30, DINOSAUR: 25, MERMAID: 35, UNICORN: 45, SUPERHERO: 50
      };
      for (const type of STAR_TYPES) {
        const entry = store.shopInventory().find((e: ShopInventoryEntry) => e.type === type);
        expect(entry).toBeDefined();
        expect(entry!.guests).toHaveLength(4);
        expect(entry!.cost).toBe(costs[type]);
      }
    });

    it('should have no star guests in the starting deck', () => {
      expect(store.deck().some(g => STAR_TYPES.includes(g.type))).toBe(false);
    });

    it('should clear isVictory left over from a previous game', () => {
      patchState(unprotected(store), { isVictory: true });
      store.initializeGame();
      expect(store.isVictory()).toBe(false);
    });
  });

  describe('stars()', () => {
    it('should be 0 for an empty party', () => {
      expect(store.stars()).toBe(0);
    });

    it('should be 3 for three Aliens', () => {
      patchState(unprotected(store), { party: aliens(3) });
      expect(store.stars()).toBe(3);
    });

    it('should sum stars across mixed star and non-star guests', () => {
      patchState(unprotected(store), {
        party: [
          testGuest('DRAGON', 'Smaug'),
          testGuest('OLD_FRIEND', 'Brian'),
          testGuest('UNICORN', 'Sparkles'),
          testGuest('SUPERHERO', 'Batman'),
          testGuest('MERMAID', 'Ariel')
        ]
      });
      expect(store.stars()).toBe(4);
    });

    it('should drop to 0 after a normal party end', () => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: aliens(2) });
      store.advancePhase();
      expect(store.stars()).toBe(0);
    });
  });

  describe('advancePhase() win check', () => {
    it('should enter victory when ending a party with exactly 4 stars', () => {
      const party = [...aliens(2), testGuest('SUPERHERO', 'Batman'), testGuest('DRAGON', 'Smaug')];
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party, popularity: 10, money: 1 });

      store.advancePhase();

      expect(store.isVictory()).toBe(true);
      expect(store.isGameComplete()).toBe(false);
      // No settlement and no next turn: the winning party stays put
      expect(store.party()).toEqual(party);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.popularity()).toBe(10);
      expect(store.money()).toBe(1);
    });

    it('should enter victory with more than 4 stars', () => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: aliens(5) });
      store.advancePhase();
      expect(store.isVictory()).toBe(true);
    });

    it('should end the party normally with 3 stars', () => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: aliens(3) });
      store.advancePhase();
      expect(store.isVictory()).toBe(false);
      expect(store.party()).toEqual([]);
      expect(store.currentTurn()).toBe(2);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
    });

    it('should enter victory instead of Game Over on the final turn', () => {
      store.initializeGame(1);
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: aliens(4) });
      store.advancePhase();
      expect(store.isVictory()).toBe(true);
      expect(store.isGameComplete()).toBe(false);
    });

    it('should not win just by reaching 4 stars mid-party', () => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, deck: aliens(4) });
      for (let i = 0; i < 4; i++) store.inviteGuest();
      expect(store.stars()).toBe(4);
      expect(store.isVictory()).toBe(false);
    });

    it('should apply a Dragon money deficit when ending a party without victory', () => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: [testGuest('DRAGON', 'Smaug')], popularity: 20, money: 1 });
      store.advancePhase();
      // money 1 - 3 = -2 → clamped to 0, popularity penalized 2 × 7
      expect(store.money()).toBe(0);
      expect(store.popularity()).toBe(6);
    });
  });

  describe('shutdowns never win', () => {
    it('should not win after a trouble shutdown with 4 stars in the bust party', () => {
      const wildBuddies = ['WB1', 'WB2', 'WB3'].map(n => testGuest('WILD_BUDDY', n));
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, houseCapacity: 10, deck: [...aliens(4), ...wildBuddies] });

      for (let i = 0; i < 7; i++) store.inviteGuest();

      expect(store.isPartyShutdown()).toBe(true);
      expect(store.isOverflowShutdown()).toBe(false);
      expect(store.bustPartySnapshot().filter(g => g.type === 'ALIEN')).toHaveLength(4);

      store.acknowledgeShutdown();
      pickBan(store, 0);
      store.confirmChoice();

      expect(store.isVictory()).toBe(false);
      expect(store.currentTurn()).toBe(2);
    });

    it('should not win after a Dinosaur pushes trouble over the limit', () => {
      const dinos = ['Barney', 'Blue', 'Dino'].map(n => testGuest('DINOSAUR', n));
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, deck: [...aliens(1), ...dinos] });

      for (let i = 0; i < 4; i++) store.inviteGuest();

      expect(store.isPartyShutdown()).toBe(true);
      expect(store.isVictory()).toBe(false);
    });

    it('should not win after a Mermaid causes an overflow with 4+ stars', () => {
      patchState(unprotected(store), {
        currentPhase: GamePhase.PARTY,
        houseCapacity: 4,
        deck: [...aliens(3), testGuest('MERMAID', 'Ariel'), testGuest('OLD_FRIEND', 'Brian')]
      });

      for (let i = 0; i < 4; i++) store.inviteGuest();

      expect(store.isPartyShutdown()).toBe(true);
      expect(store.isOverflowShutdown()).toBe(true);
      expect(store.bustPartySnapshot().reduce((s, g) => s + g.properties.starValue, 0)).toBe(4);

      store.acknowledgeShutdown();

      expect(store.isVictory()).toBe(false);
      expect(store.currentTurn()).toBe(2);
    });
  });

  describe('while victorious', () => {
    beforeEach(() => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: aliens(4) });
      store.advancePhase();
      expect(store.isVictory()).toBe(true);
    });

    it('should ignore inviteGuest()', () => {
      const deck = store.deck();
      const party = store.party();
      store.inviteGuest();
      expect(store.deck()).toBe(deck);
      expect(store.party()).toBe(party);
    });

    it('should report canInviteGuest() as false', () => {
      expect(store.deck().length).toBeGreaterThan(0);
      expect(store.canInviteGuest()).toBe(false);
    });

    it('should ignore advancePhase()', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store.advancePhase();
      expect(store.isVictory()).toBe(true);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.party()).toHaveLength(4);
      warnSpy.mockRestore();
    });

    it('should complete the game on claimVictory()', () => {
      store.claimVictory();
      expect(store.isVictory()).toBe(false);
      expect(store.isGameComplete()).toBe(true);
    });

    it('should clear isVictory on resetGame()', () => {
      store.resetGame();
      expect(store.isVictory()).toBe(false);
    });
  });

  describe('claimVictory()', () => {
    it('should do nothing when there is no victory', () => {
      store.claimVictory();
      expect(store.isGameComplete()).toBe(false);
      expect(store.isVictory()).toBe(false);
    });
  });

  describe('Mermaid entrance effect', () => {
    it('should auto-invite exactly one guest from the deck', () => {
      const mermaid = testGuest('MERMAID', 'Ariel');
      const brian = testGuest('OLD_FRIEND', 'Brian');
      const khalil = testGuest('RICH_PAL', 'Khalil');
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, deck: [mermaid, brian, khalil] });

      store.inviteGuest();

      expect(store.party().map(g => g.name)).toEqual(['Ariel', 'Brian']);
      expect(store.deck().map(g => g.name)).toEqual(['Khalil']);
    });

    it('should be admitted alone when the deck is empty', () => {
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, deck: [testGuest('MERMAID', 'Ariel')] });

      store.inviteGuest();

      expect(store.party().map(g => g.name)).toEqual(['Ariel']);
      expect(store.deck()).toEqual([]);
      expect(store.isPartyShutdown()).toBe(false);
    });
  });
});

/**
 * Guest identity: ids assigned at initialization, stable across moves, and used to match guests.
 *
 * **Validates: guest-identity Requirements 1.2, 2.2, 2.3, 3.1, 3.2**
 */
describe('Guest Identity — GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  afterEach(() => resetGuestTypesForTesting());

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
    store.initializeGame();
    patchState(unprotected(store), { currentPhase: GamePhase.PARTY, houseCapacity: 10, party: [] });
  });

  it('should give every guest in the deck and shop an id', () => {
    const guests = [...store.deck(), ...store.shopInventory().flatMap(e => e.guests)];
    expect(guests.every(g => typeof g.id === 'string' && g.id.length > 0)).toBe(true);
  });

  it('should keep a Climber\'s id through her entrance effect', () => {
    const climber = testGuest('CLIMBER', 'Skye');
    patchState(unprotected(store), { deck: [climber] });

    store.inviteGuest();

    expect(store.party()[0].id).toBe(climber.id);
    expect(store.party()[0].properties.popularityValue).toBe(1);
  });

  it('should update the party guest when updateGuest is given a copy of it', () => {
    const copier = registerTestGuestType({
      id: 'TEST_COPIER',
      effects: customEntrance((ctx, guest) => {
        ctx.updateGuest({ ...guest }, g => ({ ...g, properties: { ...g.properties, popularityValue: 7 } }));
      }, [TEST_ICON])
    });
    patchState(unprotected(store), { deck: [testGuest(copier, 'Colin')] });

    store.inviteGuest();

    expect(store.party()).toHaveLength(1);
    expect(store.party()[0].properties.popularityValue).toBe(7);
  });

  it('should keep the original id when an updater returns a different one', () => {
    const renamer = registerTestGuestType({
      id: 'TEST_RENAMER',
      effects: customEntrance((ctx, guest) => {
        ctx.updateGuest(guest, g => ({ ...g, id: 'someone-else', properties: { ...g.properties, popularityValue: 7 } }));
      }, [TEST_ICON])
    });
    const colin = testGuest(renamer, 'Colin');
    patchState(unprotected(store), { deck: [colin] });

    store.inviteGuest();

    expect(store.party().map(g => g.id)).toEqual([colin.id]);
    // The update itself still applied
    expect(store.party()[0].properties.popularityValue).toBe(7);
  });

  it('should ban only the selected guest when two bust guests share a name', () => {
    const first = testGuest('WILD_BUDDY', 'Matt');
    const second = testGuest('WILD_BUDDY', 'Matt');
    patchState(unprotected(store), { deck: [] });
    startBanSelection(store, [first, second]);

    pickBan(store, 1);
    store.confirmChoice();

    expect(store.discard().map(g => g.id)).toEqual([second.id]);
    expect(store.deck().map(g => g.id)).toEqual([first.id]);
  });
});
