import * as fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ActionKind, effectIcons, findActionKind, getActionKind, registerActionKind, resetActionKindsForTesting, runEffect
} from './action-kinds';
import { BUILT_IN_TABLES_SNAPSHOT } from './built-in-tables.snapshot';
import { EffectDefinition } from './effect-definition';
import { admitGuest } from './guest-effects';
import { getGuestDetails, Guest, GuestProperties } from './guest.model';
import { PROPERTY_KEYS } from './guest-type';
import { getGuestType, registerGuestType, resetGuestTypesForTesting } from './guest-type-registry';
import { TestEffectContext } from '../../testing/effect-context';
import { arbDataOnlyDefinition } from '../../testing/guest-type-arbitraries';
import { customEntrance, registerTestGuestType, testGuest } from '../../testing/guests';

const entrance = (action: EffectDefinition['action']): EffectDefinition => ({ trigger: 'entrance', action });

// For calling validate() directly on kinds with no nested actions
const noNested = (): string[] => [];

// Runs one effect of `guest` and everything it enqueues.
const run = (ctx: TestEffectContext, guest: Guest, effect: EffectDefinition) =>
  ctx.resolve((c) => runEffect(c, guest, effect));

/**
 * Action kinds: the built-in kinds, the kind registry, and running effects from descriptors.
 *
 * **Validates: effect-descriptors Requirements 2, 3, 4, 5, 6, 8.1**
 */
describe('Action Kinds', () => {
  afterEach(() => {
    resetGuestTypesForTesting();
    resetActionKindsForTesting();
  });

  describe('autoInvite', () => {
    it('should admit the top guests of the deck, in deck order', () => {
      const host = testGuest('OLD_FRIEND', 'Host');
      const deck = ['Colin', 'Emily', 'Rachelle'].map(name => testGuest('OLD_FRIEND', name));
      const ctx = new TestEffectContext({ deck, party: [host] });

      run(ctx, host, entrance({ kind: 'autoInvite', count: 2 }));

      expect(ctx.party.map(g => g.name)).toEqual(['Host', 'Colin', 'Emily']);
      expect(ctx.deck.map(g => g.name)).toEqual(['Rachelle']);
    });

    it('should stop when the deck runs out', () => {
      const host = testGuest('OLD_FRIEND', 'Host');
      const ctx = new TestEffectContext({ deck: [testGuest('OLD_FRIEND', 'Colin')], party: [host] });

      run(ctx, host, entrance({ kind: 'autoInvite', count: 3 }));

      expect(ctx.party.map(g => g.name)).toEqual(['Host', 'Colin']);
    });

    it('should show one invite icon per guest invited', () => {
      expect(getActionKind('autoInvite').icons({ count: 3 }, 'entrance')).toEqual(
        Array(3).fill({ symbol: '👤', label: 'Invites a guest on entrance' })
      );
    });

    it('should reject a count that is not an integer of at least 1', () => {
      const kind = getActionKind('autoInvite');
      for (const count of [0, -1, 1.5, '2', undefined]) {
        expect(kind.validate({ kind: 'autoInvite', count }, 'a', noNested)).toEqual(['a.count: expected an integer ≥ 1']);
      }
      expect(kind.validate({ kind: 'autoInvite', count: 2, times: 1 }, 'a', noNested)).toEqual(['a.times: unknown parameter']);
    });
  });

  describe('adjustSelf', () => {
    const climb = entrance({ kind: 'adjustSelf', property: 'popularityValue', delta: 1, max: 9 });

    it('should change the property of the guest whose effect it is', () => {
      const skye = testGuest('CLIMBER', 'Skye', { popularityValue: 3 });
      const colin = testGuest('OLD_FRIEND', 'Colin');
      const ctx = new TestEffectContext({ party: [colin, skye] });

      run(ctx, skye, climb);

      expect(ctx.party[1].properties.popularityValue).toBe(4);
      expect(ctx.party[0]).toBe(colin);
    });

    it('should clamp to max and min', () => {
      const skye = testGuest('CLIMBER', 'Skye', { popularityValue: 9, moneyValue: -2 });
      const ctx = new TestEffectContext({ party: [skye] });

      run(ctx, skye, climb);
      run(ctx, skye, entrance({ kind: 'adjustSelf', property: 'moneyValue', delta: -3, min: -3 }));

      expect(ctx.party[0].properties.popularityValue).toBe(9);
      expect(ctx.party[0].properties.moneyValue).toBe(-3);
    });

    it('should start from the guest as she is in the party when the effect runs', () => {
      const skye = testGuest('CLIMBER', 'Skye');
      const changed = { ...skye, properties: { ...skye.properties, popularityValue: 5 } };
      const ctx = new TestEffectContext({ party: [changed] });

      // `skye` is the guest as enqueued, with popularity 0
      run(ctx, skye, climb);

      expect(ctx.party[0].properties.popularityValue).toBe(6);
    });

    it('should do nothing when the guest has left the party', () => {
      const skye = testGuest('CLIMBER', 'Skye');
      const party = [testGuest('OLD_FRIEND', 'Colin')];
      const ctx = new TestEffectContext({ party });

      run(ctx, skye, climb);

      expect(ctx.party).toEqual(party);
    });

    it('should show a plus for gains and a minus for losses', () => {
      const kind = getActionKind('adjustSelf');
      expect(kind.icons(climb.action, 'entrance')).toEqual([{ symbol: '➕', label: 'Gains 1 popularity on entrance' }]);
      expect(kind.icons({ property: 'moneyValue', delta: -2 }, 'entrance'))
        .toEqual([{ symbol: '➖', label: 'Loses 2 money on entrance' }]);
    });

    it('should report every problem with its parameters', () => {
      expect(getActionKind('adjustSelf').validate(
        { kind: 'adjustSelf', property: 'charmValue', delta: 0, min: 1.5, max: 'x', extra: true }, 'a', noNested
      )).toEqual([
        `a.property: expected one of ${PROPERTY_KEYS.join(', ')}`,
        'a.delta: expected a non-zero integer',
        'a.min: expected an integer',
        'a.max: expected an integer',
        'a.extra: unknown parameter'
      ]);
      expect(getActionKind('adjustSelf').validate({ kind: 'adjustSelf', property: 'moneyValue', delta: 1, min: 2, max: 1 }, 'a', noNested))
        .toEqual(['a.min: expected min ≤ max']);
    });
  });

  describe('custom', () => {
    it('should run its function with the guest and show its icons', () => {
      const icons = [{ symbol: '🧪', label: 'Test effect' }];
      const calls: string[] = [];
      const [effect] = customEntrance((_ctx, guest) => calls.push(guest.name), icons);
      const colin = testGuest('OLD_FRIEND', 'Colin');

      run(new TestEffectContext(), colin, effect);

      expect(calls).toEqual(['Colin']);
      expect(effectIcons([effect])).toEqual(icons);
    });

    it('should require a function and a non-empty list of icons', () => {
      expect(getActionKind('custom').validate({ kind: 'custom', run: 1, icons: [] }, 'a', noNested)).toEqual([
        'a.run: expected a function',
        'a.icons: expected a non-empty list of { symbol, label }'
      ]);
    });
  });

  describe('chooseGuest', () => {
    const boost = entrance({
      kind: 'chooseGuest',
      prompt: 'Who gets a boost?',
      from: 'party',
      action: { kind: 'adjustSelf', property: 'popularityValue', delta: 2 }
    });

    it('should ask for a party guest and run its action on the one chosen', () => {
      const cora = testGuest('OLD_FRIEND', 'Cora');
      const colin = testGuest('RICH_PAL', 'Colin');
      const ctx = new TestEffectContext({ party: [cora, colin] });

      run(ctx, cora, boost);

      expect(ctx.pendingChoice?.request.prompt).toBe('Who gets a boost?');
      expect(ctx.pendingChoice?.request.sourceGuestId).toBe(cora.id);
      expect(ctx.pendingChoice?.options).toEqual([
        { id: cora.id, label: 'Old Friend Cora', guest: cora },
        { id: colin.id, label: 'Rich Pal Colin', guest: colin }
      ]);

      ctx.choose(colin.id);

      expect(ctx.party[0]).toBe(cora);
      expect(ctx.party[1].properties.popularityValue).toBe(2);
    });

    it('should show a target icon', () => {
      expect(effectIcons([boost])).toEqual([{ symbol: '🎯', label: 'Chooses a party guest on entrance' }]);
    });

    it('should validate its own parameters and its nested action', () => {
      const validateAction = vi.fn(() => ['a.action.delta: nested problem']);
      expect(getActionKind('chooseGuest').validate(
        { kind: 'chooseGuest', prompt: '', from: 'deck', action: { kind: 'adjustSelf' }, extra: 1 }, 'a', validateAction
      )).toEqual([
        'a.prompt: expected a non-empty string',
        'a.from: expected "party"',
        'a.action.delta: nested problem',
        'a.extra: unknown parameter'
      ]);
      expect(validateAction).toHaveBeenCalledWith({ kind: 'adjustSelf' }, 'a.action');
    });

    it('should reject a bad nested action when its type is registered', () => {
      const def = (action: unknown) => ({
        id: 'TEST_CHOOSER',
        label: 'Chooser',
        cost: null,
        properties: { ...getGuestType('OLD_FRIEND').properties },
        effects: [entrance({ kind: 'chooseGuest', prompt: 'Pick', from: 'party', action } as EffectDefinition['action'])]
      });
      expect(() => registerGuestType(def({ kind: 'adjustSelf', property: 'moneyValue', delta: 0 })))
        .toThrow('effects[0].action.action.delta: expected a non-zero integer');
      expect(() => registerGuestType(def({ kind: 'NOPE' })))
        .toThrow('effects[0].action.action.kind: unknown action kind "NOPE"');
      expect(() => registerGuestType(def(undefined))).toThrow('effects[0].action.action: expected an object');
      // A custom action inside is fine in code
      expect(() => registerGuestType(def({ kind: 'custom', run: () => {}, icons: [{ symbol: '?', label: 'Icon' }] })))
        .not.toThrow();
    });
  });

  describe('Registry', () => {
    const doubler: ActionKind<{ times: number }> = {
      kind: 'TEST_DOUBLE_MONEY',
      dataOnly: true,
      validate: () => [],
      run: (ctx) => ctx.setMoney(ctx.getMoney() * 2),
      icons: () => [{ symbol: '💰', label: 'Doubles money' }]
    };

    it('should register a new kind and reject a taken name', () => {
      registerActionKind(doubler);
      expect(findActionKind('TEST_DOUBLE_MONEY')).toBe(doubler);
      expect(() => registerActionKind(doubler)).toThrow('Action kind "TEST_DOUBLE_MONEY" is already registered');
      expect(() => registerActionKind({ ...doubler, kind: 'autoInvite' })).toThrow('already registered');
    });

    it('should throw on an unknown kind, naming it', () => {
      expect(() => getActionKind('NOPE')).toThrow('Unknown action kind "NOPE"');
      expect(findActionKind('NOPE')).toBeUndefined();
    });

    it('should drop registered kinds on reset and keep the built-ins', () => {
      registerActionKind(doubler);
      resetActionKindsForTesting();
      expect(findActionKind('TEST_DOUBLE_MONEY')).toBeUndefined();
      expect(['autoInvite', 'adjustSelf', 'custom', 'chooseGuest'].every(k => findActionKind(k))).toBe(true);
    });
  });

  describe('Validation through the guest type registry', () => {
    const def = (effects: unknown[]) => ({
      id: 'TEST_TYPE',
      label: 'Test Type',
      cost: null,
      properties: { ...getGuestType('OLD_FRIEND').properties },
      effects: effects as EffectDefinition[]
    });

    it('should name the type, the effect position and the problem', () => {
      expect(() => registerGuestType(def([
        entrance({ kind: 'autoInvite', count: 1 }),
        entrance({ kind: 'autoInvite', count: 0 })
      ]))).toThrow('Invalid guest type "TEST_TYPE": effects[1].action.count: expected an integer ≥ 1');
    });

    it('should reject an unknown trigger and an unknown kind', () => {
      expect(() => registerGuestType(def([{ trigger: 'exit', action: { kind: 'autoInvite', count: 1 } }])))
        .toThrow('effects[0].trigger: expected one of entrance');
      expect(() => registerGuestType(def([entrance({ kind: 'NOPE' })])))
        .toThrow('effects[0].action.kind: unknown action kind "NOPE"');
    });

    it('should accept a kind once it is registered', () => {
      expect(() => registerGuestType(def([entrance({ kind: 'TEST_KIND' })]))).toThrow('unknown action kind');
      registerActionKind({ kind: 'TEST_KIND', dataOnly: true, validate: () => [], run: () => {}, icons: () => [] });
      expect(() => registerGuestType(def([entrance({ kind: 'TEST_KIND' })]))).not.toThrow();
    });
  });

  describe('Property 1: Built-in Effects Are Unchanged', () => {
    it('should show the pre-descriptor icons on Climber, Mr. Popular, Celebrity and Mermaid cards', () => {
      // Feature: effect-descriptors, Property 1: Built-in Effects Are Unchanged
      const before = Object.entries(BUILT_IN_TABLES_SNAPSHOT.entranceIcons);
      expect(before.map(([type]) => type).sort()).toEqual(['CELEBRITY', 'CLIMBER', 'MERMAID', 'MR_POPULAR']);
      for (const [type, icons] of before) {
        const { properties } = getGuestType(type);
        expect(getGuestDetails(type, properties).icons.slice(0, icons.length)).toEqual(icons);
      }
    });

    it('should describe the built-in effects as the spec says', () => {
      expect(getGuestType('CLIMBER').effects)
        .toEqual([entrance({ kind: 'adjustSelf', property: 'popularityValue', delta: 1, max: 9 })]);
      expect(getGuestType('MR_POPULAR').effects).toEqual([entrance({ kind: 'autoInvite', count: 1 })]);
      expect(getGuestType('MERMAID').effects).toEqual([entrance({ kind: 'autoInvite', count: 1 })]);
      expect(getGuestType('CELEBRITY').effects).toEqual([entrance({ kind: 'autoInvite', count: 2 })]);
    });
  });

  describe('Property 2: autoInvite Enqueues count Invites', () => {
    it('should admit min(count, deck length) guests from the top of the deck, in order', () => {
      // Feature: effect-descriptors, Property 2: autoInvite Enqueues count Invites
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), fc.nat({ max: 8 }), (count, deckSize) => {
          const host = testGuest('OLD_FRIEND', 'Host');
          // Old Friends have no effects, so no one else gets invited
          const deck = Array.from({ length: deckSize }, (_, i) => testGuest('OLD_FRIEND', `Guest ${i}`));
          const ctx = new TestEffectContext({ deck, party: [host] });

          run(ctx, host, entrance({ kind: 'autoInvite', count }));

          const admitted = Math.min(count, deckSize);
          expect(ctx.party).toEqual([host, ...deck.slice(0, admitted)]);
          expect(ctx.deck).toEqual(deck.slice(admitted));
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: adjustSelf Clamps and Targets the Current Guest', () => {
    const optionalInt = fc.option(fc.integer({ min: -9, max: 9 }), { nil: undefined });

    it('should set the current value plus delta, clamped, on the triggering guest only', () => {
      // Feature: effect-descriptors, Property 3: adjustSelf Clamps and Targets the Current Guest
      fc.assert(
        fc.property(
          fc.constantFrom(...PROPERTY_KEYS),
          fc.integer({ min: -9, max: 9 }),
          fc.integer({ min: -5, max: 5 }).filter(d => d !== 0),
          fc.tuple(optionalInt, optionalInt).map(([a, b]) =>
            (a !== undefined && b !== undefined && a > b ? [b, a] : [a, b])),
          fc.integer({ min: 1, max: 5 }).chain(size => fc.tuple(fc.constant(size), fc.nat({ max: size - 1 }))),
          fc.boolean(),
          (property, current, delta, [min, max], [size, target], inParty) => {
            const party = Array.from({ length: size }, (_, i) => testGuest('RICH_PAL', `Guest ${i}`));
            // The guest as enqueued is stale; the party version has `current`
            const enqueued = party[target];
            party[target] = { ...enqueued, properties: { ...enqueued.properties, [property]: current } };
            const startingParty = inParty ? party : party.filter((_, i) => i !== target);
            const ctx = new TestEffectContext({ party: [...startingParty] });

            run(ctx, enqueued, entrance({
              kind: 'adjustSelf', property, delta,
              ...(min !== undefined && { min }),
              ...(max !== undefined && { max })
            }));

            if (!inParty) {
              expect(ctx.party).toEqual(startingParty);
              return;
            }
            let expected = current + delta;
            if (min !== undefined) expected = Math.max(min, expected);
            if (max !== undefined) expected = Math.min(max, expected);
            const expectedProperties: GuestProperties = { ...party[target].properties, [property]: expected };
            expect(ctx.party.map(g => g.id)).toEqual(party.map(g => g.id));
            expect(ctx.party[target].properties).toEqual(expectedProperties);
            ctx.party.forEach((g, i) => { if (i !== target) expect(g).toBe(party[i]); });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Entrance Effects Run in Definition Order', () => {
    it('should run each entrance effect, and what it enqueues, before the next one starts', () => {
      // Feature: effect-descriptors, Property 4: Entrance Effects Run in Definition Order
      fc.assert(
        fc.property(fc.array(fc.nat({ max: 3 }), { minLength: 1, maxLength: 4 }), (followUps) => {
          resetGuestTypesForTesting();
          const log: string[] = [];
          // Effect i logs "i", then enqueues followUps[i] effects that log "i.j"
          const effects = followUps.flatMap((count, i) => customEntrance((ctx) => {
            log.push(`${i}`);
            for (let j = 0; j < count; j++) ctx.enqueue(() => log.push(`${i}.${j}`));
          }));
          const type = registerTestGuestType({ id: 'TEST_MULTI', effects });

          new TestEffectContext().resolve(admitGuest(testGuest(type, 'Colin')));

          expect(log).toEqual(followUps.flatMap((count, i) =>
            [`${i}`, ...Array.from({ length: count }, (_, j) => `${i}.${j}`)]));
        }),
        { numRuns: 100 }
      );
    });

    it('should enqueue nothing for a type without entrance effects', () => {
      const ctx = new TestEffectContext();
      const enqueue = vi.spyOn(ctx, 'enqueue');
      const colin = testGuest('OLD_FRIEND', 'Colin');

      admitGuest(colin)(ctx);

      expect(ctx.party).toEqual([colin]);
      expect(enqueue).not.toHaveBeenCalled();
    });
  });

  describe('Property 5: Icons Follow Effect Order', () => {
    it('should start a card\'s icons with each effect\'s icons, in definition order', () => {
      // Feature: effect-descriptors, Property 5: Icons Follow Effect Order
      fc.assert(
        fc.property(arbDataOnlyDefinition(), (def) => {
          resetGuestTypesForTesting();
          registerGuestType(def);
          const expected = (def.effects ?? []).flatMap(e => getActionKind(e.action.kind).icons(e.action, e.trigger));

          const icons = getGuestDetails(def.id, def.properties).icons;

          expect(icons.slice(0, expected.length)).toEqual(expected);
          // Everything after the effect icons is peace, trouble and star
          expect(icons.slice(expected.length).every(i => ['☮️', '❌', '⭐'].includes(i.symbol))).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
