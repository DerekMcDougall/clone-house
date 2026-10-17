# Implementation Plan: Activated Abilities

## Overview

Add the `activated` trigger, per-party usage tracking, `useAbility`, and ability buttons on party guest cards. Requires **effect-choices**. Check the assumptions in `requirements.md` before starting.

## Tasks

- [ ] 1. Definitions
  - [ ] 1.1 Add `'activated'` to `Trigger`, `uses` and `label` to `EffectDefinition`, and "when used" to `triggerPhrase`
    - _Requirements: 1.1, 1.2, 1.4_
  - [ ] 1.2 Validate `uses` / `label` (activated only) in `validateGuestType` and `parseGuestTypeDefinition`
    - _Requirements: 1.3, 1.5_
  - [ ]* 1.3 Unit tests: validation, JSON round-trip, "when used" icon labels
    - _Requirements: 1.3–1.5, 4.6_

- [ ] 2. Store
  - [ ] 2.1 Add `usedAbilities` state; clear it at party end, bust, overflow, `initializeGame` and `resetGame`
    - _Requirements: 3.3_
  - [ ] 2.2 Add the `partyAbilities` computed signal
    - _Requirements: 3.1, 3.2_
  - [ ] 2.3 Add `useAbility(guestId, effectIndex)`: mark used, then `resolveEffects`
    - _Requirements: 2.1–2.5_
  - [ ]* 2.4 Property tests 1–6
    - **Property 1: Once Per Party** — **Validates: Requirements 2.5, 3.1, 3.3, 3.4**
    - **Property 2: Unlimited Uses** — **Validates: Requirements 1.2, 3.1**
    - **Property 3: Unavailable Means No-Op** — **Validates: Requirements 2.5, 3.1**
    - **Property 4: Abilities Behave Like Effects** — **Validates: Requirements 2.2, 2.3, 2.4**
    - **Property 5: partyAbilities Matches Definitions** — **Validates: Requirements 3.2, 4.2**
    - **Property 6: Conservation With Abilities** — **Validates: Requirements 5.1**

- [ ] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. UI
  - [ ] 4.1 Add `showAbilities` input and ability buttons to `GuestCardComponent`
    - _Requirements: 4.1–4.5_
  - [ ] 4.2 Turn on `showAbilities` for the party list in `phase-content.component.html`
    - _Requirements: 4.5_
  - [ ] 4.3 Guest card unit tests: visibility, disabled and "Used" states, accessible names, no nested buttons in the choice panel
    - _Requirements: 4.1–4.5_
  - [ ] 4.4 Integration test: use a `chooseGuest` ability end to end through the UI
    - _Requirements: 2.2, 2.3, 4.1_

- [ ] 5. Final checkpoint — Ensure all tests pass and `ng build` succeeds; register a test ability type in a dev build and try it in the app
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- No real guest type with an ability is added; the first one comes with its own spec, which should only need a definition (and possibly a new action kind)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "2.2"] },
    { "id": 3, "tasks": ["2.3"] },
    { "id": 4, "tasks": ["2.4", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3"] },
    { "id": 6, "tasks": ["4.4"] }
  ]
}
```
