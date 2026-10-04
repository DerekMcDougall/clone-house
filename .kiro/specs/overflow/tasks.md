# Implementation Plan: overflow

## Overview

This implementation plan covers the overflow feature which introduces the overflow mechanic and two new guest types (Mr. Popular and Celebrity) that perform automatic guest invites when they enter the party. The implementation adds a local effect queue inside `inviteGuest()`, overflow detection, and a separate overflow shutdown modal.

## Tasks

- [x] 1. Update Guest model with new guest types
  - [x] 1.1 Add MR_POPULAR and CELEBRITY to GuestType union
    - Add `'MR_POPULAR' | 'CELEBRITY'` to the GuestType union in guest.model.ts
    - _Requirements: 1.1, 2.1_

  - [x] 1.2 Add GUEST_TYPE_DEFAULTS entries for new types
    - Add `MR_POPULAR: { popularityValue: 3, troubleValue: 0, moneyValue: 0, peaceValue: 0 }`
    - Add `CELEBRITY: { popularityValue: 2, troubleValue: 0, moneyValue: 3, peaceValue: 0 }`
    - _Requirements: 1.2, 2.2_

  - [x] 1.3 Add GUEST_TYPE_LABELS entries
    - Add `MR_POPULAR: 'Mr. Popular'`
    - Add `CELEBRITY: 'Celebrity'`
    - _Requirements: 1.3, 2.3_

  - [x] 1.4 Add GUEST_TYPE_COSTS entries
    - Add `MR_POPULAR: 5`
    - Add `CELEBRITY: 11`
    - _Requirements: 1.4, 2.4_

  - [x] 1.5 Add new guests to SHOP_GUESTS array
    - Add 4 MR_POPULAR entries: Rowan, Oscar, Lawrence, McDougall
    - Add 4 CELEBRITY entries: Troy, Rainier, Pedro, Kent
    - _Requirements: 3.1, 3.2_

  - [x] 1.6 Add GUEST_TYPE_ENTRANCE_EFFECTS for new types
    - Add MR_POPULAR handler: `(ctx) => { ctx.autoInvite(); }`
    - Add CELEBRITY handler: `(ctx) => { ctx.autoInvite(); ctx.autoInvite(); }`
    - _Requirements: 4.1, 5.1_

- [x] 2. Update EffectContext interface
  - [x] 2.1 Add autoInvite() method declaration to EffectContext interface
    - Add `autoInvite(): void` — draws top deck guest and appends it to the party; no shutdown checking, no effect queuing
    - _Requirements: 4.2, 5.2_

- [x] 3. Update GameStoreState and initial state
  - [x] 3.1 Add isOverflowShutdown field to GameStoreState interface
    - Add `isOverflowShutdown: boolean` to the GameStoreState interface
    - _Requirements: 7.4, 9.2_

  - [x] 3.2 Initialize isOverflowShutdown to false in initialState and initializeGame()
    - Add `isOverflowShutdown: false` to the `initialState` constant
    - Add `isOverflowShutdown: false` to the `patchState` call inside `initializeGame()`
    - _Requirements: 7.4, 9.2_

- [x] 4. Implement autoInvite() on EffectContextImpl
  - [x] 4.1 Add autoInvite() method to EffectContextImpl
    - If `this._deck` is empty, return silently
    - Destructure top guest from `this._deck`, assign remainder back to `this._deck`
    - Append drawn guest to `this._party`
    - No shutdown checking, no entrance-effect queuing — those are `inviteGuest()`'s responsibility
    - _Requirements: 4.2, 4.3, 5.2, 5.3, 5.4_

- [x] 5. Add triggerOverflowShutdown() method to GameStore
  - [x] 5.1 Implement triggerOverflowShutdown()
    - Snapshot current party into `bustPartySnapshot`
    - Merge deck + discard into new deck (same as `triggerPartyShutdown()`)
    - Set `party: []`, `discard: []`, `isPartyShutdown: true`, `isOverflowShutdown: true`
    - _Requirements: 7.1, 7.3_

- [x] 6. Rewrite inviteGuest() to own the full effect chain loop
  - [x] 6.1 Seed local pendingEffects queue with the initial guest
    - After the existing empty-deck and house-full guard clauses, draw `rawGuest` from the deck
    - Look up `GUEST_TYPE_ENTRANCE_EFFECTS[rawGuest.type] ?? null` as `initialHandler`
    - Declare `pendingEffects: Array<{ guest: Guest; handler: EffectHandler | null }>` and push `{ guest: rawGuest, handler: initialHandler }`
    - Commit the deck-minus-rawGuest to the store immediately via `patchState`
    - _Requirements: 4.1, 5.1_

  - [x] 6.2 Implement the FIFO drain loop — add guest, commit, check shutdown
    - For each `pending` entry in `pendingEffects` (standard `for` loop so new pushes are picked up):
      - `patchState(store, { party: [...store.party(), pending.guest] })`
      - If `store.party().length > store.houseCapacity()`: call `store.triggerOverflowShutdown()` and `return`
      - Else if `store.trouble() > store.effectiveTroubleLimit()`: call `store.triggerPartyShutdown()` and `return`
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.4_

  - [x] 6.3 Run entrance effect handler and enqueue drawn guests
    - Continuing inside the same loop body (after the shutdown checks pass):
    - If `pending.handler` is non-null, create `new EffectContextImpl(pending.guest, store.deck(), store.party(), store.discard(), store.popularity(), store.money())`
    - Call `pending.handler(ctx)` — the handler calls `ctx.autoInvite()` N times, appending drawn guests to `ctx._party`
    - Commit ctx state back to store via `patchState` (deck, party, discard, popularity, money)
    - Identify drawn guests as `ctx.getParty().slice(partyBeforeHandler.length)` where `partyBeforeHandler` is the store party captured before running the handler
    - Push each drawn guest with its own handler lookup onto `pendingEffects`
    - _Requirements: 4.4, 5.5, 6.1, 6.2, 6.3, 6.4_

- [x] 7. Modify acknowledgeShutdown() for overflow handling
  - [x] 7.1 Check isOverflowShutdown flag in acknowledgeShutdown()
    - On final turn: set `isGameComplete: true`, clear `isPartyShutdown`, `isOverflowShutdown`, `bustPartySnapshot`, `selectedBanGuest` (same for both shutdown types)
    - On non-final turn with `isOverflowShutdown = true`: skip ban selection; set `isPartyShutdown: false`, `isOverflowShutdown: false`, `currentTurn: currentTurn + 1`, `currentPhase: GamePhase.BUY`
    - On non-final turn with `isOverflowShutdown = false`: enter ban selection (existing behavior — `isPartyShutdown: false`, `isBanSelectionActive: true`)
    - _Requirements: 7.4, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Update PhaseContentComponent for overflow modal
  - [x] 8.1 Make existing trouble shutdown modal conditional on !isOverflowShutdown()
    - Change the existing `@if (gameStore.isPartyShutdown())` guard to `@if (gameStore.isPartyShutdown() && !gameStore.isOverflowShutdown())`
    - _Requirements: 9.1_

  - [x] 8.2 Add overflow shutdown modal
    - Add `@if (gameStore.isPartyShutdown() && gameStore.isOverflowShutdown())` block
    - Render `<div class="overflow-modal-overlay">` containing `<div class="overflow-modal">`
    - Display message: "Party exceeded capacity! Fire department has shut it down!"
    - Button calls `gameStore.acknowledgeShutdown()`; label is `isFinalTurn() ? 'Game Over' : 'End Party'`
    - Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for accessibility
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 9. Add CSS styling for overflow modal
  - [x] 9.1 Add overflow-modal-overlay and overflow-modal styles
    - `.overflow-modal-overlay`: `position: fixed`, full width/height, `background-color: rgba(0,0,0,0.5)`, flexbox centering, `z-index: 1000`
    - `.overflow-modal`: `background: white`, `padding: 2rem`, `border-radius: 8px`, `max-width: 400px`, `text-align: center`, box-shadow
    - `.overflow-modal p`: `font-size: 1.2rem`, `margin-bottom: 1.5rem`, `color: #333`
    - _Requirements: 9.1_

  - [x] 9.2 Add overflow-button styles
    - `.overflow-button`: `padding: 0.75rem 2rem`, `font-size: 1rem`, `font-weight: 600`, `color: white`, `background-color: #fd7e14`, `border: none`, `border-radius: 4px`, `cursor: pointer`
    - `.overflow-button:hover`: `background-color: #e8690a`
    - `.overflow-button:focus`: `outline: 2px solid #e8690a`, `outline-offset: 2px`
    - _Requirements: 9.1_

- [x] 10. Write property-based tests for overflow feature
  - [ ]* 10.1 Write property test for Auto_Invite draws correct number of guests
    - **Property 1: Auto_Invite Draws Correct Number of Guests From Deck**
    - **Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4**

  - [ ]* 10.2 Write property test for effect sequencing
    - **Property 2: Effect Sequencing — Current Effect Completes Before Chained Effects Fire**
    - **Validates: Requirements 6.1, 6.2, 6.3, 5.5, 4.4**

  - [ ]* 10.3 Write property test for overflow shutdown state and guest preservation
    - **Property 3: Overflow Shutdown State and Guest Preservation**
    - **Validates: Requirements 7.1, 7.3, 11.3**

  - [ ]* 10.4 Write property test for overflow shutdown skips ban selection
    - **Property 4: Overflow Shutdown Skips Ban Selection and Advances Turn**
    - **Validates: Requirements 7.4, 9.2, 9.3, 9.4, 9.5**

  - [ ]* 10.5 Write property test for pending effects cancelled on shutdown
    - **Property 5: Pending Effects Cancelled on Any Shutdown**
    - **Validates: Requirements 6.4, 7.2, 8.2**

  - [ ]* 10.6 Write property test for trouble shutdown during effect chain
    - **Property 6: Trouble Shutdown During Effect Chain Behaves Normally**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 10.7 Write property test for overflow priority over trouble
    - **Property 7: Overflow Takes Priority Over Trouble Limit**
    - **Validates: Requirements 8.4**

  - [ ]* 10.8 Write property test for guest conservation invariant
    - **Property 8: Guest Conservation Invariant**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The implementation uses TypeScript as the programming language based on existing codebase
- `EffectContextImpl` constructor signature is UNCHANGED — still takes `(guest, deck, party, discard, popularity, money)` with no new parameters
- `autoInvite()` on `EffectContextImpl` is a thin draw-and-append operation; all shutdown checking and effect enqueueing lives in `inviteGuest()`
- The `pendingEffects` queue is a local variable inside `inviteGuest()` and is never stored in `GameStoreState`
- Overflow is checked before trouble in the loop, so simultaneous overflow+trouble always triggers overflow shutdown

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "3.1"] },
    { "id": 1, "tasks": ["3.2", "4.1"] },
    { "id": 2, "tasks": ["5.1"] },
    { "id": 3, "tasks": ["6.1", "7.1"] },
    { "id": 4, "tasks": ["6.2"] },
    { "id": 5, "tasks": ["6.3"] },
    { "id": 6, "tasks": ["8.1", "8.2", "9.1", "9.2"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8"] }
  ]
}
```
