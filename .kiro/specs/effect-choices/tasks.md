# Implementation Plan: Effect Choices

## Overview

Move the effect stack into store state, add `requestChoice` and a pending-choice state that pauses and resumes resolution, render choices in a generic panel, and move ban selection onto it. Requires **effect-descriptors**. The ban screen keeps its text and flow.

## Tasks

- [x] 1. Queue in state
  - [x] 1.1 Add `pendingEffects` and `choice` to store state; clear both in `initializeGame`, `resetGame` and on bust
    - _Requirements: 2.1, 2.5_
  - [x] 1.2 Split `resolveEffects` into `resolveEffects(effect)` + `runQueue()` reading and writing `pendingEffects`; extract `bust(isOverflow)` and use it from `triggerPartyShutdown` / `triggerOverflowShutdown`
    - _Requirements: 2.5_

- [x] 2. Checkpoint — Ensure all tests pass (pure refactor so far)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Choices
  - [x] 3.1 Add `ChoiceOption`, `ChoiceRequest`, `GameStateView` and `EffectContext.requestChoice`; implement in `EffectContextImpl`
    - _Requirements: 1.1–1.4_
  - [x] 3.2 Handle choice entries in `runQueue`: compute options, skip when empty, otherwise `startChoice` and stop
    - _Requirements: 2.1, 2.2_
  - [x] 3.3 Add `selectChoiceOption`, `confirmChoice`, `pendingChoice` and `isAwaitingChoice`
    - _Requirements: 3.1–3.7_
  - [x] 3.4 Gate `inviteGuest`, `advancePhase`, `purchaseGuest`, `purchaseExpansion`, `canInviteGuest` and the phase button on `isAwaitingChoice`
    - _Requirements: 2.3, 2.4_
  - [x]* 3.5 Property tests 1, 2, 4, 5, 6
    - **Property 1: Choices Keep Queue Order** — **Validates: Requirements 1.3, 2.1, 3.5, 3.6, 3.7**
    - **Property 2: Nothing Happens While Waiting** — **Validates: Requirements 2.3, 2.4**
    - **Property 4: Empty Options Skip** — **Validates: Requirements 2.2**
    - **Property 5: Invalid Selections Are Ignored** — **Validates: Requirements 3.4**
    - **Property 6: Bust Clears Pending Effects** — **Validates: Requirements 2.5**

- [x] 4. Choice panel
  - [x] 4.1 Add `choice-panel.component.{ts,html,scss}`, with styles moved from the ban rules in `phase-content.component.scss`
    - _Requirements: 4.1–4.5_
  - [x] 4.2 Unit tests for the panel: guest options, label options, confirmation dialog, accessible names
    - _Requirements: 4.1–4.5_

- [x] 5. Ban selection on choices
  - [x] 5.1 Start the ban choice from `acknowledgeShutdown`; move `confirmBan`'s body into `applyBan(guest)`
    - _Requirements: 6.1, 6.2_
  - [x] 5.2 Replace `isBanSelectionActive`, `selectedBanGuest` and `banConfirmationMessage` state with deprecated computed wrappers; make `selectGuestToBan` and `confirmBan` wrappers
    - _Requirements: 6.3_
  - [x] 5.3 Replace the ban markup in `phase-content.component.html` with `<app-choice-panel />`; update specs that query the old class names
    - _Requirements: 6.4_
  - [x]* 5.4 Property test 7
    - **Property 7: Ban Outcome Unchanged** — **Validates: Requirements 6.1–6.3**

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. chooseGuest action kind
  - [x] 7.1 Add `chooseGuest`, with recursive validation and `dataOnly` taken from the nested action
    - _Requirements: 5.1–5.4_
  - [x]* 7.2 Property tests 3 and 8
    - **Property 3: Options Reflect State When Reached** — **Validates: Requirements 2.1, 5.2**
    - **Property 8: Guest Conservation Holds** — **Validates: Requirements 3.5, 6.2**
  - [x] 7.3 Integration test: a JSON-defined test type whose entrance effect is `chooseGuest` + `adjustSelf`; invite it, pick a guest in the panel, and check that the chosen guest changed
    - _Requirements: 5.2_

- [ ] 8. Final checkpoint — Ensure all tests pass and `ng build` succeeds; play a trouble bust in the app and check that the ban screen looks and works as before
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 1 is a pure refactor and can be its own PR
- No real guest type with a choice is added; the first one comes with the guest design that needs it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3"] },
    { "id": 5, "tasks": ["3.4", "4.1", "5.1"] },
    { "id": 6, "tasks": ["3.5", "4.2", "5.2", "7.1"] },
    { "id": 7, "tasks": ["5.3", "5.4", "7.2"] },
    { "id": 8, "tasks": ["7.3"] }
  ]
}
```
