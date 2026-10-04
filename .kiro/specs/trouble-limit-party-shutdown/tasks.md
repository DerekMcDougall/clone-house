# Implementation Plan: Trouble Limit & Party Shutdown

## Overview

Add a two-component trouble limit system (permanent base + temporary per-party modifier) to the game store, implement party shutdown when trouble exceeds the limit, display a shutdown modal, update the trouble display format, and disable status pane buttons during shutdown. Implementation proceeds bottom-up: state/interface changes first, then store logic, then UI components, with tests alongside each layer.

## Tasks

- [x] 1. Add trouble limit state to GameState interface and GameStore
  - [x] 1.1 Extend GameState interface with `baseTroubleLimit` and `partyTroubleLimitModifier` fields
    - Add `baseTroubleLimit: number` and `partyTroubleLimitModifier: number` to `GameState` in `game-state.interface.ts`
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Extend GameStoreState with `isPartyShutdown` and update initial state
    - Add `isPartyShutdown: boolean` to `GameStoreState` in `game.store.ts`
    - Set defaults: `baseTroubleLimit: 2`, `partyTroubleLimitModifier: 0`, `isPartyShutdown: false`
    - Update `initializeGame()` and `resetGame()` to include new fields
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.3 Add `effectiveTroubleLimit` computed signal
    - Add computed signal: `max(0, baseTroubleLimit + partyTroubleLimitModifier)`
    - _Requirements: 1.3_

  - [x] 1.4 Write property tests for trouble limit state (Properties 1, 11)
    - **Property 1: Effective Trouble Limit Equals Clamped Base Plus Modifier**
    - **Validates: Requirements 1.3, 8.3, 8.4**
    - **Property 11: Limit Modification Methods Apply Delta With Clamping**
    - **Validates: Requirements 8.1, 8.2**

- [x] 2. Implement trouble limit modification methods
  - [x] 2.1 Add `modifyBaseTroubleLimit(delta)` and `modifyPartyTroubleLimitModifier(delta)` store methods
    - `modifyBaseTroubleLimit`: clamp result to `max(0, current + delta)`
    - `modifyPartyTroubleLimitModifier`: no clamping, result is `current + delta`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 3. Implement party shutdown logic in the store
  - [x] 3.1 Add `triggerPartyShutdown()` store method
    - Return guests to deck WITHOUT calculating popularity/money
    - Reset `partyTroubleLimitModifier` to 0
    - Set `isPartyShutdown` to true
    - _Requirements: 4.1, 4.2, 4.3, 2.2_

  - [x] 3.2 Add `acknowledgeShutdown()` store method
    - If not final turn: set `isPartyShutdown` false, advance to next turn Buy phase
    - If final turn: set `isPartyShutdown` false, mark game complete
    - _Requirements: 5.1, 5.2, 6.5_

  - [x] 3.3 Update `advancePhase()` to reset `partyTroubleLimitModifier` on normal party end
    - After calculating resources and returning guests, set `partyTroubleLimitModifier` to 0
    - _Requirements: 2.1_

  - [x] 3.4 Write property tests for shutdown store logic (Properties 2, 4, 5, 6)
    - **Property 2: Party Trouble Limit Modifier Resets on Any Party End**
    - **Validates: Requirements 2.1, 2.2**
    - **Property 4: Shutdown Forfeits Popularity and Money**
    - **Validates: Requirements 4.1, 4.2**
    - **Property 5: Shutdown Preserves Guest Conservation and Empties Party**
    - **Validates: Requirements 4.3**
    - **Property 6: Shutdown Acknowledgment Advances Game State**
    - **Validates: Requirements 5.1, 5.2, 6.5**

  - [x] 3.5 Write unit tests for shutdown store logic
    - Test `triggerPartyShutdown()` sets `isPartyShutdown` true
    - Test `triggerPartyShutdown()` does not change popularity or money
    - Test `triggerPartyShutdown()` returns guests to deck and empties party
    - Test `acknowledgeShutdown()` on non-final turn advances to next turn Buy phase
    - Test `acknowledgeShutdown()` on final turn marks game complete
    - Test `advancePhase()` from Party resets `partyTroubleLimitModifier` to 0
    - Test default values after `initializeGame()` and `resetGame()`
    - _Requirements: 1.4, 2.1, 2.2, 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 4. Checkpoint - Verify store logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add shutdown detection effect in GameplayComponent
  - [x] 5.1 Add Angular `effect()` in GameplayComponent constructor
    - Watch `trouble`, `effectiveTroubleLimit`, `currentPhase`, and `isPartyShutdown`
    - If phase is PARTY and not already shutdown and trouble > effectiveTroubleLimit, call `triggerPartyShutdown()`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Write property test for shutdown detection (Property 3)
    - **Property 3: Shutdown If and Only If Trouble Exceeds Limit During Party**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Update StatusPaneComponent for trouble display and button disabling
  - [x] 6.1 Update trouble display to "{current} / {limit}" format
    - Change trouble `<p>` content from `{{ gameStore.trouble() }}` to `{{ gameStore.trouble() }} / {{ gameStore.effectiveTroubleLimit() }}`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 6.2 Disable invite button and phase button when `isPartyShutdown` is true
    - Add `[disabled]="gameStore.isPartyShutdown()"` to both buttons
    - _Requirements: 6.6_

  - [x] 6.3 Write property tests for StatusPaneComponent (Properties 9, 10)
    - **Property 9: Status Pane Buttons Disabled During Shutdown**
    - **Validates: Requirements 6.6**
    - **Property 10: Trouble Display Format During Party Phase**
    - **Validates: Requirements 7.1, 7.3**

  - [x] 6.4 Write unit tests for StatusPaneComponent updates
    - Test trouble displays as "0 / 2" at party start with defaults
    - Test phase button is disabled when `isPartyShutdown` is true
    - Test invite button is disabled when `isPartyShutdown` is true
    - Test buttons are enabled when `isPartyShutdown` is false
    - _Requirements: 6.6, 7.1, 7.2, 7.3_

- [x] 7. Add shutdown modal to PhaseContentComponent
  - [x] 7.1 Add shutdown modal overlay to PhaseContentComponent template and styles
    - Show modal when `gameStore.isPartyShutdown()` is true
    - Display message: "The party has gotten out of control and has been shut down!"
    - Button label: "Game Over" if final turn, "End Party" otherwise
    - Button click calls `gameStore.acknowledgeShutdown()`
    - Add modal overlay and modal styles (fixed overlay, centered card, red button)
    - Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for accessibility
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Write property tests for PhaseContentComponent modal (Properties 7, 8)
    - **Property 7: Shutdown Modal Displayed When isPartyShutdown Is True**
    - **Validates: Requirements 6.1**
    - **Property 8: Shutdown Modal Button Label Matches Turn State**
    - **Validates: Requirements 6.3, 6.4**

  - [x] 7.3 Write unit tests for shutdown modal
    - Test modal is rendered when `isPartyShutdown` is true
    - Test modal contains the exact message text
    - Test modal button says "End Party" on non-final turn
    - Test modal button says "Game Over" on final turn
    - Test modal is not rendered when `isPartyShutdown` is false
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
