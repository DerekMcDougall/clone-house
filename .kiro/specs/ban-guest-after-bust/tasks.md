# Implementation Plan: Ban Guest After Bust

## Overview

Implement the guest banning mechanic after a party bust. Bottom-up approach: shared model constants first, then store state and logic, then UI components, with tests alongside each layer. All code is TypeScript/Angular using NgRx SignalStore.

## Tasks

- [x] 1. Extract shared GUEST_TYPE_LABELS to guest model
  - [x] 1.1 Add GUEST_TYPE_LABELS export to guest.model.ts
    - Export `GUEST_TYPE_LABELS: Record<GuestType, string>` mapping OLD_FRIEND→"Old Friend", WILD_BUDDY→"Wild Buddy", RICH_PAL→"Rich Pal"
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 1.2 Update GuestCardComponent to import shared GUEST_TYPE_LABELS
    - Remove the local `GUEST_TYPE_LABELS` property from GuestCardComponent
    - Import `GUEST_TYPE_LABELS` from `../models/guest.model`
    - Use the imported constant in the template via a protected readonly field
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Add discard and ban selection state to GameStore
  - [x] 2.1 Extend GameStoreState interface and initialState
    - Add `discard: Guest[]`, `isBanSelectionActive: boolean`, `bustPartySnapshot: Guest[]`, `selectedBanGuest: Guest | null` to `GameStoreState`
    - Add corresponding defaults to `initialState`: `discard: []`, `isBanSelectionActive: false`, `bustPartySnapshot: []`, `selectedBanGuest: null`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Add banConfirmationMessage computed signal
    - Add computed signal that returns `"{TypeLabel} {Name} will be banned from the next party."` when `selectedBanGuest` is set, empty string otherwise
    - Import `GUEST_TYPE_LABELS` from guest.model.ts
    - _Requirements: 5.2, 9.1, 9.2, 9.3_
  - [x] 2.3 Update initializeGame() with new state fields
    - Add `discard: []`, `isBanSelectionActive: false`, `bustPartySnapshot: []`, `selectedBanGuest: null` to the patchState call
    - _Requirements: 1.2_
  - [x] 2.4 Update resetGame() — verify initialState covers new fields
    - Confirm resetGame() patches with initialState which now includes the new fields; no code change needed if initialState is already updated in 2.1
    - _Requirements: 1.3_

- [x] 3. Implement modified shutdown and ban store methods
  - [x] 3.1 Modify triggerPartyShutdown()
    - Snapshot current party into `bustPartySnapshot`
    - Return discard pile guests to deck (spread currentDeck + currentDiscard)
    - Clear party array and discard array
    - Reset partyTroubleLimitModifier to 0
    - Set isPartyShutdown to true
    - Remove the old `returnGuestsToDeck()` call
    - _Requirements: 2.1, 3.1_
  - [x] 3.2 Modify acknowledgeShutdown()
    - Non-final turn: set `isPartyShutdown = false`, `isBanSelectionActive = true` (do NOT advance turn)
    - Final turn: set `isPartyShutdown = false`, `isGameComplete = true`, clear bustPartySnapshot and selectedBanGuest
    - _Requirements: 3.2, 4.2, 4.3_
  - [x] 3.3 Add selectGuestToBan(index: number) method
    - Guard: return early if index out of bounds of bustPartySnapshot
    - Set `selectedBanGuest` to `bustPartySnapshot[index]`
    - _Requirements: 5.1_
  - [x] 3.4 Add confirmBan() method
    - Guard: return early if selectedBanGuest is null
    - Place selected guest in discard: `[selected]`
    - Return remaining snapshot guests to deck, shuffle
    - Clear ban state: `isBanSelectionActive = false`, `bustPartySnapshot = []`, `selectedBanGuest = null`
    - Advance: `currentTurn + 1`, `currentPhase = BUY`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 3.5 Modify advancePhase() PARTY branch
    - Calculate popularity and money from party first (while discard/deck state is stable)
    - Then return both party guests AND discard pile to deck together: `[...currentDeck, ...party, ...currentDiscard]`
    - Shuffle the combined deck
    - Clear party and discard arrays
    - Reset partyTroubleLimitModifier
    - Advance turn or mark game complete
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 3.6 Write property tests for store ban logic (game.store.property.spec.ts)
    - **Property 1: Guest Conservation Invariant** — after any sequence of operations, `deck.length + party.length + discard.length === 10`
    - **Validates: Requirements 1.4, 8.1, 8.2, 8.3**
    - **Property 2: Discard Pile Returned to Deck on Party End** — after party end (normal or bust), discard is empty and deck contains previously discarded guests
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 3: Acknowledge Shutdown Enters Ban Selection If and Only If Non-Final Turn** — non-final → isBanSelectionActive true; final → isGameComplete true
    - **Validates: Requirements 3.2, 4.3**
    - **Property 6: Ban Confirmation Message Format** — for any guest type and name, message matches `"{TypeLabel} {Name} will be banned from the next party."`
    - **Validates: Requirements 5.2, 9.1, 9.2, 9.3**
    - **Property 7: Confirm Ban Splits Snapshot Correctly** — selected guest in discard, remaining in deck
    - **Validates: Requirements 6.1, 6.2**
    - **Property 8: Confirm Ban Advances Game State** — turn incremented, phase BUY, ban state cleared
    - **Validates: Requirements 6.4, 6.5**
    - **Property 9: Invite Guest Does Not Touch Discard Pile** — discard unchanged after inviteGuest()
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - **Property 10: Guest Data Integrity Across All Movements** — multiset of (type, name) preserved across all locations
    - **Validates: Requirements 2.2, 8.4**
  - [x] 3.7 Write unit tests for store ban logic (game.store.spec.ts)
    - Test initializeGame() sets discard to empty array
    - Test resetGame() sets discard to empty array
    - Test triggerPartyShutdown() snapshots party, clears party, returns discard to deck
    - Test acknowledgeShutdown() on non-final turn sets isBanSelectionActive
    - Test acknowledgeShutdown() on final turn does NOT set isBanSelectionActive
    - Test selectGuestToBan() sets selectedBanGuest; out-of-bounds is no-op
    - Test confirmBan() places selected in discard, returns rest to deck, advances turn
    - Test confirmBan() with no selection is no-op
    - Test advancePhase() PARTY branch returns discard + party to deck after resource calc
    - Test banConfirmationMessage for each guest type and null case
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.2, 4.3, 5.2, 6.1, 6.2, 6.4, 9.1, 9.2, 9.3_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add ban selection UI to PhaseContentComponent
  - [x] 5.1 Add ban selection view to PhaseContentComponent template
    - When `isBanSelectionActive()` is true, render blame prompt "Who takes the blame?" and guest cards from `bustPartySnapshot()` as clickable buttons
    - Each button calls `gameStore.selectGuestToBan($index)` with aria-label "Ban {name}"
    - Wrap each `<app-guest-card>` inside a `<button>` element
    - _Requirements: 3.3, 3.4, 5.1_
  - [x] 5.2 Add ban confirmation modal to PhaseContentComponent template
    - When `selectedBanGuest()` is non-null, render modal overlay with role="dialog", aria-modal="true"
    - Display `banConfirmationMessage()` text
    - OK button calls `gameStore.confirmBan()` with aria-label="OK"
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 5.3 Add CSS styles for ban selection and confirmation modal
    - Style `.ban-selection`, `.blame-prompt`, `.ban-guest-button`, `.ban-modal-overlay`, `.ban-modal`, `.ban-confirm-button`
    - Ensure ban-guest-button resets default button styles and wraps guest card
    - _Requirements: 3.3, 3.4_
  - [x] 5.4 Write property test for ban selection UI (phase-content.component.property.spec.ts)
    - **Property 4: Ban Selection UI Renders Blame Prompt and Snapshot Guests** — when isBanSelectionActive with N snapshot guests, renders blame prompt and N guest card buttons
    - **Validates: Requirements 3.3, 3.4**
  - [x] 5.5 Write unit tests for ban selection UI (phase-content.component.spec.ts)
    - Test blame prompt visible when isBanSelectionActive
    - Test guest cards rendered from bustPartySnapshot
    - Test confirmation modal appears when selectedBanGuest is set
    - Test confirmation modal shows correct message and OK button
    - Test ban selection view hidden when isBanSelectionActive is false
    - _Requirements: 3.3, 3.4, 5.1, 5.2, 5.3_

- [x] 6. Update StatusPaneComponent disabled conditions
  - [x] 6.1 Extend disabled binding on invite and phase buttons
    - Change `[disabled]="gameStore.isPartyShutdown()"` to `[disabled]="gameStore.isPartyShutdown() || gameStore.isBanSelectionActive()"` on both buttons
    - _Requirements: 3.5_
  - [x] 6.2 Write property test for status pane disabled state (status-pane.component.property.spec.ts)
    - **Property 5: Status Pane Buttons Disabled During Ban Selection** — when isBanSelectionActive is true, both buttons are disabled
    - **Validates: Requirements 3.5**
  - [x] 6.3 Write unit tests for status pane disabled state (status-pane.component.spec.ts)
    - Test invite button disabled when isBanSelectionActive is true
    - Test phase button disabled when isBanSelectionActive is true
    - Test buttons enabled when both isPartyShutdown and isBanSelectionActive are false
    - _Requirements: 3.5_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
