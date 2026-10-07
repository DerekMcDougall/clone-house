# Implementation Plan: Entrance Effect Order

## Overview

Switch the store's effect resolution from first-in, first-out to depth-first, so an arriving guest's entrance effect interrupts the effect that admitted it. One store method changes; the rest is tests and documentation.

## Tasks

- [x] 1. Resolve effects depth-first
  - [x] 1.1 Change `resolveEffects()` in `game.store.ts`
    - Give each effect's context a local `enqueued` list as its `enqueue` target
    - After the effect runs, `queue.unshift(...enqueued)` so those effects run next, in the order enqueued
    - Keep the commit and bust check after every effect
    - Update the method comment and the `GameEffect` comment in `effect-context.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [x] 2. Tests
  - [x] 2.1 Add "Entrance Effect Order — GameStore" unit tests to `game.store.spec.ts`
    - Climber auto-invited by a Celebrity has her +1 applied before Celebrity's second Auto_Invite overflows the house
    - A temporary trouble-raising entrance effect busts the party before Celebrity's second Auto_Invite draws
    - Mr. Popular auto-invited by a Celebrity sees only `[Celebrity, Mr. Popular]` when his entrance effect runs
    - Confirm each test fails under the previous first-in, first-out order
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

  - [x] 2.2 Rename the existing "FIFO order" auto-invite test to describe what it checks (draw order through a chain)

- [x] 3. Documentation
  - [x] 3.1 Mark overflow Requirements 5.5 and 6.1–6.3, design decision 4 and Property 2 as superseded by this spec
  - _Requirements: 3.1, 3.2_

- [x] 4. Final checkpoint - Ensure all tests pass

## Notes

- With the current guest types the final party and the bust point are the same under either order; the change matters for upcoming entrance effects that change trouble
- Temporary entrance effects registered in tests must be removed or restored in a `finally` block, because `GUEST_TYPE_ENTRANCE_EFFECTS` is shared module state
