import { TestBed } from '@angular/core/testing';
import { getState, patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { resetActionKindsForTesting } from '../models/action-kinds';
import { ChoiceOption, ChoiceRequest, EffectContext, GameEffect } from '../models/effect-context';
import { EffectDefinition } from '../models/effect-definition';
import { DEFAULT_GAME_SETUP } from '../models/game-setup';
import { Guest, GUEST_TYPE_COSTS, GuestType } from '../models/guest.model';
import { resetGuestTypesForTesting } from '../models/guest-type-registry';
import { BAN_PROMPT, GameStore } from './game.store';
import { isChoosingBan, startBanSelection } from '../../testing/ban';
import { customEntrance, registerTestGuestType, testGuest } from '../../testing/guests';

const options = (...ids: string[]): ChoiceOption[] => ids.map(id => ({ id, label: `Option ${id}` }));

// A choice with fixed options whose onChoose records the answer
const choice = (prompt: string, ids: string[], chosen: string[], extra: Partial<ChoiceRequest> = {}): ChoiceRequest => ({
  prompt,
  options: () => options(...ids),
  onChoose: (_ctx, option) => { chosen.push(option.id); },
  ...extra
});

const chooseGuest = (action: EffectDefinition['action']): EffectDefinition => ({
  trigger: 'entrance',
  action: { kind: 'chooseGuest', prompt: 'Pick a guest', from: 'party', action, icons: [{ symbol: '?', label: 'Icon' }] }
});

/**
 * Effect choices: pausing resolution for the player, resuming it, and ban selection on the
 * same mechanism.
 *
 * **Validates: effect-choices Requirements 1, 2, 3, 5.2, 6**
 */
describe('GameStore - Effect Choices', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  afterEach(() => {
    store.resetGame();
    resetGuestTypesForTesting();
    resetActionKindsForTesting();
  });

  // A party in progress with room for everything, and `deck` to invite from
  const startParty = (deck: Guest[], party: Guest[] = []): void => {
    store.initializeGame();
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY, houseCapacity: 50, baseTroubleLimit: 50, deck, party
    });
  };

  // Registers a type whose entrance effect is `run`, and invites one guest of it
  const inviteWithEntrance = (run: (ctx: EffectContext, guest: Guest) => void, party: Guest[] = []): Guest => {
    const type = registerTestGuestType({ id: `TEST_ENTRANCE_${Math.random().toString(36).slice(2)}`, effects: customEntrance(run) });
    const guest = testGuest(type, 'Trigger');
    startParty([guest], party);
    store.inviteGuest();
    return guest;
  };

  describe('Requesting and resolving a choice', () => {
    it('should finish the requesting effect, then pause with the options', () => {
      const chosen: string[] = [];
      inviteWithEntrance((ctx) => {
        ctx.requestChoice(choice('Pick one', ['a', 'b'], chosen));
        ctx.setMoney(5);
      });

      expect(store.money()).toBe(5);
      expect(store.isAwaitingChoice()).toBe(true);
      expect(store.canInviteGuest()).toBe(false);
      expect(store.pendingChoice()).toEqual({
        prompt: 'Pick one', options: options('a', 'b'), confirmation: null, sourceGuestId: null
      });
      expect(chosen).toEqual([]);
    });

    it('should resolve at once when there is no confirmation', () => {
      const chosen: string[] = [];
      inviteWithEntrance((ctx) => ctx.requestChoice(choice('Pick one', ['a', 'b'], chosen)));

      store.selectChoiceOption('b');

      expect(chosen).toEqual(['b']);
      expect(store.choice()).toBeNull();
      expect(store.canInviteGuest()).toBe(false); // the deck is empty
    });

    it('should wait for confirmChoice when there is a confirmation message', () => {
      const chosen: string[] = [];
      inviteWithEntrance((ctx) => ctx.requestChoice(choice('Pick one', ['a', 'b'], chosen, {
        confirmMessage: (o) => `Really ${o.id}?`
      })));

      store.selectChoiceOption('a');
      expect(store.pendingChoice()?.confirmation).toBe('Really a?');
      expect(chosen).toEqual([]);

      // Picking again changes the selection
      store.selectChoiceOption('b');
      expect(store.pendingChoice()?.confirmation).toBe('Really b?');

      store.confirmChoice();
      expect(chosen).toEqual(['b']);
      expect(store.choice()).toBeNull();
    });

    it('should apply what onChoose does to the game', () => {
      const colin = testGuest('OLD_FRIEND', 'Colin');
      inviteWithEntrance((ctx) => ctx.requestChoice({
        prompt: 'Who gets a star?',
        options: (view) => view.getParty().map(g => ({ id: g.id, label: g.name, guest: g })),
        onChoose: (c, option) => {
          c.updateGuest(option.guest!, g => ({ ...g, properties: { ...g.properties, starValue: 1 } }));
        }
      }), [colin]);

      store.selectChoiceOption(colin.id);

      expect(store.party().find(g => g.id === colin.id)?.properties.starValue).toBe(1);
      expect(store.stars()).toBe(1);
    });

    it('should report the source guest of a chooseGuest choice', () => {
      const type = registerTestGuestType({
        id: 'TEST_CHOOSER',
        effects: [chooseGuest({ kind: 'adjustSelf', property: 'popularityValue', delta: 2 })]
      });
      const chooser = testGuest(type, 'Cora');
      const colin = testGuest('OLD_FRIEND', 'Colin');
      startParty([chooser], [colin]);

      store.inviteGuest();

      expect(store.pendingChoice()?.sourceGuestId).toBe(chooser.id);
      expect(store.pendingChoice()?.options.map(o => o.label)).toEqual(['Old Friend Colin', 'TEST_CHOOSER Cora']);
      store.selectChoiceOption(colin.id);
      expect(store.party().map(g => g.properties.popularityValue)).toEqual([3, 1]);
    });
  });

  describe('Property 1: Choices Keep Queue Order', () => {
    // A tree of effects: each logs its path, then in order enqueues child effects and
    // requests choices whose onChoose logs the answer and enqueues more children.
    type TreeNode = { steps: Step[] };
    type Step = { enqueue: TreeNode } | { choose: { optionCount: number; then: TreeNode[] } };

    const nodeArb = (depth: number): fc.Arbitrary<TreeNode> => depth === 0
      ? fc.constant({ steps: [] })
      : fc.record({ steps: fc.array(stepArb(depth - 1), { maxLength: 3 }) });
    const stepArb = (depth: number): fc.Arbitrary<Step> => fc.oneof(
      nodeArb(depth).map(enqueue => ({ enqueue })),
      fc.record({ optionCount: fc.integer({ min: 0, max: 3 }), then: fc.array(nodeArb(depth), { maxLength: 2 }) })
        .map(choose => ({ choose }))
    );

    const effectOf = (node: TreeNode, path: string, log: string[]): GameEffect => (ctx) => {
      log.push(path);
      node.steps.forEach((step, i) => {
        if ('enqueue' in step) {
          ctx.enqueue(effectOf(step.enqueue, `${path}.${i}`, log));
        } else {
          const { optionCount, then } = step.choose;
          ctx.requestChoice({
            prompt: `${path}.${i}`,
            options: () => options(...Array.from({ length: optionCount }, (_, k) => `o${k}`)),
            onChoose: (c, option) => {
              log.push(`${path}.${i}=${option.id}`);
              then.forEach((child, j) => c.enqueue(effectOf(child, `${path}.${i}.${j}`, log)));
            }
          });
        }
      });
    };

    // Runs the tree without pausing: each choice's onChoose runs inline, as an effect, when
    // the choice is reached. Answers are taken in order.
    const referenceOrder = (root: TreeNode, answers: number[]): string[] => {
      type Entry = { kind: 'effect'; run: GameEffect } | { kind: 'choice'; request: ChoiceRequest };
      const log: string[] = [];
      let next = 0;
      const stack: Entry[] = [{ kind: 'effect', run: effectOf(root, 'root', log) }];
      while (stack.length > 0) {
        const entry = stack.pop()!;
        const queued: Entry[] = [];
        const ctx = {
          enqueue: (run: GameEffect) => queued.push({ kind: 'effect', run }),
          requestChoice: (request: ChoiceRequest) => queued.push({ kind: 'choice', request })
        } as unknown as EffectContext;
        if (entry.kind === 'effect') {
          entry.run(ctx);
        } else {
          const opts = entry.request.options(ctx);
          if (opts.length === 0) continue;
          entry.request.onChoose(ctx, opts[answers[next++ % answers.length] % opts.length]);
        }
        stack.push(...queued.reverse());
      }
      return log;
    };

    it('should run effects in the same order as resolving every choice inline', () => {
      // Feature: effect-choices, Property 1: Choices Keep Queue Order
      let entrance: GameEffect = () => {};
      const type = registerTestGuestType({ id: 'TEST_TREE', effects: customEntrance((ctx) => entrance(ctx)) });

      fc.assert(
        fc.property(nodeArb(3), fc.array(fc.nat(), { minLength: 1, maxLength: 10 }), (root, answers) => {
          const log: string[] = [];
          entrance = effectOf(root, 'root', log);
          startParty([testGuest(type, 'Root')]);

          store.inviteGuest();
          let next = 0;
          while (store.isAwaitingChoice()) {
            const opts = store.pendingChoice()!.options;
            store.selectChoiceOption(opts[answers[next++ % answers.length] % opts.length].id);
          }

          expect(log).toEqual(referenceOrder(root, answers));
          expect(store.pendingEffects()).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Nothing Happens While Waiting', () => {
    it('should ignore inviting, advancing and buying while a choice is pending', () => {
      // Feature: effect-choices, Property 2: Nothing Happens While Waiting
      const type = registerTestGuestType({
        id: 'TEST_ASKER',
        effects: customEntrance((ctx) => ctx.requestChoice(choice('Pick one', ['a'], [])))
      });
      const purchasable = (Object.keys(GUEST_TYPE_COSTS) as GuestType[]).filter(t => GUEST_TYPE_COSTS[t] !== null);
      const operationArb = fc.oneof(
        fc.constantFrom('invite' as const, 'advancePhase' as const, 'purchaseExpansion' as const),
        fc.constantFrom(...purchasable).map(purchase => ({ purchase }))
      );

      fc.assert(
        fc.property(fc.boolean(), fc.array(operationArb, { minLength: 1, maxLength: 10 }), (ban, operations) => {
          if (ban) {
            store.initializeGame();
            startBanSelection(store, [testGuest('WILD_BUDDY', 'Matt')]);
          } else {
            startParty([testGuest(type, 'Asker'), testGuest('OLD_FRIEND', 'Colin')]);
            store.inviteGuest();
          }
          patchState(unprotected(store), { popularity: 100, money: 100 });
          const before = getState(store);
          expect(store.canInviteGuest()).toBe(false);

          for (const op of operations) {
            if (typeof op === 'object') {
              expect(store.purchaseGuest(op.purchase)).toMatchObject({ success: false, error: 'choice_pending' });
            } else if (op === 'purchaseExpansion') {
              expect(store.purchaseExpansion()).toMatchObject({ success: false, error: 'choice_pending' });
            } else if (op === 'invite') {
              store.inviteGuest();
            } else {
              store.advancePhase();
            }
          }

          expect(getState(store)).toEqual(before);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Options Reflect State When Reached', () => {
    it('should offer the party as it is when the choice is reached', () => {
      // Feature: effect-choices, Property 3: Options Reflect State When Reached
      let removeIndexes: number[] = [];
      let joining: Guest[] = [];
      const type = registerTestGuestType({
        id: 'TEST_LATE_CHOOSER',
        effects: customEntrance((ctx, guest) => {
          // Changes the party after the choice is requested but before it's reached
          ctx.enqueue((c) => c.setParty([...c.getParty().filter((_, i) => !removeIndexes.includes(i)), ...joining]));
          ctx.requestChoice({
            prompt: 'Pick a guest',
            sourceGuestId: guest.id,
            options: (view) => view.getParty().map(g => ({ id: g.id, label: g.name, guest: g })),
            onChoose: () => {}
          });
        })
      });

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          fc.uniqueArray(fc.nat({ max: 5 }), { maxLength: 6 }),
          fc.integer({ min: 0, max: 3 }),
          (partySize, removed, joiningCount) => {
            const party = Array.from({ length: partySize }, (_, i) => testGuest('OLD_FRIEND', `Guest ${i}`));
            removeIndexes = removed;
            joining = Array.from({ length: joiningCount }, (_, i) => testGuest('RICH_PAL', `Late ${i}`));
            startParty([testGuest(type, 'Chooser')], party);

            store.inviteGuest();

            const partyIds = store.party().map(g => g.id);
            if (partyIds.length === 0) {
              expect(store.choice()).toBeNull();
            } else {
              expect(store.pendingChoice()!.options.map(o => o.id)).toEqual(partyIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Empty Options Skip', () => {
    it('should carry on past a choice with no options without calling onChoose', () => {
      // Feature: effect-choices, Property 4: Empty Options Skip
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 4 }), (emptyChoices) => {
          const chosen: string[] = [];
          const ran: number[] = [];
          resetGuestTypesForTesting();
          inviteWithEntrance((ctx) => {
            for (let i = 0; i < emptyChoices; i++) {
              ctx.requestChoice(choice(`Empty ${i}`, [], chosen));
              ctx.enqueue(() => ran.push(i));
            }
          });

          expect(store.choice()).toBeNull();
          expect(chosen).toEqual([]);
          expect(ran).toEqual(Array.from({ length: emptyChoices }, (_, i) => i));
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Invalid Selections Are Ignored', () => {
    it('should ignore ids that are not options, and select or confirm with nothing pending', () => {
      // Feature: effect-choices, Property 5: Invalid Selections Are Ignored
      fc.assert(
        fc.property(fc.string(), fc.boolean(), (id, pending) => {
          resetGuestTypesForTesting();
          const chosen: string[] = [];
          if (pending) {
            inviteWithEntrance((ctx) => ctx.requestChoice(choice('Pick one', ['a', 'b'], chosen, {
              confirmMessage: () => 'Sure?'
            })));
          } else {
            startParty([]);
          }
          const before = getState(store);

          if (!['a', 'b'].includes(id) || !pending) store.selectChoiceOption(id);
          store.confirmChoice();

          expect(getState(store)).toEqual(before);
          expect(chosen).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Bust Clears Pending Effects', () => {
    it('should drop queued effects and choices when an effect busts the party', () => {
      // Feature: effect-choices, Property 6: Bust Clears Pending Effects
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 4 }), fc.boolean(), (queuedBehind, bustInOnChoose) => {
          resetGuestTypesForTesting();
          const chosen: string[] = [];
          const ran: number[] = [];
          const makeTrouble = (c: EffectContext) => c.setParty([
            ...c.getParty(),
            testGuest('WILD_BUDDY', 'Trouble', { troubleValue: 100 })
          ]);

          inviteWithEntrance((ctx) => {
            if (bustInOnChoose) {
              ctx.requestChoice({ ...choice('Bust?', ['yes'], chosen), onChoose: (c) => makeTrouble(c) });
            } else {
              ctx.enqueue(makeTrouble);
            }
            for (let i = 0; i < queuedBehind; i++) {
              ctx.requestChoice(choice(`Later ${i}`, ['a'], chosen));
              ctx.enqueue(() => ran.push(i));
            }
          });
          if (bustInOnChoose) store.selectChoiceOption('yes');

          expect(store.isPartyShutdown()).toBe(true);
          expect(store.pendingEffects()).toEqual([]);
          expect(store.choice()).toBeNull();
          expect(chosen).toEqual([]);
          expect(ran).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Ban Outcome Unchanged', () => {
    it('should ban the chosen guest and shuffle the rest into the deck', () => {
      // Feature: effect-choices, Property 7: Ban Outcome Unchanged
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 8 }).chain(size => fc.tuple(fc.constant(size), fc.nat({ max: size - 1 }))),
          fc.integer({ min: 2, max: 20 }),
          ([size, index], turn) => {
            store.initializeGame(25);
            patchState(unprotected(store), { currentTurn: turn, currentPhase: GamePhase.PARTY });
            const snapshot = Array.from({ length: size }, (_, i) => testGuest('WILD_BUDDY', `Guest ${i}`));
            const deckBefore = store.deck().map(g => g.id);

            startBanSelection(store, snapshot);
            expect(store.pendingChoice()).toMatchObject({ prompt: BAN_PROMPT });
            expect(store.pendingChoice()!.options.map(o => o.label)).toEqual(snapshot.map(g => `Ban ${g.name}`));
            store.selectChoiceOption(snapshot[index].id);
            expect(store.pendingChoice()!.confirmation).toBe(`Wild Buddy Guest ${index} will be banned from the next party.`);
            store.confirmChoice();

            expect(store.discard().map(g => g.id)).toEqual([snapshot[index].id]);
            expect(store.deck().map(g => g.id).sort()).toEqual(
              [...deckBefore, ...snapshot.filter((_, i) => i !== index).map(g => g.id)].sort()
            );
            expect(store.currentTurn()).toBe(turn + 1);
            expect(store.currentPhase()).toBe(GamePhase.BUY);
            expect(store.bustPartySnapshot()).toEqual([]);
            expect(store.choice()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should start the ban choice from a real trouble bust', () => {
      store.initializeGame(25);
      const matt = testGuest('WILD_BUDDY', 'Matt', { troubleValue: 3 });
      patchState(unprotected(store), { currentPhase: GamePhase.PARTY, deck: [matt] });

      store.inviteGuest();
      expect(store.isPartyShutdown()).toBe(true);
      expect(store.isAwaitingChoice()).toBe(false);

      store.acknowledgeShutdown();
      expect(isChoosingBan(store)).toBe(true);
      expect(store.pendingChoice()?.options.map(o => o.guest)).toEqual([matt]);
    });

    it('should skip ban selection and start the next turn when no one is left to ban', () => {
      store.initializeGame(25);
      patchState(unprotected(store), { currentTurn: 3, currentPhase: GamePhase.PARTY });
      const deckBefore = store.deck().map(g => g.id).sort();

      store.triggerPartyShutdown();
      store.acknowledgeShutdown();

      expect(store.choice()).toBeNull();
      expect(store.isPartyShutdown()).toBe(false);
      expect(store.currentTurn()).toBe(4);
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.deck().map(g => g.id).sort()).toEqual(deckBefore);
    });
  });

  describe('Property 8: Guest Conservation Holds', () => {
    it('should keep exactly the initial ids across operations that include choices', () => {
      // Feature: effect-choices, Property 8: Guest Conservation Holds
      const chooser = registerTestGuestType({
        id: 'TEST_CHOOSER',
        effects: [chooseGuest({ kind: 'adjustSelf', property: 'troubleValue', delta: 1 })]
      });
      const setup = {
        ...DEFAULT_GAME_SETUP,
        startingDeck: [...DEFAULT_GAME_SETUP.startingDeck, ...['Cora', 'Cal', 'Cy'].map(name => ({ type: chooser, name }))]
      };
      const allIds = (): string[] => [
        ...store.deck(), ...store.party(), ...store.discard(), ...store.bustPartySnapshot(),
        ...store.shopInventory().flatMap(e => e.guests)
      ].map(g => g.id).sort();

      const operationArb = fc.oneof(
        fc.constantFrom('invite' as const, 'advancePhase' as const, 'acknowledgeShutdown' as const, 'confirm' as const),
        fc.nat({ max: 9 }).map(choose => ({ choose }))
      );

      fc.assert(
        fc.property(fc.array(operationArb, { minLength: 1, maxLength: 60 }), (operations) => {
          store.initializeGame(25, setup);
          const initialIds = allIds();

          for (const op of operations) {
            if (typeof op === 'object') {
              const opts = store.pendingChoice()?.options ?? [];
              if (opts.length > 0) store.selectChoiceOption(opts[op.choose % opts.length].id);
            } else if (op === 'invite') {
              if (store.currentPhase() === GamePhase.PARTY) store.inviteGuest();
            } else if (op === 'advancePhase') {
              if (!store.isGameComplete() && !store.isPartyShutdown()) store.advancePhase();
            } else if (op === 'acknowledgeShutdown') {
              if (store.isPartyShutdown()) store.acknowledgeShutdown();
            } else {
              store.confirmChoice();
            }

            expect(allIds()).toEqual(initialIds);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
