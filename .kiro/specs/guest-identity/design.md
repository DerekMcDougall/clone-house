# Design Document: Guest Identity

## Overview

Add `id: string` to `Guest`, create every guest through one factory, and switch every "which guest is this?" comparison from object reference or name to id. Step 1 of 5 in the guest extensibility plan; the later steps (targeted choices, activated abilities) rely on it.

### Key Design Decisions

1. **Required, not optional**: `id` is required on `Guest`, so the compiler finds every place that builds a guest. Optional ids would let id-less guests slip into the zones and break matching silently.

2. **Sequential ids from a per-game counter**: `createGuest` takes its id from an id source the store creates in `initializeGame()`: `g1`, `g2`, … Sequential ids are deterministic, which keeps tests and property-test shrinking reproducible. `crypto.randomUUID()` would also work, but makes failures harder to replay.

3. **Ids are opaque**: Nothing parses an id or derives meaning from it. Code compares ids for equality only.

4. **`updateGuest` pins the id**: The updater may return any guest, but the context overwrites `id` with the original's, so an effect can't accidentally re-identify a guest.

5. **Names stay as they are**: Names remain display text. They're still unique among built-in guests, but nothing depends on that any more.

## Architecture

### Modified Files

```
guest.model.ts
├── Guest: + id: string
├── GuestIdSource [new type]: () => string
├── createGuestIdSource() [new]: returns a source yielding g1, g2, ...
└── createGuest(type, name, nextId) [new]: { id: nextId(), type, name, properties: { ...GUEST_TYPE_DEFAULTS[type] } }

game.store.ts
├── EffectContextImpl.updateGuest: match by id, pin id on the result
├── initializeGame(): one id source; deck and shop built with createGuest
└── confirmBan(): filter snapshot by id

phase-content.component.html
├── party list: track guest.id
└── ban selection list: track guest.id

src/testing/guests.ts [new]
└── testGuest(type, name, overrides?): Guest with a unique id
```

## Components and Interfaces

### Guest (guest.model.ts)

```typescript
export interface Guest {
  id: string;
  type: GuestType;
  name: string;
  properties: GuestProperties;
}

export type GuestIdSource = () => string;

// Yields g1, g2, g3, ... A game uses one source so every guest's id is unique.
export function createGuestIdSource(): GuestIdSource {
  let next = 1;
  return () => `g${next++}`;
}

export function createGuest(type: GuestType, name: string, nextId: GuestIdSource): Guest {
  return { id: nextId(), type, name, properties: { ...GUEST_TYPE_DEFAULTS[type] } };
}
```

### EffectContextImpl.updateGuest (game.store.ts)

```typescript
updateGuest(guest: Guest, updater: (g: Guest) => Guest): Guest {
  const updated = { ...updater(guest), id: guest.id };
  this._party = this._party.map(g => (g.id === guest.id ? updated : g));
  return updated;
}
```

### initializeGame (game.store.ts)

```typescript
const nextId = createGuestIdSource();
const deck = INITIAL_GUESTS.map(e => createGuest(e.type, e.name, nextId));
// shop: same, inside the SHOP_GUESTS loop
```

### confirmBan (game.store.ts)

```typescript
const remaining = snapshot.filter(g => g.id !== selected.id);
```

### Test helper (src/testing/guests.ts)

```typescript
let counter = 0;

// Builds a guest for tests. Ids are unique within a test run (t1, t2, ...).
export function testGuest(type: GuestType, name: string, overrides: Partial<GuestProperties> = {}): Guest {
  return {
    id: `t${++counter}`,
    type,
    name,
    properties: { ...GUEST_TYPE_DEFAULTS[type], ...overrides }
  };
}
```

The `t` prefix keeps test ids from colliding with `g` ids when a test mixes patched guests with guests from `initializeGame()`. The existing per-file helpers (`makeGuest` in `game.store.spec.ts` and similar ones in `phase-content` and `status-pane` specs) are replaced by `testGuest`. About 70 guest object literals in specs move to it.

## Data Models

No new store state. `Guest` gains one field. The guest-count invariant (`INITIAL_GUESTS.length + SHOP_GUESTS.length`, currently 94) is unchanged.

## Correctness Properties

### Property 1: Ids Are Unique After Initialization

*For any* call to `initializeGame()`, the ids of all guests across deck, party, discard and shop inventory SHALL be pairwise distinct, and their count SHALL equal `INITIAL_GUESTS.length + SHOP_GUESTS.length`.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Id Conservation Across Operations

*For any* sequence of `purchaseGuest`, `inviteGuest`, `advancePhase`, `acknowledgeShutdown`, `selectGuestToBan` and `confirmBan` operations after `initializeGame()`, the multiset of ids across deck, party, discard, shop inventory and `bustPartySnapshot` SHALL equal the set of ids created at initialization.

**Validates: Requirements 2.1, 5.1**

### Property 3: updateGuest Pins the Id and Matches by Id

*For any* party and any party guest `g`, calling `updateGuest(copyOf(g), updater)` where `updater` returns a guest with an arbitrary `id` SHALL replace exactly the party guest with id `g.id`, and the replacement SHALL have id `g.id`.

**Validates: Requirements 2.2, 3.1**

### Property 4: Ban Removes Exactly the Selected Guest

*For any* bust party snapshot containing guests that share names, selecting and confirming a ban on index `i` SHALL leave every snapshot guest except `snapshot[i]` in the deck, and `snapshot[i]` alone in the discard pile.

**Validates: Requirements 3.2**

## Error Handling

No new error paths. `updateGuest` with a guest that isn't in the party keeps its current behavior (no change to the party).

## Testing Strategy

**Library**: fast-check, minimum 100 iterations per property, tagged `// Feature: guest-identity, Property {n}: {title}`.

**Unit tests**:
- `createGuest` returns the type's default properties, copied (mutating the result doesn't change `GUEST_TYPE_DEFAULTS`)
- `createGuestIdSource()` yields `g1`, `g2`, `g3`; two sources are independent
- `updateGuest` with a structurally equal copy of a party guest updates the party (it would not today)
- Phase_Content renders two party cards for two guests named "Matt"
- Climber keeps her id after her entrance effect

**Migration of existing specs**: replace guest object literals and local `makeGuest` helpers with `testGuest`. Where a spec asserts `toEqual` on a whole guest, the id comes along naturally. Where it compares guests from different sources, compare by id.
