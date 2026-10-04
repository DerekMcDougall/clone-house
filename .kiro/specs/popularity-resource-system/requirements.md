# Requirements Document

## Introduction

The popularity resource system introduces a new player resource called "popularity" that tracks the player's social standing throughout the game. This resource starts at zero and increases or decreases based on the guests present at the end of each Party phase. Popularity will be used in future features to unlock the ability to purchase additional guests during the Buy phase.

## Glossary

- **Game_Store**: The NgRx SignalStore that manages the game state
- **Status_Pane**: The UI component that displays game information in the side panel
- **Popularity**: A non-negative integer resource that represents the player's social standing
- **Guest**: A party attendee with a type and name
- **Guest_Type**: A category of guest (e.g., OLD_FRIEND) that has associated properties including popularity value
- **Party_Phase**: The game phase where players invite guests to their party
- **Buy_Phase**: The game phase where players will eventually purchase guests (future feature)
- **Popularity_Value**: An integer property of a guest type that determines how much popularity is gained or lost
## Requirements

### Requirement 1: Initialize Popularity Resource

**User Story:** As a player, I want my popularity to start at zero at the beginning of each game, so that I have a consistent starting point.

#### Acceptance Criteria

1. WHEN the game is initialized, THE Game_Store SHALL set the popularity to 0
2. WHEN the game is reset, THE Game_Store SHALL set the popularity to 0

### Requirement 2: Maintain Non-Negative Popularity

**User Story:** As a player, I want my popularity to never go below zero, so that the resource behaves predictably.

#### Acceptance Criteria

1. THE Game_Store SHALL ensure popularity is always a non-negative integer
2. WHEN any operation would result in negative popularity, THE Game_Store SHALL set popularity to 0 instead

### Requirement 3: Display Popularity in Status Pane

**User Story:** As a player, I want to see my current popularity in the status pane above turns remaining, so that I can track my progress.

#### Acceptance Criteria

1. THE Status_Pane SHALL display the current popularity value
2. THE Status_Pane SHALL display popularity above the turns remaining display
3. THE Status_Pane SHALL update the popularity display when the popularity value changes

### Requirement 4: Define Guest Type Popularity Values

**User Story:** As a game designer, I want each guest type to have a popularity value, so that different guests affect the player's popularity differently.

#### Acceptance Criteria

1. THE Guest_Type SHALL have a popularity_value property that is an integer
2. THE Guest_Type popularity_value MAY be negative, zero, or positive
3. THE OLD_FRIEND guest type SHALL have a popularity_value of 1

### Requirement 5: Calculate Popularity at End of Party Phase

**User Story:** As a player, I want to gain or lose popularity based on the guests in my party at the end of the Party phase, so that my choices have meaningful consequences.

#### Acceptance Criteria

1. WHEN the Party phase ends, THE Game_Store SHALL calculate the total popularity change from all guests in the party
2. WHEN calculating popularity change, THE Game_Store SHALL sum the popularity_value of each guest in the party
3. WHEN the Party phase ends, THE Game_Store SHALL add the calculated popularity change to the current popularity
4. IF the resulting popularity would be negative, THEN THE Game_Store SHALL set popularity to 0

### Requirement 6: Preserve Popularity Across Turns

**User Story:** As a player, I want my popularity to accumulate across turns, so that I can build up this resource over the course of the game.

#### Acceptance Criteria

1. WHEN transitioning from Party phase to Buy phase, THE Game_Store SHALL preserve the popularity value
2. WHEN transitioning from Buy phase to Party phase, THE Game_Store SHALL preserve the popularity value
3. THE Game_Store SHALL maintain popularity as cumulative throughout the game

### Requirement 7: Popularity Calculation Example Verification

**User Story:** As a player, I want the popularity calculation to work correctly for multiple guests of the same type, so that I can predict the outcome of my party.

#### Acceptance Criteria

1. WHEN the party contains 4 OLD_FRIEND guests at the end of Party phase, THE Game_Store SHALL increase popularity by 4
2. FOR ALL guest types, WHEN N guests of that type are in the party, THE Game_Store SHALL add N times the guest type's popularity_value to the popularity total
3. WHEN the party contains guests with mixed popularity values (positive and negative), THE Game_Store SHALL correctly sum all values and apply the non-negative constraint
