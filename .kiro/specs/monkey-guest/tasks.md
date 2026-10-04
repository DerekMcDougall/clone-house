# Implementation Plan: Monkey Guest Type

## Overview

Add the MONKEY guest type to the guest model by extending 4 existing constants (`GuestType`, `GUEST_TYPE_DEFAULTS`, `GUEST_TYPE_LABELS`, `GUEST_TYPE_COSTS`) and adding 4 named Monkey entries to `SHOP_GUESTS`. No store, component, or template changes are needed — existing logic handles the new type automatically.

## Tasks

- [x] 1. Add MONKEY to guest model constants
  - [x] 1.1 Extend GuestType union, GUEST_TYPE_DEFAULTS, GUEST_TYPE_LABELS, GUEST_TYPE_COSTS, and SHOP_GUESTS in `guest.model.ts`
    - Add `'MONKEY'` to the `GuestType` union type
    - Add `MONKEY: { popularityValue: 4, troubleValue: 1, moneyValue: 0 }` to `GUEST_TYPE_DEFAULTS`
    - Add `MONKEY: 'Monkey'` to `GUEST_TYPE_LABELS`
    - Add `MONKEY: 3` to `GUEST_TYPE_COSTS`
    - Add 4 Monkey entries to `SHOP_GUESTS`: George, Punch, Darwin, Diddy
    - Verify `INITIAL_GUESTS` has zero MONKEY entries (no change needed)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1_

  - [x] 1.2 Write unit tests for Monkey model constants
    - Test `GUEST_TYPE_DEFAULTS['MONKEY']` has popularityValue 4, troubleValue 1, moneyValue 0
    - Test `GUEST_TYPE_LABELS['MONKEY']` is `'Monkey'`
    - Test `GUEST_TYPE_COSTS['MONKEY']` is 3
    - Test `SHOP_GUESTS` has exactly 4 MONKEY entries with names George, Punch, Darwin, Diddy
    - Test `INITIAL_GUESTS` has zero MONKEY entries
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1_

- [x] 2. Verify store initialization and shop display with Monkey type
  - [x] 2.1 Write unit tests for store initialization with Monkey
    - Test `initializeGame()` creates a shopInventory entry for MONKEY with 4 guests and cost 3
    - Test `initializeGame()` shopInventory MONKEY guest names are George, Punch, Darwin, Diddy
    - Test `initializeGame()` deck contains zero MONKEY guests
    - Test `purchasableShopItems()` returns Monkey at index 1 (between Old Friend and Rich Pal)
    - _Requirements: 3.2, 3.3, 4.2, 7.4_

  - [x] 2.2 Write unit tests for Monkey shop display and guest card rendering
    - Test PhaseContentComponent renders a shop card with "Monkey" label during BUY phase
    - Test Monkey shop card shows "Price: 3"
    - Test Monkey shop card shows "Available: 4" initially
    - Test GuestCardComponent renders "Monkey" header for a MONKEY guest
    - Test GuestCardComponent renders the Monkey's name as caption
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2_

- [x] 3. Checkpoint - Ensure all unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write property tests for Monkey correctness properties
  - [x] 4.1 Write property test for Monkey purchase validity
    - **Property 1: Monkey Purchase Yields Valid Monkey Guest**
    - Generate random game states with Monkey stock (1–4) and popularity >= 3
    - Verify `purchaseGuest('MONKEY')` returns success, deck grows by 1, new guest has type MONKEY, valid name from pool, and properties matching `GUEST_TYPE_DEFAULTS['MONKEY']`
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 4.2 Write property test for Monkey resource contributions
    - **Property 2: Monkey Resource Contributions**
    - Generate random party compositions containing at least one Monkey mixed with other types
    - Verify each Monkey contributes exactly +4 popularity, +1 trouble, +0 money
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 4.3 Write property test for guest conservation with Monkeys
    - **Property 3: Guest Conservation with Monkeys**
    - Generate random sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan)
    - Verify `deck.length + party.length + discard.length + sum(shopInventory[*].guests.length) === 22` after each operation
    - **Validates: Requirements 3.2, 4.2, 5.1, 5.3**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Only `guest.model.ts` requires code changes; the store, components, and templates handle the new type automatically
- Property tests use fast-check (already installed) with minimum 100 iterations
- The total guest conservation count increases from 18 to 22 (10 initial + 12 purchasable shop guests)
