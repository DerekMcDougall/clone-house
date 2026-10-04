# Implementation Plan: More Guest Types

## Overview

Add four new guest types (Auctioneer, Gangster, Rock Star, Gambler) to the guest model by extending the `GuestType` union and all associated constants in `guest.model.ts`. No store, component, or template changes needed — existing abstractions handle new types automatically. Total shop guests increase from 12 to 28, and the guest conservation count rises from 22 to 38.

## Tasks

- [x] 1. Add new guest types to guest model constants
  - [x] 1.1 Extend GuestType union, GUEST_TYPE_DEFAULTS, GUEST_TYPE_LABELS, GUEST_TYPE_COSTS, and SHOP_GUESTS in `guest.model.ts`
    - Add `'AUCTIONEER' | 'GANGSTER' | 'ROCK_STAR' | 'GAMBLER'` to the `GuestType` union type
    - Add `AUCTIONEER: { popularityValue: 0, troubleValue: 0, moneyValue: 3 }` to `GUEST_TYPE_DEFAULTS`
    - Add `GANGSTER: { popularityValue: 0, troubleValue: 1, moneyValue: 4 }` to `GUEST_TYPE_DEFAULTS`
    - Add `ROCK_STAR: { popularityValue: 3, troubleValue: 1, moneyValue: 2 }` to `GUEST_TYPE_DEFAULTS`
    - Add `GAMBLER: { popularityValue: 2, troubleValue: 1, moneyValue: 3 }` to `GUEST_TYPE_DEFAULTS`
    - Add `AUCTIONEER: 'Auctioneer'`, `GANGSTER: 'Gangster'`, `ROCK_STAR: 'Rock Star'`, `GAMBLER: 'Gambler'` to `GUEST_TYPE_LABELS`
    - Add `AUCTIONEER: 9`, `GANGSTER: 6`, `ROCK_STAR: 5`, `GAMBLER: 7` to `GUEST_TYPE_COSTS`
    - Add 16 new entries to `SHOP_GUESTS`: 4 Auctioneers (Christie, Sotheby, Phillip, Bonham), 4 Gangsters (Tony, Legs, Louie, Johnny), 4 Rock Stars (Alanis, Gord, Neil, Randy), 4 Gamblers (Kenny, Ace, Jack, Raymond)
    - Verify `INITIAL_GUESTS` has zero entries for any new type (no change needed)
    - _Requirements: 1.1–1.4, 2.1–2.4, 3.1–3.4, 4.1–4.4, 5.1–5.4, 5.6, 6.1, 6.3_

  - [x] 1.2 Write unit tests for new guest type model constants
    - Test `GUEST_TYPE_DEFAULTS` has correct values for all four new types
    - Test `GUEST_TYPE_LABELS` has correct labels: Auctioneer, Gangster, Rock Star, Gambler
    - Test `GUEST_TYPE_COSTS` has correct costs: 9, 6, 5, 7
    - Test `SHOP_GUESTS` has exactly 4 entries per new type with correct names
    - Test `SHOP_GUESTS` has exactly 28 total entries
    - Test `INITIAL_GUESTS` has zero entries for any new type
    - Test `INITIAL_GUESTS` remains at exactly 10 entries
    - _Requirements: 1.1–1.4, 2.1–2.4, 3.1–3.4, 4.1–4.4, 5.1–5.6, 6.1–6.3_

- [x] 2. Verify store initialization and shop display with new guest types
  - [x] 2.1 Write unit tests for store initialization with new types
    - Test `initializeGame()` creates shopInventory entries for each new type with 4 guests and correct cost
    - Test `initializeGame()` deck contains zero guests of any new type
    - Test `purchasableShopItems()` returns all 7 types in correct order: Old Friend (2), Monkey (3), Rich Pal (3), Rock Star (5), Gangster (6), Gambler (7), Auctioneer (9)
    - _Requirements: 5.5, 6.2, 9.1, 9.2_

  - [x] 2.2 Write unit tests for new type shop display and guest card rendering
    - Test PhaseContentComponent renders shop cards for all four new types with correct labels and costs during BUY phase
    - Test each new type shop card shows "Available: 4" initially
    - Test GuestCardComponent renders correct header label and name for each new type
    - _Requirements: 9.1, 9.2, 9.3, 10.1–10.4_

- [x] 3. Checkpoint - Ensure all unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write property tests for new guest type correctness properties
  - [x] 4.1 Write property test for new-type purchase validity
    - **Property 1: New-Type Purchase Yields Valid Guest**
    - Generate a random new guest type from {AUCTIONEER, GANGSTER, ROCK_STAR, GAMBLER}. Initialize the game, set popularity >= the type's cost. Perform a purchase. Verify success, deck grows by 1, new guest has correct type, a name from the pre-purchase pool, and properties matching `GUEST_TYPE_DEFAULTS[type]`. Verify popularity decreased by `GUEST_TYPE_COSTS[type]` and shop stock decreased by 1.
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x] 4.2 Write property test for new-type resource contributions
    - **Property 2: New-Type Resource Contributions**
    - Generate random party compositions containing at least one guest of a new type mixed with other types. Calculate expected popularity, trouble, and money from `GUEST_TYPE_DEFAULTS`. Verify actual resource values match the expected sums.
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 4.3 Write property test for guest conservation with expanded pool
    - **Property 3: Guest Conservation with Expanded Pool**
    - Generate random sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan). After each operation, verify `deck.length + party.length + discard.length + sum(shopInventory[*].guests.length) === 38`.
    - **Validates: Requirements 5.6, 6.2, 7.5, 11.1**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Only `guest.model.ts` requires code changes; the store, components, and templates handle new types automatically
- Unit tests extend existing spec files: `guest.model.spec.ts`, `game.store.spec.ts`, `phase-content.component.spec.ts`, `guest-card.component.spec.ts`
- Property tests go in `game.store.property.spec.ts`
- Property tests use fast-check (already installed) with minimum 100 iterations
- The total guest conservation count increases from 22 to 38 (10 initial + 28 purchasable shop guests)
- Shop display order: Old Friend (2), Monkey (3), Rich Pal (3), Rock Star (5), Gangster (6), Gambler (7), Auctioneer (9)
