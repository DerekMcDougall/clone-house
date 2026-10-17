import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import * as fc from 'fast-check';
import { afterEach, describe, expect, it } from 'vitest';
import { GameStore } from '../stores/game.store';
import { registerActionKind, resetActionKindsForTesting } from './action-kinds';
import { GamePhase } from './game-phase.enum';
import { DEFAULT_GAME_SETUP } from './game-setup';
import { admitGuest } from './guest-effects';
import { getGuestDetails } from './guest.model';
import { parseGuestTypeDefinition } from './guest-type-json';
import { registerGuestType, resetGuestTypesForTesting } from './guest-type-registry';
import { TestEffectContext } from '../../testing/effect-context';
import { arbBrokenGuestTypeJson, arbDataOnlyDefinition } from '../../testing/guest-type-arbitraries';
import { testGuest } from '../../testing/guests';

// The example from the effect-descriptors design
const PARTY_PLANNER_JSON = `{
  "id": "PARTY_PLANNER",
  "label": "Party Planner",
  "cost": 8,
  "properties": { "popularityValue": 1, "troubleValue": 0, "moneyValue": 0, "peaceValue": 0, "starValue": 0 },
  "effects": [{ "trigger": "entrance", "action": { "kind": "autoInvite", "count": 1 } }]
}`;

/**
 * Guest types from JSON.
 *
 * **Validates: effect-descriptors Requirements 6, 7, 8.2**
 */
describe('parseGuestTypeDefinition', () => {
  afterEach(() => {
    resetGuestTypesForTesting();
    resetActionKindsForTesting();
  });

  describe('Property 6: JSON Round-Trip', () => {
    it('should give back any data-only definition written as JSON', () => {
      // Feature: effect-descriptors, Property 6: JSON Round-Trip
      fc.assert(
        fc.property(arbDataOnlyDefinition(), (def) => {
          const parsed = parseGuestTypeDefinition(JSON.parse(JSON.stringify(def)));
          expect(parsed).toEqual(def);
          // toEqual ignores undefined fields; the parser shouldn't add any
          expect(Object.keys(parsed).sort()).toEqual(Object.keys(def).sort());
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Invalid JSON Is Rejected With a Path', () => {
    it('should throw, naming the path to the broken field', () => {
      // Feature: effect-descriptors, Property 7: Invalid JSON Is Rejected With a Path
      fc.assert(
        fc.property(arbBrokenGuestTypeJson(), ({ json, path }) => {
          expect(() => parseGuestTypeDefinition(json)).toThrow(`\n  ${path}: `);
        }),
        { numRuns: 200 }
      );
    });
  });

  it('should list every problem at once, naming the type', () => {
    const json = { ...JSON.parse(PARTY_PLANNER_JSON), cost: -1, label: '', effects: [{ trigger: 'entrance', action: { kind: 'custom' } }] };
    expect(() => parseGuestTypeDefinition(json)).toThrow([
      'Invalid guest type JSON "PARTY_PLANNER":',
      '  label: expected a non-empty string',
      '  cost: expected null or a non-negative integer',
      '  effects[0].action.kind: "custom" can\'t be defined in JSON'
    ].join('\n'));
  });

  it('should reject input that is not an object', () => {
    for (const json of [null, 'PARTY_PLANNER', [], 3]) {
      expect(() => parseGuestTypeDefinition(json)).toThrow('Invalid guest type JSON:\n  expected an object');
    }
  });

  it('should return a definition that shares nothing with its input', () => {
    const json = JSON.parse(PARTY_PLANNER_JSON);
    const def = parseGuestTypeDefinition(json);
    json.properties.popularityValue = 5;
    json.effects[0].action.count = 3;
    expect(def.properties.popularityValue).toBe(1);
    expect(def.effects?.[0].action['count']).toBe(1);
  });

  it('should not register the type', () => {
    parseGuestTypeDefinition(JSON.parse(PARTY_PLANNER_JSON));
    expect(() => registerGuestType(parseGuestTypeDefinition(JSON.parse(PARTY_PLANNER_JSON)))).not.toThrow();
  });

  describe('Integration', () => {
    it('should play a Party Planner from JSON, bought from the shop, exactly like a built-in', () => {
      registerGuestType(parseGuestTypeDefinition(JSON.parse(PARTY_PLANNER_JSON)));
      TestBed.configureTestingModule({});
      const store = TestBed.inject(GameStore);
      store.initializeGame(25, {
        ...DEFAULT_GAME_SETUP,
        shop: [...DEFAULT_GAME_SETUP.shop, { type: 'PARTY_PLANNER', names: ['Paige'] }]
      });

      expect(store.shopInventory().find(e => e.type === 'PARTY_PLANNER')?.cost).toBe(8);
      patchState(unprotected(store), { popularity: 8 });
      expect(store.purchaseGuest('PARTY_PLANNER').success).toBe(true);

      // Put Paige on top of the deck, then invite her
      const paige = store.deck().find(g => g.type === 'PARTY_PLANNER')!;
      const rest = store.deck().filter(g => g !== paige);
      patchState(unprotected(store), { deck: [paige, ...rest] });
      store.advancePhase();
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      store.inviteGuest();

      expect(store.party().map(g => g.id)).toEqual([paige.id, rest[0].id]);
      expect(getGuestDetails('PARTY_PLANNER', paige.properties).icons)
        .toEqual([{ symbol: '👤', label: 'Invites a guest on entrance' }]);
      store.resetGame();
    });

    it('should accept JSON that uses an action kind registered in code', () => {
      registerActionKind<{ amount: number }>({
        kind: 'TEST_GAIN_MONEY',
        dataOnly: true,
        validate: (p, path) => (Number.isInteger(p['amount']) ? [] : [`${path}.amount: expected an integer`]),
        run: (ctx, _guest, { amount }) => ctx.setMoney(ctx.getMoney() + amount),
        icons: ({ amount }) => [{ symbol: '💰', label: `Gains $${amount} on entrance` }]
      });
      const def = parseGuestTypeDefinition({
        ...JSON.parse(PARTY_PLANNER_JSON),
        id: 'TEST_BANKER',
        effects: [{ trigger: 'entrance', action: { kind: 'TEST_GAIN_MONEY', amount: 3 } }]
      });
      registerGuestType(def);

      const ctx = new TestEffectContext();
      ctx.resolve(admitGuest(testGuest('TEST_BANKER', 'Bea')));

      expect(ctx.money).toBe(3);
      expect(getGuestDetails('TEST_BANKER', def.properties).icons[0].label).toBe('Gains $3 on entrance');
    });
  });
});
