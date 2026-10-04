# Implementation Plan: Turn-Based Gameplay Phases

## Overview

This implementation adds turn-based gameplay mechanics to the Angular PWA game using NgRx SignalStore for state management. The system manages configurable turns (default 25) with two phases per turn: Buy phase (Shop) and Party phase. The UI includes a status pane showing remaining turns and a phase button, with phase-specific content in the main area. Game completion navigates back to the landing page.

## Tasks

- [x] 1. Install dependencies and create core types
  - Install @ngrx/signals package
  - Install fast-check for property-based testing
  - Create GamePhase enum with BUY and PARTY values
  - Create GameState interface with currentTurn, currentPhase, totalTurns, isGameComplete
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 2. Implement GameStore with NgRx SignalStore
  - [x] 2.1 Create GameStore with state management
    - Define GameStoreState interface matching GameState
    - Create signalStore with providedIn: 'root'
    - Add withState for initial state (turn 1, BUY phase, 25 total turns, not complete)
    - Add withComputed for remainingTurns, isFinalTurn, phaseButtonLabel computed signals
    - _Requirements: 1.1, 1.2, 2.2, 3.3, 4.2, 5.2, 6.1_
  
  - [x] 2.2 Implement store methods
    - Add initializeGame(turnCount) method with validation (turnCount > 0)
    - Add advancePhase() method implementing phase transition logic
    - Add resetGame() method to return to initial state
    - Add shouldSkipBuyPhase() private method that returns false
    - _Requirements: 1.1, 1.3, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.3 Write property test for configurable turn count
    - **Property 1: Configurable Turn Count Initialization**
    - **Validates: Requirements 1.1, 1.3**
  
  - [x] 2.4 Write property test for turn start phase
    - **Property 2: Turn Start Phase Invariant**
    - **Validates: Requirements 2.2**
  
  - [x] 2.5 Write property test for Buy phase advancement
    - **Property 3: Buy Phase Advancement Transition**
    - **Validates: Requirements 2.3, 4.3**
  
  - [x] 2.6 Write property test for Party phase advancement on non-final turn
    - **Property 4: Party Phase Advancement on Non-Final Turn**
    - **Validates: Requirements 2.4, 5.3**
  
  - [x] 2.7 Write property test for game completion
    - **Property 5: Game Completion on Final Turn**
    - **Validates: Requirements 2.5, 6.2**
  
  - [x] 2.8 Write property test for initialization round trip
    - **Property 15: Initialization Round Trip**
    - **Validates: Requirements 1.1, 2.2**
  
  - [x] 2.9 Write unit tests for GameStore
    - Test default 25 turn initialization
    - Test error handling for invalid turn counts
    - Test advancePhase on completed game (should log warning)
    - Test resetGame functionality
    - Test computed signal calculations
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create PhaseContentComponent
  - [x] 4.1 Implement PhaseContentComponent with phase input
    - Create component with @Input() phase property
    - Create separate HTML template file
    - Create separate SCSS file
    - Add conditional rendering: "Shop" heading for BUY, "Party" heading for PARTY
    - Export GamePhase enum for template use
    - _Requirements: 4.1, 5.1_
  
  - [x] 4.2 Write property test for Buy phase heading
    - **Property 9: Buy Phase Heading Display**
    - **Validates: Requirements 4.1**
  
  - [x] 4.3 Write property test for Party phase heading
    - **Property 11: Party Phase Heading Display**
    - **Validates: Requirements 5.1**
  
  - [x] 4.4 Write unit tests for PhaseContentComponent
    - Test Shop heading renders in BUY phase
    - Test Party heading renders in PARTY phase
    - _Requirements: 4.1, 5.1_

- [x] 5. Create StatusPaneComponent
  - [x] 5.1 Implement StatusPaneComponent with store injection
    - Create component that injects GameStore directly
    - Create separate HTML template file
    - Create separate SCSS file
    - Display remainingTurns signal value
    - Display phase button with phaseButtonLabel signal
    - Wire button click to gameStore.advancePhase()
    - Add aria-label to button for accessibility
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 5.2, 6.1, 7.1, 7.2_
  
  - [x] 5.2 Write property test for status pane visibility
    - **Property 6: Status Pane Visibility Invariant**
    - **Validates: Requirements 3.2**
  
  - [x] 5.3 Write property test for remaining turns accuracy
    - **Property 7: Remaining Turns Display Accuracy**
    - **Validates: Requirements 3.3**
  
  - [x] 5.4 Write property test for remaining turns update
    - **Property 8: Remaining Turns Update on Turn Completion**
    - **Validates: Requirements 3.4**
  
  - [x] 5.5 Write property test for Buy phase button label
    - **Property 10: Buy Phase Button Label**
    - **Validates: Requirements 4.2**
  
  - [x] 5.6 Write property test for Party phase button label
    - **Property 12: Party Phase Button Label on Non-Final Turn**
    - **Validates: Requirements 5.2**
  
  - [x] 5.7 Write property test for final turn button label
    - **Property 13: Final Turn Button Label**
    - **Validates: Requirements 6.1**
  
  - [x] 5.8 Write unit tests for StatusPaneComponent
    - Test store injection works correctly
    - Test button click calls advancePhase
    - Test remaining turns display updates
    - Test button label changes based on phase
    - Test aria-label attribute
    - _Requirements: 3.2, 3.3, 3.4, 4.2, 5.2, 6.1, 7.1, 7.2_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create GameplayComponent
  - [x] 7.1 Implement GameplayComponent container
    - Create component that injects GameStore and Router
    - Create separate HTML template file
    - Create separate SCSS file
    - Call gameStore.initializeGame() in ngOnInit
    - Add effect() to watch isGameComplete signal
    - Navigate to '/' when game completes
    - Compose PhaseContentComponent and StatusPaneComponent in template
    - Pass currentPhase signal to PhaseContentComponent
    - _Requirements: 1.1, 2.2, 3.1, 3.2, 6.3_
  
  - [x] 7.2 Write property test for navigation on completion
    - **Property 14: Navigation on Game Completion**
    - **Validates: Requirements 6.3**
  
  - [x] 7.3 Write unit tests for GameplayComponent
    - Test component initializes game on ngOnInit
    - Test effect triggers navigation when game completes
    - Test component composition (PhaseContentComponent and StatusPaneComponent present)
    - Test phase prop passed to PhaseContentComponent
    - _Requirements: 1.1, 2.2, 6.3_

- [x] 8. Add styling for gameplay layout
  - [x] 8.1 Style GameplayComponent layout
    - Create flexbox layout with main content and status pane
    - Position status pane on right side
    - Ensure responsive layout
    - _Requirements: 3.1, 7.1, 7.2_
  
  - [x] 8.2 Style StatusPaneComponent
    - Style status info section with turn counter
    - Style phase button at bottom of pane
    - Ensure button maintains position during transitions
    - Add hover and focus states for accessibility
    - _Requirements: 3.2, 3.3, 7.1, 7.2_
  
  - [x] 8.3 Style PhaseContentComponent
    - Style phase headings (Shop and Party)
    - Ensure consistent spacing and typography
    - _Requirements: 4.1, 5.1_

- [x] 9. Write integration tests
  - Test complete game flow from start to finish
  - Test full turn cycle (Buy → Party → next Buy)
  - Test game completion and navigation
  - Test UI updates in response to state changes
  - Test multi-turn game scenarios
  - _Requirements: All requirements_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All components use separate HTML and SCSS files (no inline templates/styles)
- StatusPaneComponent injects GameStore directly (no prop passing)
- shouldSkipBuyPhase() method returns false for now (future extensibility)
