# Implementation Plan: Party Guest Deck System

## Overview

This plan implements a deck-based party guest system for the Angular PWA game. The implementation extends the existing GameStore with deck and party state, creates a new GuestCardComponent for displaying guests, and modifies existing components to support guest invitation during the Party phase. The system manages 6 unique "Old Friend" guests that can be invited and returned to the deck across game turns.

## Tasks

- [x] 1. Define Guest data model and initial deck configuration
  - Create Guest interface in a new `models/guest.model.ts` file
  - Define INITIAL_OLD_FRIENDS constant with the 6 guest names
  - Export types for use across the application
  - _Requirements: 1.2, 7.4_

- [x] 2. Extend GameStore with deck and party state
  - [x] 2.1 Add deck and party arrays to GameStoreState interface
    - Extend existing state interface in `stores/game.store.ts`
    - Initialize deck and party as empty arrays in initial state
    - _Requirements: 1.1_
  
  - [x] 2.2 Implement deck initialization and shuffle logic
    - Create private shuffleDeck() method using Fisher-Yates algorithm
    - Extend initializeGame() to create 6 Old Friend guests from INITIAL_OLD_FRIENDS
    - Shuffle deck after creation and reset party to empty array
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.3 Write property test for Guest Conservation (Property 1)
    - **Property 1: Guest Conservation**
    - **Validates: Requirements 8.4**
    - Generate random sequences of operations (invite, advancePhase)
    - Verify total guest count always equals 6
  
  - [x] 2.4 Write property test for Unique Guest Names (Property 2)
    - **Property 2: Unique Guest Names**
    - **Validates: Requirements 1.4**
    - Verify all guests have unique names from the valid set
  
  - [x] 2.5 Implement inviteGuest() method
    - Check if deck is empty and return early if true
    - Remove first guest from deck array
    - Add removed guest to party array
    - _Requirements: 4.1, 4.2, 4.3, 8.2_
  
  - [x] 2.6 Write property test for Draw from Top (Property 4)
    - **Property 4: Draw from Top**
    - **Validates: Requirements 2.2**
    - Verify guest removed is always at index 0
  
  - [x] 2.7 Write property test for Invite Decreases Deck and Increases Party (Property 8)
    - **Property 8: Invite Decreases Deck and Increases Party**
    - **Validates: Requirements 4.4**
    - Verify deck size decreases by 1 and party size increases by 1
  
  - [x] 2.8 Write property test for Invited Guest Appears in Party (Property 9)
    - **Property 9: Invited Guest Appears in Party**
    - **Validates: Requirements 4.1, 4.2**
    - Verify the specific guest from deck top appears in party
  
  - [x] 2.9 Implement returnGuestsToDeck() private method
    - Move all guests from party to end of deck array
    - Clear party array
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 2.10 Write property test for Return to Bottom (Property 5)
    - **Property 5: Return to Bottom**
    - **Validates: Requirements 2.3**
    - Verify returned guests are added at end of deck array
  
  - [x] 2.11 Extend advancePhase() to call returnGuestsToDeck()
    - Check if current phase is PARTY before advancing
    - Call returnGuestsToDeck() when transitioning from PARTY phase
    - Maintain existing phase transition logic
    - _Requirements: 6.4_
  
  - [x] 2.12 Write property test for Party Empty After Phase Transition (Property 15)
    - **Property 15: Party Empty After Phase Transition**
    - **Validates: Requirements 6.4, 6.1**
    - Verify party is empty after advancing from PARTY phase
  
  - [x] 2.13 Write property test for Guests Return to Deck on Phase Transition (Property 16)
    - **Property 16: Guests Return to Deck on Phase Transition**
    - **Validates: Requirements 6.2, 6.3**
    - Verify deck size increases by party size when phase advances
  
  - [x] 2.14 Add canInviteGuest computed signal
    - Create computed signal that returns `deck().length > 0`
    - Export signal for component use
    - _Requirements: 3.3_
  
  - [x] 2.15 Write property test for Guest Identity Preservation (Property 10)
    - **Property 10: Guest Identity Preservation**
    - **Validates: Requirements 7.4, 7.1, 7.2, 7.3, 4.3**
    - Generate random operation sequences
    - Verify guest names never change throughout operations
  
  - [x] 2.16 Write unit tests for GameStore deck and party methods
    - Test initialization creates 6 guests with correct names
    - Test empty deck invite is no-op
    - Test all guests return to deck on phase transition
    - Test deck shuffle produces different order

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create GuestCardComponent
  - [x] 4.1 Generate component with Angular CLI structure
    - Create component file, template, styles, and spec
    - Define @Input() guest property of type Guest
    - _Requirements: 5.1_
  
  - [x] 4.2 Implement guest card template
    - Add card-header div displaying "Old Friend" for OLD_FRIEND type
    - Add card-image div with person placeholder icon
    - Add card-caption div displaying guest.name
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [x] 4.3 Add guest card styling
    - Style card with border, shadow, and padding
    - Make card responsive and accessible
    - Add focus states for accessibility
    - _Requirements: 5.1_
  
  - [x] 4.4 Write property test for Guest Card Header (Property 12)
    - **Property 12: Guest Card Header**
    - **Validates: Requirements 5.2**
    - Generate random guests and verify header displays "Old Friend"
  
  - [x] 4.5 Write property test for Guest Card Name Display (Property 13)
    - **Property 13: Guest Card Name Display**
    - **Validates: Requirements 5.4**
    - Generate random guest names and verify caption displays correctly
  
  - [x] 4.6 Write unit tests for GuestCardComponent
    - Test component renders with correct structure
    - Test guest name displays in caption
    - Test header displays "Old Friend"

- [x] 5. Extend PhaseContentComponent to display guest cards
  - [x] 5.1 Inject GameStore and access party signal
    - Import GameStore in component
    - Access party() signal for guest list
    - Access canInviteGuest() signal for empty deck state
    - _Requirements: 5.1_
  
  - [x] 5.2 Add guest card rendering to template
    - Add conditional section for Party phase
    - Use @for to iterate over party guests in reverse order
    - Render GuestCardComponent for each guest
    - Add "No more guests!" message display logic
    - _Requirements: 5.1, 5.5, 8.1_
  
  - [x] 5.3 Write property test for All Party Guests Displayed (Property 11)
    - **Property 11: All Party Guests Displayed**
    - **Validates: Requirements 5.1**
    - Generate random party sizes and verify card count matches
  
  - [x] 5.4 Write property test for Guest Card Reverse Chronological Order (Property 14)
    - **Property 14: Guest Card Reverse Chronological Order**
    - **Validates: Requirements 5.5**
    - Generate random party sequences and verify display order
  
  - [x] 5.5 Write unit tests for PhaseContentComponent guest display
    - Test guest cards render during Party phase
    - Test guest cards hidden during other phases
    - Test "No more guests!" message displays when deck empty
    - Test guests display in reverse chronological order

- [x] 6. Extend StatusPaneComponent to add Invite Guest button
  - [x] 6.1 Inject GameStore and access phase and deck signals
    - Import GameStore in component
    - Access currentPhase() signal for button visibility
    - Access canInviteGuest() signal for empty deck handling
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.2 Add Invite Guest button to template
    - Add button below existing phase button
    - Show button only when currentPhase() === GamePhase.PARTY
    - Button always enabled (empty deck handled via message)
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 6.3 Implement onInviteGuest() click handler
    - Check canInviteGuest() before calling inviteGuest()
    - If false, trigger message display in PhaseContentComponent
    - If true, call gameStore.inviteGuest()
    - _Requirements: 4.1, 4.2, 8.1, 8.2_
  
  - [x] 6.4 Write property test for Button Visibility Matches Phase (Property 7)
    - **Property 7: Button Visibility Matches Phase**
    - **Validates: Requirements 3.1, 3.2**
    - Generate random phase states and verify button visibility
  
  - [x] 6.5 Write unit tests for StatusPaneComponent invite button
    - Test button visible during Party phase
    - Test button hidden during other phases
    - Test button click calls inviteGuest when deck not empty
    - Test button click shows message when deck empty

- [x] 7. Integration and wiring
  - [x] 7.1 Import and declare GuestCardComponent in app module/component
    - Add GuestCardComponent to imports array
    - Ensure component is available to PhaseContentComponent
    - _Requirements: 5.1_
  
  - [x] 7.2 Import Guest model in all components using it
    - Import Guest interface in GuestCardComponent
    - Import Guest interface in GameStore
    - Import INITIAL_OLD_FRIENDS in GameStore
    - _Requirements: 1.2, 5.1_
  
  - [x] 7.3 Write integration tests for complete guest flow
    - Test full flow: initialize → invite guests → advance phase → guests return
    - Test multiple turns with guest invitation
    - Test empty deck handling across components
    - _Requirements: 1.1, 4.1, 6.1, 8.1_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with Angular and NgRx SignalStore
- All 16 correctness properties from the design document are covered by property tests
- Checkpoints ensure incremental validation at key milestones
