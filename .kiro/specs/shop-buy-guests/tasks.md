# Implementation Plan: Shop Buy Guests

## Overview

Bottom-up implementation: model constants first, then store state/logic, then UI components. Tests are placed alongside each layer to catch errors early.

## Tasks

- [x] 1. Add shop constants to guest model
  - [x] 1.1 Add GUEST_TYPE_COSTS and SHOP_GUESTS constants to guest.model.ts
    - Add `GUEST_TYPE_COSTS: Record<GuestType, number | null>` with OLD_FRIEND=2, RICH_PAL=3, WILD_BUDDY=null
    - Add `SHOP_GUESTS: readonly { type: GuestType; name: string }[]` with Old Friends (Matt, Chad, Wes, Caleb) and Rich Pals (Kevin, Arlene, Robert, Jim)
    - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2_

  - [x] 1.2 Write unit tests for model constants in guest.model.spec.ts
    - GUEST_TYPE_COSTS has OLD_FRIEND = 2, RICH_PAL = 3, WILD_BUDDY = null
    - SHOP_GUESTS has 4 OLD_FRIEND entries and 4 RICH_PAL entries, no WILD_BUDDY entries
    - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2_

- [x] 2. Extend store with shop types, state, and logic
  - [x] 2.1 Add ShopInventoryEntry interface and PurchaseResult type to game.store.ts
    - Add `ShopInventoryEntry` interface with `type: GuestType`, `guests: Guest[]`, `cost: number`
    - Add `PurchaseResult` discriminated union type (success | sold_out | insufficient_popularity)
    - _Requirements: 1.1, 3.1, 4.1, 5.1_

  - [x] 2.2 Extend GameStoreState with shopInventory and update initialState
    - Add `shopInventory: ShopInventoryEntry[]` to `GameStoreState`
    - Set `shopInventory: []` in `initialState`
    - _Requirements: 1.1, 6.1_

  - [x] 2.3 Add purchasableShopItems computed signal
    - Filter shop inventory entries, sort by ascending cost then alphabetically by GUEST_TYPE_LABELS
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 2.4 Modify initializeGame() to build shop inventory from SHOP_GUESTS
    - Build ShopInventoryEntry[] from SHOP_GUESTS, filtering out types with null cost
    - Create full Guest objects with properties from GUEST_TYPE_DEFAULTS
    - Patch shopInventory into store state
    - _Requirements: 1.1, 1.5, 7.1, 7.2_

  - [x] 2.5 Add purchaseGuest() method with validation, random selection, and PurchaseResult return
    - Check stock > 0 (return sold_out error if not)
    - Check popularity >= cost (return insufficient_popularity error if not)
    - Random select guest via Math.floor(Math.random() * guests.length)
    - Remove selected guest from shopInventory, add to deck, deduct cost from popularity
    - Return PurchaseResult
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 4.1, 5.1, 8.1, 8.2, 8.3_

  - [x] 2.6 Write property tests for store shop logic (Properties 1–6, 8) in game.store.property.spec.ts
    - **Property 1: Shop + Game Guest Conservation Invariant**
    - **Validates: Requirements 3.1, 3.3, 3.6, 8.2**
    - **Property 2: Popularity Deduction Equals Cost on Successful Purchase**
    - **Validates: Requirements 3.2**
    - **Property 3: Shop Stock Decrements by Exactly 1 on Successful Purchase**
    - **Validates: Requirements 3.3, 8.2**
    - **Property 4: Purchase Rejected When Stock Is 0 — Store State Unchanged**
    - **Validates: Requirements 4.1**
    - **Property 5: Purchase Rejected When Popularity < Cost — Store State Unchanged**
    - **Validates: Requirements 5.1**
    - **Property 6: Purchased Guest Has Valid Name from Shop Pool**
    - **Validates: Requirements 3.1, 7.3, 8.1**
    - **Property 8: Shop Inventory Persists Across Turn Transitions**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 2.7 Write unit tests for store shop logic in game.store.spec.ts
    - initializeGame() creates 2 shop entries (OLD_FRIEND, RICH_PAL) with correct names, counts, and costs
    - No WILD_BUDDY entry exists after initialization
    - purchaseGuest() with valid state returns success and adds guest to deck
    - purchaseGuest() with 0 stock returns sold_out with correct message
    - purchaseGuest() with insufficient popularity returns insufficient_popularity with correct message
    - purchaseGuest() with exactly enough popularity succeeds
    - purchaseGuest() last guest of a type succeeds deterministically
    - resetGame() sets shopInventory to empty array
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.2, 3.3, 4.1, 5.1, 6.1, 8.3_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add shop UI to PhaseContentComponent
  - [x] 4.1 Add shop cards and purchase handling to PhaseContentComponent
    - Import signal, GuestType, GUEST_TYPE_LABELS into phase-content.component.ts
    - Add local signals: shopErrorMessage = signal<string | null>(null), shopAddedFeedback = signal<GuestType | null>(null)
    - Add onPurchaseGuest(type) method: call gameStore.purchaseGuest(), inspect result, set shopAddedFeedback on success (with setTimeout to clear after ~1.5s), set shopErrorMessage on failure
    - Add dismissShopError() method to clear shopErrorMessage
    - Render shop cards during BUY phase from gameStore.purchasableShopItems() with type label, icon, "Price: {cost}", "Available: {guests.length}"
    - Shop cards are buttons with click handler calling onPurchaseGuest(item.type)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 7.4_

  - [x] 4.2 Add shop error modal to PhaseContentComponent
    - Render error modal overlay when shopErrorMessage() is non-null
    - Display message text and "OK" button that calls dismissShopError()
    - Use role="dialog", aria-modal="true" for accessibility
    - _Requirements: 4.1, 4.2, 5.1, 5.2_

  - [x] 4.3 Add "Added!" feedback with CSS animation
    - Conditionally render "Added!" text on shop card when shopAddedFeedback() matches item.type
    - Add CSS fade-out animation for the added-feedback class
    - _Requirements: 3.4, 3.5_

  - [x] 4.4 Add CSS styles for shop cards, error modal, and feedback
    - Style shop-cards-container, shop-card, shop-price, shop-stock
    - Style shop-error-overlay, shop-error-modal, shop-error-button
    - Style added-feedback with fade animation keyframes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2_

  - [x] 4.5 Write property test for shop display order (Property 7) in phase-content.component.property.spec.ts
    - **Property 7: Shop Display Order Is Sorted by Cost Then Alphabetically**
    - **Validates: Requirements 9.1, 9.2**

  - [x] 4.6 Write unit tests for shop UI in phase-content.component.spec.ts
    - During BUY phase, shop cards rendered for each purchasable type
    - Shop cards show type label, price, and available stock but not guest names
    - During PARTY phase, shop is not displayed
    - Error modal appears when shopErrorMessage signal is set
    - Error modal OK button calls dismissShopError() and clears the signal
    - "Added!" text appears when shopAddedFeedback matches card type
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 4.1, 4.2, 5.1, 5.2, 7.4, 9.3_

- [x] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
