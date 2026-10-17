# Design Document: Activated Abilities

## Overview

Add an `activated` trigger. Guest types list abilities as ordinary effect definitions, and the store's `useAbility(guestId, effectIndex)` runs one through the effect queue. The store records which abilities each guest has used this party, and party guest cards show a button per ability.

Step 5 of 5 in the guest extensibility plan. Depends on **effect-choices**: abilities get pausing and the `chooseGuest` kind for free.

### Key Design Decisions

1. **An ability is just an effect with a different trigger**: No new action kinds, no separate ability type. `{ trigger: 'activated', action: { kind: 'autoInvite', count: 1 } }` is "invite a guest when used". Icons and validation come from the action kind as before; the trigger only changes the wording.

2. **Abilities are identified by `(guestId, effectIndex)`**: The effect's index in its type's `effects` list is stable, because types can't be replaced after registration (guest-type-registry). This avoids inventing ability ids.

3. **Usage is store state, not guest state**: `usedAbilities: Record<guestId, number[]>` lives in the store and is cleared whenever a party ends. Putting a flag on the guest would mean resetting it on every guest at party end, and a guest's properties are things that persist (like the Climber's popularity). Per-party usage doesn't.

4. **Mark used, then run**: The use is recorded before the effect runs. A bust in the middle can't leave the ability reusable, and an ability can't re-trigger itself through its own effects.

5. **Nothing else may be in flight**: An ability is unavailable while a choice is pending or effects are queued. Otherwise a player could start a second chain in the middle of the first, and the ordering rules don't say what that means.

6. **Buttons only in the party list**: `GuestCardComponent` gets a `showAbilities` input, off by default. The choice panel wraps cards in `<button>`, and a button inside a button is invalid HTML and breaks keyboard and screen reader use.

## Architecture

### Modified Files

```
models/effect-definition.ts
├── Trigger: + 'activated'
├── EffectDefinition: + uses?: 'oncePerParty' | 'unlimited', + label?: string
└── triggerPhrase: activated → "when used"

models/guest-type.ts, models/guest-type-json.ts
└── validate uses/label (activated only); JSON round-trip

stores/game.store.ts
├── state: + usedAbilities: Record<string, number[]>
├── computed: + partyAbilities: PartyAbility[]
├── method: + useAbility(guestId, effectIndex)
└── clear usedAbilities in advancePhase (party end), bust(), initializeGame, resetGame

components/guest-card.component.{ts,html,scss}
├── + @Input() showAbilities = false
└── + ability buttons from gameStore.partyAbilities() for this guest

components/phase-content.component.html
└── party list: <app-guest-card [guest]="guest" [showAbilities]="true" />
```

## Components and Interfaces

### Definitions (models/effect-definition.ts)

```typescript
export type Trigger = 'entrance' | 'activated';

export interface EffectDefinition {
  trigger: Trigger;
  action: ActionDefinition;
  // Activated effects only.
  uses?: 'oncePerParty' | 'unlimited';
  label?: string;
}

const TRIGGER_PHRASES: Record<Trigger, string> = {
  entrance: 'on entrance',
  activated: 'when used'
};
```

`admitGuest` already filters on `trigger === 'entrance'`, so activated effects never run on entrance.

### PartyAbility (stores/game.store.ts)

```typescript
export interface PartyAbility {
  guestId: string;
  effectIndex: number;
  label: string;          // effect.label ?? first icon's label
  icons: readonly GuestIcon[];
  used: boolean;
  available: boolean;
}
```

```typescript
partyAbilities: computed(() => {
  const blocked = store.currentPhase() !== GamePhase.PARTY || store.isAwaitingChoice()
    || store.pendingEffects().length > 0 || store.isPartyShutdown()
    || store.isBanSelectionActive() || store.isVictory();
  return store.party().flatMap(guest =>
    (findGuestType(guest.type)?.effects ?? []).flatMap((effect, effectIndex) => {
      if (effect.trigger !== 'activated') return [];
      const icons = getActionKind(effect.action.kind).icons(effect.action, effect.trigger);
      const used = store.usedAbilities()[guest.id]?.includes(effectIndex) ?? false;
      const reusable = effect.uses === 'unlimited';
      return [{ guestId: guest.id, effectIndex, label: effect.label ?? icons[0].label, icons, used,
                available: !blocked && (reusable || !used) }];
    })
  );
}),
```

`pendingEffects` is always empty between player actions (the queue either finishes or pauses on a choice), so that check is a guard, not a reachable state. It stays because it's what makes decision 5 hold if that ever changes.

### useAbility (stores/game.store.ts)

```typescript
useAbility(guestId: string, effectIndex: number): void {
  const ability = store.partyAbilities().find(a => a.guestId === guestId && a.effectIndex === effectIndex);
  if (!ability?.available) return;

  const used = store.usedAbilities();
  patchState(store, {
    usedAbilities: { ...used, [guestId]: [...(used[guestId] ?? []), effectIndex] }
  });

  const guest = store.party().find(g => g.id === guestId)!;
  const effect = getGuestType(guest.type).effects![effectIndex];
  resolveEffects((ctx) => runEffect(ctx, guest, effect));
},
```

For `'unlimited'` abilities the index is appended again each use. That's harmless and gives a use count for free if one is ever needed.

### Guest card (components/guest-card.component.*)

```html
<div class="guest-card">
  <!-- header, image, caption, details as today -->
  @if (showAbilities) {
    @for (ability of abilities(); track ability.effectIndex) {
      <button class="ability-button"
              [disabled]="!ability.available"
              (click)="gameStore.useAbility(guest.id, ability.effectIndex)"
              [attr.aria-label]="ability.label + ' (' + guest.name + ')'">
        {{ ability.used ? 'Used' : ability.label }}
      </button>
    }
  }
</div>
```

`abilities()` filters `gameStore.partyAbilities()` to this guest. The button sits at the bottom of the card, above the money value. Cards may need a little more height, which the existing card styles allow (`padding: 1.75rem 1rem` already leaves room for the overlay).

### Icons

`getGuestDetails` already lists every effect's icons in order (effect-descriptors), so ability icons appear with "when used" labels without changes. A type with an entrance invite and an ability invite shows two 👤 icons, labeled "Invites a guest on entrance" and "Invites a guest when used".

## Data Models

| State | Type | Initial | Cleared |
|---|---|---|---|
| `usedAbilities` | `Record<string, number[]>` | `{}` | party end, bust, overflow, `initializeGame`, `resetGame` |

## Correctness Properties

### Property 1: Once Per Party

*For any* party containing a guest with a `'oncePerParty'` ability, after one successful `useAbility` call for it, further calls in the same party SHALL change nothing, and after the party ends and the guest is invited again, the ability SHALL be available.

**Validates: Requirements 2.5, 3.1, 3.3, 3.4**

### Property 2: Unlimited Uses

*For any* `n` in [1, 5], a guest with an `'unlimited'` ability whose action is a recording `custom` effect SHALL run that effect `n` times after `n` calls.

**Validates: Requirements 1.2, 3.1**

### Property 3: Unavailable Means No-Op

*For any* game state in which an ability is unavailable (wrong phase, guest not in party, bad index, entrance effect index, used, choice pending, shut down, ban selection, victory), `useAbility` SHALL leave all state unchanged.

**Validates: Requirements 2.5, 3.1**

### Property 4: Abilities Behave Like Effects

*For any* test type whose ability is `autoInvite` with count in [1, 3], using the ability SHALL admit the same guests, run the same entrance effects in the same order, and bust under the same conditions as an entrance `autoInvite` with the same count would. A bust SHALL leave the ability marked used until the party is cleared.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 5: partyAbilities Matches Definitions

*For any* party of guests from test types with random activated effects, `partyAbilities()` SHALL contain exactly one entry per (party guest, activated effect) pair, in party order then effect order, with labels from `label` or the first icon.

**Validates: Requirements 3.2, 4.2**

### Property 6: Conservation With Abilities

The guest id conservation invariant SHALL hold across random operation sequences that include `useAbility` on test types with inviting and choosing abilities.

**Validates: Requirements 5.1**

## Error Handling

- Unknown guest id or effect index in `useAbility`: no matching `PartyAbility`, so it's a no-op.
- Validation rejects `uses` / `label` on entrance effects at registration, with the effect's path.

## Testing Strategy

**Library**: fast-check, minimum 100 iterations per property, tagged `// Feature: activated-abilities, Property {n}: {title}`.

- Test-only types (registered and reset per spec): one with a once-per-party `autoInvite` ability, one with an unlimited recording ability, one with a `chooseGuest` + `adjustSelf` ability.
- Guest card unit tests: buttons appear only with `showAbilities`; disabled and "Used" states; accessible names; no buttons inside choice-panel options.
- Integration test: buy a test ability guest, start a party, invite it, press its button, pick a guest in the choice panel, and check the chosen guest changed and the button now says "Used".
