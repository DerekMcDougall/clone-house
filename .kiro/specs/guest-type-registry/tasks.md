# Implementation Plan: Guest Type Registry

## Overview

Move every guest type into one `GuestTypeDefinition`, register them in a registry, switch game code to read the registry, and keep the old tables as deprecated derived views. Requires **guest-identity**. No player-visible change.

## Tasks

- [x] 1. Capture the current tables
  - [x] 1.1 Write `built-in-tables.snapshot.ts` fixture with the current values of all seven tables (entrance effects recorded as the set of type ids that have one)
    - _Requirements: 7.1_

- [x] 2. Definitions and registry
  - [x] 2.1 Add `models/guest-type.ts` with `GuestTypeDefinition` and `validateGuestType`
    - _Requirements: 1.1, 1.3, 3.2–3.5_
  - [x] 2.2 Move shared icons to `models/guest-icons.ts`; move `admitGuest` and `autoInvite` to `models/guest-effects.ts` as `function` declarations
    - _Requirements: 1.1_
  - [x] 2.3 Add `models/built-in-guest-types.ts` with `BuiltInGuestType` and the 22 definitions, in current table order
    - _Requirements: 1.2, 2.5_
  - [x] 2.4 Add `models/guest-type-registry.ts` with `registerGuestType`, `getGuestType`, `findGuestType`, `listGuestTypes`, `guestTypeLabel` and `resetGuestTypesForTesting`; register built-ins at load
    - _Requirements: 2.1–2.6, 3.1_
  - [x] 2.5 Change `GuestType` to `string`; rebuild the seven tables as `@deprecated` derived views of `BUILT_IN_GUEST_TYPES`
    - _Requirements: 1.4, 6.1, 6.2, 6.3_
  - [x]* 2.6 Property tests 1–3
    - **Property 1: Derived Views Match the Old Tables** — **Validates: Requirements 1.2, 6.1, 7.1**
    - **Property 2: Registration Round-Trips** — **Validates: Requirements 2.1, 2.4**
    - **Property 3: Invalid Definitions Are Rejected Without Side Effects** — **Validates: Requirements 3.1–3.5**
  - [x] 2.7 Unit test: each of the new model modules imports cleanly on its own (no load-order errors)
    - _Requirements: 2.5_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Read the registry from game code
  - [x] 4.1 `createGuest`, `admitGuest`, `getGuestDetails`: read from the registry
    - _Requirements: 4.2_
  - [x] 4.2 Add `models/game-setup.ts` (`GameSetup`, `DEFAULT_GAME_SETUP`, `validateGameSetup`); `initializeGame(turnCount, setup)` builds the deck and shop from the setup
    - _Requirements: 4.1, 5.1, 5.2, 8.1–8.5_
  - [x] 4.3 Store labels (`banConfirmationMessage`, `purchasableShopItems`, `purchaseGuest`) via `guestTypeLabel`
    - _Requirements: 4.2_
  - [x] 4.4 Guest_Card and Phase_Content: labels via `guestTypeLabel`, shop-card properties via `getGuestType(type).properties`
    - _Requirements: 4.2, 4.3_
  - [x]* 4.5 Property tests 4–6 (with `resetGuestTypesForTesting()` in `afterEach`)
    - **Property 4: The Setup Decides the Deck and Shop** — **Validates: Requirements 4.1, 5.1, 8.1–8.3, 8.5**
    - **Property 4b: Invalid Setups Are Rejected** — **Validates: Requirements 8.4**
    - **Property 5: Mid-Game Registration Doesn't Touch the Current Game** — **Validates: Requirements 5.2**
    - **Property 6: Runtime Types Score Like Built-ins** — **Validates: Requirements 5.3**
  - [x] 4.6 Unit test: a runtime-registered type renders its label on a guest card and a shop card
    - _Requirements: 4.2, 5.1_

- [x] 5. Final checkpoint — Ensure all tests pass and `ng build` succeeds
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm no non-test code imports the deprecated views (`grep` for each name outside `*.spec.ts`)
    - _Requirements: 4.2, 7.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Retiring the derived views (moving specs to the registry, then deleting the views and the snapshot fixture) is left for a later cleanup, so this change stays reviewable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3"] },
    { "id": 2, "tasks": ["2.4"] },
    { "id": 3, "tasks": ["2.5", "2.7"] },
    { "id": 4, "tasks": ["2.6", "4.1", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["4.5", "4.6"] }
  ]
}
```
