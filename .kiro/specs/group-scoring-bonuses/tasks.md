# Implementation Plan: Group Scoring Bonuses

## Overview

Add the `groupScore` trigger and `scoreBonus` `amounts`, move bonus scoring into helpers and add a third settled step for group bonuses, then add the Dancer. Tasks 1–2 don't change play on their own, because no built-in type has a `groupScore` effect until task 4.

## Tasks

- [x] 1. groupScore and amounts
  - [x] 1.1 Add `'groupScore'` to `Trigger`, `TRIGGERS` and `triggerPhrase` ("once per group when scored"); let `scoreBonus` allow it
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Add `amounts` to `scoreBonus`: validation (exactly one of `amount` and `amounts`, non-empty integer list) and lookup in `run`
    - _Requirements: 2.1–2.6_
  - [x] 1.3 Unit tests for the trigger and `amounts`, JSON parsing, arbitraries that cover both; property test 1
    - _Requirements: 1.1, 1.2, 2.1–2.6_

- [x] 2. Scoring pass
  - [x] 2.1 Add `scoreOwnBonuses` and `scoreGroupBonuses` to the store (group effects once per type, as its first guest's); in `advancePhase`, settle after own bonuses, then run group bonuses and settle again
    - _Requirements: 1.3, 3.1–3.6_
  - [x] 2.2 Store tests with test-only group types: one payout per type, two group types, mixed with per-guest bonuses, group money not covering an own-bonus shortfall, nothing on bust or win or entrance; property tests 2 and 4
    - _Requirements: 1.3, 3.1–3.5_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Dancer
  - [x] 4.1 Add `DANCER` to `BuiltInGuestType`, `BUILT_IN_GUEST_TYPES` and the default shop with Fred, Carlton, Elaine and Jennifer
    - _Requirements: 4.1–4.5_
  - [x] 4.2 Update counts that include every shop guest (118 → 122 conservation, 27 → 28 shop types, order lists)
    - _Requirements: 4.4_
  - [x] 4.3 Store tests: 1–4 Dancers score 1, 4, 9, 16; Dancers with other bonus guests; property tests 3 and 5
    - _Requirements: 4.2_
  - [x] 4.4 Card tests: the Dancer shows 💃 and no values, between Cute Dog and Gambler in the shop
    - _Requirements: 4.3, 4.6_
  - [x] 4.5 Update `product.md` and clear the Dancer from the scratchpad
    - _Requirements: 4.1–4.4_

- [x] 5. Final checkpoint — Ensure all tests pass and `ng build` succeeds; buy Dancers in the app and check that a party with several scores the group bonus once
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Builds on scoring-bonuses (PR #20); this branch is stacked on it
- Task 2.2 uses test-only types so the scoring pass is tested apart from the Dancer

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5"] }
  ]
}
```
