# Implementation Plan: Peace & Trouble Limit

## Overview

This feature adds the `peaceValue` property to `GuestProperties`, introduces two new peace-granting guest types (CUTE_DOG and HIPPY), and refactors `partyTroubleLimitModifier` from stored state to a computed signal derived from the sum of `peaceValue` across all party guests. The implementation proceeds model-first, then store refactor, then test updates.

## Tasks

- [x] 1. Extend guest model with peaceValue and new guest types
  - [x] 1.1 Add peaceValue to GuestProperties interface and update all constants
    - Add `peaceValue: number` to the `GuestProperties` interface in `guest.model.ts`
    - Add `'CUTE_DOG' | 'HIPPY'` to the `GuestType` union
    - Add `peaceValue: 0` to every existing entry in `GUEST_TYPE_DEFAULTS`
    - Add CUTE_DOG entry to `GUEST_TYPE_DEFAULTS`: `{ popularityValue: 2, troubleValue: 0, moneyValue: 0, peaceValue: 1 }`
    - Add HIPPY entry to `GUEST_TYPE_DEFAULTS`: `{ popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 1 }`
    - Add `CUTE_DOG: 'Cute Dog'` and `HIPPY: 'Hippy'` to `GUEST_TYPE_LABELS`
    - Add `CUTE_DOG: 7` and `HIPPY: 4` to `GUEST_TYPE_COSTS`
    - Add 8 new entries to `SHOP_GUESTS`: 4 CUTE_DOG (Oreo, Lily, Pearl, Ronnie) and 4 HIPPY (Bob, Joni, Joan, Jerry)
    - Verify `SHOP_GUESTS` has 36 total entries and `INITIAL_GUESTS` remains 10 entries with no CUTE_DOG or HIPPY
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.3_

  - [ ]* 1.2 Write unit tests for new guest model constants
    - Test `GuestProperties` includes `peaceValue` field
    - Test all existing types have `peaceValue: 0` in `GUEST_TYPE_DEFAULTS`
    - Test CUTE_DOG defaults: `{ popularityValue: 2, troubleValue: 0, moneyValue: 0, peaceValue: 1 }`
    - Test HIPPY defaults: `{ popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 1 }`
    - Test `GUEST_TYPE_LABELS['CUTE_DOG']` is `'Cute Dog'` and `GUEST_TYPE_LABELS['HIPPY']` is `'Hippy'`
    - Test `GUEST_TYPE_COSTS['CUTE_DOG']` is 7 and `GUEST_TYPE_COSTS['HIPPY']` is 4
    - Test `SHOP_GUESTS` has exactly 4 CUTE_DOG entries (Oreo, Lily, Pearl, Ronnie) and 4 HIPPY entries (Bob, Joni, Joan, Jerry)
    - Test `SHOP_GUESTS` has exactly 36 total entries
    - Test `INITIAL_GUESTS` has zero CUTE_DOG or HIPPY entries and exactly 10 entries
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3_

- [x] 2. Refactor partyTroubleLimitModifier from stored state to computed signal
  - [x] 2.1 Remove partyTroubleLimitModifier from GameState interface and store initialState
    - Remove `partyTroubleLimitModifier: number` from the `GameState` interface in `game-state.interface.ts`
    - Remove `partyTroubleLimitModifier: 0` from `initialState` in `game.store.ts`
    - _Requirements: 6.1_

  - [x] 2.2 Add partyTroubleLimitModifier as a computed signal and remove mutation method
    - Add `partyTroubleLimitModifier` as a computed signal in the `withComputed` block: `party.reduce((sum, g) => sum + g.properties.peaceValue, 0)`
    - Ensure `partyTroubleLimitModifier` is defined before `effectiveTroubleLimit` in the `withComputed` block so the latter can reference it
    - Remove the `modifyPartyTroubleLimitModifier(delta: number)` method from `withMethods`
    - _Requirements: 6.1, 6.2, 6.3, 7.1_

  - [x] 2.3 Remove manual partyTroubleLimitModifier resets from store methods
    - Remove `partyTroubleLimitModifier: 0` from the `patchState` call in `advancePhase()` (Party phase branch)
    - Remove `partyTroubleLimitModifier: 0` from the `patchState` call in `triggerPartyShutdown()`
    - Remove `partyTroubleLimitModifier: 0` from the `patchState` call in `initializeGame()`
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Existing tests that use `patchState` to set `partyTroubleLimitModifier` directly will break — these must be updated in subsequent tasks.

- [x] 4. Update existing tests for store refactor
  - [x] 4.1 Fix broken store unit tests that reference partyTroubleLimitModifier as stored state
    - Update any tests in `game.store.spec.ts` that use `patchState` to set `partyTroubleLimitModifier` — replace with setting the `party` array to contain guests with appropriate `peaceValue` instead
    - Update any tests that assert `partyTroubleLimitModifier` as an initial state value — assert it as a computed signal returning 0 when party is empty
    - Remove any tests for the deleted `modifyPartyTroubleLimitModifier()` method
    - _Requirements: 6.1, 6.2, 6.3, 7.4, 8.1, 8.2, 8.3_

  - [x] 4.2 Fix broken store property tests that reference partyTroubleLimitModifier as stored state
    - Update any property tests in `game.store.property.spec.ts` that set `partyTroubleLimitModifier` via `patchState` — replace with setting the `party` array with peace guests
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 4.3 Add store unit tests for computed partyTroubleLimitModifier and peace guest shop behavior
    - Test `partyTroubleLimitModifier()` is 0 when party is empty
    - Test `partyTroubleLimitModifier()` is 1 when party has one guest with `peaceValue: 1`
    - Test `partyTroubleLimitModifier()` is 2 when party has two guests with `peaceValue: 1`
    - Test `effectiveTroubleLimit()` is 3 when `baseTroubleLimit` is 2 and one peace guest is in party
    - Test `modifyPartyTroubleLimitModifier` method does not exist on the store
    - Test after `initializeGame()`, shopInventory has entries for CUTE_DOG (4 guests, cost 7) and HIPPY (4 guests, cost 4)
    - Test after `initializeGame()`, deck contains zero CUTE_DOG or HIPPY guests
    - Test `purchasableShopItems()` returns 9 types in correct order: Old Friend, Monkey, Rich Pal, Hippy, Rock Star, Gangster, Cute Dog, Gambler, Auctioneer
    - _Requirements: 4.3, 5.2, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 11.2_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Add property-based tests for peace mechanics
  - [ ]* 6.1 Write property test: partyTroubleLimitModifier equals sum of party peace
    - **Property 1: partyTroubleLimitModifier Equals Sum of Party Peace**
    - Generate random party compositions (varying guest types and counts, including peace types with peaceValue > 0 and non-peace types with peaceValue 0). Set the party in the store. Verify `partyTroubleLimitModifier()` equals the sum of `peaceValue` across all party guests.
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.4, 8.1, 8.2, 8.3**

  - [ ]* 6.2 Write property test: effective trouble limit reflects peace
    - **Property 2: Effective Trouble Limit Reflects Peace**
    - Generate random party compositions and random `baseTroubleLimit` values. Set both in the store. Verify `effectiveTroubleLimit()` equals `Math.max(0, baseTroubleLimit + sum of party peaceValues)`.
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 6.3 Write property test: peace guest purchase flow
    - **Property 3: Peace Guest Purchase Flow**
    - Generate a random peace guest type (CUTE_DOG or HIPPY). Initialize the game, set popularity high enough. Perform a purchase. Verify success, deck grew by 1, correct type and name, popularity decreased by cost, shop stock decreased by 1.
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 6.4 Write property test: peace guest resource contributions
    - **Property 4: Peace Guest Resource Contributions**
    - Generate random party compositions containing at least one peace guest type. Verify the store's computed `trouble()`, popularity calculation, money calculation, and `partyTroubleLimitModifier()` all include the correct per-guest contributions matching `GUEST_TYPE_DEFAULTS`.
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 6.5 Write property test: guest conservation at 46
    - **Property 5: Guest Conservation at 46**
    - Generate random sequences of game operations including purchases of peace types. After each operation, verify `deck.length + party.length + discard.length + sum(shopInventory[*].guests.length) === 46`.
    - **Validates: Requirements 14.1**

  - [ ]* 6.6 Write property test: trouble display reflects peace-adjusted limit
    - **Property 6: Trouble Display Reflects Peace-Adjusted Limit**
    - Generate random party compositions with at least one peace guest during Party phase. Render StatusPaneComponent. Verify the displayed text matches "{trouble} / {effectiveTroubleLimit}" where the limit includes peace contributions.
    - **Validates: Requirements 13.1, 13.2**

- [ ] 7. Update component tests for peace guest types
  - [ ]* 7.1 Add phase-content component tests for peace guest shop cards
    - Test that during BUY phase, shop cards for CUTE_DOG and HIPPY are rendered with correct labels and costs
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 7.2 Add guest-card component tests for peace guest rendering
    - Test GuestCardComponent renders "Cute Dog" header and guest name for a CUTE_DOG guest
    - Test GuestCardComponent renders "Hippy" header and guest name for a HIPPY guest
    - _Requirements: 12.1, 12.2_

  - [ ]* 7.3 Add status-pane component test for peace-adjusted trouble display
    - Test that during Party phase with one peace guest, trouble displays as "0 / 3" (baseTroubleLimit 2 + 1 peace)
    - _Requirements: 13.1, 13.2_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 4.1 and 4.2 are critical — the store refactor in tasks 2.1–2.3 will break existing tests that set `partyTroubleLimitModifier` via `patchState`; those tests must be updated to set the `party` array with peace guests instead
- Each property test references a specific correctness property from the design document
- The computed signal ordering in task 2.2 is important: `partyTroubleLimitModifier` must be defined before `effectiveTroubleLimit` in the `withComputed` block
