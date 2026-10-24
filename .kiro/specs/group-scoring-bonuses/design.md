# Design Document: Group Scoring Bonuses

## Overview

Add a `groupScore` trigger. A type's `groupScore` effects run once per scoring pass, as the effects of its first guest in the party, in a third scoring step after guests' own bonuses. Give `scoreBonus` an `amounts` table as an alternative to `amount`, then add the Dancer. Move bonus scoring into helpers that take the guests being scored, so early scoring can reuse them later.

This builds on scoring-bonuses (PR #20).

### Key Design Decisions

1. **A trigger, not a flag on the effect**: A trigger says when an effect runs, and "once per group when scored" is a when. It reuses the per-kind trigger check from scoring-bonuses: `scoreBonus` lists `['score', 'groupScore']`, and every other kind is kept out. It also needs no new field on `EffectDefinition`, so JSON parsing and validation stay as they are.

2. **The first guest of the type runs it**: A group effect still needs a "guest whose effect it is", because `ActionKind.run` takes one. The first guest of the type in party order is a stable choice. `scoreBonus` doesn't look at that guest, since it counts from the party, so which group member runs the effect doesn't change the result.

3. **`amounts` beside `amount`, not a formula**: 1, 4, 9, 16 is n², but a lookup table covers any curve, such as diminishing returns or a cap, without a new kind or a mini expression language. It reads clearly in data: `amounts: [1, 4, 9, 16]`. Counts past the end use the last entry, so a table never runs out. A count of 0 gives 0, the same as `amount × 0`.

4. **Count Dancers with the existing `per: 'guestOfType'`**: `guestType: 'DANCER'` already counts the group. A `per: 'ownType'` would save naming the type, but nothing needs it yet.

5. **Group bonuses are a third settled step**: Scoring becomes normal amounts → settle → guests' own bonuses → settle → group bonuses → settle. Each step settles before the next, so group bonus money can't cover a shortfall from an earlier step, which matches how own bonuses relate to normal scoring. With no group bonuses, the third settle changes nothing, because its inputs are already settled.

6. **Scoring helpers for later early scoring**: Today bonuses are run inline in `advancePhase`. This moves them into two helpers that take the guests being scored: `scoreOwnBonuses(ctx, guests)` runs each guest's `score` effects, and `scoreGroupBonuses(ctx, guests)` runs each type's `groupScore` effects once. `advancePhase` calls them with the whole party. Early scoring will call them with one guest, and get "that guest's bonus, then its type's group bonus" without further changes. Early scoring itself isn't in this spec; its turn rules belong to that feature.

## Architecture

### Modified Files

```
models/effect-definition.ts
└── Trigger: + 'groupScore'; TRIGGERS, TRIGGER_PHRASES: + groupScore: 'once per group when scored'

models/action-kinds.ts
└── scoreBonus: triggers ['score', 'groupScore']; + amounts (exclusive with amount)

models/built-in-guest-types.ts
└── + DANCER

models/game-setup.ts
└── DEFAULT_GAME_SETUP.shop: + DANCER: Fred, Carlton, Elaine, Jennifer

stores/game.store.ts
├── + scoreOwnBonuses(ctx, guests), scoreGroupBonuses(ctx, guests)
└── advancePhase: own bonuses → settle → group bonuses → settle
```

No UI changes: the 💃 icon comes from the effect, like other effect icons.

### amounts (models/action-kinds.ts)

```typescript
type ScoreBonusParams = {
  resource: 'popularity' | 'money';
  amount?: number;
  amounts?: readonly number[];
  // per, guestType, when, icons as before
};

// Validation: exactly one of amount / amounts
//   a.amount: give exactly one of amount and amounts
//   a.amounts: expected a non-empty list of integers

// In run, after count is worked out:
const bonus = amounts
  ? (count <= 0 ? 0 : amounts[Math.min(count, amounts.length) - 1])
  : amount! * count;
```

### Scoring pass (stores/game.store.ts)

```typescript
// Runs every effect of `guest` with the given trigger
const runTriggered = (ctx: EffectContext, guest: Guest, trigger: Trigger): void => {
  for (const effect of getGuestType(guest.type).effects ?? []) {
    if (effect.trigger === trigger) runEffect(ctx, guest, effect);
  }
};

// Adds each guest's own scoring bonuses to ctx. Worked out from ctx's party.
const scoreOwnBonuses = (ctx: EffectContext, guests: readonly Guest[]): void => {
  for (const guest of guests) runTriggered(ctx, guest, 'score');
};

// Adds each type's group bonuses to ctx once, as its first guest's, in party order.
const scoreGroupBonuses = (ctx: EffectContext, guests: readonly Guest[]): void => {
  const firstOfEachType = guests.filter((g, i) => guests.findIndex(o => o.type === g.type) === i);
  for (const guest of firstOfEachType) runTriggered(ctx, guest, 'groupScore');
};
```

`advancePhase` after the win check:

```typescript
// Step 1: normal amounts, settled (as today)
const scored = settle(...);

// Step 2: guests' own bonuses, settled (as today, through the helper)
const ctx = new EffectContextImpl(..., scored.popularity, scored.money, store.houseCapacity());
scoreOwnBonuses(ctx, store.party());
const withOwn = settle(ctx.getPopularity(), ctx.getMoney());

// Step 3: group bonuses, settled
ctx.setPopularity(withOwn.popularity);
ctx.setMoney(withOwn.money);
scoreGroupBonuses(ctx, store.party());
patchState(store, settle(ctx.getPopularity(), ctx.getMoney()));
```

### Dancer (models/built-in-guest-types.ts)

```typescript
{
  id: 'DANCER',
  label: 'Dancer',
  cost: 7,
  properties: { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
  effects: [{
    trigger: 'groupScore',
    action: {
      kind: 'scoreBonus',
      resource: 'popularity',
      amounts: [1, 4, 9, 16],
      per: 'guestOfType',
      guestType: 'DANCER',
      icons: [{ symbol: '💃', label: '1, 4, 9 or 16 popularity for 1–4 Dancers, once per group, when scored' }]
    }
  }]
}
```

It goes after the Writer. In the shop it sorts at cost 7, between Cute Dog and Gambler.

## Correctness Properties

### Property 1: amounts Lookup

For any non-empty `amounts`, count and resource, `scoreBonus` with `amounts` adds `amounts[min(count, length) − 1]`, or 0 when count is 0. With a one-entry list and no `per`, that's the same as `amount` with that value.

**Validates: Requirements 2.2, 2.3, 2.6**

### Property 2: Three Settled Steps, One Group Bonus per Type

For any party, the totals after scoring equal `settle(settle(settle(totals + normal) + own) + group)`, where `own` is the sum of every guest's `score` bonuses and `group` is, for each distinct type in the party, its `groupScore` bonuses once.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Dancer Group Size

For any party with n ≥ 1 Dancers and no other bonus guests, the Dancers add exactly `[1, 4, 9, 16][min(n, 4) − 1]` popularity at scoring, wherever they are in the party.

**Validates: Requirements 4.2**

### Property 4: No Group Bonuses Without Scoring

For any party with Dancers that busts or wins, popularity and money are unchanged.

**Validates: Requirement 3.4**

### Property 5: Guest Conservation

10 starting guests + 112 shop guests = 122 guests across the deck, party, discard, bust party and shop through every operation.

**Validates: Requirement 4.4**

## Testing Strategy

- `action-kinds.spec.ts`: `amounts` lookup (count 0, within the list, past the end, without `per`, with `houseFull`); validation of `amount`/`amounts`; `groupScore` allowed for `scoreBonus` and rejected for other kinds; property 1
- `guest-type-json.spec.ts`: a group bonus type from JSON; `arbScoreBonusAction` sometimes uses `amounts`, and `arbDataOnlyEffect` sometimes uses `groupScore`
- `game.store.scoring.spec.ts`: a test group type pays once with several of its guests in the party; two group types each pay once; a group type and a per-guest type together; group bonus money doesn't cover a shortfall from own bonuses; nothing on bust or win; `groupScore` not run on entrance; properties 2 and 4
- Dancer store tests: 1–4 Dancers score 1, 4, 9, 16; Dancers mixed with other bonus guests; property 3
- Card tests: the Dancer's shop card shows 💃 and no values, at its place between Cute Dog and Gambler
- Counts that include every shop guest (118 → 122 conservation, 27 → 28 shop types, order lists) go up
