# Requirements Document

## Introduction

During the BUY phase of each turn, the player can spend popularity to purchase new guests from a shop. Purchased guests are permanently added to the player's deck for the remainder of the game. The shop offers a fixed inventory of Old Friends and Rich Pals that is not replenished once sold out. The shop UI displays each available guest type as a card (without a name) along with its price and remaining stock, and provides feedback modals for error conditions and a brief confirmation animation on successful purchase.

## Glossary

- **Shop**: The UI section displayed during the BUY phase that presents purchasable guest types with their price and remaining stock
- **Shop_Inventory**: The data structure tracking the remaining quantity of each purchasable guest type, initialized at game start and decremented on purchase
- **Guest_Type_Card**: A visual card in the shop representing a guest type, rendered like a GuestCardComponent but without a guest name
- **Popularity_Cost**: The amount of popularity required to purchase one guest of a given type; defined as 2 for Old Friend, 3 for Rich Pal, and null for Wild Buddy
- **PhaseContentComponent**: The Angular component responsible for rendering phase-specific content including the shop during the BUY phase
- **GameStore**: The NgRx SignalStore managing all game state including deck, popularity, and shop inventory
- **Deck**: The player's collection of guest cards that are drawn from during the PARTY phase
- **Added_Feedback**: A brief "Added!" text that appears on a Guest_Type_Card after a successful purchase and fades away
- **Error_Modal**: A dialog overlay with a message and an "OK" dismiss button, used for sold-out and insufficient-popularity conditions
- **Shop_Guest_Pool**: The named set of individual guests available in the shop for each guest type; Old Friends are Matt, Chad, Wes, and Caleb; Rich Pals are Kevin, Arlene, Robert, and Jim
- **Shop_Display_Order**: The ordering rule for guest types in the Shop; guest types are sorted first by ascending Popularity_Cost, then alphabetically by guest type label

## Requirements

### Requirement 1: Shop Inventory Initialization

**User Story:** As a player, I want the shop to start with a fixed stock of purchasable guests, so that I have a known set of options available each game.

#### Acceptance Criteria

1. WHEN the game is initialized, THE GameStore SHALL create a Shop_Inventory with 4 named Old Friend guests (Matt, Chad, Wes, Caleb) and 4 named Rich Pal guests (Kevin, Arlene, Robert, Jim) available for purchase
2. THE Shop_Inventory SHALL assign a Popularity_Cost of 2 to Old Friend guests
3. THE Shop_Inventory SHALL assign a Popularity_Cost of 3 to Rich Pal guests
4. THE Shop_Inventory SHALL assign a Popularity_Cost of null to Wild Buddy guests
5. WHEN a guest type has a Popularity_Cost of null, THE Shop SHALL exclude that guest type from the purchasable offerings

### Requirement 2: Shop Display During BUY Phase

**User Story:** As a player, I want to see the available guest types with their prices and stock in the shop, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE PhaseContentComponent SHALL display the Shop containing one Guest_Type_Card for each purchasable guest type
2. THE Guest_Type_Card SHALL render the guest type label and icon identically to the GuestCardComponent, except that the Guest_Type_Card SHALL omit the guest name
3. THE Guest_Type_Card SHALL display the text "Price: {Popularity_Cost}" beneath the card for the corresponding guest type
4. THE Guest_Type_Card SHALL display the text "Available: {remaining_stock}" beneath the price line for the corresponding guest type
5. WHILE the current phase is not BUY, THE PhaseContentComponent SHALL not display the Shop

### Requirement 3: Successful Guest Purchase

**User Story:** As a player, I want to buy a guest from the shop and add it to my deck, so that I can strengthen my deck for future parties.

#### Acceptance Criteria

1. WHEN the player clicks a Guest_Type_Card AND the Shop_Inventory has at least 1 guest of the selected type remaining AND the player's popularity is greater than or equal to the Popularity_Cost of the selected type, THE GameStore SHALL select a random named guest from the remaining Shop_Guest_Pool of the selected type and add that guest to the Deck
2. WHEN a successful purchase occurs, THE GameStore SHALL deduct the Popularity_Cost from the player's current popularity
3. WHEN a successful purchase occurs, THE GameStore SHALL remove the selected named guest from the Shop_Guest_Pool and decrement the Shop_Inventory stock for the purchased guest type by 1
4. WHEN a successful purchase occurs, THE Guest_Type_Card SHALL display the Added_Feedback text "Added!" on the card
5. THE Added_Feedback SHALL fade away after a brief visible duration
6. WHEN a guest is added to the Deck via purchase, THE guest SHALL retain its name and remain in the Deck permanently for the remainder of the game

### Requirement 4: Sold Out Error Handling

**User Story:** As a player, I want to be informed when a guest type is sold out, so that I know I cannot purchase more of that type.

#### Acceptance Criteria

1. WHEN the player clicks a Guest_Type_Card AND the Shop_Inventory has 0 guests of the selected type remaining, THE PhaseContentComponent SHALL display an Error_Modal with the message "No {guest_type_label} available!"
2. THE Error_Modal SHALL include an "OK" button that dismisses the modal when clicked

### Requirement 5: Insufficient Popularity Error Handling

**User Story:** As a player, I want to be informed when I lack the popularity to buy a guest, so that I understand why the purchase failed.

#### Acceptance Criteria

1. WHEN the player clicks a Guest_Type_Card AND the Shop_Inventory has at least 1 guest of the selected type remaining AND the player's popularity is less than the Popularity_Cost of the selected type, THE PhaseContentComponent SHALL display an Error_Modal with the message "Not enough popularity!"
2. THE Error_Modal SHALL include an "OK" button that dismisses the modal when clicked

### Requirement 6: Shop Inventory Persistence

**User Story:** As a player, I want the shop stock to persist across turns without replenishment, so that purchasing decisions have lasting consequences.

#### Acceptance Criteria

1. WHEN a turn advances from PARTY phase to the next BUY phase, THE GameStore SHALL preserve the current Shop_Inventory stock values without modification
2. THE GameStore SHALL not replenish or reset the Shop_Inventory at any point after game initialization

### Requirement 7: Shop Guest Names and Identity

**User Story:** As a player, I want each shop guest to have a unique name, so that purchased guests feel like distinct individuals when added to my deck.

#### Acceptance Criteria

1. THE Shop_Guest_Pool SHALL contain 4 Old Friend guests named Matt, Chad, Wes, and Caleb
2. THE Shop_Guest_Pool SHALL contain 4 Rich Pal guests named Kevin, Arlene, Robert, and Jim
3. WHEN a guest is purchased from the Shop, THE GameStore SHALL assign the selected guest's name to the guest added to the Deck
4. THE Guest_Type_Card SHALL not display individual guest names in the Shop

### Requirement 8: Random Selection from Shop Stock

**User Story:** As a player, I want the specific guest I receive to be randomly chosen from the remaining stock, so that each purchase feels varied and unpredictable.

#### Acceptance Criteria

1. WHEN a purchase of a guest type is initiated, THE GameStore SHALL select one guest uniformly at random from the remaining Shop_Guest_Pool entries of the selected type
2. WHEN a guest is selected for purchase, THE GameStore SHALL remove that specific named guest from the Shop_Guest_Pool so that the same named guest cannot be purchased again
3. WHILE only 1 guest of a given type remains in the Shop_Guest_Pool, THE GameStore SHALL select that remaining guest deterministically

### Requirement 9: Shop Display Ordering

**User Story:** As a player, I want the shop to display guest types in a consistent order, so that I can quickly find the type I want to buy.

#### Acceptance Criteria

1. THE Shop SHALL display Guest_Type_Cards ordered first by ascending Popularity_Cost
2. WHEN two guest types have the same Popularity_Cost, THE Shop SHALL order those Guest_Type_Cards alphabetically by guest type label
3. THE Shop_Display_Order SHALL place Old Friend (Popularity_Cost 2) before Rich Pal (Popularity_Cost 3)
