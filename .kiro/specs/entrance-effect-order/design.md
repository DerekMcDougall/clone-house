# Design Document: Entrance Effect Order

## Overview

`resolveEffects()` in the Game_Store switches from a first-in, first-out queue to depth-first resolution. The effects an effect enqueues now go to the front of the queue, in the order they were enqueued, instead of the back. Because an arriving guest's entrance effect is enqueued by the effect that admitted the guest, it runs straight after that effect and before anything that was already waiting, which is how it interrupts.

No other code changes: `admitGuest()`, `autoInvite()`, `EffectContext` and the entrance effect handlers are untouched.

### Key Design Decisions

1. **Collect, then put at the front**: Each effect gets its own local `enqueued` list as the context's `enqueue` target. After the effect runs, `queue.unshift(...enqueued)` puts those effects at the front of the queue. Keeping them in their original order means Celebrity's two Auto_Invites still run first-then-second (Requirement 1.4). A plain stack (taking the most recently enqueued effect first) would reverse them.

2. **One effect per loop pass is kept**: The loop still runs one effect, commits its context, and checks for a Bust before the next. So a trouble change by an interrupting entrance effect is checked before any further Auto_Invite draws a guest (Requirement 2.1).

3. **Draws still happen when they run**: `autoInvite()` draws the top guest when its effect runs, so an Auto_Invite discarded by a Bust never removes a guest from the deck (Requirement 2.2). The resulting party is a prefix of the deck in either order. The order only changes which effect drew which guest and when each entrance effect runs relative to later draws.

4. **No recursion**: Running interrupting effects through the same loop, rather than by calling `resolveEffects()` recursively, keeps a single place where state is committed and Busts are checked, and a Bust ends the whole chain with one `return`.

## Architecture

### Modified Files

```
game.store.ts
└── resolveEffects(initialEffect): enqueue() now collects into a per-effect list;
    after the effect runs, that list is placed at the front of the queue

effect-context.ts
└── GameEffect comment: describes the new order
```

### Resolution Order Example

Deck: Celebrity (Troy), Mr. Popular (Rowan), Colin, Emily, Rachelle. The player invites Troy.

| Step | Effect run | Queue afterwards |
|------|-----------|------------------|
| 1 | admit Troy → enqueues Troy's entrance | [Troy's entrance] |
| 2 | Troy's entrance → enqueues draw A, draw B | [draw A, draw B] |
| 3 | draw A → admits Rowan → enqueues Rowan's entrance | [Rowan's entrance, draw B] |
| 4 | Rowan's entrance → enqueues draw C | [draw C, draw B] |
| 5 | draw C → admits Colin | [draw B] |
| 6 | draw B → admits Emily | [] |

Under the previous order, step 4 would have been draw B (admitting Colin) and Rowan's draw would have admitted Emily. The final party is the same, `[Troy, Rowan, Colin, Emily]`, but Rowan's entrance now runs while the party is `[Troy, Rowan]`.

## Correctness Properties

### Property 1: Interrupting Entrance Effect Runs Before the Next Auto_Invite

*For any* invite of a Celebrity whose first Auto_Invite draws a guest with an entrance effect, that entrance effect SHALL run while the party contains only the Celebrity, the guest, and any guests that entrance effect has itself brought in.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Bust From an Interrupting Effect Stops the Chain

*For any* chain in which an interrupting entrance effect pushes trouble over the Effective_Trouble_Limit, the Game_Store SHALL shut the party down before any remaining Auto_Invite draws, and the guests those Auto_Invites would have drawn SHALL remain in the deck.

**Validates: Requirements 2.1, 2.2**

## Testing Strategy

Unit tests in `game.store.spec.ts` under "Entrance Effect Order — GameStore":

1. **Climber interrupt (real guests)**: Celebrity → Climber → Old Friend with house capacity 2. Celebrity's second Auto_Invite overflows the house; the Climber in `bustPartySnapshot` SHALL already have `popularityValue` 1. Under the previous order it was still 0.
2. **Trouble-raising stand-in**: an Old Friend entrance effect is temporarily registered that sets the guest's `troubleValue` to 3. Celebrity's first Auto_Invite admits that guest; the party SHALL bust on trouble, and Celebrity's second guest SHALL still be in the deck.
3. **Nested chain**: Celebrity → Mr. Popular → three Old Friends. Mr. Popular's entrance effect is wrapped to record the party when it runs; it SHALL see `[Troy, Rowan]`.

Each test was confirmed to fail against the previous first-in, first-out order. Temporary entrance effects are registered in `GUEST_TYPE_ENTRANCE_EFFECTS` and restored in a `finally` block.

The existing overflow and auto-invite tests are unchanged apart from renaming the "FIFO order" test, since party contents and bust points are the same under either order with the current guest types.
