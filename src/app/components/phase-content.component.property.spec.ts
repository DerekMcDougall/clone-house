import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GUEST_TYPE_DEFAULTS, GUEST_TYPE_LABELS, GuestType } from '../models/guest.model';
import { GameStore, ShopInventoryEntry } from '../stores/game.store';
import { PhaseContentComponent } from './phase-content.component';

/**
 * Property-Based Tests for PhaseContentComponent
 * 
 * These tests use fast-check to verify component rendering properties
 * across multiple iterations, ensuring the component behaves correctly
 * for all valid phase configurations.
 */
describe('PhaseContentComponent - Property-Based Tests', () => {
  let component: PhaseContentComponent;
  let fixture: ComponentFixture<PhaseContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseContentComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(PhaseContentComponent);
    component = fixture.componentInstance;
  });

  /**
   * Property 9: Buy Phase Heading Display
   * 
   * **Validates: Requirements 4.1**
   * 
   * For any game state where the current phase is Buy_Phase, the rendered page
   * heading should contain the text "Shop".
   * 
   * This property test sets the phase input to BUY, triggers change detection,
   * and verifies the heading element contains "Shop". The test runs 100 iterations
   * to ensure component rendering consistency.
   */
  describe('Property 9: Buy Phase Heading Display', () => {
    it('should display "Shop" heading when phase is BUY', () => {
      // Feature: turn-based-gameplay-phases, Property 9: Buy Phase Heading Display
      fc.assert(
        fc.property(
          fc.constant(GamePhase.BUY),
          (phase) => {
            // Set the phase input to BUY
            component.phase = phase;
            
            // Trigger change detection
            fixture.detectChanges();
            
            // Query for the heading element
            const compiled = fixture.nativeElement as HTMLElement;
            const heading = compiled.querySelector('h2');
            
            // Verify heading exists and contains "Shop"
            expect(heading).toBeTruthy();
            expect(heading?.textContent).toContain('Shop');
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 11: Party Phase Heading Display
   * 
   * **Validates: Requirements 5.1**
   * 
   * For any game state where the current phase is Party_Phase, the rendered page
   * heading should contain the text "Party".
   * 
   * This property test sets the phase input to PARTY, triggers change detection,
   * and verifies the heading element contains "Party". The test runs 100 iterations
   * to ensure component rendering consistency.
   */
  describe('Property 11: Party Phase Heading Display', () => {
    it('should display "Party" heading when phase is PARTY', () => {
      // Feature: turn-based-gameplay-phases, Property 11: Party Phase Heading Display
      fc.assert(
        fc.property(
          fc.constant(GamePhase.PARTY),
          (phase) => {
            // Set the phase input to PARTY
            component.phase = phase;
            
            // Trigger change detection
            fixture.detectChanges();
            
            // Query for the heading element
            const compiled = fixture.nativeElement as HTMLElement;
            const heading = compiled.querySelector('h2');
            
            // Verify heading exists and contains "Party"
            expect(heading).toBeTruthy();
            expect(heading?.textContent).toContain('Party');
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 11: All Party Guests Displayed
   * 
   * **Validates: Requirements 5.1**
   * 
   * For any party state, the number of guest cards rendered SHALL equal the
   * number of guests in the party.
   * 
   * This ensures every guest in the party has a corresponding visual representation.
   * This property test generates random party sizes (0-6 guests), sets up the game
   * store with that many guests in the party, and verifies that the exact number
   * of guest cards are rendered in the component.
   */
  describe('Property 11: All Party Guests Displayed', () => {
    it('should render exactly one guest card for each guest in the party', { timeout: 15000 }, () => {
      // Feature: party-guest-deck-system, Property 11: All Party Guests Displayed
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (partySize) => {
            // Reset the store before each iteration
            component.gameStore.resetGame();
            
            // Initialize the game
            component.gameStore.initializeGame();
            
            // Raise capacity and trouble limit so we can invite up to 10 guests without a bust
            patchState(component.gameStore, { houseCapacity: 100, baseTroubleLimit: 100 });
            
            // Advance to PARTY phase
            component.gameStore.advancePhase();
            expect(component.gameStore.currentPhase()).toBe('PARTY');
            
            // Set the phase input to PARTY
            component.phase = GamePhase.PARTY;
            
            // Invite the specified number of guests to create the party
            for (let i = 0; i < partySize; i++) {
              component.gameStore.inviteGuest();
            }
            
            // Verify the party has the expected size
            const actualPartySize = component.gameStore.party().length;
            expect(actualPartySize).toBe(partySize);
            
            // Trigger change detection to render the guest cards
            fixture.detectChanges();
            
            // Query for all guest card elements
            const compiled = fixture.nativeElement as HTMLElement;
            const guestCards = compiled.querySelectorAll('app-guest-card');
            
            // Verify the number of rendered guest cards equals the party size
            expect(guestCards.length).toBe(partySize);
            
            // Additional verification: if party size > 0, verify cards are actually visible
            if (partySize > 0) {
              expect(guestCards.length).toBeGreaterThan(0);
              
              // Verify each card corresponds to a guest in the party
              const party = component.gameStore.party();
              expect(guestCards.length).toBe(party.length);
            }
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 14: Guest Card Reverse Chronological Order
   * 
   * **Validates: Requirements 5.5**
   * 
   * For any party state with multiple guests, the guest cards SHALL be displayed
   * in reverse chronological order, with the most recently invited guest first.
   * 
   * This ensures the UI presents guests in the expected order, with newest additions
   * most prominent. This property test generates random party sequences (2-6 guests),
   * invites guests one by one, and verifies that the rendered guest cards appear in
   * reverse order compared to the party array (which stores guests in chronological
   * order of invitation).
   */
  describe('Property 14: Guest Card Reverse Chronological Order', () => {
    it('should display guest cards in reverse chronological order (newest first)', { timeout: 30000 }, () => {
      // Feature: party-guest-deck-system, Property 14: Guest Card Reverse Chronological Order
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (partySize) => {
            // Create a fresh fixture for each iteration
            const testFixture = TestBed.createComponent(PhaseContentComponent);
            const testComponent = testFixture.componentInstance;
            
            // Initialize the game
            testComponent.gameStore.initializeGame();
            
            // Raise capacity and trouble limit so we can invite up to 10 guests without a bust
            patchState(testComponent.gameStore, { houseCapacity: 100, baseTroubleLimit: 100 });
            
            // Advance to PARTY phase
            testComponent.gameStore.advancePhase();
            expect(testComponent.gameStore.currentPhase()).toBe('PARTY');
            
            // Set the phase input to PARTY
            testComponent.phase = GamePhase.PARTY;
            
            // Track the order of invited guests
            const invitedGuestNames: string[] = [];
            
            // Invite the specified number of guests to create the party
            for (let i = 0; i < partySize; i++) {
              const deckBeforeInvite = testComponent.gameStore.deck();
              if (deckBeforeInvite.length > 0) {
                const guestToInvite = deckBeforeInvite[0];
                invitedGuestNames.push(guestToInvite.name);
                testComponent.gameStore.inviteGuest();
              }
            }
            
            // Verify the party has the expected size
            const actualPartySize = testComponent.gameStore.party().length;
            expect(actualPartySize).toBe(partySize);
            
            // Trigger change detection to render the guest cards
            testFixture.detectChanges();
            
            // Get the party in chronological order (oldest first)
            const party = testComponent.gameStore.party();
            
            // Get the reversed party (newest first) - this is what should be displayed
            const reversedParty = [...party].reverse();
            
            // Query for all guest card elements
            const compiled = testFixture.nativeElement as HTMLElement;
            const guestCards = compiled.querySelectorAll('app-guest-card');
            
            // Verify we have the expected number of cards
            expect(guestCards.length).toBe(partySize);
            
            // Verify the order of displayed guest cards matches reversed party order
            guestCards.forEach((card, index) => {
              const cardCaption = card.querySelector('.card-caption');
              expect(cardCaption).toBeTruthy();
              
              const displayedName = cardCaption?.textContent?.trim();
              const expectedName = reversedParty[index].name;
              
              // The displayed name should match the reversed party order
              expect(displayedName).toBe(expectedName);
            });
            
            // Additional verification: first card should be the most recently invited guest
            if (partySize > 0) {
              const firstCard = guestCards[0];
              const firstCardCaption = firstCard.querySelector('.card-caption');
              const firstDisplayedName = firstCardCaption?.textContent?.trim();
              
              // The first displayed card should be the last guest invited
              const lastInvitedGuest = invitedGuestNames[invitedGuestNames.length - 1];
              expect(firstDisplayedName).toBe(lastInvitedGuest);
              
              // The last displayed card should be the first guest invited
              const lastCard = guestCards[guestCards.length - 1];
              const lastCardCaption = lastCard.querySelector('.card-caption');
              const lastDisplayedName = lastCardCaption?.textContent?.trim();
              const firstInvitedGuest = invitedGuestNames[0];
              expect(lastDisplayedName).toBe(firstInvitedGuest);
            }
            
            // Reset the store and clean up fixture for the next iteration
            testComponent.gameStore.resetGame();
            testFixture.destroy();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 7: Shutdown Modal Displayed When isPartyShutdown Is True
   *
   * **Validates: Requirements 6.1**
   *
   * For any game state where isPartyShutdown is true, the PhaseContentComponent
   * SHALL render the shutdown modal overlay in the DOM.
   */
  describe('Property 7: Shutdown Modal Displayed When isPartyShutdown Is True', () => {
    it('should render shutdown modal overlay when isPartyShutdown is true', () => {
      // Feature: trouble-limit-party-shutdown, Property 7: Shutdown Modal Displayed When isPartyShutdown Is True
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (currentTurn, totalTurns) => {
            const adjustedTotalTurns = Math.max(currentTurn, totalTurns);

            const testFixture = TestBed.createComponent(PhaseContentComponent);
            const testComponent = testFixture.componentInstance;
            const store = TestBed.inject(GameStore);

            // Initialize game and advance to PARTY phase
            store.initializeGame(adjustedTotalTurns);
            store.advancePhase();

            // Set isPartyShutdown to true and currentTurn via patchState
            patchState(store, {
              isPartyShutdown: true,
              currentTurn: currentTurn
            });

            testComponent.phase = GamePhase.PARTY;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const modalOverlay = compiled.querySelector('.shutdown-modal-overlay');

            expect(modalOverlay).toBeTruthy();

            // Clean up
            store.resetGame();
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Shutdown Modal Button Label Matches Turn State
   *
   * **Validates: Requirements 6.3, 6.4**
   *
   * For any game state where the shutdown modal is displayed, the modal button
   * SHALL be labeled "Game Over" if the current turn is the final turn, and
   * "End Party" otherwise.
   */
  describe('Property 8: Shutdown Modal Button Label Matches Turn State', () => {
    it('should display correct button label based on whether it is the final turn', () => {
      // Feature: trouble-limit-party-shutdown, Property 8: Shutdown Modal Button Label Matches Turn State
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (currentTurn, totalTurns) => {
            const adjustedTotalTurns = Math.max(currentTurn, totalTurns);

            const testFixture = TestBed.createComponent(PhaseContentComponent);
            const testComponent = testFixture.componentInstance;
            const store = TestBed.inject(GameStore);

            // Initialize game and advance to PARTY phase
            store.initializeGame(adjustedTotalTurns);
            store.advancePhase();

            // Set shutdown state with specific turn values
            patchState(store, {
              isPartyShutdown: true,
              currentTurn: currentTurn
            });

            testComponent.phase = GamePhase.PARTY;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const button = compiled.querySelector('.shutdown-button');

            expect(button).toBeTruthy();

            const buttonText = button?.textContent?.trim();
            const isFinalTurn = currentTurn === adjustedTotalTurns;

            if (isFinalTurn) {
              expect(buttonText).toBe('Game Over');
            } else {
              expect(buttonText).toBe('End Party');
            }

            // Clean up
            store.resetGame();
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Ban Selection UI Renders Blame Prompt and Snapshot Guests
   *
   * **Validates: Requirements 3.3, 3.4**
   *
   * For any game state where isBanSelectionActive is true and bustPartySnapshot
   * contains N guests (N > 0), the PhaseContentComponent SHALL render the text
   * "Who takes the blame?" and exactly N guest card buttons.
   */
  describe('Property 4: Ban Selection UI Renders Blame Prompt and Snapshot Guests', () => {
    it('should render blame prompt and N guest card buttons when isBanSelectionActive with N snapshot guests', () => {
      // Feature: ban-guest-after-bust, Property 4: Ban Selection UI Renders Blame Prompt and Snapshot Guests

      const guestArb: fc.Arbitrary<Guest> = fc.tuple(
        fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL'),
        fc.string({ minLength: 1, maxLength: 20 })
      ).map(([type, name]) => ({
        type,
        name,
        properties: { ...GUEST_TYPE_DEFAULTS[type] }
      }));

      const snapshotArb = fc.array(guestArb, { minLength: 1, maxLength: 10 });

      fc.assert(
        fc.property(
          snapshotArb,
          (snapshot) => {
            const testFixture = TestBed.createComponent(PhaseContentComponent);
            const testComponent = testFixture.componentInstance;
            const store = TestBed.inject(GameStore);

            // Initialize game so store is in a valid state
            store.initializeGame();
            store.advancePhase();

            // Set ban selection active with the generated snapshot
            patchState(store, {
              isBanSelectionActive: true,
              bustPartySnapshot: snapshot,
              isPartyShutdown: false,
              selectedBanGuest: null
            } as any);

            testComponent.phase = GamePhase.PARTY;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;

            // Verify blame prompt is present
            const blamePrompt = compiled.querySelector('.blame-prompt');
            expect(blamePrompt).toBeTruthy();
            expect(blamePrompt?.textContent?.trim()).toBe('Who takes the blame?');

            // Verify the correct number of ban guest buttons
            const banButtons = compiled.querySelectorAll('.ban-guest-button');
            expect(banButtons.length).toBe(snapshot.length);

            // Clean up
            store.resetGame();
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: shop-buy-guests, Property 7: Shop Display Order Is Sorted by Cost Then Alphabetically
describe('PhaseContentComponent - Shop Buy Guests Property Tests', () => {
  /**
   * Property 7: Shop Display Order Is Sorted by Cost Then Alphabetically
   *
   * **Validates: Requirements 9.1, 9.2**
   *
   * For any set of ShopInventoryEntry items in shopInventory, the purchasableShopItems
   * computed signal SHALL return them sorted by ascending cost, with ties broken
   * alphabetically by GUEST_TYPE_LABELS[type].
   */
  describe('Property 7: Shop Display Order Is Sorted by Cost Then Alphabetically', () => {
    it('should return shop items sorted by ascending cost then alphabetically by type label', () => {
      // Feature: shop-buy-guests, Property 7: Shop Display Order Is Sorted by Cost Then Alphabetically

      const guestTypeArb = fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL');

      const shopEntryArb: fc.Arbitrary<ShopInventoryEntry> = fc.tuple(
        guestTypeArb,
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 6 })
      ).map(([type, cost, guestCount]) => ({
        type,
        guests: Array.from({ length: guestCount }, (_, i) => ({
          type,
          name: `Guest${i}`,
          properties: { ...GUEST_TYPE_DEFAULTS[type] }
        })),
        cost
      }));

      const shopInventoryArb = fc.array(shopEntryArb, { minLength: 0, maxLength: 8 });

      fc.assert(
        fc.property(
          shopInventoryArb,
          (inventory) => {
            const store = TestBed.inject(GameStore);
            store.initializeGame();

            patchState(store, { shopInventory: inventory });

            const sorted = store.purchasableShopItems();

            // Verify sorted by ascending cost, ties broken alphabetically by label
            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1];
              const curr = sorted[i];

              if (prev.cost !== curr.cost) {
                expect(prev.cost).toBeLessThan(curr.cost);
              } else {
                const labelPrev = GUEST_TYPE_LABELS[prev.type] ?? prev.type;
                const labelCurr = GUEST_TYPE_LABELS[curr.type] ?? curr.type;
                expect(labelPrev.localeCompare(labelCurr)).toBeLessThanOrEqual(0);
              }
            }

            // Verify all original entries are present (same length)
            expect(sorted.length).toBe(inventory.length);

            store.resetGame();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
