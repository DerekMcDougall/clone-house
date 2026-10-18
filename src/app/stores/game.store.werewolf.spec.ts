import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GuestType } from '../models/guest.model';
import { resetGuestTypesForTesting } from '../models/guest-type-registry';
import { GameStore } from './game.store';
import { registerTestGuestType, testGuest } from '../../testing/guests';

/**
 * When trouble is checked: after an arriving guest's first entrance effect, so an effect
 * like the Werewolf's can change the guest's trouble first. Overflow is still checked at
 * once.
 *
 * **Validates: werewolf-guest Requirements 3**
 */
describe('GameStore - Trouble Check After Entrance Effects', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  afterEach(() => {
    store.resetGame();
    resetGuestTypesForTesting();
  });

  // A party in progress with `party` already in it and `deck` to invite from
  const startParty = (deck: Guest[], party: Guest[], { troubleLimit = 1, capacity = 10 } = {}): void => {
    store.initializeGame();
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY, houseCapacity: capacity, baseTroubleLimit: troubleLimit, deck, party
    });
  };

  // A test type whose entrance effect changes its own trouble by `delta`
  const selfTroubleType = (delta: number): GuestType => registerTestGuestType({
    id: `TEST_SELF_TROUBLE_${delta > 0 ? 'UP' : 'DOWN'}`,
    effects: [{ trigger: 'entrance', action: { kind: 'adjustSelf', property: 'troubleValue', delta, min: 0 } }]
  });

  // A party already at a trouble limit of 1
  const atLimit = (): Guest[] => [testGuest('WILD_BUDDY', 'Anthony')];

  it('should let an entrance effect lower the guest\'s trouble before the check', () => {
    const guest = testGuest(selfTroubleType(-1), 'Remus', { troubleValue: 1 });
    startParty([guest], atLimit());

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(false);
    expect(store.party().map(g => g.id)).toContain(guest.id);
    expect(store.trouble()).toBe(1);
  });

  it('should bust when an entrance effect raises the guest\'s trouble over the limit', () => {
    const guest = testGuest(selfTroubleType(1), 'Remus');
    startParty([guest], atLimit());

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(true);
    expect(store.isOverflowShutdown()).toBe(false);
    expect(store.bustPartySnapshot().find(g => g.id === guest.id)?.properties.troubleValue).toBe(1);
  });

  it('should still bust at once for a guest without entrance effects', () => {
    startParty([testGuest('WILD_BUDDY', 'Teresa')], atLimit());

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(true);
  });

  it('should bust on a Celebrity\'s first guest before the second is drawn', () => {
    const second = testGuest('OLD_FRIEND', 'Colin');
    startParty([testGuest('CELEBRITY', 'Troy'), testGuest('WILD_BUDDY', 'Teresa'), second], atLimit());

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(true);
    expect(store.bustPartySnapshot().map(g => g.name)).toEqual(['Anthony', 'Troy', 'Teresa']);
    expect(store.deck().map(g => g.id)).toContain(second.id);
  });

  it('should bust on overflow before the arriving guest\'s entrance effect runs', () => {
    const climber = testGuest('CLIMBER', 'Skye');
    startParty([testGuest('MR_POPULAR', 'Rowan'), climber], [], { capacity: 1 });

    store.inviteGuest();

    expect(store.isOverflowShutdown()).toBe(true);
    expect(store.bustPartySnapshot().find(g => g.id === climber.id)).toEqual(climber);
  });

  it('should check guests without entrance effects as soon as they arrive', () => {
    // Feature: werewolf-guest, Property 4: Guests Without Entrance Effects Are Checked at Once
    fc.assert(
      fc.property(
        fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY', 'MONKEY', 'HIPPY', 'DINOSAUR'),
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 4 }),
        (type, guestTrouble, partyTrouble, limit) => {
          const guest = testGuest(type, 'Guest', { troubleValue: guestTrouble, peaceValue: 0 });
          const party = Array.from({ length: partyTrouble }, (_, i) => testGuest('WILD_BUDDY', `Buddy ${i}`));
          startParty([guest, testGuest('OLD_FRIEND', 'Next')], party, { troubleLimit: Math.max(limit, partyTrouble) });

          store.inviteGuest();

          expect(store.isPartyShutdown()).toBe(partyTrouble + guestTrouble > Math.max(limit, partyTrouble));
          // Nothing else was drawn
          expect(store.deck().map(g => g.name)).toEqual(['Next']);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should bust on overflow without running the arriving guest\'s entrance effect', () => {
    // Feature: werewolf-guest, Property 5: Overflow Is Immediate
    fc.assert(
      fc.property(
        fc.constantFrom<GuestType>('CLIMBER', 'MR_POPULAR', 'CELEBRITY', 'MERMAID'),
        fc.integer({ min: 1, max: 5 }),
        (type, capacity) => {
          const arriving = testGuest(type, 'Arriving');
          const party = Array.from({ length: capacity - 1 }, (_, i) => testGuest('OLD_FRIEND', `Friend ${i}`));
          const rest = [testGuest('OLD_FRIEND', 'Left 1'), testGuest('OLD_FRIEND', 'Left 2')];
          startParty([testGuest('MR_POPULAR', 'Rowan'), arriving, ...rest], party, { capacity, troubleLimit: 10 });

          store.inviteGuest();

          expect(store.isOverflowShutdown()).toBe(true);
          expect(store.bustPartySnapshot().find(g => g.id === arriving.id)).toEqual(arriving);
          // The arriving guest's own invites never happened
          expect(store.deck().map(g => g.name)).toEqual(expect.arrayContaining(['Left 1', 'Left 2']));
        }
      ),
      { numRuns: 100 }
    );
  });
});
