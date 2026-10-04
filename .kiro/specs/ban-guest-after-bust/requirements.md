# Requirements Document

## Introduction

This feature introduces a guest banning mechanic triggered by a party bust (trouble exceeding the limit) on any non-final turn. After the existing shutdown modal is dismissed, the player must choose one attending guest to ban from the next party. A new discard pile is added as a third location for guest cards alongside the deck and party. Banned guests go to the discard pile and do not participate in future parties until returned. At the end of each party (before any banning occurs), guests in the discard pile are returned to the deck. The invite button always draws from the deck, never the discard pile.

This modifies the existing party shutdown flow from the trouble-limit-party-shutdown spec. The shutdown modal still appears first, but instead of immediately advancing to the next turn, a ban selection step is inserted. On the final turn, the Game Over button navigates home and no ban occurs.

## Glossary

- **Game_Store**: The NgRx SignalStore that manages the game state
- **Phase_Content**: The UI component that renders the main content area for the current phase
- **Status_Pane**: The UI component that displays game information in the right-side panel
- **Deck**: The shuffled stack of guest cards from which guests are drawn when invited
- **Party**: The collection of guests currently attending the active party
- **Discard_Pile**: A new collection of guest cards that are temporarily removed from play; guests in the Discard_Pile are not in the Deck or Party and cannot be invited
- **Guest**: A card with a type and name that moves between Deck, Party, and Discard_Pile
- **Party_Bust**: The event when trouble exceeds the Effective_Trouble_Limit during the Party phase, triggering a party shutdown
- **Ban_Selection_Phase**: A sub-phase after a Party_Bust on a non-final turn where the player selects one party guest to ban
- **Banned_Guest**: A guest selected by the player during Ban_Selection_Phase to be placed in the Discard_Pile
- **Shutdown_Modal**: The existing modal dialog displayed when a Party_Bust occurs
- **Ban_Confirmation_Modal**: A modal dialog confirming which guest the player selected to ban
- **Blame_Prompt**: The text "Who takes the blame?" displayed above party guests during Ban_Selection_Phase
- **Final_Turn**: The last turn of the game (currentTurn equals totalTurns)
- **Party_Phase**: The game phase where players invite guests to their party
- **Buy_Phase**: The game phase where players purchase items from the shop

## Requirements

### Requirement 1: Add Discard Pile to Game State

**User Story:** As a game designer, I want a discard pile as a third location for guest cards, so that guests can be temporarily removed from play without being destroyed.

#### Acceptance Criteria

1. THE Game_Store SHALL maintain a Discard_Pile as an array of Guest objects with a default value of an empty array
2. WHEN the game is initialized, THE Game_Store SHALL set the Discard_Pile to an empty array
3. WHEN the game is reset, THE Game_Store SHALL set the Discard_Pile to an empty array
4. FOR ALL game states, the total count of guests in Deck plus Party plus Discard_Pile SHALL equal the total number of guests in the game

### Requirement 2: Return Discard Pile to Deck on Party End

**User Story:** As a player, I want discarded guests to return to the deck when a party ends, so that banned guests become available again for future parties.

#### Acceptance Criteria

1. WHEN a party ends (normally or due to a Party_Bust), THE Game_Store SHALL return all guests in the Discard_Pile to the Deck before any ban selection occurs
2. WHEN guests are returned from the Discard_Pile to the Deck, THE Game_Store SHALL preserve each guest's type and name
3. WHEN guests from the Discard_Pile and guests from the Party (or house) are both returned to the Deck, THE Game_Store SHALL shuffle the Deck after all returns are complete

### Requirement 3: Modified Shutdown Flow on Non-Final Turn

**User Story:** As a player, I want to choose a guest to blame after a party bust, so that the bust has a lasting consequence for the next party.

#### Acceptance Criteria

1. WHEN a Party_Bust occurs on a non-final turn, THE Phase_Content SHALL display the Shutdown_Modal with an "End Party" button
2. WHEN the player dismisses the Shutdown_Modal on a non-final turn, THE Game_Store SHALL enter the Ban_Selection_Phase instead of advancing to the next turn
3. WHILE the Ban_Selection_Phase is active, THE Phase_Content SHALL display the Blame_Prompt text "Who takes the blame?" above the party guest cards
4. WHILE the Ban_Selection_Phase is active, THE Phase_Content SHALL display the guests that were in the Party at the time of the bust as selectable cards
5. WHILE the Ban_Selection_Phase is active, THE Status_Pane phase button and invite button SHALL be disabled

### Requirement 4: Shutdown Flow on Final Turn

**User Story:** As a player, I want the game to end immediately when a bust occurs on the final turn, so that no ban selection is needed.

#### Acceptance Criteria

1. WHEN a Party_Bust occurs on the Final_Turn, THE Phase_Content SHALL display the Shutdown_Modal with a "Game Over" button
2. WHEN the player clicks the "Game Over" button, THE Game_Store SHALL mark the game as complete and navigate to the home page
3. WHEN a Party_Bust occurs on the Final_Turn, THE Game_Store SHALL NOT enter the Ban_Selection_Phase

### Requirement 5: Ban Guest Selection

**User Story:** As a player, I want to select one guest from the busted party to ban, so that I can strategically choose which guest to remove.

#### Acceptance Criteria

1. WHEN the player selects a guest during the Ban_Selection_Phase, THE Phase_Content SHALL display the Ban_Confirmation_Modal
2. THE Ban_Confirmation_Modal SHALL display the message "{{guest-type}} {{name}} will be banned from the next party." using the selected guest's type label and name
3. THE Ban_Confirmation_Modal SHALL display an "OK" button to dismiss the modal
4. WHEN the player clicks the "OK" button on the Ban_Confirmation_Modal, THE Game_Store SHALL complete the ban process for the selected guest

### Requirement 6: Execute Ban Process

**User Story:** As a game designer, I want the ban process to move the selected guest to the discard pile and all other party guests to the deck, so that the game state is correctly updated after a ban.

#### Acceptance Criteria

1. WHEN the ban process completes, THE Game_Store SHALL place the Banned_Guest in the Discard_Pile
2. WHEN the ban process completes, THE Game_Store SHALL return all other guests that were in the Party (excluding the Banned_Guest) to the Deck
3. WHEN the ban process completes, THE Game_Store SHALL shuffle the Deck
4. WHEN the ban process completes, THE Game_Store SHALL advance to the Buy_Phase of the next turn
5. WHEN the ban process completes, THE Party SHALL be empty

### Requirement 7: Discard Pile Isolation from Invite

**User Story:** As a player, I want the invite button to only draw from the deck, so that banned guests do not appear at the next party.

#### Acceptance Criteria

1. WHEN the "Invite Guest" button is clicked, THE Game_Store SHALL draw a guest from the Deck only
2. THE Game_Store SHALL NOT draw guests from the Discard_Pile when inviting
3. WHILE the Deck is empty and the Discard_Pile contains guests, THE Game_Store SHALL treat the Deck as empty for invite purposes

### Requirement 8: Guest Conservation with Discard Pile

**User Story:** As a game designer, I want the total number of guests to remain constant across all three locations, so that no guests are created or destroyed.

#### Acceptance Criteria

1. FOR ALL game states, the sum of guests in Deck plus Party plus Discard_Pile SHALL equal the total number of guests initialized at game start
2. WHEN a guest is moved to the Discard_Pile, THE Game_Store SHALL remove the guest from the Party
3. WHEN guests are returned from the Discard_Pile to the Deck, THE Game_Store SHALL remove the guests from the Discard_Pile
4. FOR ALL guest movements between Deck, Party, and Discard_Pile, THE Game_Store SHALL preserve the guest's type and name

### Requirement 9: Ban Selection Displays Guest Type Labels

**User Story:** As a player, I want to see the guest type displayed in a readable format in the ban confirmation, so that I understand which type of guest I am banning.

#### Acceptance Criteria

1. WHEN displaying the Ban_Confirmation_Modal, THE Phase_Content SHALL use the guest type label "Old Friend" for OLD_FRIEND guests
2. WHEN displaying the Ban_Confirmation_Modal, THE Phase_Content SHALL use the guest type label "Wild Buddy" for WILD_BUDDY guests
3. WHEN displaying the Ban_Confirmation_Modal, THE Phase_Content SHALL use the guest type label "Rich Pal" for RICH_PAL guests
