# Requirements Document

## Introduction

This feature adds four new guest types to the party game: Auctioneer, Gangster, Rock Star, and Gambler. None of these guests appear in the player's starting deck. Each type is available exclusively through the shop with a stock of 4 named guests per type, adding 16 new purchasable guests to the existing 12 (total 28 shop guests). The new types introduce higher costs, money generation, and trouble, expanding the strategic depth of the game. This is a purely additive change following the same pattern as the existing Monkey guest type — only constants in `guest.model.ts` are extended.

## Glossary

- **Auctioneer**: A new guest type granting 3 money, 0 popularity, and 0 trouble, costing 9 popularity to purchase
- **Gangster**: A new guest type granting 4 money, 0 popularity, and 1 trouble, costing 6 popularity to purchase
- **Rock_Star**: A new guest type granting 3 popularity, 1 trouble, and 2 money, costing 5 popularity to purchase
- **Gambler**: A new guest type granting 2 popularity, 1 trouble, and 3 money, costing 7 popularity to purchase
- **GuestType**: The TypeScript union type defining all valid guest categories; extended to include 'AUCTIONEER', 'GANGSTER', 'ROCK_STAR', and 'GAMBLER'
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

### Requirement 1: Auctioneer Guest Type Definition

**User Story:** As a developer, I want the Auctioneer guest type to be defined in the guest model, so that the game recognizes Auctioneers as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'AUCTIONEER'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'AUCTIONEER' to a GuestProperties with popularityValue of 0, troubleValue of 0, and moneyValue of 3
3. THE GUEST_TYPE_LABELS SHALL map 'AUCTIONEER' to the display label "Auctioneer"
4. THE GUEST_TYPE_COSTS SHALL map 'AUCTIONEER' to a popularity cost of 9

### Requirement 2: Gangster Guest Type Definition

**User Story:** As a developer, I want the Gangster guest type to be defined in the guest model, so that the game recognizes Gangsters as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'GANGSTER'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'GANGSTER' to a GuestProperties with popularityValue of 0, troubleValue of 1, and moneyValue of 4
3. THE GUEST_TYPE_LABELS SHALL map 'GANGSTER' to the display label "Gangster"
4. THE GUEST_TYPE_COSTS SHALL map 'GANGSTER' to a popularity cost of 6

### Requirement 3: Rock Star Guest Type Definition

**User Story:** As a developer, I want the Rock Star guest type to be defined in the guest model, so that the game recognizes Rock Stars as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'ROCK_STAR'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'ROCK_STAR' to a GuestProperties with popularityValue of 3, troubleValue of 1, and moneyValue of 2
3. THE GUEST_TYPE_LABELS SHALL map 'ROCK_STAR' to the display label "Rock Star"
4. THE GUEST_TYPE_COSTS SHALL map 'ROCK_STAR' to a popularity cost of 5

### Requirement 4: Gambler Guest Type Definition

**User Story:** As a developer, I want the Gambler guest type to be defined in the guest model, so that the game recognizes Gamblers as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'GAMBLER'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'GAMBLER' to a GuestProperties with popularityValue of 2, troubleValue of 1, and moneyValue of 3
3. THE GUEST_TYPE_LABELS SHALL map 'GAMBLER' to the display label "Gambler"
4. THE GUEST_TYPE_COSTS SHALL map 'GAMBLER' to a popularity cost of 7

### Requirement 5: Shop Inventory for New Guest Types

**User Story:** As a player, I want the shop to stock all four new guest types, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Auctioneer entries with the names "Christie", "Sotheby", "Phillip", and "Bonham"
2. THE SHOP_GUESTS SHALL include exactly 4 Gangster entries with the names "Tony", "Legs", "Louie", and "Johnny"
3. THE SHOP_GUESTS SHALL include exactly 4 Rock_Star entries with the names "Alanis", "Gord", "Neil", and "Randy"
4. THE SHOP_GUESTS SHALL include exactly 4 Gambler entries with the names "Kenny", "Ace", "Jack", and "Raymond"
5. WHEN the game is initialized, THE GameStore SHALL create a Shop_Inventory entry for each new guest type containing 4 named guests and the correct cost
6. THE SHOP_GUESTS SHALL contain exactly 28 total entries (12 existing plus 16 new)

### Requirement 6: New Guest Types Excluded from Starting Deck

**User Story:** As a player, I want to start the game without any of the new guest types in my deck, so that they are only obtainable through the shop.

#### Acceptance Criteria

1. THE INITIAL_GUESTS SHALL contain zero entries with type 'AUCTIONEER', 'GANGSTER', 'ROCK_STAR', or 'GAMBLER'
2. WHEN the game is initialized, THE Deck SHALL contain zero Auctioneer, Gangster, Rock_Star, or Gambler guests
3. THE INITIAL_GUESTS SHALL remain unchanged at exactly 10 entries (4 Old Friends, 4 Wild Buddies, 2 Rich Pals)

### Requirement 7: Purchase Behavior for New Guest Types

**User Story:** As a player, I want to buy new guest types from the shop and add them to my deck, so that I can use their abilities at future parties.

#### Acceptance Criteria

1. WHEN the player purchases an Auctioneer AND the Shop_Inventory has at least 1 Auctioneer remaining AND the player's popularity is greater than or equal to 9, THE GameStore SHALL add a random named Auctioneer from the remaining inventory to the Deck and deduct 9 popularity
2. WHEN the player purchases a Gangster AND the Shop_Inventory has at least 1 Gangster remaining AND the player's popularity is greater than or equal to 6, THE GameStore SHALL add a random named Gangster from the remaining inventory to the Deck and deduct 6 popularity
3. WHEN the player purchases a Rock_Star AND the Shop_Inventory has at least 1 Rock_Star remaining AND the player's popularity is greater than or equal to 5, THE GameStore SHALL add a random named Rock_Star from the remaining inventory to the Deck and deduct 5 popularity
4. WHEN the player purchases a Gambler AND the Shop_Inventory has at least 1 Gambler remaining AND the player's popularity is greater than or equal to 7, THE GameStore SHALL add a random named Gambler from the remaining inventory to the Deck and deduct 7 popularity
5. WHEN a successful purchase of any new guest type occurs, THE GameStore SHALL remove the selected named guest from the Shop_Inventory and decrement that type's stock by 1

### Requirement 8: Party Contributions for New Guest Types

**User Story:** As a player, I want each new guest type to contribute its defined resources at parties, so that inviting them has meaningful gameplay impact.

#### Acceptance Criteria

1. WHEN an Auctioneer guest is in the party, THE GameStore SHALL include 3 money, 0 popularity, and 0 trouble from that Auctioneer in the party's total resource calculations
2. WHEN a Gangster guest is in the party, THE GameStore SHALL include 4 money, 0 popularity, and 1 trouble from that Gangster in the party's total resource calculations
3. WHEN a Rock_Star guest is in the party, THE GameStore SHALL include 2 money, 3 popularity, and 1 trouble from that Rock_Star in the party's total resource calculations
4. WHEN a Gambler guest is in the party, THE GameStore SHALL include 3 money, 2 popularity, and 1 trouble from that Gambler in the party's total resource calculations

### Requirement 9: Shop Display for New Guest Types

**User Story:** As a player, I want to see all new guest types in the shop in the correct order, so that I can compare options and make informed purchases.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE PhaseContentComponent SHALL display a shop card for each new guest type showing the correct label and cost
2. THE Shop SHALL display guest types in ascending cost order, then alphabetical label order for ties, resulting in the order: Old Friend (2), Monkey (3), Rich Pal (3), Rock Star (5), Gangster (6), Gambler (7), Auctioneer (9)
3. Each new guest type shop card SHALL display "Available: {remaining_stock}" reflecting the current inventory count for that type

### Requirement 10: Guest Card Rendering for New Guest Types

**User Story:** As a player, I want new guest types in my party to be displayed as cards with their name and type, so that I can identify them during gameplay.

#### Acceptance Criteria

1. WHEN an Auctioneer guest is in the party, THE GuestCardComponent SHALL display "Auctioneer" as the card header label and the guest's name as the card caption
2. WHEN a Gangster guest is in the party, THE GuestCardComponent SHALL display "Gangster" as the card header label and the guest's name as the card caption
3. WHEN a Rock_Star guest is in the party, THE GuestCardComponent SHALL display "Rock Star" as the card header label and the guest's name as the card caption
4. WHEN a Gambler guest is in the party, THE GuestCardComponent SHALL display "Gambler" as the card header label and the guest's name as the card caption

### Requirement 11: Guest Conservation Invariant

**User Story:** As a developer, I want the total guest count to remain constant across all game operations, so that no guests are created or destroyed during gameplay.

#### Acceptance Criteria

1. FOR ALL sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan), THE sum of deck.length, party.length, discard.length, and all shopInventory guest counts SHALL equal 38 (10 initial guests plus 28 purchasable shop guests)
