import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GuestProperties, GuestType } from '../models/guest.model';
import { resetGuestTypesForTesting } from '../models/guest-type-registry';
import { GameStore } from './game.store';
import { registerTestGuestType, testGuest } from '../../testing/guests';

const ICON = [{ symbol: '🧪', label: 'Test bonus' }];
const NO_PROPERTIES: GuestProperties = { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 };

// The existing floor and penalty: popularity and money at 0 or above, 7 popularity per point
// of money below 0
const settle = (popularity: number, money: number) => ({
  popularity: Math.max(0, Math.max(0, popularity) - Math.max(0, -money) * 7),
  money: Math.max(0, money)
});

/**
 * Scoring with bonuses: normal amounts are settled first, then every guest's score effects
 * are added and settled again.
 *
 * **Validates: scoring-bonuses Requirements 1.4, 3**
 */
describe('GameStore - Scoring Bonuses', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  afterEach(() => {
    store.resetGame();
    resetGuestTypesForTesting();
  });

  // A party in progress, not on the final turn
  const startParty = (party: Guest[], { popularity = 0, money = 0, capacity = 10, deck = [] as Guest[] } = {}): void => {
    store.initializeGame();
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY, houseCapacity: capacity, popularity, money, party, deck, discard: []
    });
  };

  // A test type with no properties of its own beyond `properties` and one score bonus
  const bonusType = (id: string, bonus: Record<string, unknown>, properties: Partial<GuestProperties> = {}): GuestType =>
    registerTestGuestType({
      id,
      properties: { ...NO_PROPERTIES, ...properties },
      effects: [{ trigger: 'score', action: { kind: 'scoreBonus', resource: 'popularity', amount: 1, icons: ICON, ...bonus } }]
    });

  it('should add each guest\'s bonus after the party\'s normal amounts', () => {
    const type = bonusType('TEST_FLAT', { amount: 3 }, { popularityValue: 1 });
    startParty([testGuest(type, 'Flat'), testGuest(type, 'Flatter'), testGuest('RICH_PAL', 'Khalil')], { popularity: 4, money: 2 });

    store.advancePhase();

    // 4 + 2 normal + 6 bonus; 2 + 1 money
    expect(store.popularity()).toBe(12);
    expect(store.money()).toBe(3);
    expect(store.currentPhase()).toBe(GamePhase.BUY);
  });

  it('should work out every bonus from the finished party', () => {
    const counter = bonusType('TEST_PER_TROUBLE', { resource: 'money', amount: 2, per: 'trouble' });
    const spaces = bonusType('TEST_PER_SPACE', { per: 'emptySpace' });
    startParty(
      [testGuest(counter, 'Sam'), testGuest('WILD_BUDDY', 'Anthony'), testGuest('HIPPY', 'Bob'), testGuest(spaces, 'Raj')],
      { capacity: 6 }
    );

    store.advancePhase();

    // Normal: Wild Buddy 2 + Hippy 1. Bonuses: 2 money × 1 trouble (peace doesn't count), 1 × 2 empty spaces
    expect(store.popularity()).toBe(5);
    expect(store.money()).toBe(2);
  });

  it('should not let bonus money cover a shortfall from normal scoring', () => {
    const comedian = registerTestGuestType({ id: 'TEST_COSTLY', properties: { ...NO_PROPERTIES, moneyValue: -1 } });
    const bartender = bonusType('TEST_PAYS', { resource: 'money', amount: 2 });
    startParty([testGuest(comedian, 'Jerry'), testGuest(bartender, 'Sam')], { popularity: 10, money: 0 });

    store.advancePhase();

    // Normal: money -1 → 0, costing 7 popularity. Then the bonus adds 2 money.
    expect(store.popularity()).toBe(3);
    expect(store.money()).toBe(2);
  });

  it('should settle again after bonuses, so a negative bonus can cost popularity', () => {
    const type = bonusType('TEST_DEBT', { resource: 'money', amount: -2 });
    startParty([testGuest(type, 'Debt')], { popularity: 20, money: 1 });

    store.advancePhase();

    expect(store.money()).toBe(0);
    expect(store.popularity()).toBe(13);
  });

  it('should run no bonuses when the party wins', () => {
    const type = bonusType('TEST_FLAT', { amount: 3 });
    const aliens = ['ET', 'Rocky', 'Olimar', 'Alf'].map(name => testGuest('ALIEN', name));
    startParty([...aliens, testGuest(type, 'Flat')], { popularity: 4 });

    store.advancePhase();

    expect(store.isVictory()).toBe(true);
    expect(store.popularity()).toBe(4);
  });

  it('should run no bonuses when the party busts', () => {
    const type = bonusType('TEST_FLAT', { amount: 3 });
    startParty([testGuest(type, 'Flat'), testGuest('WILD_BUDDY', 'Anthony'), testGuest('WILD_BUDDY', 'Teresa')], {
      popularity: 4, deck: [testGuest('WILD_BUDDY', 'Jodie')]
    });

    store.inviteGuest();
    expect(store.isPartyShutdown()).toBe(true);
    store.acknowledgeShutdown();

    expect(store.popularity()).toBe(4);
  });

  it('should not run score effects when a guest enters the party', () => {
    const type = bonusType('TEST_FLAT', { amount: 3 });
    startParty([], { popularity: 4, deck: [testGuest(type, 'Flat')] });

    store.inviteGuest();

    expect(store.party().map(g => g.name)).toEqual(['Flat']);
    expect(store.popularity()).toBe(4);
  });

  describe('Group bonuses', () => {
    // A test type with a group bonus: `amounts` by how many of its guests are in the party
    const groupType = (id: string, amounts: number[], { resource = 'popularity', properties = {} as Partial<GuestProperties> } = {}): GuestType =>
      registerTestGuestType({
        id,
        properties: { ...NO_PROPERTIES, ...properties },
        effects: [{
          trigger: 'groupScore',
          action: { kind: 'scoreBonus', resource, amounts, per: 'guestOfType', guestType: id, icons: ICON }
        }]
      });
    const several = (type: GuestType, n: number) => Array.from({ length: n }, (_, i) => testGuest(type, `${type} ${i}`));

    it('should pay a group bonus once, sized by the group', () => {
      const type = groupType('TEST_GROUP', [1, 4, 9, 16]);
      startParty([testGuest('RICH_PAL', 'Khalil'), ...several(type, 3)], { popularity: 2 });

      store.advancePhase();

      expect(store.popularity()).toBe(11);
      expect(store.money()).toBe(1);
    });

    it('should pay each group type once', () => {
      const a = groupType('TEST_GROUP_A', [1, 4, 9]);
      const b = groupType('TEST_GROUP_B', [10, 20]);
      startParty([...several(a, 2), ...several(b, 1), ...several(a, 1)]);

      store.advancePhase();

      // A: 3 guests → 9; B: 1 guest → 10
      expect(store.popularity()).toBe(19);
    });

    it('should add group bonuses after own bonuses', () => {
      const group = groupType('TEST_GROUP', [5]);
      const own = bonusType('TEST_OWN', { amount: 2 });
      startParty([testGuest(group, 'G'), testGuest(own, 'O'), testGuest(own, 'P')]);

      store.advancePhase();

      expect(store.popularity()).toBe(9);
    });

    it('should not let group bonus money cover a shortfall from own bonuses', () => {
      const own = bonusType('TEST_DEBT', { resource: 'money', amount: -1 });
      const group = groupType('TEST_PAYS', [3], { resource: 'money' });
      startParty([testGuest(own, 'Debt'), testGuest(group, 'Pays')], { popularity: 10, money: 0 });

      store.advancePhase();

      // Own bonuses: money -1 → 0, costing 7 popularity. Then the group bonus adds 3 money.
      expect(store.popularity()).toBe(3);
      expect(store.money()).toBe(3);
    });

    it('should run no group bonuses on a bust, a win or an entrance', () => {
      const type = groupType('TEST_GROUP', [5]);

      startParty([], { popularity: 4, deck: [testGuest(type, 'G')] });
      store.inviteGuest();
      expect(store.popularity()).toBe(4);

      const aliens = ['ET', 'Rocky', 'Olimar', 'Alf'].map(name => testGuest('ALIEN', name));
      startParty([...aliens, testGuest(type, 'G')], { popularity: 4 });
      store.advancePhase();
      expect(store.isVictory()).toBe(true);
      expect(store.popularity()).toBe(4);

      startParty([testGuest(type, 'G'), ...several('WILD_BUDDY', 2)], { popularity: 4, deck: [testGuest('WILD_BUDDY', 'Jodie')] });
      store.inviteGuest();
      expect(store.isPartyShutdown()).toBe(true);
      store.acknowledgeShutdown();
      expect(store.popularity()).toBe(4);
    });

    it('should settle normal amounts, own bonuses and group bonuses in turn, one group bonus per type', () => {
      // Feature: group-scoring-bonuses, Property 2: Three Settled Steps, One Group Bonus per Type
      fc.assert(
        fc.property(
          fc.array(fc.nat(5), { minLength: 1, maxLength: 8 }),
          fc.nat(20),
          fc.nat(4),
          (picks, popularity, money) => {
            resetGuestTypesForTesting();
            const types = [
              groupType('TEST_SQUARES', [1, 4, 9, 16]),
              groupType('TEST_GROUP_MONEY', [2, -3], { resource: 'money' }),
              bonusType('TEST_OWN', { amount: 2 }, { moneyValue: -1 }),
              bonusType('TEST_OWN_DEBT', { resource: 'money', amount: -1 }),
              'OLD_FRIEND',
              'RICH_PAL'
            ];
            const tables: Record<string, { resource: 'popularity' | 'money'; amounts: number[] }> = {
              TEST_SQUARES: { resource: 'popularity', amounts: [1, 4, 9, 16] },
              TEST_GROUP_MONEY: { resource: 'money', amounts: [2, -3] }
            };
            const party = picks.map((p, i) => testGuest(types[p], `Guest ${i}`));
            startParty(party, { popularity, money, capacity: 10 });

            const normal = settle(
              popularity + party.reduce((sum, g) => sum + g.properties.popularityValue, 0),
              money + party.reduce((sum, g) => sum + g.properties.moneyValue, 0)
            );
            const ownPopularity = 2 * party.filter(g => g.type === 'TEST_OWN').length;
            const ownMoney = -party.filter(g => g.type === 'TEST_OWN_DEBT').length;
            const withOwn = settle(normal.popularity + ownPopularity, normal.money + ownMoney);
            let groupPopularity = 0;
            let groupMoney = 0;
            for (const [type, { resource, amounts }] of Object.entries(tables)) {
              const n = party.filter(g => g.type === type).length;
              const bonus = n === 0 ? 0 : amounts[Math.min(n, amounts.length) - 1];
              if (resource === 'popularity') groupPopularity += bonus;
              else groupMoney += bonus;
            }
            const expected = settle(withOwn.popularity + groupPopularity, withOwn.money + groupMoney);

            store.advancePhase();

            expect({ popularity: store.popularity(), money: store.money() }).toEqual(expected);
          }
        ),
        { numRuns: 150 }
      );
    });

    it('should leave the totals alone when a party with group bonus guests busts or wins', () => {
      // Feature: group-scoring-bonuses, Property 4: No Group Bonuses Without Scoring
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 4 }), fc.boolean(), fc.nat(30), fc.nat(5), (n, win, popularity, money) => {
          resetGuestTypesForTesting();
          const group = several(groupType('TEST_GROUP', [1, 4, 9, 16]), n);
          if (win) {
            startParty([...several('ALIEN', 4), ...group], { popularity, money });
            store.advancePhase();
            expect(store.isVictory()).toBe(true);
          } else {
            startParty([...several('WILD_BUDDY', 2), ...group], { popularity, money, deck: [testGuest('WILD_BUDDY', 'Jodie')] });
            store.inviteGuest();
            expect(store.isPartyShutdown()).toBe(true);
            store.acknowledgeShutdown();
          }
          expect(store.popularity()).toBe(popularity);
          expect(store.money()).toBe(money);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Bonus guest types', () => {
    // Ends a party of `party` from 10 popularity and 10 money and returns what it earned
    const earned = (party: Guest[], capacity: number) => {
      startParty(party, { popularity: 10, money: 10, capacity });
      store.advancePhase();
      return { popularity: store.popularity() - 10, money: store.money() - 10 };
    };
    const friends = (n: number) => Array.from({ length: n }, (_, i) => testGuest('OLD_FRIEND', `Friend ${i}`));

    it('should give a Comedian 5 popularity only when the house is full', () => {
      // Comedian: -1 money; Old Friends: 1 popularity each
      expect(earned([testGuest('COMEDIAN', 'Jerry'), ...friends(3)], 5)).toEqual({ popularity: 3, money: -1 });
      expect(earned([testGuest('COMEDIAN', 'Jerry'), ...friends(4)], 5)).toEqual({ popularity: 9, money: -1 });
    });

    it('should give a Mascot 1 popularity per Old Friend', () => {
      const party = [testGuest('MASCOT', 'Sparty'), ...friends(3), testGuest('RICH_PAL', 'Khalil')];
      // 1 Mascot + 3 Old Friends + 3 bonus
      expect(earned(party, 6)).toEqual({ popularity: 7, money: 1 });
    });

    it('should give an Introvert 1 popularity per empty space', () => {
      expect(earned([testGuest('INTROVERT', 'Sheldon'), ...friends(1)], 6)).toEqual({ popularity: 6, money: 0 });
    });

    it('should give a Bartender 2 money and a Writer 2 popularity per trouble', () => {
      const party = [testGuest('BARTENDER', 'Sam'), testGuest('WRITER', 'Erin'), testGuest('WILD_BUDDY', 'Anthony'), testGuest('ROCK_STAR', 'Gord')];
      // Normal: 1 + 1 + 2 + 3 popularity, 2 money. 2 trouble: Bartender +4 money, Writer +4 popularity
      expect(earned(party, 5)).toEqual({ popularity: 11, money: 6 });
    });

    it('should count spaces from a house expansion', () => {
      store.initializeGame();
      patchState(unprotected(store), { money: 2 });
      expect(store.purchaseExpansion().success).toBe(true);
      expect(store.houseCapacity()).toBe(6);

      const comedianParty = [testGuest('COMEDIAN', 'Jerry'), ...friends(4)];
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: comedianParty, popularity: 0, money: 1 });
      store.advancePhase();
      // 5 guests in a 6-space house: not full, so only the Old Friends' popularity
      expect(store.popularity()).toBe(4);

      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, party: [testGuest('INTROVERT', 'Raj')], popularity: 0 });
      store.advancePhase();
      // 1 + 5 empty spaces
      expect(store.popularity()).toBe(6);
    });
  });

  describe('Properties', () => {
    // Test bonus types covering every count and the houseFull condition
    const registerBonusTypes = (): GuestType[] => [
      bonusType('TEST_FLAT', { amount: 3 }, { moneyValue: -1 }),
      bonusType('TEST_SPACE', { per: 'emptySpace' }, { popularityValue: 1 }),
      bonusType('TEST_TROUBLE', { resource: 'money', amount: 2, per: 'trouble' }, { popularityValue: 1 }),
      bonusType('TEST_FRIENDS', { per: 'guestOfType', guestType: 'OLD_FRIEND' }),
      bonusType('TEST_FULL', { amount: 5, when: 'houseFull' }, { moneyValue: -1 }),
      bonusType('TEST_LOSS', { resource: 'money', amount: -1 })
    ];
    const plainTypes: GuestType[] = ['OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL', 'CATERER', 'TICKET_TAKER', 'GANGSTER'];

    // Each test type's bonus, worked out by hand, for a finished party
    const expectedBonus = (type: GuestType, party: Guest[], capacity: number): { popularity: number; money: number } => {
      const trouble = party.reduce((sum, g) => sum + g.properties.troubleValue, 0);
      switch (type) {
        case 'TEST_FLAT': return { popularity: 3, money: 0 };
        case 'TEST_SPACE': return { popularity: capacity - party.length, money: 0 };
        case 'TEST_TROUBLE': return { popularity: 0, money: 2 * trouble };
        case 'TEST_FRIENDS': return { popularity: party.filter(g => g.type === 'OLD_FRIEND').length, money: 0 };
        case 'TEST_FULL': return { popularity: party.length === capacity ? 5 : 0, money: 0 };
        case 'TEST_LOSS': return { popularity: 0, money: -1 };
        default: return { popularity: 0, money: 0 };
      }
    };

    it('should settle normal amounts, then add every bonus and settle again', () => {
      // Feature: scoring-bonuses, Property 2: Scoring Is Normal Amounts Plus Bonuses
      fc.assert(
        fc.property(
          fc.array(fc.nat(11), { minLength: 1, maxLength: 7 }),
          fc.nat(2),
          fc.nat(30),
          fc.nat(5),
          (picks, extraSpace, popularity, money) => {
            resetGuestTypesForTesting();
            const types = [...registerBonusTypes(), ...plainTypes];
            const party = picks.map((p, i) => testGuest(types[p], `Guest ${i}`));
            const capacity = party.length + extraSpace;
            startParty(party, { popularity, money, capacity });

            const normal = settle(
              popularity + party.reduce((sum, g) => sum + g.properties.popularityValue, 0),
              money + party.reduce((sum, g) => sum + g.properties.moneyValue, 0)
            );
            const bonuses = party.map(g => expectedBonus(g.type, party, capacity));
            const expected = settle(
              normal.popularity + bonuses.reduce((sum, b) => sum + b.popularity, 0),
              normal.money + bonuses.reduce((sum, b) => sum + b.money, 0)
            );

            store.advancePhase();

            expect({ popularity: store.popularity(), money: store.money() }).toEqual(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should leave the totals alone when a party with bonus guests busts or wins', () => {
      // Feature: scoring-bonuses, Property 3: No Bonuses Without Scoring
      fc.assert(
        fc.property(
          fc.array(fc.nat(5), { minLength: 1, maxLength: 4 }),
          fc.boolean(),
          fc.nat(30),
          fc.nat(5),
          (picks, win, popularity, money) => {
            resetGuestTypesForTesting();
            const types = registerBonusTypes();
            const bonusGuests = picks.map((p, i) => testGuest(types[p], `Guest ${i}`));

            if (win) {
              const aliens = [0, 1, 2, 3].map(i => testGuest('ALIEN', `Alien ${i}`));
              startParty([...aliens, ...bonusGuests], { popularity, money });
              store.advancePhase();
              expect(store.isVictory()).toBe(true);
            } else {
              const buddies = [0, 1].map(i => testGuest('WILD_BUDDY', `Buddy ${i}`));
              startParty([...buddies, ...bonusGuests], { popularity, money, deck: [testGuest('WILD_BUDDY', 'Jodie')] });
              store.inviteGuest();
              expect(store.isPartyShutdown()).toBe(true);
              store.acknowledgeShutdown();
            }

            expect(store.popularity()).toBe(popularity);
            expect(store.money()).toBe(money);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
