# Implementation Plan: Negative Resources

## Overview

Add two new guest types (Caterer and Ticket Taker) with negative resource values, and implement the money deficit penalty logic in `advancePhase()`. The existing components auto-render new types from model constants, so no component changes are needed. Existing tests with hardcoded counts must be updated to reflect the expanded guest pool (44 shop guests, 54 total, 11 shop types).

## Tasks

- [x] 1. Add CATERER and TICKET_TAKER guest types to the model
  - [x] 1.1 Extend GuestType union, GUEST_TYPE_DEFAULTS, GUEST_TYPE_LABELS, GUEST_TYPE_COSTS, and SHOP_GUESTS in `guest.model.ts`
    - Add `'CATERER' | 'TICKET_TAKER'` to the `GuestType` union
    - Add CATERER defaults: `{ popularityValue: 4, troubleValue: 0, moneyValue: -1, peaceValue: 0 }`
    - Add TICKET_TAKER defaults: `{ popularityValue: -1, troubleValue: 0, moneyValue: 2, peaceValue: 0 }`
    - Add labels: CATERER → `'Caterer'`, TICKET_TAKER → `'Ticket Taker'`
    - Add costs: CATERER → `5`, TICKET_TAKER → `4`
    - Add 8 SHOP_GUESTS entries: 4 Caterers (Ronald, Wendy, Mario, Tim) and 4 Ticket Takers (Val, Grant, Mark, Stubby)
    - INITIAL_GUESTS remains unchanged (no CATERER or TICKET_TAKER entries)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.4, 4.1, 4.2, 4.3_

  - [ ] 1.2 Write unit tests for CATERER and TICKET_TAKER model constants
    - Test `GUEST_TYPE_DEFAULTS['CATERER']` has values (4, 0, -1, 0)
    - Test `GUEST_TYPE_DEFAULTS['TICKET_TAKER']` has values (-1, 0, 2, 0)
    - Test `GUEST_TYPE_LABELS['CATERER']` is `'Caterer'` and `GUEST_TYPE_LABELS['TICKET_TAKER']` is `'Ticket Taker'`
    - Test `GUEST_TYPE_COSTS['CATERER']` is 5 and `GUEST_TYPE_COSTS['TICKET_TAKER']` is 4
    - Test SHOP_GUESTS has exactly 4 CATERER entries with names Ronald, Wendy, Mario, Tim
    - Test SHOP_GUESTS has exactly 4 TICKET_TAKER entries with names Val, Grant, Mark, Stubby
    - Test SHOP_GUESTS has exactly 44 total entries
    - Test INITIAL_GUESTS has zero CATERER or TICKET_TAKER entries and remains at 10
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.4, 4.1, 4.2, 4.3_

- [x] 2. Rewrite advancePhase() Party branch with money deficit penalty logic
  - [x] 2.1 Implement the 4-step resource calculation in the Party branch of `advancePhase()` in `game.store.ts`
    - Define `const MONEY_DEFICIT_PENALTY_RATE = 7` as a local constant inside the method
    - Step 1: `newPopularity = Math.max(0, currentPopularity + popularityChange)`
    - Step 2: `moneyChange = sum of moneyValue across party`
    - Step 3: `moneyDeficit = Math.max(0, -(currentMoney + moneyChange))`, `newMoney = Math.max(0, currentMoney + moneyChange)`
    - Step 4: `finalPopularity = moneyDeficit > 0 ? Math.max(0, newPopularity - moneyDeficit * MONEY_DEFICIT_PENALTY_RATE) : newPopularity`
    - Patch state with `finalPopularity` and `newMoney`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2_

  - [ ] 2.2 Write unit tests for money deficit penalty worked examples in `game.store.spec.ts`
    - Test: 3 money, moneyChange -7 → money 0, popularity penalty 28
    - Test: 0 money, moneyChange -3 → money 0, popularity penalty 21
    - Test: 5 popularity, +2 popChange, deficit 4 → popularity max(0, 7 - 28) = 0
    - Test: no deficit case (5 money, moneyChange -2 → money 3, no penalty)
    - Test: zero deficit (moneyChange >= 0 → no penalty applied)
    - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 2.3 Write property test for party resource contribution sums
    - **Property 1: Party Resource Contribution Sums**
    - Generate random party compositions including CATERER and TICKET_TAKER guests
    - Verify raw popularity change equals sum of `popularityValue` and raw money change equals sum of `moneyValue` across all party guests, including negative values
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 11.1, 11.2**

  - [ ] 2.4 Write property test for end-of-party resource calculation formula
    - **Property 2: End-of-Party Resource Calculation Formula**
    - Generate random starting popularity (0–100), starting money (0–50), and random party compositions including guests with negative resource values
    - Verify final money = `max(0, startMoney + moneyChange)` and final popularity = `max(0, max(0, startPop + popChange) - max(0, -(startMoney + moneyChange)) * 7)`
    - **Validates: Requirements 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update existing tests with new hardcoded counts
  - [x] 4.1 Update hardcoded counts in existing test files
    - `guest.model.spec.ts`: Update SHOP_GUESTS total from 36 → 44
    - `game.store.spec.ts`: Update `shopInventory().length` assertions from 9 → 11 (3 occurrences)
    - `game.store.spec.ts`: Update `purchasableShopItems()` length from 9 → 11 and add TICKET_TAKER/CATERER entries in the expected sort order
    - `game.store.property.spec.ts`: Update `EXPECTED_TOTAL` from 46 → 54
    - _Requirements: 3.4, 12.2, 14.1_

  - [ ] 4.2 Write unit tests for CATERER and TICKET_TAKER shop inventory initialization in `game.store.spec.ts`
    - Test: After `initializeGame()`, shopInventory has entry for CATERER with 4 guests and cost 5
    - Test: After `initializeGame()`, shopInventory has entry for TICKET_TAKER with 4 guests and cost 4
    - Test: After `initializeGame()`, deck contains zero CATERER or TICKET_TAKER guests
    - _Requirements: 3.3, 4.2_

  - [ ] 4.3 Write property test for negative resource guest purchase flow
    - **Property 3: Negative Resource Guest Purchase Flow**
    - Generate a random negative resource guest type (CATERER or TICKET_TAKER), set popularity high enough, perform a purchase
    - Verify success, deck grew by 1, correct type and name from pre-purchase pool, popularity decreased by cost, shop stock decreased by 1
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ] 4.4 Write property test for shop display order with negative resource types
    - **Property 4: Shop Display Order with Negative Resource Types**
    - Verify `purchasableShopItems()` returns all 11 types in correct order: Old Friend (2), Monkey (3), Rich Pal (3), Hippy (4), Ticket Taker (4), Caterer (5), Rock Star (5), Gangster (6), Cute Dog (7), Gambler (7), Auctioneer (9)
    - **Validates: Requirements 12.2**

  - [ ] 4.5 Write property test for guest conservation at 54
    - **Property 5: Guest Conservation at 54**
    - Generate random sequences of game operations including purchases of CATERER and TICKET_TAKER
    - Verify `deck.length + party.length + discard.length + bustPartySnapshot.length + sum(shopInventory[*].guests.length) === 54` after each operation
    - **Validates: Requirements 14.1**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- No component changes needed — existing components auto-render new types from model constants
- The MONEY_DEFICIT_PENALTY_RATE = 7 constant is local to advancePhase(), not exported
- Property tests use fast-check (already installed) with minimum 100 iterations
