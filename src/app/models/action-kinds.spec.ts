import * as fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ActionKind, effectIcons, findActionKind, getActionKind, registerActionKind, resetActionKindsForTesting,
  runEffect
} from './action-kinds';
import { BUILT_IN_TABLES_SNAPSHOT } from './built-in-tables.snapshot';
import { EffectDefinition, Trigger, TRIGGERS } from './effect-definition';
import { admitGuest } from './guest-effects';
import { getGuestDetails, Guest, GuestProperties } from './guest.model';
import { DEFAULT_GAME_SETUP } from './game-setup';
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

  describe('cycleSelf', () => {
    const moon = { symbol: '🌙', label: 'Switches between 0 and 1 trouble on entrance' };
    const cycle = (values: number[]) =>
      entrance({ kind: 'cycleSelf', property: 'troubleValue', values, icons: [moon] });
    const withTrouble = (troubleValue: number) => testGuest('OLD_FRIEND', 'Remus', { troubleValue });

    it('should step to the next value, wrapping around', () => {
      for (const [from, to] of [[0, 1], [1, 2], [2, 0]]) {
        const guest = withTrouble(from);
        const ctx = new TestEffectContext({ party: [guest] });
        run(ctx, guest, cycle([0, 1, 2]));
        expect(ctx.party[0].properties.troubleValue).toBe(to);
      }
    });

    it('should go to the first value when the current one is not listed', () => {
      const guest = withTrouble(5);
      const ctx = new TestEffectContext({ party: [guest] });
      run(ctx, guest, cycle([0, 1]));
      expect(ctx.party[0].properties.troubleValue).toBe(0);
    });

    it('should start from the guest as they are in the party when the effect runs', () => {
      const guest = withTrouble(0);
      const ctx = new TestEffectContext({ party: [withTrouble(1)] });
      // Same id as the party guest, but with the trouble it had when enqueued
      run(ctx, { ...guest, id: ctx.party[0].id }, cycle([0, 1]));
      expect(ctx.party[0].properties.troubleValue).toBe(0);
    });

    it('should do nothing when the guest has left the party', () => {
      const party = [testGuest('OLD_FRIEND', 'Colin')];
      const ctx = new TestEffectContext({ party });
      run(ctx, withTrouble(0), cycle([0, 1]));
      expect(ctx.party).toEqual(party);
    });

    it('should show the icons it is given', () => {
      expect(effectIcons([cycle([0, 1])])).toEqual([moon]);
    });

    it('should report every problem with its parameters', () => {
      expect(getActionKind('cycleSelf').validate(
        { kind: 'cycleSelf', property: 'charmValue', values: [1], icons: [], extra: 1 }, 'a', noNested
      )).toEqual([
        `a.property: expected one of ${PROPERTY_KEYS.join(', ')}`,
        'a.values: expected a list of at least 2 integers',
        'a.icons: expected a non-empty list of { symbol, label }',
        'a.extra: unknown parameter'
      ]);
      for (const values of [undefined, 'x', [0, 0.5], [0, '1']]) {
        expect(getActionKind('cycleSelf').validate(
          { kind: 'cycleSelf', property: 'troubleValue', values, icons: [moon] }, 'a', noNested
        )).toEqual(['a.values: expected a list of at least 2 integers']);
      }
    });

    it('should step through its values in order and come back round', () => {
      // Feature: werewolf-guest, Property 1: cycleSelf Steps Through Its Values
      fc.assert(
        fc.property(
          fc.constantFrom(...PROPERTY_KEYS),
          fc.uniqueArray(fc.integer({ min: -9, max: 9 }), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: -9, max: 9 }),
          (property, values, start) => {
            const guest = testGuest('OLD_FRIEND', 'Remus', { [property]: start });
            const ctx = new TestEffectContext({ party: [guest] });
            const effect = entrance({ kind: 'cycleSelf', property, values, icons: [moon] });

            run(ctx, guest, effect);
            const index = values.indexOf(start);
            expect(ctx.party[0].properties[property]).toBe(values[(index + 1) % values.length]);

            // Now on a listed value, values.length more steps come back to it
            const listed = ctx.party[0].properties[property];
            for (let i = 0; i < values.length; i++) run(ctx, guest, effect);
            expect(ctx.party[0].properties[property]).toBe(listed);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('scoreBonus', () => {
    const icon = { symbol: '🍸', label: 'Test bonus' };
    const bonus = (params: Record<string, unknown>): EffectDefinition =>
      ({ trigger: 'score', action: { kind: 'scoreBonus', resource: 'popularity', amount: 1, icons: [icon], ...params } });
    // Runs the bonus of the first guest in `party` and returns the popularity and money added
    const score = (party: Guest[], params: Record<string, unknown>, houseCapacity = 5) => {
      const ctx = new TestEffectContext({ party, houseCapacity });
      run(ctx, party[0], bonus(params));
      return { popularity: ctx.popularity, money: ctx.money };
    };
    const friends = (n: number) => Array.from({ length: n }, (_, i) => testGuest('OLD_FRIEND', `Friend ${i}`));

    it('should add a flat bonus once without per', () => {
      expect(score(friends(1), { amount: 3 })).toEqual({ popularity: 3, money: 0 });
      expect(score(friends(1), { resource: 'money', amount: -2 })).toEqual({ popularity: 0, money: -2 });
    });

    it('should count empty spaces in the house', () => {
      expect(score(friends(2), { per: 'emptySpace' }, 5)).toEqual({ popularity: 3, money: 0 });
      expect(score(friends(5), { per: 'emptySpace' }, 5)).toEqual({ popularity: 0, money: 0 });
    });

    it('should count trouble in the party, before peace', () => {
      const party = [testGuest('OLD_FRIEND', 'Sam'), testGuest('WILD_BUDDY', 'Anthony'), testGuest('ROCK_STAR', 'Gord'), testGuest('HIPPY', 'Bob')];
      expect(score(party, { resource: 'money', amount: 2, per: 'trouble' })).toEqual({ popularity: 0, money: 4 });
    });

    it('should count party guests of the given type', () => {
      const party = [testGuest('RICH_PAL', 'Sparty'), ...friends(3), testGuest('WILD_BUDDY', 'Teresa')];
      expect(score(party, { per: 'guestOfType', guestType: 'OLD_FRIEND' })).toEqual({ popularity: 3, money: 0 });
      expect(score(party, { per: 'guestOfType', guestType: 'NOT_REGISTERED' })).toEqual({ popularity: 0, money: 0 });
    });

    it('should add nothing unless the house is full when asked', () => {
      expect(score(friends(4), { amount: 5, when: 'houseFull' }, 5)).toEqual({ popularity: 0, money: 0 });
      expect(score(friends(5), { amount: 5, when: 'houseFull' }, 5)).toEqual({ popularity: 5, money: 0 });
    });

    it('should show the icons it is given', () => {
      expect(effectIcons([bonus({})])).toEqual([icon]);
    });

    it('should report every problem with its parameters', () => {
      const validate = (p: Record<string, unknown>) => getActionKind('scoreBonus').validate({ kind: 'scoreBonus', ...p }, 'a', noNested);
      expect(validate({ resource: 'charm', amount: 0, per: 'guest', when: 'never', icons: [], extra: 1 })).toEqual([
        'a.resource: expected "popularity" or "money"',
        'a.amount: expected a non-zero integer',
        'a.per: expected one of emptySpace, trouble, guestOfType',
        'a.when: expected "houseFull"',
        'a.icons: expected a non-empty list of { symbol, label }',
        'a.extra: unknown parameter'
      ]);
      const valid = { resource: 'money', amount: 1, icons: [icon] };
      expect(validate(valid)).toEqual([]);
      expect(validate({ ...valid, amount: 1.5 })).toEqual(['a.amount: expected a non-zero integer']);
      expect(validate({ ...valid, per: 'guestOfType' })).toEqual(['a.guestType: expected a non-empty string']);
      expect(validate({ ...valid, per: 'guestOfType', guestType: '' })).toEqual(['a.guestType: expected a non-empty string']);
      expect(validate({ ...valid, per: 'trouble', guestType: 'OLD_FRIEND' }))
        .toEqual(['a.guestType: only allowed when per is "guestOfType"']);
    });

    it('should add amount × count of its resource, or nothing when its condition fails', () => {
      // Feature: scoring-bonuses, Property 1: Bonus Formula
      fc.assert(
        fc.property(
          fc.array(fc.record({
            type: fc.constantFrom('OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL', 'MONKEY'),
            troubleValue: fc.integer({ min: 0, max: 3 })
          }), { minLength: 1, maxLength: 8 }),
          fc.integer({ min: 0, max: 4 }),
          fc.constantFrom<'popularity' | 'money'>('popularity', 'money'),
          fc.integer({ min: -5, max: 5 }).filter(n => n !== 0),
          fc.constantFrom(undefined, 'emptySpace', 'trouble', 'guestOfType'),
          fc.boolean(),
          (guests, extraSpace, resource, amount, per, houseFull) => {
            const party = guests.map(({ type, troubleValue }, i) => testGuest(type, `Guest ${i}`, { troubleValue }));
            const capacity = party.length + extraSpace;
            const params = {
              resource, amount,
              ...(per && { per }),
              ...(per === 'guestOfType' && { guestType: 'OLD_FRIEND' }),
              ...(houseFull && { when: 'houseFull' })
            };

            const count =
              per === 'emptySpace' ? extraSpace :
              per === 'trouble' ? party.reduce((sum, g) => sum + g.properties.troubleValue, 0) :
              per === 'guestOfType' ? party.filter(g => g.type === 'OLD_FRIEND').length :
              1;
            // + 0 turns -0 (a negative amount times 0) into 0
            const expected = houseFull && extraSpace > 0 ? 0 : amount * count + 0;

            const ctx = new TestEffectContext({ party, houseCapacity: capacity });
            run(ctx, party[0], bonus(params));

            expect(resource === 'popularity' ? ctx.popularity : ctx.money).toBe(expected);
            expect(resource === 'popularity' ? ctx.money : ctx.popularity).toBe(0);
            expect(ctx.party).toEqual(party);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Given icons', () => {
    const cycle = (icons: unknown) => ({ kind: 'cycleSelf', property: 'troubleValue', values: [0, 1], icons });

    it('should accept a color and bold', () => {
      expect(getActionKind('cycleSelf').validate(cycle([{ symbol: 'X', label: 'X', color: '#f9a825', bold: true }]), 'a', noNested))
        .toEqual([]);
    });

    it('should reject a color that is not a string and a bold that is not a boolean', () => {
      expect(getActionKind('cycleSelf').validate(
        cycle([{ symbol: 'O', label: 'O' }, { symbol: 'X', label: 'X', color: 3, bold: 'yes' }]), 'a', noNested
      )).toEqual(['a.icons[1].color: expected a string', 'a.icons[1].bold: expected a boolean']);
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
      action: { kind: 'adjustSelf', property: 'popularityValue', delta: 2 },
      icons: [{ symbol: '🎁', label: 'Gives a party guest 2 popularity on entrance' }]
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

    it('should show the icons it is given', () => {
      expect(effectIcons([boost])).toEqual([{ symbol: '🎁', label: 'Gives a party guest 2 popularity on entrance' }]);
    });

    it('should validate its own parameters and its nested action', () => {
      const validateAction = vi.fn(() => ['a.action.delta: nested problem']);
      expect(getActionKind('chooseGuest').validate(
        { kind: 'chooseGuest', prompt: '', from: 'deck', action: { kind: 'adjustSelf' }, icons: [], extra: 1 }, 'a', validateAction
      )).toEqual([
        'a.prompt: expected a non-empty string',
        'a.from: expected "party"',
        'a.action.delta: nested problem',
        'a.icons: expected a non-empty list of { symbol, label }',
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
        effects: [entrance({ kind: 'chooseGuest', prompt: 'Pick', from: 'party', action, icons: [{ symbol: '?', label: 'Icon' }] } as EffectDefinition['action'])]
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
      triggers: ['entrance'],
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
      expect(['autoInvite', 'adjustSelf', 'cycleSelf', 'scoreBonus', 'custom', 'chooseGuest'].every(k => findActionKind(k))).toBe(true);
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
        .toThrow('effects[0].trigger: expected one of entrance, score');
      expect(() => registerGuestType(def([entrance({ kind: 'NOPE' })])))
        .toThrow('effects[0].action.kind: unknown action kind "NOPE"');
    });

    it('should accept a kind once it is registered', () => {
      expect(() => registerGuestType(def([entrance({ kind: 'TEST_KIND' })]))).toThrow('unknown action kind');
      registerActionKind({ kind: 'TEST_KIND', dataOnly: true, triggers: ['entrance'], validate: () => [], run: () => {}, icons: () => [] });
      expect(() => registerGuestType(def([entrance({ kind: 'TEST_KIND' })]))).not.toThrow();
    });

    describe('Triggers', () => {
      const bonusAction = { kind: 'scoreBonus', resource: 'popularity', amount: 1, icons: [{ symbol: '?', label: 'Icon' }] };
      const pick = (action: unknown) =>
        ({ kind: 'chooseGuest', prompt: 'Pick', from: 'party', action, icons: [{ symbol: '?', label: 'Icon' }] });

      it('should reject a kind used with a trigger it does not allow', () => {
        expect(() => registerGuestType(def([entrance(bonusAction)])))
          .toThrow('effects[0].action.kind: "scoreBonus" can\'t be used with trigger "entrance"');
        expect(() => registerGuestType(def([{ trigger: 'score', action: { kind: 'autoInvite', count: 1 } }])))
          .toThrow('effects[0].action.kind: "autoInvite" can\'t be used with trigger "score"');
      });

      it('should check nested actions against the effect\'s trigger', () => {
        expect(() => registerGuestType(def([entrance(pick(bonusAction))])))
          .toThrow('effects[0].action.action.kind: "scoreBonus" can\'t be used with trigger "entrance"');
      });

      it('should accept existing kinds on entrance and scoreBonus on score', () => {
        expect(() => registerGuestType(def([
          entrance({ kind: 'autoInvite', count: 1 }),
          entrance(pick({ kind: 'adjustSelf', property: 'popularityValue', delta: 1 })),
          { trigger: 'score', action: bonusAction }
        ]))).not.toThrow();
      });

      it('should use a registered kind\'s triggers', () => {
        registerActionKind({ kind: 'TEST_SCORE', dataOnly: true, triggers: ['score'], validate: () => [], run: () => {}, icons: () => [] });
        expect(() => registerGuestType(def([{ trigger: 'score', action: { kind: 'TEST_SCORE' } }]))).not.toThrow();
        resetGuestTypesForTesting();
        expect(() => registerGuestType(def([entrance({ kind: 'TEST_SCORE' })])))
          .toThrow('"TEST_SCORE" can\'t be used with trigger "entrance"');
      });

      it('should refuse to register a kind without triggers', () => {
        const base = { dataOnly: true, validate: () => [], run: () => {}, icons: () => [] };
        // Built without type checking, as from plain JavaScript
        for (const triggers of [undefined, [], 'entrance']) {
          expect(() => registerActionKind({ ...base, kind: 'TEST_NO_TRIGGERS', triggers } as unknown as ActionKind))
            .toThrow('Action kind "TEST_NO_TRIGGERS" must list at least one trigger');
        }
        expect(findActionKind('TEST_NO_TRIGGERS')).toBeUndefined();
      });

      it('should list at least one trigger for every built-in kind', () => {
        for (const name of ['autoInvite', 'adjustSelf', 'cycleSelf', 'scoreBonus', 'custom', 'chooseGuest']) {
          expect(getActionKind(name).triggers).toEqual(name === 'scoreBonus' ? ['score'] : ['entrance']);
        }
      });

      it('should allow an effect exactly when its kind allows its trigger, nested or not', () => {
        // Feature: scoring-bonuses, Property 4: Trigger Check
        registerActionKind({ kind: 'TEST_BOTH', dataOnly: true, triggers: ['entrance', 'score'], validate: () => [], run: () => {}, icons: () => [] });
        const actions: Record<string, unknown> = {
          autoInvite: { kind: 'autoInvite', count: 1 },
          adjustSelf: { kind: 'adjustSelf', property: 'popularityValue', delta: 1 },
          scoreBonus: bonusAction,
          TEST_BOTH: { kind: 'TEST_BOTH' }
        };
        fc.assert(
          fc.property(
            fc.constantFrom(...Object.keys(actions)),
            fc.constantFrom<Trigger>(...TRIGGERS),
            fc.boolean(),
            (kind, trigger, nested) => {
              resetGuestTypesForTesting();
              const allowed = getActionKind(kind).triggers.includes(trigger)
                // chooseGuest itself only allows entrance
                && (!nested || trigger === 'entrance');
              const effect = { trigger, action: nested ? pick(actions[kind]) : actions[kind] };
              const register = () => registerGuestType(def([effect]));
              if (allowed) expect(register).not.toThrow();
              else expect(register).toThrow('can\'t be used with trigger');
            }
          ),
          { numRuns: 100 }
        );
      });
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

  describe('Werewolf', () => {
    it('should be defined as the werewolf-guest spec says', () => {
      // werewolf-guest Requirements 2.1–2.4
      const def = getGuestType('WEREWOLF');
      expect(def).toMatchObject({
        label: 'Werewolf',
        cost: 5,
        properties: { popularityValue: 4, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 }
      });
      expect(def.effects).toEqual([entrance({
        kind: 'cycleSelf',
        property: 'troubleValue',
        values: [0, 1],
        icons: [{ symbol: '🌙', label: 'Switches between 0 and 1 trouble on entrance' }]
      })]);
      expect(DEFAULT_GAME_SETUP.shop.find(e => e.type === 'WEREWOLF')?.names).toEqual(['Remus', 'Lawrence', 'Scott', 'Jacob']);
      expect(DEFAULT_GAME_SETUP.startingDeck.some(g => g.type === 'WEREWOLF')).toBe(false);
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
