# Design Document: Scoring Bonuses

## Overview

Add a `score` trigger and a `scoreBonus` action kind. When a party is scored, settle its normal amounts as today, then run each guest's `score` effects against a context holding the settled totals, and settle again. Add the five bonus guest types, and let icons have a color and bold weight.

### Key Design Decisions

1. **A trigger and an action kind, not a separate bonus field**: Bonuses use the same effect definitions as entrance effects, so they get validation, JSON support and card icons for free. The next trigger planned (`activated`, in activated-abilities) fits the same way.

2. **Kinds list their triggers**: Score effects run once at scoring, outside the effect queue, with no bust checks and no choices. An `autoInvite` or `chooseGuest` there would make no sense, and a `scoreBonus` on entrance would add popularity mid-party. So each `ActionKind` gets `triggers`, and validation rejects an effect whose kind doesn't allow its trigger. The check covers nested actions too, so `chooseGuest` can't wrap a `scoreBonus`. Kinds that don't set `triggers` default to `['entrance']`, which matches every kind today, including kinds registered by tests.

3. **One kind with a count and a condition**: All five bonuses are "amount × count, maybe only when something holds". `per` picks the count (`emptySpace`, `trouble`, `guestOfType`) and `when` the condition (`houseFull`). With neither, the bonus is flat. New counts and conditions can be added to the kind without new kinds.

4. **Score effects run directly, outside the queue**: `runQueue` exists to order chains of effects and check for busts between them. Scoring has neither: every bonus is worked out from the same finished party, and nothing can bust. The store calls `runEffect` for each one against a scoring context, so the existing `ActionKind.run` signature is reused.

5. **Normal scoring settles first, then bonuses settle**: The existing floor-and-penalty step becomes a helper, `settle(popularity, money)`, and runs twice: once on the totals plus the party's normal amounts, as today, and once after the bonuses. So bonus money can't offset a shortfall from normal scoring. Bonuses are summed before the second settle, so their order within scoring doesn't matter.

6. **The view gains house capacity**: Empty spaces and "house full" need the capacity, which effects can't see today. `GameStateView` gets `getHouseCapacity()`, which entrance effects and choice options can use too. Effects can't change it; there's no setter.

7. **Icons get optional `color` and `bold`**: The Mascot's bold "O" and the Writer's yellow X are text, not emoji. Two optional fields cover them and keep `GuestIcon` simple. A `color` on an emoji has no visible effect, which is harmless.

## Architecture

### Modified Files

```
models/effect-definition.ts
└── Trigger: + 'score'; TRIGGERS, TRIGGER_PHRASES: + score: 'when scored'

models/effect-context.ts
└── GameStateView: + getHouseCapacity()

models/guest-icons.ts
└── GuestIcon: + color?, bold?

models/action-kinds.ts
├── ActionKind: + triggers?: readonly Trigger[] (default ['entrance'])
├── isIcon: accept optional color (string) and bold (boolean)
├── + scoreBonus kind
└── + allowedTriggers(kind) helper

models/guest-type.ts
└── effectProblems / actionProblems: reject a kind that doesn't allow the effect's trigger, nested actions included

models/built-in-guest-types.ts
└── + COMEDIAN, MASCOT, INTROVERT, BARTENDER, WRITER

models/game-setup.ts
└── DEFAULT_GAME_SETUP.shop: + the five types and their names

stores/game.store.ts
├── EffectContextImpl: + houseCapacity (read-only)
├── view: + getHouseCapacity
└── advancePhase: run score effects between the normal amounts and the floor/penalty

components/guest-details.component.html, .scss
└── icon span: [style.color], [class.bold]
```

### scoreBonus (models/action-kinds.ts)

```typescript
type ScoreBonusParams = {
  resource: 'popularity' | 'money';
  amount: number;
  per?: 'emptySpace' | 'trouble' | 'guestOfType';
  guestType?: string;
  when?: 'houseFull';
  icons: readonly GuestIcon[];
};

// Adds `amount` of `resource` for each counted thing in the house (once, without `per`),
// or nothing when `when` doesn't hold. Runs at scoring, on the finished party.
const scoreBonusKind: ActionKind<ScoreBonusParams> = {
  kind: 'scoreBonus',
  dataOnly: true,
  triggers: ['score'],
  validate: (p, path) => [ /* each parameter, guestType only with guestOfType, unknownParams */ ],
  run: (ctx, _guest, { resource, amount, per, guestType, when }) => {
    const party = ctx.getParty();
    const capacity = ctx.getHouseCapacity();
    if (when === 'houseFull' && party.length < capacity) return;

    const count =
      per === 'emptySpace' ? Math.max(0, capacity - party.length) :
      per === 'trouble' ? party.reduce((sum, g) => sum + g.properties.troubleValue, 0) :
      per === 'guestOfType' ? party.filter(g => g.type === guestType).length :
      1;

    if (resource === 'popularity') ctx.setPopularity(ctx.getPopularity() + amount * count);
    else ctx.setMoney(ctx.getMoney() + amount * count);
  },
  icons: (p) => p.icons
};
```

A `guestType` that isn't registered isn't an error; it counts 0. JSON types can be registered in any order, so validation can't depend on which types exist yet.

### Trigger check (models/guest-type.ts)

`effectProblems` passes each effect's trigger down to `actionProblems`, which adds a problem when `allowedTriggers(kind)` doesn't include it:

```
effects[0].action.kind: "scoreBonus" can't be used with trigger "entrance"
```

The `validateAction` callback passed to a kind's `validate` carries the same trigger, so nested actions are checked against the enclosing effect's trigger.

### Scoring (stores/game.store.ts)

Today `advancePhase` adds the party's popularity and money, floors both at 0 and applies the money penalty. After this change:

```typescript
// Floors popularity and money at 0; each point of money below 0 costs 7 popularity
const settle = (popularity: number, money: number) => {
  const moneyDeficit = Math.max(0, -money);
  return {
    popularity: Math.max(0, Math.max(0, popularity) - moneyDeficit * MONEY_DEFICIT_PENALTY_RATE),
    money: Math.max(0, money)
  };
};

// Normal scoring, exactly as today
const scored = settle(
  store.popularity() + calculatePopularityChange(),
  store.money() + calculateMoneyChange()
);

// Then every guest's bonuses, on the settled totals, settled again
const ctx = new EffectContextImpl(
  store.deck(), store.party(), store.discard(),
  scored.popularity, scored.money, store.houseCapacity()
);
for (const guest of store.party()) {
  for (const effect of getGuestType(guest.type).effects ?? []) {
    if (effect.trigger === 'score') runEffect(ctx, guest, effect);
  }
}
patchState(store, settle(ctx.getPopularity(), ctx.getMoney()));
```

`settle` is the existing floor-and-penalty code, extracted unchanged. With no bonuses the second settle changes nothing, because its inputs are already settled (requirement 3.5). Bonus guests' amounts are positive today, so the second settle only matters for JSON types with negative bonuses. `scoreBonus` only reads the party and writes popularity and money, so every bonus sees the same party (requirement 3.2). Anything a score effect enqueues is dropped; validation keeps queueing kinds out of `score`.

The win check stays first, so a winning party runs no score effects. A bust never reaches `advancePhase`'s scoring.

### Guest types (models/built-in-guest-types.ts)

```typescript
{
  id: 'COMEDIAN',
  label: 'Comedian',
  cost: 5,
  properties: { popularityValue: 0, troubleValue: 0, moneyValue: -1, peaceValue: 0, starValue: 0 },
  effects: [{
    trigger: 'score',
    action: {
      kind: 'scoreBonus', resource: 'popularity', amount: 5, when: 'houseFull',
      icons: [{ symbol: '🏘️', label: '5 popularity when scored if the house is full' }]
    }
  }]
},
// MASCOT:    popularity 1, amount 1, per 'guestOfType', guestType 'OLD_FRIEND', { symbol: 'O', bold: true }
// INTROVERT: popularity 1, amount 1, per 'emptySpace', 🛖
// BARTENDER: popularity 1, resource 'money', amount 2, per 'trouble', 🍸
// WRITER:    popularity 1, amount 2, per 'trouble', { symbol: 'X', color: '#f9a825', bold: true }
```

They go after the Werewolf, in the order above, in both `BUILT_IN_GUEST_TYPES` and the shop. The shop sorts by cost, so the list order only matters for ties. "Jerry" is also a Hippy's name; guests are identified by id, so that's fine.

The deprecated tables in `guest.model.ts` and `built-in-tables.snapshot.ts` need no change. `GUEST_TYPE_ENTRANCE_EFFECTS` and `GUEST_TYPE_ENTRANCE_ICONS` already filter to entrance effects.

### Card icons (components/guest-details)

```html
<span role="img" [attr.aria-label]="icon.label" [title]="icon.label"
      [style.color]="icon.color ?? null" [class.bold]="icon.bold">{{ icon.symbol }}</span>
```

`.guest-icons .bold { font-weight: 700; }`. `getGuestDetails` already puts effect icons before peace, trouble and stars.

## Correctness Properties

### Property 1: Bonus Formula

For any party, house capacity, and valid `scoreBonus` parameters, running the kind changes `resource` by `amount × count` (or 0 when `when: 'houseFull'` and the house isn't full), where count is as defined in requirement 2.2, and changes nothing else.

**Validates: Requirements 2.2, 2.3**

### Property 2: Scoring Is Normal Amounts Plus Bonuses

For any party that ends normally without a win, the player's popularity and money afterward equal `settle(settle(totals + normal amounts) + bonuses)`, where `settle` is the existing floor-and-penalty formula and `bonuses` is the sum of every guest's bonus worked out on the finished party.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: No Bonuses Without Scoring

For any party with bonus guests that busts or ends with a win, popularity and money are the same as if those guests had no `score` effects.

**Validates: Requirement 3.4**

### Property 4: Trigger Check

For any action kind and trigger, a guest type with an effect of that kind and trigger is valid only if the kind allows the trigger. The same holds with the action nested inside `chooseGuest`.

**Validates: Requirements 1.2, 1.3**

### Property 5: Guest Conservation

The existing conservation property holds with the larger shop: 10 starting guests + 108 shop guests = 118 guests across the deck, party, discard, bust party and shop through every operation.

**Validates: Requirement 4.3**

## Testing Strategy

- `action-kinds.spec.ts`: `scoreBonus` validation problems with paths; each count; `houseFull` met and not met; flat bonus; money vs popularity; an unregistered `guestType` counts 0; icons
- `guest-type.spec` / `guest-type-registry.spec.ts`: the trigger check, top level and nested; existing kinds still accepted on entrance
- `guest-type-json.spec.ts`: a bonus type from JSON; icons with `color` and `bold`; bad `color` / `bold` rejected; `arbDataOnlyEffect` gains `scoreBonus` effects with `trigger: 'score'` (not `arbDataOnlyAction`, whose actions can also be nested in `chooseGuest`)
- `game.store.spec.ts`: each new guest type's bonus in a real party; with 0 money, a Comedian's -1 money costs 7 popularity even when a Bartender's bonus pays out; bonuses not applied on bust or win; capacity raised by an expansion changes the Introvert's and Comedian's bonuses
- Guest card tests: each new type's icon in the shop and house; the Mascot's "O" is bold; the Writer's "X" is bold and gold; existing icons have no inline color
- Property tests 1–5
- Counts that include every shop guest (98 → 118 conservation, shop size and type lists) go up by 20
