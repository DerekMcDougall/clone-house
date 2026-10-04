# Implementation Plan: Wild Buddy & Trouble Resource

## Overview

Extend the guest model with a WILD_BUDDY type and troubleValue property, add a computed trouble signal to the GameStore, update the starting deck to 8 guests (4 Old Friends + 4 Wild Buddies), display trouble in the status pane during Party phase, and update guest card headers via a label map. Each task builds incrementally on the previous one.

## Tasks

- [x] 1. Extend guest model with Wild Buddy type and trouble value
  - [x] 1.1 Update GuestType, GuestProperties, GUEST_TYPE_DEFAULTS, and replace INITIAL_OLD_FRIENDS with INITIAL_GUESTS
    - Add `'WILD_BUDDY'` to the `GuestType` union type
    - Add `troubleValue: number` to `GuestProperties` interface
    - Update `GUEST_TYPE_DEFAULTS` with both types' full properties (OLD_FRIEND: popularityValue 1, troubleValue 0; WILD_BUDDY: popularityValue 2, troubleValue 1)
    - Replace `INITIAL_OLD_FRIENDS` string array with `INITIAL_GUESTS` typed array of `{ type: GuestType; name: string }` containing 4 Old Friends (Brian, Colin, Emily, Rachelle) and 4 Wild Buddies (Anthony, Teresa, Jacco, Jodie)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 9.1, 9.2, 9.3_

  - [x] 1.2 Write property test for guest type defaults (Property 1)
    - **Property 1: Guest Type Defaults Include Non-Negative Trouble Value**
    - Iterate over all keys of `GUEST_TYPE_DEFAULTS`, verify each has a `troubleValue >= 0`
    - **Validates: Requirements 2.1, 2.2**

  - [x] 1.3 Write unit tests for guest model changes
    - Test WILD_BUDDY exists in GUEST_TYPE_DEFAULTS with popularityValue 2 and troubleValue 1
    - Test OLD_FRIEND has troubleValue 0
    - Test INITIAL_GUESTS has 8 entries: 4 OLD_FRIEND, 4 WILD_BUDDY with correct names
    - Test all names in INITIAL_GUESTS are unique
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 9.1, 9.2, 9.3_

- [x] 2. Add computed trouble signal and update deck initialization in GameStore
  - [x] 2.1 Add trouble computed signal and update initializeGame to use INITIAL_GUESTS
    - Add `trouble` computed signal: `party.reduce((sum, guest) => sum + guest.properties.troubleValue, 0)`
    - Update `initializeGame()` to create deck from `INITIAL_GUESTS` using each entry's type and name with `GUEST_TYPE_DEFAULTS[type]`
    - Update import from `INITIAL_OLD_FRIENDS` to `INITIAL_GUESTS`
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 5.1, 5.2, 9.1, 9.4_

  - [x] 2.2 Write property test for trouble computation (Property 2)
    - **Property 2: Trouble Equals Sum of Party Guests' Trouble Values**
    - Generate random sequences of invite operations, verify `store.trouble()` equals manual sum of `troubleValue` for all party guests
    - **Validates: Requirements 3.1, 4.1, 4.2, 4.4**

  - [x] 2.3 Write property test for guest name uniqueness (Property 6)
    - **Property 6: All Guest Names Unique**
    - Generate random sequences of game operations, verify all guest names across deck + party are unique
    - **Validates: Requirements 8.1, 8.2**

  - [x] 2.4 Write property test for trouble and popularity independence (Property 7)
    - **Property 7: Trouble and Popularity Independence**
    - Invite guests one at a time, verify trouble change equals guest's troubleValue and popularity change equals sum of popularityValue, with neither affecting the other
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 2.5 Write unit tests for GameStore changes
    - Test deck has 8 guests after initializeGame()
    - Test trouble is 0 when party is empty
    - Test trouble increases correctly when Wild Buddies are invited
    - Test trouble resets to 0 when party ends (advancePhase from Party)
    - _Requirements: 3.1, 3.3, 4.1, 5.1, 9.1, 10.1_

- [x] 3. Checkpoint - Ensure model and store tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update UI components for trouble display and guest card headers
  - [x] 4.1 Add trouble display to StatusPaneComponent during Party phase
    - Add trouble `<div class="status-info">` with `<h3>Trouble</h3>` and `<p class="trouble-count">` below turns remaining, inside the existing `@if (gameStore.currentPhase() === GamePhase.PARTY)` block but before the invite button
    - Add `.trouble-count` style consistent with existing `.turn-count` / `.popularity-count` styles
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.2 Write property test for trouble displayed during Party phase (Property 3)
    - **Property 3: Trouble Displayed During Party Phase**
    - Render StatusPaneComponent during Party phase, verify trouble value element is present
    - **Validates: Requirements 6.1, 6.3**

  - [x] 4.3 Write property test for trouble hidden during Buy phase (Property 4)
    - **Property 4: Trouble Hidden During Buy Phase**
    - Render StatusPaneComponent during Buy phase, verify trouble display element is absent
    - **Validates: Requirements 6.4**

  - [x] 4.4 Update GuestCardComponent header to use GUEST_TYPE_LABELS map
    - Add `GUEST_TYPE_LABELS` map to component: `{ OLD_FRIEND: 'Old Friend', WILD_BUDDY: 'Wild Buddy' }`
    - Update template header from ternary to `{{ GUEST_TYPE_LABELS[guest.type] ?? guest.type }}`
    - Update both inline template and external `.html` template file
    - _Requirements: 7.1, 7.2_

  - [x] 4.5 Write property test for guest card header labels (Property 5)
    - **Property 5: Guest Card Header Matches Type Label**
    - Generate random guests of either type, render GuestCardComponent, verify header text matches type label
    - **Validates: Requirements 7.1, 7.2**

  - [x] 4.6 Write unit tests for UI component changes
    - Test trouble element present during Party phase with correct value
    - Test trouble element absent during Buy phase
    - Test "Wild Buddy" header for WILD_BUDDY guest, "Old Friend" header for OLD_FRIEND guest
    - _Requirements: 6.1, 6.4, 7.1, 7.2_

- [x] 5. Update existing tests for new deck size
  - Update any existing tests that assert `deck.length + party.length === 6` to assert `=== 8`
  - Update any tests referencing `INITIAL_OLD_FRIENDS` to use `INITIAL_GUESTS`
  - Verify guest conservation invariant holds with 8 guests
  - _Requirements: 9.1_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout; all implementation tasks use TypeScript
