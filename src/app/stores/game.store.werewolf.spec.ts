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

/**
 * The Werewolf: switches between 0 and 1 trouble each time it enters, before trouble is
 * checked.
 *
 * **Validates: werewolf-guest Requirements 2.2, 3.4–3.6**
 */
describe('GameStore - Werewolf', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  afterEach(() => store.resetGame());

  // A party in progress with `party` already in it and `deck` to invite from
  const startParty = (deck: Guest[], party: Guest[] = [], troubleLimit = 3): void => {
    store.initializeGame();
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY, houseCapacity: 10, baseTroubleLimit: troubleLimit, deck, party
    });
  };

  const werewolf = (troubleValue = 0) => testGuest('WEREWOLF', 'Remus', { troubleValue });
  const buddies = (count: number) => Array.from({ length: count }, (_, i) => testGuest('WILD_BUDDY', `Buddy ${i}`));
  const inParty = (guest: Guest) => store.party().find(g => g.id === guest.id);

  it('should switch to 1 trouble on its first entrance', () => {
    const remus = werewolf();
    startParty([remus]);

    store.inviteGuest();

    expect(inParty(remus)?.properties.troubleValue).toBe(1);
  });

  it('should enter a party at the trouble limit when it has 1 trouble, switching to 0', () => {
    const remus = werewolf(1);
    startParty([remus], buddies(3));

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(false);
    expect(inParty(remus)?.properties.troubleValue).toBe(0);
    expect(store.trouble()).toBe(3);
  });

  it('should bust when its switch to 1 trouble goes over the limit, and keep that trouble when banned', () => {
    const remus = werewolf(0);
    startParty([remus], buddies(3));

    store.inviteGuest();

    expect(store.isPartyShutdown()).toBe(true);
    expect(store.bustPartySnapshot().find(g => g.id === remus.id)?.properties.troubleValue).toBe(1);

    store.acknowledgeShutdown();
    store.selectChoiceOption(remus.id);
    store.confirmChoice();
    expect(store.discard()).toEqual([expect.objectContaining({ id: remus.id, properties: expect.objectContaining({ troubleValue: 1 }) })]);
  });

  it('should keep its trouble when the party ends and switch back on its next entrance', () => {
    const remus = werewolf();
    startParty([remus]);
    store.inviteGuest();

    store.advancePhase(); // End the party
    const back = store.deck().find(g => g.id === remus.id)!;
    expect(back.properties.troubleValue).toBe(1);

    startParty([back]);
    store.inviteGuest();
    expect(inParty(remus)?.properties.troubleValue).toBe(0);
  });

  it('should have N % 2 trouble after entering N parties', () => {
    // Feature: werewolf-guest, Property 2: Werewolf Switches on Each Entrance
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 8 }), (entrances) => {
        let remus = werewolf();
        for (let i = 0; i < entrances; i++) {
          startParty([remus]);
          store.inviteGuest();
          remus = inParty(remus)!;
        }
        expect(remus.properties.troubleValue).toBe(entrances % 2);
      }),
      { numRuns: 50 }
    );
  });

  it('should bust if and only if its trouble after switching takes the party over the limit', () => {
    // Feature: werewolf-guest, Property 3: Trouble Waits for the Entrance Effect
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom(0, 1),
        (partyTrouble, extraLimit, startTrouble) => {
          const limit = partyTrouble + extraLimit;
          const remus = werewolf(startTrouble);
          startParty([remus], buddies(partyTrouble), limit);

          store.inviteGuest();

          const after = 1 - startTrouble;
          expect(store.isPartyShutdown()).toBe(partyTrouble + after > limit);
        }
      ),
      { numRuns: 100 }
    );
  });
});
