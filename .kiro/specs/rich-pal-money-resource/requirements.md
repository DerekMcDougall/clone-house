# Requirements Document

## Introduction

This feature introduces a new guest type called "Rich Pal" and a new persistent resource called "money." Rich Pals grant money instead of popularity or trouble, creating a third resource dimension. Money persists across phases and accumulates like popularity. The starting deck expands from 8 to 10 guests, adding 2 Rich Pals (Khalil and Renata) to the existing 4 Old Friends and 4 Wild Buddies.

## Glossary

- **Game_Store**: The NgRx SignalStore that manages the game state
- **Status_Pane**: The UI component that displays game information in the side panel
- **Guest_Card**: The UI component that renders an individual guest as a card
- **Guest_Type**: A category of guest (e.g., OLD_FRIEND, WILD_BUDDY, RICH_PAL) with associated properties
- **Rich_Pal**: A new guest type that grants 1 money, 0 popularity, and 0 trouble when in the party at end of Party phase
- **Money**: A non-negative integer resource that persists between phases and accumulates over the course of the game
- **Money_Value**: An integer property of a guest type that determines how much money is granted when the guest is in the party at end of Party phase
- **Party_Phase**: The game phase where players invite guests to their party
- **Starting_Deck**: The initial set of guest cards the player begins the game with

## Requirements

### Requirement 1: Define Rich Pal Guest Type

**User Story:** As a game designer, I want to define a Rich Pal guest type with distinct properties, so that players have a new strategic option that generates money.

#### Acceptance Criteria

1. THE Guest_Type SHALL include a RICH_PAL variant in addition to the existing OLD_FRIEND and WILD_BUDDY variants
2. THE RICH_PAL guest type SHALL have a popularity_value of 0
3. THE RICH_PAL guest type SHALL have a trouble_value of 0
4. THE RICH_PAL guest type SHALL have a money_value of 1

### Requirement 2: Add Money Value Property to Guest Types

**User Story:** As a game designer, I want each guest type to have a money value, so that different guests affect the money resource differently.

#### Acceptance Criteria

1. THE Guest_Type SHALL have a money_value property that is an integer
2. FOR ALL guest types, THE Guest_Type SHALL define a default money_value
3. THE OLD_FRIEND guest type SHALL have a money_value of 0
4. THE WILD_BUDDY guest type SHALL have a money_value of 0

### Requirement 3: Initialize Money Resource

**User Story:** As a player, I want my money to start at zero at the beginning of each game, so that I have a consistent starting point.

#### Acceptance Criteria

1. WHEN the game is initialized, THE Game_Store SHALL set money to 0
2. WHEN the game is reset, THE Game_Store SHALL set money to 0

### Requirement 4: Maintain Non-Negative Money

**User Story:** As a player, I want my money to never go below zero, so that the resource behaves predictably.

#### Acceptance Criteria

1. THE Game_Store SHALL ensure money is always a non-negative integer
2. WHEN any operation would result in negative money, THE Game_Store SHALL set money to 0 instead

### Requirement 5: Calculate Money at End of Party Phase

**User Story:** As a player, I want to gain money based on the guests in my party at the end of the Party phase, so that Rich Pals provide a tangible benefit.

#### Acceptance Criteria

1. WHEN the Party phase ends, THE Game_Store SHALL calculate the total money change from all guests in the party
2. WHEN calculating money change, THE Game_Store SHALL sum the money_value of each guest in the party
3. WHEN the Party phase ends, THE Game_Store SHALL add the calculated money change to the current money
4. IF the resulting money would be negative, THEN THE Game_Store SHALL set money to 0

### Requirement 6: Preserve Money Across Turns

**User Story:** As a player, I want my money to accumulate across turns, so that I can build up this resource over the course of the game.

#### Acceptance Criteria

1. WHEN transitioning from Party phase to Buy phase, THE Game_Store SHALL preserve the money value
2. WHEN transitioning from Buy phase to Party phase, THE Game_Store SHALL preserve the money value
3. THE Game_Store SHALL maintain money as cumulative throughout the game

### Requirement 7: Display Money in Status Pane

**User Story:** As a player, I want to see my current money in the status pane below the popularity display, so that I can track my wealth.

#### Acceptance Criteria

1. THE Status_Pane SHALL display the current money value
2. THE Status_Pane SHALL display money below the popularity display and above the turns remaining display
3. THE Status_Pane SHALL update the money display when the money value changes

### Requirement 8: Display Rich Pal Card Header

**User Story:** As a player, I want Rich Pal guest cards to display "Rich Pal" as the header, so that I can visually distinguish them from other guest types.

#### Acceptance Criteria

1. WHEN a guest of type RICH_PAL is rendered, THE Guest_Card SHALL display "Rich Pal" as the card header
2. WHEN a guest of type OLD_FRIEND is rendered, THE Guest_Card SHALL continue to display "Old Friend" as the card header
3. WHEN a guest of type WILD_BUDDY is rendered, THE Guest_Card SHALL continue to display "Wild Buddy" as the card header

### Requirement 9: Rich Pal Unique Names

**User Story:** As a game designer, I want each Rich Pal to have a unique name, so that guests feel like distinct characters.

#### Acceptance Criteria

1. THE Game_Store SHALL assign unique names to each Rich Pal guest
2. FOR ALL guests in the deck, no two guests SHALL share the same name regardless of guest type

### Requirement 10: Update Starting Deck Composition

**User Story:** As a player, I want the starting deck to contain a mix of Old Friends, Wild Buddies, and Rich Pals, so that the game offers strategic variety from the start.

#### Acceptance Criteria

1. WHEN the game is initialized, THE Game_Store SHALL create a starting deck of 10 guests
2. WHEN the game is initialized, THE Game_Store SHALL include 4 Old Friend guests with names Brian, Colin, Emily, and Rachelle
3. WHEN the game is initialized, THE Game_Store SHALL include 4 Wild Buddy guests with names Anthony, Teresa, Jacco, and Jodie
4. WHEN the game is initialized, THE Game_Store SHALL include 2 Rich Pal guests with names Khalil and Renata
5. WHEN the game is initialized, THE Game_Store SHALL shuffle the starting deck

### Requirement 11: Money Independence from Other Resources

**User Story:** As a player, I want money, popularity, and trouble to be tracked independently, so that each resource has clear and predictable behavior.

#### Acceptance Criteria

1. THE Game_Store SHALL calculate money independently from popularity and trouble
2. THE Game_Store SHALL not use money to modify popularity or trouble calculations
3. THE Game_Store SHALL not use popularity or trouble to modify money calculations
