# Design Document: Effect Descriptors

## Overview

Replace `entranceEffect` / `entranceIcons` on `GuestTypeDefinition` with a list of effect descriptors. Each descriptor names an action kind; the kind's code runs the effect and supplies its icons. Built-in kinds cover today's effects (`autoInvite`, `adjustSelf`), `custom` wraps a function, and `parseGuestTypeDefinition` turns JSON into a definition.

Step 3 of 5 in the guest extensibility plan. Depends on **guest-type-registry**.

### Key Design Decisions

1. **Trigger and action are separate**: `{ trigger, action }` lets the same action run at different times. "Invite a guest" works as an entrance effect today and as an activated ability in step 5, with no new kind. Icon labels take the trigger into account ("on entrance" vs. "when used").

2. **Action kinds are code; definitions are data**: Logic lives in a small number of action kinds. Guest types only choose and configure them. That's what makes JSON-defined types possible without evaluating code.

3. **`custom` is the escape hatch, not the norm**: A one-off effect can be written as `custom` without designing a reusable kind first. It's rejected by `parseGuestTypeDefinition`, and validation can't check what it does. When a second guest needs the same custom logic, promote it to a kind.

4. **`adjustSelf` reads the current guest**: Today the Climber handler applies its updater to the guest as admitted. If another effect changed that guest in between, the change would be lost. With ids (guest-identity), `adjustSelf` looks up the guest's current party version by id. Nothing can change a guest between admission and its entrance effect today, so behavior is unchanged; this prevents a future bug.

5. **One queue entry per entrance effect**: `admitGuest` enqueues each entrance effect separately, in definition order. For today's types (one entrance effect each) this is identical to now. A type with two entrance effects gets the natural behavior: guests the first one admits finish their own entrance effects before the second one starts, just as Celebrity's two invites already behave.

6. **Hand-written validation, no schema library**: Definitions are small, and good error messages with paths (`effects[1].action.count: expected an integer ≥ 1`) are easy to produce by hand. This avoids a new dependency. Revisit if the format grows.

## Architecture

### New and Modified Files

```
models/effect-definition.ts [new]
├── Trigger = 'entrance'
├── ActionDefinition = { kind: string; [param: string]: unknown }
├── EffectDefinition = { trigger: Trigger; action: ActionDefinition }
└── triggerPhrase(trigger): "on entrance"

models/action-kinds.ts [new]
├── ActionKind<P> { kind, dataOnly, validate(params, path), run(ctx, guest, params), icons(params, trigger) }
├── registerActionKind / getActionKind / findActionKind
├── resetActionKindsForTesting(): back to built-ins only
├── built-ins: autoInvite, adjustSelf, custom
├── runEffect(ctx, guest, effect): looks up the kind and runs it
└── effectIcons(effects): every effect's icons, in order

models/guest-type.ts
├── GuestTypeDefinition: - entranceEffect, - entranceIcons, + effects?: EffectDefinition[]
├── effectProblems(effects, dataOnly): every problem with a list of effects, with paths
└── validateGuestType: validates every effect through its kind

models/guest-type-json.ts [new]
└── parseGuestTypeDefinition(json): GuestTypeDefinition

models/built-in-guest-types.ts
└── Climber, Mr. Popular, Celebrity, Mermaid move to descriptors

models/guest-effects.ts
└── admitGuest: enqueues runEffect for each entrance effect

models/guest.model.ts
├── getGuestDetails: icons from effects via each kind's icons()
└── derived views GUEST_TYPE_ENTRANCE_EFFECTS / GUEST_TYPE_ENTRANCE_ICONS: rebuilt from descriptors
```

### Module Load Order

The built-in guest types are now plain data and import nothing at run time, so the guest-type-registry cycle through `built-in-guest-types.ts` is gone. Two new cycles take its place: `guest-effects → action-kinds → guest-effects` (`autoInvite` and `runEffect` use each other) and `guest-type → action-kinds → guest-effects → registry → guest-type` (validation looks up kinds). Both are safe for the same reasons as before: the shared functions are `function` declarations, and nothing runs them at module load.

> **Implementation note:** the action-kind registry registers its built-ins on first use, like the guest type registry, so it doesn't depend on load order either. `guest.model.ts` builds `GUEST_TYPE_ENTRANCE_ICONS` at load time through `effectIcons`; this works because no module in the cycles imports `guest.model.ts` at run time. The "Module load order" tests cover the three new modules.

## Components and Interfaces

### Definitions (models/effect-definition.ts)

```typescript
export type Trigger = 'entrance';

export interface ActionDefinition {
  kind: string;
  [param: string]: unknown;
}

export interface EffectDefinition {
  trigger: Trigger;
  action: ActionDefinition;
}

const TRIGGER_PHRASES: Record<Trigger, string> = { entrance: 'on entrance' };
export const triggerPhrase = (trigger: Trigger) => TRIGGER_PHRASES[trigger];
```

### Action kinds (models/action-kinds.ts)

```typescript
export interface ActionKind<P = Record<string, unknown>> {
  kind: string;
  // False for kinds whose parameters can't be written in JSON (custom).
  dataOnly: boolean;
  // Returns a list of problems, each prefixed with `path`; empty when valid.
  validate(params: Record<string, unknown>, path: string): string[];
  run(ctx: EffectContext, guest: Guest, params: P): void;
  icons(params: P, trigger: Trigger): readonly GuestIcon[];
}
```

Built-in kinds:

```typescript
const autoInviteKind: ActionKind<{ count: number }> = {
  kind: 'autoInvite',
  dataOnly: true,
  validate: (p, path) => isIntegerAtLeast(p['count'], 1) ? [] : [`${path}.count: expected an integer ≥ 1`],
  run: (ctx, _guest, { count }) => { for (let i = 0; i < count; i++) autoInvite(ctx); },
  icons: ({ count }, trigger) =>
    Array.from({ length: count }, () => ({ symbol: '👤', label: `Invites a guest ${triggerPhrase(trigger)}` }))
};

const adjustSelfKind: ActionKind<{ property: keyof GuestProperties; delta: number; min?: number; max?: number }> = {
  kind: 'adjustSelf',
  dataOnly: true,
  validate: /* property is a GuestProperties key; delta a non-zero integer; min, max integers; min ≤ max */,
  run: (ctx, guest, { property, delta, min, max }) => {
    const current = ctx.getParty().find(g => g.id === guest.id);
    if (!current) return;
    const value = clamp(current.properties[property] + delta, min, max);
    ctx.updateGuest(current, g => ({ ...g, properties: { ...g.properties, [property]: value } }));
  },
  icons: ({ property, delta }, trigger) => [{
    symbol: delta >= 0 ? '➕' : '➖',
    label: `${delta >= 0 ? 'Gains' : 'Loses'} ${Math.abs(delta)} ${PROPERTY_NAMES[property]} ${triggerPhrase(trigger)}`
  }]
};

const customKind: ActionKind<{ run: EffectHandler; icons: readonly GuestIcon[] }> = {
  kind: 'custom',
  dataOnly: false,
  validate: /* run is a function; icons is a non-empty array of { symbol, label } strings */,
  run: (ctx, guest, p) => p.run(ctx, guest),
  icons: (p) => p.icons
};
```

`PROPERTY_NAMES` maps `popularityValue → 'popularity'`, `moneyValue → 'money'`, `troubleValue → 'trouble'`, `peaceValue → 'peace'`, `starValue → 'star'`. Climber's label stays exactly "Gains 1 popularity on entrance".

```typescript
export function runEffect(ctx: EffectContext, guest: Guest, effect: EffectDefinition): void {
  const kind = getActionKind(effect.action.kind);
  kind.run(ctx, guest, effect.action);
}
```

### Built-in definitions (models/built-in-guest-types.ts)

```typescript
{ id: 'CLIMBER', /* ... */ effects: [
  { trigger: 'entrance', action: { kind: 'adjustSelf', property: 'popularityValue', delta: 1, max: 9 } }
] },
{ id: 'CELEBRITY', /* ... */ effects: [
  { trigger: 'entrance', action: { kind: 'autoInvite', count: 2 } }
] },
```

### admitGuest (models/guest-effects.ts)

```typescript
export function admitGuest(guest: Guest): GameEffect {
  return (ctx) => {
    ctx.setParty([...ctx.getParty(), guest]);
    for (const effect of findGuestType(guest.type)?.effects ?? []) {
      if (effect.trigger === 'entrance') {
        ctx.enqueue((c) => runEffect(c, guest, effect));
      }
    }
  };
}
```

### getGuestDetails (models/guest.model.ts)

```typescript
const effectIcons = (findGuestType(type)?.effects ?? [])
  .flatMap(e => getActionKind(e.action.kind).icons(e.action, e.trigger));
// then peace, trouble and star icons, as today
```

### JSON (models/guest-type-json.ts)

```typescript
export function parseGuestTypeDefinition(json: unknown): GuestTypeDefinition
```

Checks, in order, collecting every problem with its path:
- `json` is an object with exactly the keys `id`, `label`, `cost`, `properties`, and optionally `effects`
- `properties` has exactly the five GuestProperties keys, all integers
- each effect is `{ trigger, action }`; `action.kind` is registered and `dataOnly`; the kind's `validate` passes

Throws one `Error` listing every problem, so a designer can fix them all at once. The effect checks are `effectProblems`, shared with `validateGuestType`, so a definition from JSON and one written in TypeScript are held to the same rules. The result is then registered with `registerGuestType`, which runs the remaining rules (duplicate id and so on). Parsing doesn't register, so callers can parse a batch and register only when all of it is valid.

A guest type doesn't say which games it's in. To put JSON-defined guests in a game, the caller adds them to a `GameSetup` (guest-type-registry, Requirement 8) passed to `initializeGame()`. Parsing a setup from JSON is out of scope here; it would be a small addition next to this parser.

Example:

```json
{
  "id": "PARTY_PLANNER",
  "label": "Party Planner",
  "cost": 8,
  "properties": { "popularityValue": 1, "troubleValue": 0, "moneyValue": 0, "peaceValue": 0, "starValue": 0 },
  "effects": [{ "trigger": "entrance", "action": { "kind": "autoInvite", "count": 1 } }]
}
```

### Derived views

`GUEST_TYPE_ENTRANCE_EFFECTS[type]` becomes `(ctx, guest) => entranceEffects.forEach(e => runEffect(ctx, guest, e))`, and `GUEST_TYPE_ENTRANCE_ICONS[type]` becomes the effects' icons. For today's types (one entrance effect each), calling the derived handler directly is the same as what `admitGuest` enqueues, so the existing specs that call it keep passing.

### Changes from the first draft

- **`adjustSelf` rejects `delta: 0`.** It would do nothing, and Requirement 3.3 gives it no icon.
- **Every kind rejects parameters it doesn't define** (Requirement 6.4), such as `{ kind: 'autoInvite', count: 1, times: 2 }`. A typo in a parameter name is an error, not a silently ignored field. This matches how `parseGuestTypeDefinition` treats unknown fields.
- **`INVITE_ICON` is removed.** `autoInvite` builds its icon, with the trigger phrase in the label.

## Data Models

No store state changes.

## Correctness Properties

### Property 1: Built-in Effects Are Unchanged

For Climber, Mr. Popular, Celebrity and Mermaid, `getGuestDetails` SHALL return the same icons, with the same labels, as before this feature; and the existing entrance effect, overflow and effect-order specs SHALL pass unchanged.

**Validates: Requirements 3.2, 3.3, 5.1–5.5**

### Property 2: autoInvite Enqueues count Invites

*For any* `count` in [1, 5] and any deck, running an `autoInvite` effect with that count from a guest's entrance SHALL admit `min(count, deck length)` guests from the top of the deck, in deck order (ignoring guests those guests invite).

**Validates: Requirements 2.1**

### Property 3: adjustSelf Clamps and Targets the Current Guest

*For any* starting value, `delta`, and optional `min ≤ max`, `adjustSelf` SHALL set the triggering guest's property to `clamp(current + delta, min, max)`, where `current` is the value in the party when the effect runs. Other guests SHALL be unchanged. If the guest isn't in the party, nothing SHALL change.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 4: Entrance Effects Run in Definition Order

*For any* runtime-registered type with several entrance effects (built from `custom` actions that record their position), admitting one guest of that type SHALL run its effects in definition order, and effects enqueued by an earlier one SHALL finish before the next one starts.

**Validates: Requirements 4.1, 4.2**

### Property 5: Icons Follow Effect Order

*For any* type with a list of effects, `getGuestDetails(type, properties).icons` SHALL start with the concatenation of each effect's kind icons, in definition order.

**Validates: Requirements 3.1, 3.5**

### Property 6: JSON Round-Trip

*For any* valid Data_Only_Definition `def`, `parseGuestTypeDefinition(JSON.parse(JSON.stringify(def)))` SHALL deep-equal `def`.

**Validates: Requirements 7.2, 7.5**

### Property 7: Invalid JSON Is Rejected With a Path

*For any* valid Data_Only_Definition with one field broken (wrong type, removed, extra key, unknown kind, bad or unknown parameter, `custom` kind), `parseGuestTypeDefinition` SHALL throw, and the message SHALL contain the path to the broken field.

**Validates: Requirements 6.1–6.4, 7.3, 7.4**

## Error Handling

- Unknown action kind at run time: `getActionKind` throws. Registration validation makes this unreachable for registered types.
- Invalid definitions: rejected at registration or parse time with path-prefixed messages; never at run time.

## Testing Strategy

**Library**: fast-check, minimum 100 iterations per property, tagged `// Feature: effect-descriptors, Property {n}: {title}`.

- Each built-in action kind gets unit tests against a mock `EffectContext` (as the Climber tests do today).
- `arbDataOnlyDefinition()` extends the guest-type-registry generator with random `autoInvite` and `adjustSelf` effects.
- Specs that register types or action kinds reset both registries in `afterEach`.
- `TestEffectContext` (`src/testing/effect-context.ts`) is an in-memory `EffectContext` whose `resolve()` runs effects in the store's order, so kinds and `admitGuest` can be tested without the store.
- `customEntrance(run, icons)` (`src/testing/guests.ts`) builds a `custom` entrance effect for test types.
