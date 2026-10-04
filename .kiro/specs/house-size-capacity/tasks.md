# Implementation Plan: House Size Capacity

## Overview

Bottom-up implementation starting with store state and logic, then computed signals, then UI components. Each layer is tested before building the next. The store gains `houseCapacity`, `expansionsPurchased`, and `showHouseFullMessage` state fields, four computed signals, and a `purchaseExpansion()` method. The `inviteGuest()` method gets a capacity guard. UI changes add the Expand House shop item, card shadows, modals, and vertical scrolling.

## Tasks

- [x] 1. Add house capacity state and expansion types to the store
  - [x] 1.1 Add `ExpansionPurchaseResult` type, new state fields, and updated `initialState` in `game.store.ts`
    - Add `ExpansionPurchaseResult` discriminated union type export
    - Add `houseCapacity: number`, `expansionsPurchased: number`, `showHouseFullMessage: boolean` to `GameStoreState`
    - Set defaults in `initialState`: `houseCapacity: 5`, `expansionsPurchased: 0`, `showHouseFullMessage: false`
    - _Requirements: 1.1, 7.1, 10.3_

  - [x] 1.2 Write property test: initial state invariants
    - **Property 1: For any valid turn count, `initializeGame(n)` sets `houseCapacity` to 5, `expansionsPurchased` to 0, and `showHouseFullMessage` to false**
    - **Validates: Requirements 1.1, 7.1**

  - [x] 1.3 Write unit tests for initial state fields
    - Verify `houseCapacity` is 5 after `initializeGame()`
    - Verify `expansionsPurchased` is 0 after `initializeGame()`
    - Verify `showHouseFullMessage` is false after `initializeGame()`
    - _Requirements: 1.1, 7.1_

- [x] 2. Add computed signals for expansion cost, stock, empty slots, and house full
  - [x] 2.1 Add `expansionCost`, `expansionStock`, `emptySlots`, and `isHouseFull` computed signals in `withComputed` block of `game.store.ts`
    - `expansionCost`: `Math.min(store.expansionsPurchased() + 2, 12)`
    - `expansionStock`: `29 - store.expansionsPurchased()`
    - `emptySlots`: `Math.max(0, store.houseCapacity() - store.party().length)`
    - `isHouseFull`: `store.party().length >= store.houseCapacity()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 8.1, 2.1_

  - [x] 2.2 Write property test: expansion cost formula
    - **Property 2: For any `expansionsPurchased` in [0, 29], `expansionCost` equals `min(expansionsPurchased + 2, 12)`**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 2.3 Write property test: expansion stock derivation
    - **Property 3: For any `expansionsPurchased` in [0, 29], `expansionStock` equals `29 - expansionsPurchased`**
    - **Validates: Requirements 7.1, 7.2**

  - [x] 2.4 Write property test: empty slots and house full consistency
    - **Property 4: For any `houseCapacity` >= 0 and `party.length` in [0, houseCapacity], `emptySlots` equals `houseCapacity - party.length` and `isHouseFull` is true iff `party.length >= houseCapacity`**
    - **Validates: Requirements 8.1, 8.4, 2.1**

- [x] 3. Implement `purchaseExpansion()` method in the store
  - [x] 3.1 Add `purchaseExpansion()` to `withMethods` in `game.store.ts`
    - Check `expansionsPurchased >= 29` → return sold_out
    - Check `money < expansionCost` → return insufficient_money with "Not enough money!"
    - On success: increment `houseCapacity` by 1, increment `expansionsPurchased` by 1, deduct cost from `money`
    - Return `ExpansionPurchaseResult`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.3, 7.1_

  - [x] 3.2 Write property test: successful expansion preserves invariants
    - **Property 5: After a successful `purchaseExpansion()`, `houseCapacity` equals previous + 1, `expansionsPurchased` equals previous + 1, and `money` equals previous minus the cost at time of purchase**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 3.3 Write property test: failed expansion leaves state unchanged
    - **Property 6: When `money < expansionCost` or `expansionsPurchased >= 29`, `purchaseExpansion()` returns failure and `houseCapacity`, `expansionsPurchased`, and `money` are unchanged**
    - **Validates: Requirements 6.1, 6.3, 7.1**

  - [x] 3.4 Write unit tests for `purchaseExpansion()` edge cases
    - Test purchase with exactly enough money
    - Test purchase with 1 money short
    - Test purchase when stock is 0 (29 purchased)
    - Test cost cap at $12 after 10+ purchases
    - _Requirements: 4.4, 5.1, 6.1, 6.3_

- [x] 4. Modify `inviteGuest()` with house capacity guard
  - [x] 4.1 Add capacity check to `inviteGuest()` in `game.store.ts`
    - Before drawing from deck, check `party.length >= houseCapacity`
    - If full, set `showHouseFullMessage: true` and return early
    - Clear `showHouseFullMessage` on successful invite
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Write property test: invite guard enforces capacity
    - **Property 7: When `party.length >= houseCapacity`, calling `inviteGuest()` does not change `party` or `deck` and sets `showHouseFullMessage` to true**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 4.3 Write unit tests for invite capacity guard
    - Test invite succeeds when party < capacity
    - Test invite blocked when party == capacity
    - Test `showHouseFullMessage` flag set/cleared correctly
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 5. Update `initializeGame()` and `resetGame()` for new state fields
  - [x] 5.1 Modify `initializeGame()` in `game.store.ts` to set `houseCapacity: 5`, `expansionsPurchased: 0`, `showHouseFullMessage: false`
    - _Requirements: 1.1, 7.1, 10.3_

  - [x] 5.2 Write unit tests for reset and persistence
    - Verify `resetGame()` resets `houseCapacity` to 5 and `expansionsPurchased` to 0
    - Verify capacity persists across `advancePhase()` (BUY→PARTY→BUY)
    - Verify capacity persists through `triggerPartyShutdown()`
    - _Requirements: 10.1, 10.2, 10.3, 1.2_

- [x] 6. Checkpoint - Ensure all store-layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add Expand House item to shop UI in PhaseContentComponent
  - [x] 7.1 Add expansion shop card, local signals, and handlers in `phase-content.component.ts`
    - Add `expansionErrorMessage = signal<string | null>(null)` local signal
    - Add `emptySlotArray` helper: `() => Array.from({ length: this.gameStore.emptySlots() }, (_, i) => i)`
    - Add `onPurchaseExpansion()` method calling `gameStore.purchaseExpansion()` and setting error on failure
    - Add `dismissHouseFullMessage()` method patching `showHouseFullMessage` to false via a store method
    - Add `dismissExpansionError()` method clearing local signal
    - Render Expand House button after `@for` loop of `purchasableShopItems`, shown when `gameStore.expansionStock() > 0`
    - Display cost with "$" prefix, stock as "Available: N"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2_

  - [x] 7.2 Write unit tests for Expand House shop item rendering
    - Verify expansion card appears as last shop item during BUY phase
    - Verify expansion card hidden when stock is 0
    - Verify expansion card hidden during PARTY phase
    - Verify cost displays with "$" prefix
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Add card shadows during PARTY phase in PhaseContentComponent
  - [x] 8.1 Render card shadow placeholders in the party guest area of `phase-content.component.ts`
    - Add `card-shadow` divs using `@for` over `emptySlotArray()` after guest cards
    - Style card shadows as muted placeholders matching guest card dimensions
    - Shadows only render during PARTY phase
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 8.2 Write unit tests for card shadow rendering
    - Verify shadow count equals `houseCapacity - party.length`
    - Verify zero shadows when party is full
    - Verify shadows not rendered during BUY phase
    - _Requirements: 8.1, 8.3, 8.4_

- [x] 9. Add House Full modal and Expansion Error modal in PhaseContentComponent
  - [x] 9.1 Add modal templates and styles in `phase-content.component.ts`
    - House Full modal: shown when `gameStore.showHouseFullMessage()` is true, message "The house is full!", OK button calls `dismissHouseFullMessage()`
    - Expansion Error modal: shown when `expansionErrorMessage()` is non-null, displays message, OK button calls `dismissExpansionError()`
    - Reuse existing modal overlay styling pattern
    - _Requirements: 2.2, 2.3, 6.1, 6.2_

  - [x] 9.2 Write unit tests for modal display and dismissal
    - Verify House Full modal appears when `showHouseFullMessage` is true
    - Verify House Full modal dismissed on OK click
    - Verify Expansion Error modal appears with "Not enough money!" message
    - Verify Expansion Error modal dismissed on OK click
    - _Requirements: 2.2, 2.3, 6.1, 6.2_

- [x] 10. Update GameplayComponent layout for vertical scrolling
  - [x] 10.1 Modify styles in `gameplay.component.ts`
    - Main pane: `overflow-y: auto; overflow-x: hidden`
    - Status pane: `overflow: hidden; position: sticky; top: 0; height: 100vh`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.2 Write unit tests for layout overflow behavior
    - Verify main content area has `overflow-y: auto`
    - Verify status pane has `position: sticky` and `overflow: hidden`
    - _Requirements: 9.1, 9.3, 9.4_

- [x] 11. Add `dismissHouseFullMessage()` method to the store
  - Add a method in `withMethods` of `game.store.ts` that patches `showHouseFullMessage` to false
  - This allows the PhaseContentComponent to dismiss the modal via a clean store API
  - _Requirements: 2.3_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the store layer (task 6) and after full integration (task 13)
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript (Angular + NgRx SignalStore)
