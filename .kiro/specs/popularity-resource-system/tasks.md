# Implementation Plan: Popularity Resource System

## Overview

This implementation plan adds a popularity resource system to the Angular PWA game. The system tracks player social standing through a non-negative integer that accumulates based on party guest composition. Implementation involves extending the Guest model with a properties object, updating the GameStore to manage popularity state and calculations, and modifying the StatusPaneComponent to display the current popularity value.

## Tasks

- [x] 1. Extend Guest model with properties object
  - [x] 1.1 Update Guest interface to include properties: GuestProperties
    - Add GuestProperties interface with popularityValue: number
    - Modify Guest interface to include properties field
    - Create GUEST_TYPE_DEFAULTS constant with OLD_FRIEND default properties
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 1.2 Write property test for Guest model structure
    - **Property: Guest instances always have valid properties object**
    - **Validates: Requirements 4.1**

- [x] 2. Update existing guest creation code
  - [x] 2.1 Modify guest creation to initialize properties from GUEST_TYPE_DEFAULTS
    - Update all locations where Guest objects are created
    - Copy GUEST_TYPE_DEFAULTS[guestType] to guest.properties
    - Ensure deep copy using spread operator
    - _Requirements: 4.1, 4.3_
  
  - [x] 2.2 Write unit tests for guest creation with properties
    - Test that created guests have properties object
    - Test that OLD_FRIEND guests have popularityValue of 1
    - _Requirements: 4.3_

- [x] 3. Extend GameStore with popularity state
  - [x] 3.1 Add popularity property to GameState and GameStoreState interfaces
    - Add popularity: number to GameState interface
    - Verify GameStoreState inherits popularity from GameState
    - _Requirements: 1.1, 2.1_
  
  - [x] 3.2 Initialize popularity to 0 in initializeGame()
    - Set popularity: 0 in initial state object
    - _Requirements: 1.1_
  
  - [x] 3.3 Initialize popularity to 0 in resetGame()
    - Set popularity: 0 in reset state object
    - _Requirements: 1.2_
  
  - [x] 3.4 Write unit tests for popularity initialization
    - Test initializeGame() sets popularity to 0
    - Test resetGame() sets popularity to 0
    - _Requirements: 1.1, 1.2_

- [x] 4. Implement popularity calculation logic
  - [x] 4.1 Add calculatePopularityChange() private method to GameStore
    - Sum guest.properties.popularityValue for all guests in party
    - Return the total as a number
    - _Requirements: 5.1, 5.2_
  
  - [x] 4.2 Modify advancePhase() to calculate and apply popularity changes
    - When currentPhase is PARTY, call calculatePopularityChange()
    - Add change to current popularity
    - Apply non-negative constraint using Math.max(0, newPopularity)
    - Update state with new popularity value
    - _Requirements: 5.1, 5.3, 5.4, 2.2_
  
  - [x] 4.3 Write property test for popularity calculation formula
    - **Property 3: Popularity Calculation Formula**
    - **Validates: Requirements 5.1, 5.2, 5.3, 7.2**
  
  - [x] 4.4 Write property test for non-negative invariant
    - **Property 1: Popularity Non-Negative Invariant**
    - **Validates: Requirements 2.1, 2.2, 5.4**
  
  - [x] 4.5 Write unit tests for popularity calculation examples
    - Test 4 OLD_FRIEND guests increase popularity by 4
    - Test empty party results in no popularity change
    - Test single guest increases popularity correctly
    - _Requirements: 7.1, 7.2_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update StatusPaneComponent to display popularity
  - [x] 6.1 Add popularity display to StatusPaneComponent template
    - Add popularity section above turns remaining section
    - Display gameStore.popularity() signal value
    - Use appropriate CSS classes for styling consistency
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 6.2 Write property test for status pane display
    - **Property 2: Status Pane Displays Current Popularity**
    - **Validates: Requirements 3.1, 3.3**
  
  - [x] 6.3 Write unit tests for StatusPaneComponent popularity display
    - Test component renders popularity value from store
    - Test popularity appears before turns remaining in DOM
    - Test component renders with popularity of 0
    - Test component renders with large popularity value
    - _Requirements: 3.1, 3.2_

- [x] 7. Verify popularity preservation and accumulation
  - [x] 7.1 Write property test for popularity preservation during phase transitions
    - **Property 4: Popularity Preservation During Phase Transitions**
    - **Validates: Requirements 6.1, 6.2**
  
  - [x] 7.2 Write property test for popularity accumulation across turns
    - **Property 5: Popularity Accumulation Across Turns**
    - **Validates: Requirements 6.3**
  
  - [x] 7.3 Write integration tests for complete popularity flow
    - Test initialization → party → advance → verify popularity increased
    - Test multiple turns accumulate popularity correctly
    - Test reset returns popularity to 0
    - _Requirements: 1.1, 1.2, 6.3_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- The Guest model extension with properties object enables future features to add new properties cleanly
- Popularity calculation occurs during Party→Buy phase transition in advancePhase()
- All property tests should run with minimum 100 iterations
