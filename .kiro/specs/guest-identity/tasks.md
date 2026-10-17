# Implementation Plan: Guest Identity

## Overview

Add `Guest.id`, a `createGuest` factory and id-based matching. The compiler will flag every guest literal once `id` is required; most of the work is moving specs to a shared `testGuest` helper. No player-visible change.

## Tasks

- [ ] 1. Add ids to the model
  - [ ] 1.1 Add `id` to `Guest`, plus `GuestIdSource`, `createGuestIdSource()` and `createGuest()` in `guest.model.ts`
    - _Requirements: 1.1_
  - [ ] 1.2 Add `src/testing/guests.ts` with `testGuest(type, name, overrides?)`
    - _Requirements: 6.1_
  - [ ]* 1.3 Unit tests for `createGuest` and `createGuestIdSource`
    - _Requirements: 1.1, 1.4_

- [ ] 2. Use ids in the store
  - [ ] 2.1 Build the deck and shop in `initializeGame()` with one id source and `createGuest`
    - _Requirements: 1.2, 1.3, 1.4_
  - [ ] 2.2 Change `EffectContextImpl.updateGuest` to match by id and pin the id on the result
    - _Requirements: 2.2, 3.1, 3.3_
  - [ ] 2.3 Change `confirmBan()` to filter the snapshot by id
    - _Requirements: 3.2_
  - [ ]* 2.4 Property tests 1–4 in `game.store.property.spec.ts`
    - **Property 1: Ids Are Unique After Initialization** — **Validates: Requirements 1.2, 1.3, 1.4**
    - **Property 2: Id Conservation Across Operations** — **Validates: Requirements 2.1, 5.1**
    - **Property 3: updateGuest Pins the Id and Matches by Id** — **Validates: Requirements 2.2, 3.1**
    - **Property 4: Ban Removes Exactly the Selected Guest** — **Validates: Requirements 3.2**

- [ ] 3. Track by id in the UI
  - [ ] 3.1 In `phase-content.component.html`, track the party and ban selection lists by `guest.id`
    - _Requirements: 4.1, 4.2_
  - [ ] 3.2 Unit test: two party guests named "Matt" render two cards
    - _Requirements: 4.3_

- [ ] 4. Migrate specs
  - [ ] 4.1 Replace guest object literals and local `makeGuest` helpers in all specs with `testGuest`
    - _Requirements: 6.2_

- [ ] 5. Checkpoint — Ensure all tests pass and `ng build` succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 4.1 can run in parallel with tasks 2–3; the build stays red until it's done, because `id` is required

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["4.1", "3.2"] },
    { "id": 3, "tasks": ["2.4"] }
  ]
}
```
