# Requirements Document

## Introduction

This feature adds a trouble limit system to the Party phase. When accumulated trouble exceeds the limit, the party is immediately shut down — the player forfeits popularity and money gains from that party's guests, though guests still return to the deck as normal. A modal dialog informs the player of the shutdown. The trouble display in the status pane is updated to show the current trouble relative to the limit. The trouble limit defaults to 2 but supports modification by future game effects, both single-party (temporary) and permanent scopes.

## Glossary

- **Game_Store**: The NgRx SignalStore that manages the game state
- **Status_Pane**: The UI component that displays game information in the right-side panel
- **Phase_Content**: The UI component that renders the main content area for the current phase
- **Trouble**: A computed non-negative integer resource representing accumulated risk from party guests
- **Trouble_Limit**: A non-negative integer threshold; when trouble exceeds this value, the party is shut down
- **Base_Trouble_Limit**: The permanent trouble limit value that persists across parties (default 2)
- **Party_Trouble_Limit_Modifier**: A temporary integer modifier to the trouble limit that applies only to the current party and resets to 0 when the party ends
- **Effective_Trouble_Limit**: The sum of Base_Trouble_Limit and Party_Trouble_Limit_Modifier, representing the actual threshold used during a party
- **Party_Shutdown**: The event triggered when trouble exceeds the Effective_Trouble_Limit, causing the party to end without granting resources
- **Shutdown_Modal**: A modal dialog displayed to the player when a Party_Shutdown occurs
- **Party_Phase**: The game phase where players invite guests to their party
- **Buy_Phase**: The game phase where players purchase items from the shop

## Requirements

### Requirement 1: Define Trouble Limit State

**User Story:** As a game designer, I want the game to track a trouble limit with both permanent and temporary components, so that future game effects can modify the limit in flexible ways.

#### Acceptance Criteria

1. THE Game_Store SHALL maintain a Base_Trouble_Limit as stored state with a default value of 2
2. THE Game_Store SHALL maintain a Party_Trouble_Limit_Modifier as stored state with a default value of 0
3. THE Game_Store SHALL derive the Effective_Trouble_Limit as a computed value equal to Base_Trouble_Limit plus Party_Trouble_Limit_Modifier
4. WHEN the game is initialized, THE Game_Store SHALL set Base_Trouble_Limit to 2 and Party_Trouble_Limit_Modifier to 0

### Requirement 2: Reset Party Trouble Limit Modifier After Party Ends

**User Story:** As a game designer, I want temporary trouble limit modifications to reset after each party, so that single-party effects do not carry over.

#### Acceptance Criteria

1. WHEN the Party phase ends normally (player presses End Party or Game Over), THE Game_Store SHALL reset Party_Trouble_Limit_Modifier to 0
2. WHEN the Party phase ends due to a Party_Shutdown, THE Game_Store SHALL reset Party_Trouble_Limit_Modifier to 0

### Requirement 3: Detect Trouble Exceeding Limit

**User Story:** As a player, I want the game to detect when trouble exceeds the limit for any reason, so that the party is shut down immediately.

#### Acceptance Criteria

1. WHEN trouble exceeds the Effective_Trouble_Limit during the Party phase for any reason, THE Game_Store SHALL trigger a Party_Shutdown
2. THE Game_Store SHALL evaluate trouble against the Effective_Trouble_Limit whenever either value changes
3. WHILE trouble is less than or equal to the Effective_Trouble_Limit, THE Game_Store SHALL allow the party to continue normally

### Requirement 4: Party Shutdown Forfeits Resources

**User Story:** As a player, I want to lose the party's resource gains when the party is shut down, so that exceeding the trouble limit has meaningful consequences.

#### Acceptance Criteria

1. WHEN a Party_Shutdown occurs, THE Game_Store SHALL not add popularity from the current party's guests to the player's popularity total
2. WHEN a Party_Shutdown occurs, THE Game_Store SHALL not add money from the current party's guests to the player's money total
3. WHEN a Party_Shutdown occurs, THE Game_Store SHALL return all party guests to the deck

### Requirement 5: Party Shutdown Advances Game State

**User Story:** As a player, I want the game to continue to the next turn after a shutdown, so that the game flow is not broken.

#### Acceptance Criteria

1. WHEN a Party_Shutdown occurs and the current turn is not the final turn, THE Game_Store SHALL advance to the Buy phase of the next turn
2. WHEN a Party_Shutdown occurs and the current turn is the final turn, THE Game_Store SHALL mark the game as complete

### Requirement 6: Display Shutdown Modal

**User Story:** As a player, I want to see a modal dialog when the party is shut down, so that I understand what happened.

#### Acceptance Criteria

1. WHEN a Party_Shutdown occurs, THE Phase_Content SHALL display the Shutdown_Modal
2. THE Shutdown_Modal SHALL display the message "The party has gotten out of control and has been shut down!"
3. WHEN the current turn is not the final turn, THE Shutdown_Modal SHALL display a button labeled "End Party"
4. WHEN the current turn is the final turn, THE Shutdown_Modal SHALL display a button labeled "Game Over"
5. WHEN the player clicks the Shutdown_Modal button, THE Game_Store SHALL advance the game state as described in Requirement 5
6. WHILE the Shutdown_Modal is displayed, THE Status_Pane phase button and invite button SHALL be disabled or hidden

### Requirement 7: Update Trouble Display Format

**User Story:** As a player, I want to see the trouble limit alongside the current trouble, so that I know how close I am to a shutdown.

#### Acceptance Criteria

1. WHILE the current phase is Party_Phase, THE Status_Pane SHALL display trouble in the format "{current trouble} / {Effective_Trouble_Limit}"
2. WHEN the game enters the Party phase with default settings, THE Status_Pane SHALL display "0 / 2" as the initial trouble value
3. WHEN the Effective_Trouble_Limit changes due to a modifier, THE Status_Pane SHALL update the displayed limit value

### Requirement 8: Trouble Limit Modification Support

**User Story:** As a game designer, I want the ability to modify the trouble limit both temporarily and permanently, so that future game effects can interact with the trouble system.

#### Acceptance Criteria

1. THE Game_Store SHALL provide a method to modify the Base_Trouble_Limit by a given integer delta for permanent changes
2. THE Game_Store SHALL provide a method to modify the Party_Trouble_Limit_Modifier by a given integer delta for single-party changes
3. WHEN the Base_Trouble_Limit is modified, THE Effective_Trouble_Limit SHALL reflect the change immediately
4. WHEN the Party_Trouble_Limit_Modifier is modified, THE Effective_Trouble_Limit SHALL reflect the change immediately
