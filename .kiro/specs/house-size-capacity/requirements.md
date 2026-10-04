# Requirements Document

## Introduction

The house has a limited capacity that restricts how many guests can attend a party. The game starts with a house capacity of 5. Players can increase capacity by purchasing "Expand House" upgrades from the shop using money (not popularity). The shop offers 29 expansions with escalating costs. During the party phase, empty guest slots are visualized as card shadows. The main content area scrolls vertically when the house is too large to fit on screen, while the right status pane remains fixed.

## Glossary

- **House_Capacity**: A non-negative integer representing the maximum number of guests allowed in the party at one time; starts at 5 and increases by 1 per expansion purchased
- **Expand_House_Item**: A shop item displayed as the last entry in the shop that costs money (not popularity) and increases House_Capacity by 1 when purchased
- **Expansion_Stock**: The total number of Expand_House_Item purchases available in the shop; starts at 29 and decrements by 1 per purchase
- **Expansion_Cost**: The money cost of the next Expand_House_Item purchase; starts at 2 for the first expansion, increases by 1 for each subsequent purchase, and caps at 12
- **Card_Shadow**: A placeholder visual element rendered in each empty party slot during the PARTY phase, representing an available spot for a guest
- **House_Full_Modal**: A dialog overlay with the message "The house is full!" and an OK dismiss button, displayed when the player attempts to invite a guest while the party is at House_Capacity
- **Money_Error_Modal**: A dialog overlay with the message "Not enough money!" and an OK dismiss button, displayed when the player attempts to buy an expansion without sufficient money
- **GameStore**: The NgRx SignalStore managing all game state including deck, party, popularity, money, and house capacity
- **PhaseContentComponent**: The Angular component responsible for rendering phase-specific content including the shop during BUY phase and party guests during PARTY phase
- **StatusPaneComponent**: The Angular component displaying game stats and action buttons in the right sidebar
- **Main_Pane**: The left content area of the gameplay layout that displays phase content and scrolls vertically when content overflows
- **Right_Pane**: The right sidebar containing the StatusPaneComponent that remains fixed and does not scroll

## Requirements

### Requirement 1: Initial House Capacity

**User Story:** As a player, I want the house to start with a capacity of 5, so that my early parties have a natural size limit.

#### Acceptance Criteria

1. WHEN the game is initialized, THE GameStore SHALL set House_Capacity to 5
2. THE House_Capacity SHALL persist across turn transitions without modification unless an Expand_House_Item is purchased

### Requirement 2: House Capacity Enforces Party Size Limit

**User Story:** As a player, I want the house capacity to limit how many guests can attend the party, so that I must strategically manage my party size.

#### Acceptance Criteria

1. WHEN the player attempts to invite a guest while the party size equals House_Capacity, THE GameStore SHALL set the `showHouseFullMessage` flag and not modify the party or deck
2. WHEN `showHouseFullMessage` is true, THE PhaseContentComponent SHALL display the House_Full_Modal with the message "The house is full!"
3. THE House_Full_Modal SHALL include an "OK" button that dismisses the modal when clicked

### Requirement 3: Expand House Shop Item Display

**User Story:** As a player, I want to see the Expand House option in the shop with its current cost, so that I can decide whether to invest money in a larger house.

#### Acceptance Criteria

1. WHILE the current phase is BUY AND Expansion_Stock is greater than 0, THE PhaseContentComponent SHALL display the Expand_House_Item as the last item in the shop
2. THE Expand_House_Item SHALL display the current Expansion_Cost with a "$" prefix (e.g., "$2", "$3")
3. THE Expand_House_Item SHALL display the remaining Expansion_Stock as available quantity
4. WHILE the current phase is not BUY, THE PhaseContentComponent SHALL not display the Expand_House_Item

### Requirement 4: Expansion Cost Calculation

**User Story:** As a player, I want expansion costs to escalate with each purchase, so that growing the house becomes progressively more expensive.

#### Acceptance Criteria

1. THE Expansion_Cost for the first expansion SHALL be 2 money
2. THE Expansion_Cost for the second expansion SHALL be 3 money
3. WHEN the player has purchased N expansions (where N >= 0), THE Expansion_Cost for the next expansion SHALL be min(N + 2, 12) money
4. THE Expansion_Cost SHALL not exceed 12 money regardless of the number of expansions purchased
5. WHEN an expansion is purchased, THE Expand_House_Item SHALL immediately update to display the new Expansion_Cost

### Requirement 5: Successful House Expansion Purchase

**User Story:** As a player, I want to buy a house expansion to increase my party capacity, so that I can invite more guests in future turns.

#### Acceptance Criteria

1. WHEN the player clicks the Expand_House_Item AND the player's money is greater than or equal to the Expansion_Cost AND Expansion_Stock is greater than 0, THE GameStore SHALL increase House_Capacity by 1
2. WHEN a successful expansion purchase occurs, THE GameStore SHALL deduct the Expansion_Cost from the player's current money
3. WHEN a successful expansion purchase occurs, THE GameStore SHALL decrement Expansion_Stock by 1
4. WHEN a successful expansion purchase occurs, THE GameStore SHALL update the Expansion_Cost to reflect the new cost for the next expansion

### Requirement 6: Insufficient Money Error Handling

**User Story:** As a player, I want to be informed when I lack the money to expand the house, so that I understand why the purchase failed.

#### Acceptance Criteria

1. WHEN the player clicks the Expand_House_Item AND the player's money is less than the Expansion_Cost, THE PhaseContentComponent SHALL display the Money_Error_Modal with the message "Not enough money!"
2. THE Money_Error_Modal SHALL include an "OK" button that dismisses the modal when clicked
3. WHEN the player's money is less than the Expansion_Cost, THE GameStore SHALL not modify House_Capacity, money, or Expansion_Stock

### Requirement 7: Expansion Stock Limits

**User Story:** As a player, I want there to be a finite number of expansions available, so that house growth has a natural ceiling.

#### Acceptance Criteria

1. WHEN the game is initialized, THE GameStore SHALL set Expansion_Stock to 29
2. THE maximum achievable House_Capacity SHALL be 34 (initial capacity of 5 plus 29 expansions)
3. WHEN Expansion_Stock reaches 0, THE PhaseContentComponent SHALL not display the Expand_House_Item in the shop

### Requirement 8: Party Phase Card Shadows

**User Story:** As a player, I want to see empty slots in the party as card shadows, so that I can visualize how much room remains in the house.

#### Acceptance Criteria

1. WHILE the current phase is PARTY, THE PhaseContentComponent SHALL render one Card_Shadow for each empty guest slot (House_Capacity minus current party size)
2. THE Card_Shadow SHALL be visually distinct from guest cards, rendered as a muted placeholder shape matching the guest card dimensions
3. WHEN a guest is invited to the party, THE PhaseContentComponent SHALL replace one Card_Shadow with the invited guest's card
4. WHEN the party size equals House_Capacity, THE PhaseContentComponent SHALL render zero Card_Shadows

### Requirement 9: Main Pane Vertical Scrolling

**User Story:** As a player, I want the main content area to scroll vertically when the house is too large to fit on screen, so that I can see all party slots.

#### Acceptance Criteria

1. WHILE the party content exceeds the visible height of the Main_Pane, THE Main_Pane SHALL scroll vertically to reveal all content
2. THE Main_Pane SHALL not scroll horizontally
3. THE Right_Pane SHALL not scroll vertically or horizontally regardless of Main_Pane content size
4. THE Right_Pane SHALL remain fixed in position while the Main_Pane scrolls

### Requirement 10: House Capacity Persistence Across Game Events

**User Story:** As a player, I want my house expansions to persist for the entire game, so that my investment carries forward.

#### Acceptance Criteria

1. WHEN a turn advances from PARTY phase to the next BUY phase, THE GameStore SHALL preserve the current House_Capacity without modification
2. WHEN a party shutdown occurs, THE GameStore SHALL preserve the current House_Capacity without modification
3. WHEN the game is reset, THE GameStore SHALL reset House_Capacity to 5 and Expansion_Stock to 29
