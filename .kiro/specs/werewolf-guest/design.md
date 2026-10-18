# Design Document: Werewolf Guest

## Overview

Add a `cycleSelf` action kind and the Werewolf guest type, which uses it to switch its trouble between 0 and 1 on each entrance. Change `runQueue` so that the trouble check after a guest arrives waits for that guest's entrance effect. Overflow is still checked straight away.

### Key Design Decisions

1. **A general `cycleSelf`, not a Werewolf-only toggle**: "Step a property through a list of values" covers the Werewolf (`[0, 1]`) and later guests, such as a three-phase guest or one that switches money, at no extra cost. It's data-only, so it works from JSON, and it doesn't need `custom`.

2. **Given icons, not derived ones**: An icon derived from the parameters (say, 🔄 "Cycles trouble") wouldn't say what the guest is about. As with `chooseGuest`, each type picks the icon that fits. The Werewolf's is 🌙.

3. **Skip one trouble check rather than reorder the queue**: The rule is that a Werewolf's switch happens before the trouble limit is checked. Every effect is already followed by a bust check, including the guest's own entrance effects, which run straight after its arrival because the queue is depth-first. Skipping the trouble check after an arrival whose guest has entrance effects is therefore enough: the check after the guest's first entrance effect covers the arrival as well. Nothing else changes order.

   The store detects arrivals without new API: it compares the party's guest ids before and after each effect. A guest that wasn't there before has arrived. That covers both the player's invite and an auto-invite's draw, which are the only ways a guest enters the party.

4. **Overflow stays immediate**: The overflow rule is that the party ends at once, without completing pending entrance effects. A guest that overflows the house has arrived where there's no room, and its own entrance effect doesn't change that. So the overflow check still runs after every effect. A Werewolf or Climber that overflows the party is bust unchanged, as today.

5. **Only the first entrance effect counts**: For a guest with several entrance effects, the check after its first effect also covers the arrival, so trouble is checked before its later effects run. Every type today has at most one entrance effect. Waiting for all of a guest's effects would mean tracking which queued entries belong to which guest, because the depth-first queue runs other guests' effects between them, and nothing needs that yet.

### Behavior Changes

Only guests that have entrance effects and change their own trouble behave differently, and the Werewolf is the only one. Climber, Mr. Popular, Celebrity and Mermaid have 0 trouble and their entrance effects don't change trouble. So skipping the check after their arrival delays the same check result by one effect:

- Mr. Popular's, Celebrity's and Mermaid's effects only enqueue draws, so no guest is drawn before the delayed check runs.
- A Climber's effect raises its popularity, which the check doesn't look at.

## Architecture

### Modified Files

```
models/action-kinds.ts
└── + cycleSelf kind: validate, run, icons (given)

models/built-in-guest-types.ts
└── + WEREWOLF in BuiltInGuestType and BUILT_IN_GUEST_TYPES

models/game-setup.ts
└── DEFAULT_GAME_SETUP.shop: + WEREWOLF: Remus, Lawrence, Scott, Jacob

stores/game.store.ts
└── runQueue: skip the trouble check after an effect in which a guest with entrance effects arrived
```

No UI changes: cards already take icons from the type's effects, and the trouble icon from the instance's `troubleValue` (`getGuestDetails`).

### cycleSelf (models/action-kinds.ts)

```typescript
type CycleSelfParams = { property: keyof GuestProperties; values: number[]; icons: readonly GuestIcon[] };

const cycleSelfKind: ActionKind<CycleSelfParams> = {
  kind: 'cycleSelf',
  dataOnly: true,
  validate: (p, path) => [
    /* property is a PROPERTY_NAMES key */,
    /* values: an array of at least 2 integers */,
    ...iconsProblems(p['icons'], path),
    ...unknownParams(p, path, ['property', 'values', 'icons'])
  ],
  run: (ctx, guest, { property, values }) => {
    const current = ctx.getParty().find(g => g.id === guest.id);
    if (!current) return;
    // indexOf is -1 when the value isn't in the list, so this gives values[0]
    const next = values[(values.indexOf(current.properties[property]) + 1) % values.length];
    ctx.updateGuest(current, g => ({ ...g, properties: { ...g.properties, [property]: next } }));
  },
  icons: (p) => p.icons
};
```

Like `adjustSelf`, it reads the guest's current party version by id, so changes made since the effect was enqueued aren't lost.

### Werewolf (models/built-in-guest-types.ts)

```typescript
{
  id: 'WEREWOLF',
  label: 'Werewolf',
  cost: 5,
  properties: { popularityValue: 4, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
  effects: [{
    trigger: 'entrance',
    action: {
      kind: 'cycleSelf',
      property: 'troubleValue',
      values: [0, 1],
      icons: [{ symbol: '🌙', label: 'Switches between 0 and 1 trouble on entrance' }]
    }
  }]
}
```

The Werewolf goes after Superhero, at the end of `BUILT_IN_GUEST_TYPES` and the shop list. "Lawrence" is also a Mr. Popular's name. That's fine, because guests are identified by id (guest-identity) and every name-based path already handles repeated names.

### Trouble check in runQueue (stores/game.store.ts)

Today, after each effect:

```typescript
const isOverflow = store.party().length > store.houseCapacity();
if (isOverflow || store.trouble() > store.effectiveTroubleLimit()) { bust(isOverflow); return; }
```

After:

```typescript
const before = new Set(store.party().map(g => g.id));
entry.run(ctx);
// ...push ctx.queued, commit state as today...

// A guest with entrance effects that just arrived is checked for trouble after its first
// entrance effect, which runs next, so an effect like the Werewolf's can change its trouble first
const awaitingEntrance = store.party().some(g =>
  !before.has(g.id) && (findGuestType(g.type)?.effects ?? []).some(e => e.trigger === 'entrance'));

const isOverflow = store.party().length > store.houseCapacity();
const isTroubleBust = !awaitingEntrance && store.trouble() > store.effectiveTroubleLimit();
if (isOverflow || isTroubleBust) { bust(isOverflow); return; }
```

The guest's entrance effect is the next entry to run: `admitGuest` enqueues it, `runQueue` pushes it on top of the stack, and nothing else runs between them. A choice can't come between them either, because the entrance effect is enqueued as an effect. If the entrance effect requests a choice, the effect still finishes and is checked before resolution pauses.

## Correctness Properties

### Property 1: cycleSelf Steps Through Its Values

For any property, any list of at least 2 integers and any starting value, running `cycleSelf` sets the property to the next value in the list after the starting one, wrapping around, or to the first value when the starting value isn't in the list. Running it `values.length` times from a value in the list returns to that value.

**Validates: Requirements 1.2, 1.3**

### Property 2: Werewolf Switches on Each Entrance

For any number of parties N in which a Werewolf enters (without busting before its effect), its trouble after them is `N % 2`.

**Validates: Requirements 2.2, 3.6**

### Property 3: Trouble Waits for the Entrance Effect

For any party at or below the trouble limit and any Werewolf, inviting the Werewolf ends the party with a trouble bust if and only if its trouble *after* switching takes the party over the limit.

**Validates: Requirements 3.1, 3.4, 3.5**

### Property 4: Guests Without Entrance Effects Are Checked at Once

For any guest type without entrance effects and any party state, inviting a guest of that type busts, or doesn't, exactly as before this change.

**Validates: Requirements 3.2**

### Property 5: Overflow Is Immediate

For any guest with entrance effects that an auto-invite brings into a full house, the party ends with an overflow bust and the guest's entrance effect doesn't run (a Werewolf's trouble and a Climber's popularity are unchanged in the bust party).

**Validates: Requirements 3.3**

## Testing Strategy

- `action-kinds.spec.ts`: `cycleSelf` validation problems with paths; run on a party guest; wrap-around; value not in the list; guest not in the party; icons; works from JSON in `guest-type-json.spec.ts`.
- `game.store.spec.ts`: the four scenarios from requirement 3 (at the limit with a 1-trouble Werewolf, a switch to 1 that busts, a Werewolf that overflows, a Wild Buddy at the limit as before).
- Property tests 1–5.
- Card tests: the shop card shows 4 popularity and 🌙 with no ❌; a house card shows ❌ only at 1 trouble.
- Counts that include every shop guest (the 94-guest conservation property, shop size tests) go up by 4.
- `arbDataOnlyAction` gains `cycleSelf`, so the existing JSON round-trip and validation properties cover it.
