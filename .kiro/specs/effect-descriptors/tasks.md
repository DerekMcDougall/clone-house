# Implementation Plan: Effect Descriptors

## Overview

Describe guest effects as `{ trigger, action }` data backed by an action-kind registry, move the four built-in entrance effects onto it, and add JSON parsing for data-only guest types. Requires **guest-type-registry**. No player-visible change.

## Tasks

- [ ] 1. Effect definitions and action kinds
  - [ ] 1.1 Add `models/effect-definition.ts` (`Trigger`, `ActionDefinition`, `EffectDefinition`, `triggerPhrase`)
    - _Requirements: 1.2, 1.3_
  - [ ] 1.2 Add `models/action-kinds.ts` with the `ActionKind` interface, the registry (`registerActionKind`, `getActionKind`, `findActionKind`, `resetActionKindsForTesting`) and `runEffect`
    - _Requirements: 8.1_
  - [ ] 1.3 Implement the `autoInvite`, `adjustSelf` and `custom` kinds, including validation and icons
    - _Requirements: 2.1–2.5, 3.1–3.4_
  - [ ]* 1.4 Unit tests for each kind against a mock `EffectContext`
    - _Requirements: 2.1–2.5, 3.2–3.4_
  - [ ]* 1.5 Property tests 2–3
    - **Property 2: autoInvite Enqueues count Invites** — **Validates: Requirements 2.1**
    - **Property 3: adjustSelf Clamps and Targets the Current Guest** — **Validates: Requirements 2.2, 2.3, 2.4**

- [ ] 2. Switch guest types to descriptors
  - [ ] 2.1 Replace `entranceEffect` / `entranceIcons` with `effects` on `GuestTypeDefinition`; validate each effect's trigger, kind and parameters in `validateGuestType`
    - _Requirements: 1.1, 6.1–6.3_
  - [ ] 2.2 Rewrite Climber, Mr. Popular, Celebrity and Mermaid with descriptors
    - _Requirements: 5.1–5.3_
  - [ ] 2.3 `admitGuest`: enqueue `runEffect` for each entrance effect, in definition order
    - _Requirements: 4.1–4.3_
  - [ ] 2.4 `getGuestDetails`: build effect icons from each kind's `icons()`
    - _Requirements: 3.1, 3.5_
  - [ ] 2.5 Rebuild the `GUEST_TYPE_ENTRANCE_EFFECTS` and `GUEST_TYPE_ENTRANCE_ICONS` derived views from descriptors
    - _Requirements: 5.5_
  - [ ]* 2.6 Property tests 1, 4, 5
    - **Property 1: Built-in Effects Are Unchanged** — **Validates: Requirements 3.2, 3.3, 5.1–5.5**
    - **Property 4: Entrance Effects Run in Definition Order** — **Validates: Requirements 4.1, 4.2**
    - **Property 5: Icons Follow Effect Order** — **Validates: Requirements 3.1, 3.5**

- [ ] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. JSON definitions
  - [ ] 4.1 Add `models/guest-type-json.ts` with `parseGuestTypeDefinition`, collecting every problem with its path
    - _Requirements: 7.1–7.4, 8.2_
  - [ ]* 4.2 Property tests 6–7
    - **Property 6: JSON Round-Trip** — **Validates: Requirements 7.2, 7.5**
    - **Property 7: Invalid JSON Is Rejected With a Path** — **Validates: Requirements 6.1–6.3, 7.3, 7.4**
  - [ ] 4.3 Integration test: parse the Party Planner example from the design, register it, buy one, invite it, and check that it auto-invites
    - _Requirements: 7.2_
  - [ ] 4.4 Integration test: register a new action kind, then parse and register a JSON type that uses it
    - _Requirements: 8.1, 8.2_

- [ ] 5. Final checkpoint — Ensure all tests pass and `ng build` succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Loading JSON definitions from a file or URL, and any UI for designing guest types, are out of scope; this spec only makes them possible

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4", "1.5", "2.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.4", "4.1"] },
    { "id": 5, "tasks": ["2.5", "2.6", "4.2"] },
    { "id": 6, "tasks": ["4.3", "4.4"] }
  ]
}
```
