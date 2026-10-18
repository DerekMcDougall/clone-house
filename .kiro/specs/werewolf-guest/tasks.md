# Implementation Plan: Werewolf Guest

## Overview

Add the `cycleSelf` action kind, check trouble after an arriving guest's entrance effect, then add the Werewolf. The trouble-check change only affects guests that change their own trouble on entrance, so it can land before the Werewolf without changing play.

## Tasks

- [x] 1. cycleSelf action kind
  - [x] 1.1 Add `cycleSelf` to `action-kinds.ts`: validation with paths, `run` on the current party version of the guest, given icons; register it with the built-ins
    - _Requirements: 1.1–1.7_
  - [x] 1.2 Unit tests for validation, run, wrap-around, a value not in the list, a guest not in the party, icons, and JSON parsing; add `cycleSelf` to `arbDataOnlyAction`
    - _Requirements: 1.1–1.7_
  - [x]* 1.3 Property test 1
    - **Property 1: cycleSelf Steps Through Its Values** — **Validates: Requirements 1.2, 1.3**

- [x] 2. Trouble check after the entrance effect
  - [x] 2.1 In `runQueue`, skip the trouble check after an effect in which a guest with entrance effects arrived; keep the overflow check after every effect
    - _Requirements: 3.1–3.3_
  - [x] 2.2 Unit tests with a test-only type whose entrance effect lowers its own trouble: safe at the limit, bust when the effect raises trouble over the limit, overflow still immediate; a type without entrance effects busts as before
    - _Requirements: 3.1–3.3_
  - [x]* 2.3 Property tests 4 and 5
    - **Property 4: Guests Without Entrance Effects Are Checked at Once** — **Validates: Requirements 3.2**
    - **Property 5: Overflow Is Immediate** — **Validates: Requirements 3.3**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Werewolf
  - [x] 4.1 Add `WEREWOLF` to `BuiltInGuestType` and `BUILT_IN_GUEST_TYPES`, and to the default shop with Remus, Lawrence, Scott and Jacob
    - _Requirements: 2.1–2.4_
  - [x] 4.2 Update counts that include every shop guest (94 → 98 conservation, shop size and type lists)
    - _Requirements: 2.3_
  - [x] 4.3 Store tests for the Werewolf: first entrance switches to 1; at the limit with 1 trouble it switches to 0 and the party continues; a switch to 1 that goes over the limit busts with the Werewolf at 1 trouble; trouble persists across parties and bans
    - _Requirements: 3.4–3.6_
  - [x] 4.4 Card tests: the shop card shows 4 popularity and 🌙 with no ❌; a house card shows ❌ only at 1 trouble, with 🌙 to its left
    - _Requirements: 4.1–4.3_
  - [x]* 4.5 Property tests 2 and 3
    - **Property 2: Werewolf Switches on Each Entrance** — **Validates: Requirements 2.2, 3.6**
    - **Property 3: Trouble Waits for the Entrance Effect** — **Validates: Requirements 3.1, 3.4, 3.5**

- [x] 5. Final checkpoint — Ensure all tests pass and `ng build` succeeds; buy a Werewolf in the app, invite it over several parties, and check that its ❌ appears and disappears and that it can enter a party at the trouble limit when it has 1 trouble
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Tasks 1–2 don't change play on their own and can be their own PR
- Task 2.2 uses a test-only type so the check change is tested apart from the Werewolf

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5"] }
  ]
}
```
