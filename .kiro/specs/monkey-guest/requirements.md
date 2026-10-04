# Requirements Document

## Introduction

This feature adds a new guest type called "Monkey" to the party game. Monkeys are high-popularity, moderate-trouble guests that are not part of the player's starting deck but can be purchased from the shop. The shop stocks exactly 4 named Monkey guests, each costing 3 popularity. Monkeys provide 4 popularity and 1 trouble when invited to a party, making them powerful but risky additions to the player's deck.

## Glossary

- **Monkey**: A new guest type with a popularity value of 4, a trouble value of 1, and a money value of 0
- **GuestType**: The TypeScript union type defining all valid guest categories; extended to include 'MONKEY'
- **GUEST_TYPE_DEFAULTS**: The constant mapping each GuestType to its default GuestProperties (popularity, trouble, money)
- **GUEST_TYPE_LABELS**: The constant mapping each GuestType to its human-readable display label
- **GUEST_TYPE_COSTS**: The constant mapping each GuestType to its popularity purchase cost (or null if not purchasable)
- **SHOP_GUESTS**: The constant array of named guests available for purchase in the shop
- **INITIAL_GUESTS**: The constant array of named guests included in the player's starting deck
- **Shop_Inventory**: The data structure tracking remaining purchasable guests per type, initialized at game start
- **Deck**: The player's collection of guest cards drawn from during the PARTY phase
- **GameStore**: The NgRx SignalStore managing all game state including deck, popularity, and shop inventory
- **PhaseContentComponent**: The Angular component responsible for rendering phase-specific content including the shop during the BUY phase
- **GuestCardComponent**: The Angular component that renders an individual guest card with type label, icon, and name

## Requirements

### Requirement 1: Monkey Guest Type Definition

**User Story:** As a developer, I want the Monkey guest type to be defined in the guest model, so that the game recognizes Monkeys as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'MONKEY'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'MONKEY' to a GuestProperties with popularityValue of 4, troubleValue of 1, and moneyValue of 0
3. THE GUEST_TYPE_LABELS SHALL map 'MONKEY' to the display label "Monkey"

### Requirement 2: Monkey Purchase Cost

**User Story:** As a player, I want to know how much a Monkey costs, so that I can plan my popularity spending.

#### Acceptance Criteria

1. THE GUEST_TYPE_COSTS SHALL map 'MONKEY' to a popularity cost of 3

### Requirement 3: Monkey Shop Inventory

**User Story:** As a player, I want the shop to stock Monkey guests, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Monkey entries with the names "George", "Punch", "Darwin", and "Diddy"
2. WHEN the game is initialized, THE GameStore SHALL create a Shop_Inventory entry for Monkey containing 4 named guests available for purchase
3. THE Shop_Inventory entry for Monkey SHALL have a cost of 3

### Requirement 4: Monkey Excluded from Starting Deck

**User Story:** As a player, I want to start the game without any Monkeys in my deck, so that Monkeys are only obtainable through the shop.

#### Acceptance Criteria

1. THE INITIAL_GUESTS SHALL contain zero entries with type 'MONKEY'
2. WHEN the game is initialized, THE Deck SHALL contain zero Monkey guests

### Requirement 5: Monkey Purchase Behavior

**User Story:** As a player, I want to buy a Monkey from the shop and add it to my deck, so that I can benefit from its high popularity at future parties.

#### Acceptance Criteria

1. WHEN the player purchases a Monkey from the shop AND the Shop_Inventory has at least 1 Monkey remaining AND the player's popularity is greater than or equal to 3, THE GameStore SHALL select a random named Monkey from the remaining Monkey Shop_Inventory and add that guest to the Deck
2. WHEN a successful Monkey purchase occurs, THE GameStore SHALL deduct 3 popularity from the player's current popularity
3. WHEN a successful Monkey purchase occurs, THE GameStore SHALL remove the selected named Monkey from the Shop_Inventory and decrement the Monkey stock by 1

### Requirement 6: Monkey Party Contribution

**User Story:** As a player, I want Monkeys to contribute popularity and trouble at parties, so that inviting them has meaningful gameplay impact.

#### Acceptance Criteria

1. WHEN a Monkey guest is in the party, THE GameStore SHALL include 4 popularity from that Monkey in the party's total popularity calculation
2. WHEN a Monkey guest is in the party, THE GameStore SHALL include 1 trouble from that Monkey in the party's total trouble calculation
3. WHEN a Monkey guest is in the party, THE GameStore SHALL include 0 money from that Monkey in the party's total money calculation

### Requirement 7: Monkey Shop Display

**User Story:** As a player, I want to see the Monkey option in the shop alongside other guest types, so that I can compare and choose what to buy.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE PhaseContentComponent SHALL display a shop card for the Monkey guest type showing the label "Monkey"
2. THE Monkey shop card SHALL display "Price: 3" as the cost
3. THE Monkey shop card SHALL display "Available: {remaining_stock}" reflecting the current Monkey inventory count
4. THE Shop SHALL display the Monkey card in the correct position according to the existing shop display ordering rules (ascending cost, then alphabetical label for ties)

### Requirement 8: Monkey Guest Card Rendering

**User Story:** As a player, I want Monkey guests in my party to be displayed as cards with their name and type, so that I can identify them during gameplay.

#### Acceptance Criteria

1. WHEN a Monkey guest is in the party, THE GuestCardComponent SHALL display "Monkey" as the card header label
2. WHEN a Monkey guest is in the party, THE GuestCardComponent SHALL display the Monkey's name as the card caption
