# Implementation Plan: Scoring Bonuses

## Overview

Add the `score` trigger and the per-kind trigger check, then the `scoreBonus` kind and scoring, then styled icons, then the five guest types. Tasks 1–3 don't change play on their own, because no built-in type has a `score` effect until task 5.

## Tasks

- [x] 1. The score trigger
  - [x] 1.1 Add `'score'` to `Trigger`, `TRIGGERS` and `triggerPhrase` ("when scored")
    - _Requirements: 1.1_
  - [x] 1.2 Add `triggers` to `ActionKind` (default `['entrance']`) and reject an effect whose kind doesn't allow its trigger, nested actions included
    - _Requirements: 1.2, 1.3_
  - [x] 1.3 Unit tests for the trigger check (top level, nested in `chooseGuest`, JSON) and property test 4
    - _Requirements: 1.2, 1.3_

- [x] 2. scoreBonus and scoring
  - [x] 2.1 Add `getHouseCapacity()` to `GameStateView`, `EffectContextImpl` and the store's view; update test fakes of the context
    - _Requirements: 2.2_
  - [x] 2.2 Add the `scoreBonus` kind: validation with paths, `run`, given icons, `triggers: ['score']`; register it with the built-ins
    - _Requirements: 2.1–2.5_
  - [x] 2.3 In `advancePhase`, extract the floor and money penalty into `settle`; settle normal scoring as today, then run every party guest's `score` effects on the settled totals and settle again
    - _Requirements: 1.4, 3.1–3.5_
  - [x] 2.4 Unit tests for `scoreBonus` (each count, `houseFull`, flat, money, unknown `guestType`, validation) and for scoring with a test-only bonus type (bonus added after normal scoring, bonus money not offsetting a normal-scoring shortfall, nothing on bust or win); add score-trigger `scoreBonus` effects to `arbDataOnlyEffect`
    - _Requirements: 2.1–2.5, 3.1–3.5_
  - [x] 2.5 Property tests 1, 2 and 3
    - **Property 1: Bonus Formula** — **Validates: Requirements 2.2, 2.3**
    - **Property 2: Scoring Is Normal Amounts Plus Bonuses** — **Validates: Requirements 3.1, 3.2, 3.3**
    - **Property 3: No Bonuses Without Scoring** — **Validates: Requirement 3.4**

- [x] 3. Styled icons
  - [x] 3.1 Add optional `color` and `bold` to `GuestIcon`; accept and validate them in given icons; apply them in `guest-details`
    - _Requirements: 5.1–5.4_
  - [x] 3.2 Tests: validation (including JSON), a colored bold icon renders with its color and weight, existing icons unchanged
    - _Requirements: 5.1–5.4_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Bonus guest types
  - [ ] 5.1 Add `COMEDIAN`, `MASCOT`, `INTROVERT`, `BARTENDER` and `WRITER` to `BuiltInGuestType`, `BUILT_IN_GUEST_TYPES` and the default shop with their names
    - _Requirements: 4.1–4.4_
  - [ ] 5.2 Update counts that include every shop guest (98 → 118 conservation, shop size and type lists)
    - _Requirements: 4.3_
  - [ ] 5.3 Store tests for each type's bonus in a real party, including an expansion changing the Introvert's and Comedian's bonuses
    - _Requirements: 3.1, 4.1_
  - [ ] 5.4 Card tests: each type's icon in the shop and house, left of any trouble icon; the Mascot's bold "O" and the Writer's bold gold "X"
    - _Requirements: 4.2, 5.2, 5.5_
  - [ ] 5.5 Property test 5
    - **Property 5: Guest Conservation** — **Validates: Requirement 4.3**

- [ ] 6. Final checkpoint — Ensure all tests pass and `ng build` succeeds; buy each bonus guest in the app, end parties with and without its condition met, and check the totals and icons
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks 1–3 don't change play on their own and can be their own PR
- Task 2.4 uses a test-only type so scoring is tested apart from the real guest types

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2"] },
    { "id": 2, "tasks": ["1.3", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5"] }
  ]
}
```
