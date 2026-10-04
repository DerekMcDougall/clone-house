# Requirements Document

## Introduction

This feature introduces a new guest type called "Wild Buddy" and a new resource called "trouble." Wild Buddies are high-reward, high-risk guests that grant more popularity than Old Friends but also generate trouble. The trouble resource tracks accumulated risk during the Party phase and resets when the party ends. The starting deck is expanded from 6 to 8 guests, with 4 Old Friends and 4 Wild Buddies.

## Glossary

- **Game_Store**: The NgRx SignalStore that manages the game state
- **Status_Pane**: The UI component that displays game information in the side panel
- **Guest_Card**: The UI component that renders an individual guest as a card
- **Guest_Type**: A category of guest (e.g., OLD_FRIEND, WILD_BUDDY) with associated properties
- **Wild_Buddy**: A new guest type that grants 2 popularity and 1 trouble when entering the party
- **Old_Friend**: An existing guest type that grants 1 popularity when entering the party
- **Trouble**: A non-negative integer resource that accumulates during the Party phase and resets when the party ends
- **Trouble_Value**: An integer property of a guest type that determines how much trouble is generated when the guest enters the party
- **Popularity_Value**: An integer property of a guest type that determines how much popularity is gained or lost
- **Party_Phase**: The game phase where players invite guests to their party
- **Starting_Deck**: The initial set of guest cards the player begins the game with

## Requirements

### Requirement 1: Define Wild Buddy Guest Type

**User Story:** As a game designer, I want to define a Wild Buddy guest type with distinct properties, so that players have a meaningful choice between guest types.

#### Acceptance Criteria

1. THE Guest_Type SHALL include a WILD_BUDDY variant in addition to the existing OLD_FRIEND variant
2. THE WILD_BUDDY guest type SHALL have a popularity_value of 2
3. THE WILD_BUDDY guest type SHALL have a trouble_value of 1
4. THE OLD_FRIEND guest type SHALL have a trouble_value of 0

### Requirement 2: Add Trouble Value Property to Guest Types

**User Story:** As a game designer, I want each guest type to have a trouble value, so that different guests affect the trouble resource differently.

#### Acceptance Criteria

1. THE Guest_Type SHALL have a trouble_value property that is a non-negative integer
2. FOR ALL guest types, THE Guest_Type SHALL define a default trouble_value

### Requirement 3: Derive Trouble from Party Composition

**User Story:** As a player, I want trouble to always reflect the current party composition, so that it is always accurate and consistent.

#### Acceptance Criteria

1. THE Game_Store SHALL derive trouble as a computed value from the current party members
2. THE Game_Store SHALL NOT store trouble as independent mutable state
3. WHEN the party is empty, THE computed trouble SHALL be 0

### Requirement 4: Compute Trouble from Current Party

**User Story:** As a player, I want trouble to reflect the current guests in the party, so that removing a guest in the future correctly reduces trouble.

#### Acceptance Criteria

1. THE Game_Store SHALL compute trouble as the sum of trouble_value for all guests currently in the party
2. WHEN a guest is invited to the party, THE Game_Store SHALL recompute trouble to include the new guest's trouble_value
3. THE Game_Store SHALL support future removal of guests by recomputing trouble from the remaining party members
4. FOR ALL game states, trouble SHALL equal the sum of trouble_value of all guests in the party

### Requirement 5: Trouble Resets Implicitly When Party Ends

**User Story:** As a player, I want trouble to be zero at the start of each party, so that each party starts fresh.

#### Acceptance Criteria

1. WHEN the Party phase ends and the party is emptied, THE computed trouble SHALL be 0
2. THE Game_Store SHALL NOT require explicit trouble reset logic

### Requirement 6: Display Trouble in Status Pane During Party Phase

**User Story:** As a player, I want to see the current trouble amount in the status pane during the Party phase, so that I can make informed decisions about inviting guests.

#### Acceptance Criteria

1. WHILE the current phase is Party_Phase, THE Status_Pane SHALL display the current trouble value
2. THE Status_Pane SHALL display trouble below the turns remaining display
3. WHILE the current phase is Party_Phase, THE Status_Pane SHALL update the trouble display when the trouble value changes
4. WHILE the current phase is Buy_Phase, THE Status_Pane SHALL not display the trouble value

### Requirement 7: Display Wild Buddy Card Header

**User Story:** As a player, I want Wild Buddy guest cards to display "Wild Buddy" as the header, so that I can visually distinguish them from Old Friends.

#### Acceptance Criteria

1. WHEN a guest of type WILD_BUDDY is rendered, THE Guest_Card SHALL display "Wild Buddy" as the card header
2. WHEN a guest of type OLD_FRIEND is rendered, THE Guest_Card SHALL display "Old Friend" as the card header

### Requirement 8: Wild Buddy Unique Names

**User Story:** As a game designer, I want each Wild Buddy to have a unique name, so that guests feel like distinct characters.

#### Acceptance Criteria

1. THE Game_Store SHALL assign unique names to each Wild Buddy guest
2. FOR ALL guests in the deck, no two guests SHALL share the same name regardless of guest type

### Requirement 9: Update Starting Deck Composition

**User Story:** As a player, I want the starting deck to contain a mix of Old Friends and Wild Buddies, so that the game offers strategic variety from the start.

#### Acceptance Criteria

1. WHEN the game is initialized, THE Game_Store SHALL create a starting deck of 8 guests
2. WHEN the game is initialized, THE Game_Store SHALL include 4 Old Friend guests with names Brian, Colin, Emily, and Rachelle
3. WHEN the game is initialized, THE Game_Store SHALL include 4 Wild Buddy guests with names Anthony, Teresa, Jacco, and Jodie
4. WHEN the game is initialized, THE Game_Store SHALL shuffle the starting deck

### Requirement 10: Trouble and Popularity Independence

**User Story:** As a player, I want trouble and popularity to be tracked independently, so that each resource has clear and predictable behavior.

#### Acceptance Criteria

1. WHEN a guest is invited to the party, THE Game_Store SHALL update trouble and popularity independently based on the guest's properties
2. THE Game_Store SHALL not use trouble to modify popularity calculations
3. THE Game_Store SHALL not use popularity to modify trouble calculations
