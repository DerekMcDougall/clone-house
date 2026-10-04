# Implementation Plan: Rich Pal & Money Resource

## Overview

Add the Rich Pal guest type and money resource to the party game. This involves extending the guest model with `RICH_PAL` and `moneyValue`, adding `money` to game state, calculating money at Party phase end, expanding the starting deck to 10 guests, and displaying money in the status pane.

## Tasks

- [x] 1. Extend guest model with RICH_PAL type and moneyValue property
  - [x] 1.1 Add `RICH_PAL` to `GuestType` union, add `moneyValue: number` to `GuestProperties`, add RICH_PAL entry to `GUEST_TYPE_DEFAULTS` (popularityValue: 0, troubleValue: 0, moneyValue: 1), and add `moneyValue: 0` to OLD_FRIEND and WILD_BUDDY defaults
    - Modify `angular-pwa-app/src/app/models/guest.model.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [x] 1.2 Expand `INITIAL_GUESTS` to 10 entries: add Rich Pal guests Khalil and Renata
    - Modify `angular-pwa-app/src/app/models/guest.model.ts`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 9.1, 9.2_

  - [x] 1.3 Write property test: All Guest Types Define Money Value (Property 8)
    - **Property 8: All Guest Types Define Money Value**
    - **Validates: Requirements 2.1, 2.2**
    - Verify every key in `GUEST_TYPE_DEFAULTS` has an integer `moneyValue`
    - Add to `angular-pwa-app/src/app/models/guest.model.property.spec.ts`

  - [x] 1.4 Update unit tests for guest model
    - Verify RICH_PAL defaults (popularityValue 0, troubleValue 0, moneyValue 1)
    - Verify OLD_FRIEND and WILD_BUDDY have moneyValue 0
    - Verify INITIAL_GUESTS has 10 entries (4 OLD_FRIEND, 4 WILD_BUDDY, 2 RICH_PAL)
    - Verify Rich Pal names are Khalil and Renata
    - Verify all names in INITIAL_GUESTS are unique
    - Update `angular-pwa-app/src/app/models/guest.model.spec.ts`
    - _Requirements: 1.1–1.4, 2.1–2.4, 9.1, 9.2, 10.1–10.4_

- [x] 2. Add money to game state and store
  - [x] 2.1 Add `money: number` to `GameState` interface
    - Modify `angular-pwa-app/src/app/models/game-state.interface.ts`
    - _Requirements: 3.1_

  - [x] 2.2 Add `money: 0` to `initialState` in GameStore, add private `calculateMoneyChange()` method, update `initializeGame()` to set `money: 0` and create 10-guest deck, update `resetGame()` to reset money to 0
    - Modify `angular-pwa-app/src/app/stores/game.store.ts`
    - _Requirements: 3.1, 3.2, 5.1, 5.2_

  - [x] 2.3 Update `advancePhase()` in GameStore: when Party phase ends, calculate money change from party guests, apply `Math.max(0, currentMoney + moneyChange)`, and patch state with new money alongside popularity
    - Modify `angular-pwa-app/src/app/stores/game.store.ts`
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 11.1, 11.2, 11.3_

  - [x] 2.4 Write property test: Money Non-Negative Invariant (Property 1)
    - **Property 1: Money Non-Negative Invariant**
    - **Validates: Requirements 4.1, 4.2, 5.4**
    - Generate random sequences of operations, verify money >= 0 after each
    - Add to `angular-pwa-app/src/app/stores/game.store.property.spec.ts`

  - [x] 2.5 Write property test: Money Calculation Formula (Property 2)
    - **Property 2: Money Calculation Formula**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Generate random party compositions, verify money change equals sum of moneyValue
    - Add to `angular-pwa-app/src/app/stores/game.store.property.spec.ts`

  - [x] 2.6 Write property test: Money Preservation During Non-Party Transitions (Property 3)
    - **Property 3: Money Preservation During Non-Party Transitions**
    - **Validates: Requirements 6.1, 6.2**
    - Verify money unchanged when advancing from Buy to Party phase
    - Add to `angular-pwa-app/src/app/stores/game.store.property.spec.ts`

  - [x] 2.7 Write property test: Money Accumulation Across Turns (Property 4)
    - **Property 4: Money Accumulation Across Turns**
    - **Validates: Requirements 6.3**
    - Verify money accumulates correctly over multiple turns with clamping
    - Add to `angular-pwa-app/src/app/stores/game.store.property.spec.ts`

  - [x] 2.8 Write property test: Resource Independence (Property 9)
    - **Property 9: Resource Independence**
    - **Validates: Requirements 11.1, 11.2, 11.3**
    - Verify money, popularity, and trouble are calculated independently
    - Add to `angular-pwa-app/src/app/stores/game.store.property.spec.ts`

  - [x] 2.9 Update unit tests for game store
    - Verify deck has 10 guests after initializeGame()
    - Verify money is 0 after initializeGame() and resetGame()
    - Verify money unchanged when party has no Rich Pals at phase end
    - Verify money increases by 1 when party has 1 Rich Pal at phase end
    - Update `angular-pwa-app/src/app/stores/game.store.spec.ts`
    - _Requirements: 3.1, 3.2, 5.1–5.4, 10.1_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update UI components for Rich Pal and money display
  - [x] 4.1 Add `RICH_PAL: 'Rich Pal'` to `GUEST_TYPE_LABELS` in GuestCardComponent
    - Modify `angular-pwa-app/src/app/components/guest-card.component.ts`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 4.2 Add money display to StatusPaneComponent template between popularity and turns remaining, add `.money-count` CSS styling
    - Modify `angular-pwa-app/src/app/components/status-pane.component.ts`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 4.3 Write property test: Guest Card Header Matches Type Label (Property 6)
    - **Property 6: Guest Card Header Matches Type Label**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Generate random guests of any type, verify header text matches label map
    - Add to `angular-pwa-app/src/app/components/guest-card.component.property.spec.ts`

  - [x] 4.4 Write property test: Status Pane Displays Current Money (Property 5)
    - **Property 5: Status Pane Displays Current Money**
    - **Validates: Requirements 7.1, 7.3**
    - Generate random money values, verify displayed value matches store
    - Add to `angular-pwa-app/src/app/components/status-pane.component.property.spec.ts`

  - [x] 4.5 Update unit tests for UI components
    - StatusPaneComponent: money element present with correct value, money appears between popularity and turns remaining in DOM order
    - GuestCardComponent: "Rich Pal" header for RICH_PAL type
    - Update `angular-pwa-app/src/app/components/status-pane.component.spec.ts` and `angular-pwa-app/src/app/components/guest-card.component.spec.ts`
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

- [x] 5. Update existing tests for 10-guest deck and guest name uniqueness
  - [x] 5.1 Update any existing tests that assert deck size of 8 to assert 10, and update guest conservation invariant (deck + party === 10)
    - Check and update `angular-pwa-app/src/app/stores/game.store.spec.ts`, `angular-pwa-app/src/app/stores/game.store.property.spec.ts`, `angular-pwa-app/src/app/gameplay.integration.spec.ts`, and any other files referencing deck size 8
    - _Requirements: 10.1_

  - [x] 5.2 Write property test: All Guest Names Unique (Property 7)
    - **Property 7: All Guest Names Unique**
    - **Validates: Requirements 9.1, 9.2**
    - Verify all guest names across deck + party are unique after game operations
    - Add to `angular-pwa-app/src/app/stores/game.store.property.spec.ts`

- [x] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript throughout (Angular + NgRx SignalStore)
- Existing tests asserting deck size 8 or guest conservation of 8 must be updated to 10
