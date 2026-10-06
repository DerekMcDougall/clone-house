# Implementation Plan: Star Guests & Winning

## Overview

This feature adds `starValue` to `GuestProperties`, seven shop-only star guest types (Alien, Leprechaun, Dragon, Dinosaur, Mermaid, Unicorn, Superhero), a computed `stars` signal, and a win condition: ending a party normally with 4 or more stars shows a victory dialog whose "Victory" button ends the game and returns home. Work goes in this order: model, store, UI, then tests.

## Tasks

- [x] 1. Extend guest model with stars and star guest types
  - [x] 1.1 Add starValue and WINNING_STAR_COUNT
    - Add `starValue: number` to `GuestProperties` in `guest.model.ts`
    - Add `starValue: 0` to every existing entry in `GUEST_TYPE_DEFAULTS`
    - Export `WINNING_STAR_COUNT = 4`
    - Fix any `GuestProperties` literals in existing specs that TypeScript now flags as missing `starValue`
    - _Requirements: 1.1, 1.2, 1.4, 14.1_

  - [x] 1.2 Add the seven star guest types
    - Add `'ALIEN' | 'LEPRECHAUN' | 'DRAGON' | 'DINOSAUR' | 'MERMAID' | 'UNICORN' | 'SUPERHERO'` to `GuestType`
    - Add `GUEST_TYPE_DEFAULTS`, `GUEST_TYPE_LABELS` and `GUEST_TYPE_COSTS` entries per the design table
    - Add 28 `SHOP_GUESTS` entries (4 named guests per type); `SHOP_GUESTS` becomes 84 entries
    - Leave `INITIAL_GUESTS` unchanged
    - _Requirements: 1.3, 2.1–2.4, 3.1–3.4, 4.1–4.4, 5.1–5.4, 6.1–6.4, 7.1–7.4, 8.1–8.4, 9.1–9.8, 9.10, 10.1, 10.3, 11.1_

  - [x] 1.3 Add Mermaid entrance effect
    - Add `MERMAID: (ctx) => { autoInvite(ctx); }` to `GUEST_TYPE_ENTRANCE_EFFECTS`
    - _Requirements: 2.5, 6.5, 6.6_

  - [x]* 1.4 Write unit tests for star guest model constants
    - `starValue: 0` on all 15 existing types; defaults, labels and costs for the 7 new types
    - Shop names per type, 84 total, `INITIAL_GUESTS` unchanged with no star guests
    - Guest names unique across `INITIAL_GUESTS` and `SHOP_GUESTS`
    - Only `MERMAID` among star types has an entrance effect
    - Every star type costs more than every non-star purchasable type
    - Update the existing "56 total entries" assertion in `guest.model.spec.ts` to 84
    - _Requirements: 1.1–1.3, 2–8, 9.1–9.8, 9.10, 10.1, 10.3, 11.1, 14.1_

- [x] 2. Add stars and victory to the GameStore
  - [x] 2.1 Add isVictory state and stars computed signal
    - Add `isVictory: boolean` to `GameStoreState` and `isVictory: false` to `initialState`
    - Add `isVictory: false` to the `initializeGame()` `patchState`
    - Add `stars` computed (sum of party `starValue`) next to `trouble`
    - Add `!store.isVictory()` to `canInviteGuest`
    - _Requirements: 12.1, 12.2, 12.4, 18.1, 18.2_

  - [x] 2.2 Add the win check to advancePhase()
    - Extend the early-return guard to `isGameComplete() || isVictory()`
    - In the PARTY branch, before any settlement: if `stars() >= WINNING_STAR_COUNT`, `patchState({ isVictory: true })` and return
    - Leave the rest of the PARTY branch (settlement, reshuffle, final-turn / next-turn) unchanged
    - _Requirements: 13.3, 14.2–14.5, 14.7, 14.8, 15.4_

  - [x] 2.3 Block invites during victory and add claimVictory()
    - Add `store.isVictory()` to the early-return guard in `inviteGuest()`
    - Add `claimVictory()`: no-op unless `isVictory`; otherwise `patchState({ isVictory: false, isGameComplete: true })`
    - _Requirements: 14.8, 15.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Run the suite, then update tests that assert the old shop order (14 types), shop type count, or the 66-guest conservation total (`game.store.property.spec.ts`, now 94)
  - Ask the user if questions arise.

- [x] 4. Add victory and stars to the UI
  - [x] 4.1 Status pane Stars display and button disabling
    - Add a "Stars" `status-info` block after Trouble in the PARTY section showing `{{ gameStore.stars() }} / {{ WINNING_STAR_COUNT }}` with class `star-count`
    - Add `.star-count` to the big-number style selector
    - Add `|| gameStore.isVictory()` to the `[disabled]` binding on both the Invite Guest and phase buttons
    - _Requirements: 15.3, 16.1, 16.2_

  - [x] 4.2 Victory modal in PhaseContentComponent
    - Add an `@if (gameStore.isVictory())` modal with `role="dialog"`, `aria-modal="true"`, `aria-labelledby="victory-title"`, the text "Congrats! You threw the ultimate party!", and a single `victory-button` labeled "Victory" that calls `gameStore.claimVictory()`
    - Add `.victory-modal-overlay`, `.victory-modal` and `.victory-button` styles matching the shutdown modal
    - Confirm the party cards still render underneath (the party is not cleared on victory)
    - _Requirements: 15.1, 15.2, 15.4, 15.5_

  - [x] 4.3 Verify navigation home
    - Confirm the existing `GameplayComponent` effect navigates to `/` when `isGameComplete` becomes true after `claimVictory()`; no code change expected
    - _Requirements: 15.6_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ask the user if questions arise.

- [x] 6. Store and component unit tests
  - [x]* 6.1 Store unit tests for stars and victory
    - `stars()` for empty, 3-star and 4-star parties
    - Win at 4 and 5 stars; no win at 3; win on the final turn sets `isVictory`, not `isGameComplete`
    - Victory leaves the party, turn, phase, popularity and money unchanged
    - Trouble shutdown and overflow shutdown (via Mermaid) with 4+ stars never set `isVictory`
    - `inviteGuest()` / `advancePhase()` no-ops and `canInviteGuest()` false during victory
    - `claimVictory()` behavior, including the no-op case; `resetGame()` and `initializeGame()` clear `isVictory`
    - Star types in the shop at stock 4 with correct costs; none in the starting deck; 21-type shop order
    - Mermaid auto-invites exactly one guest; Mermaid with an empty deck is admitted alone
    - _Requirements: 6.6, 9.9, 10.2, 11.2, 12.1–12.3, 13.2, 14.2–14.8, 15.5, 18.1, 18.2_

  - [x]* 6.2 Component unit tests
    - Status pane: "0 / 4" with an empty party and "2 / 4" with two star guests in PARTY; hidden in BUY; buttons disabled during victory
    - Phase content: victory modal text, single "Victory" button, click calls `claimVictory()`, party cards still rendered; star shop cards show label, price and stock
    - Guest card: header and caption for each star type
    - Gameplay: navigates to `/` after `claimVictory()`
    - _Requirements: 15.1–15.6, 16.1, 16.2, 17.1, 17.2_

  - [x]* 6.3 Integration test for a full win
    - In `gameplay.integration.spec.ts`: buy four star guests, start a party, invite until they are all in, click End Party, see the victory dialog, click Victory, and land on `/`
    - Stub `Math.random` so the shuffle is deterministic
    - _Requirements: 14.2, 15.1, 15.5, 15.6_

- [x] 7. Property-based tests
  - [x]* 7.1 Property 1: Stars Equal Sum of Party starValue
    - Random parties, including hand-built guests with `starValue` > 1 and < 0
    - **Validates: Requirements 1.4, 12.1, 12.2, 12.4**

  - [x]* 7.2 Property 2: Ending a Party With Enough Stars Wins
    - Random PARTY states (any turn, including the final one) with `stars() >= 4`; `advancePhase()` sets only `isVictory`
    - **Validates: Requirements 14.2, 14.3, 14.4, 15.4**

  - [x]* 7.3 Property 3: Ending a Party Without Enough Stars Is Unchanged
    - Random PARTY states with `stars() < 4`; compare against the expected settlement
    - **Validates: Requirements 13.3, 14.5**

  - [x]* 7.4 Property 4: Shutdowns Never Win
    - Random decks rich in star guests (including Dinosaur and Mermaid) invited until bust; resolve the shutdown
    - **Validates: Requirements 12.3, 14.6**

  - [x]* 7.5 Property 5: Victory Freezes Gameplay Until Claimed
    - **Validates: Requirements 14.8, 15.5**

  - [x]* 7.6 Property 6: Star Guest Purchase Flow
    - **Validates: Requirements 9.9, 17.1**

  - [x]* 7.7 Property 7: Star Guest Resource Contributions
    - **Validates: Requirements 13.1**

  - [x]* 7.8 Property 8: Mermaid Auto-Invites Exactly One Guest
    - **Validates: Requirements 6.5, 6.6**

  - [x]* 7.9 Property 9: Guest Conservation at 94
    - Update the existing 66-guest conservation property to 94 and add `claimVictory` to the operation generator
    - **Validates: Requirements 19.1**

  - [x]* 7.10 Property 10: Star Display Reflects Party Stars
    - In `status-pane.component.property.spec.ts`
    - **Validates: Requirements 16.1**

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Task 1.1 will break compilation wherever specs build `GuestProperties` literals without `starValue`; fix those in the same task
- Task 3 is where the existing count- and order-based assertions (56 shop guests, 66 total, the 14-type shop order) need updating
- The win check must come before the final-turn branch in `advancePhase()` so a last-turn win shows the dialog instead of ending the game silently
- Each property test references a specific correctness property from the design document
