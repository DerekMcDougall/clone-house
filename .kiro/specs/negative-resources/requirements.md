# Requirements Document

## Introduction

This feature introduces negative resource values to the party card game. Guests can now have negative `popularityValue` or `moneyValue` in their `GuestProperties`, which are added normally to party totals during end-of-party scoring. The player's total popularity and money are floored at 0. A money deficit penalty applies: if the party's money contribution would cause the player's money to go below 0, each point below 0 instead costs 7 popularity. If popularity would then go below 0 (including from the money deficit penalty), it simply floors at 0 with no further cascading penalty.

Two new guest types are added:
- **Caterer**: grants 4 popularity, -1 money; costs 5 popularity; named Ronald, Wendy, Mario, Tim
- **Ticket Taker**: grants -1 popularity, 2 money; costs 4 popularity; named Val, Grant, Mark, Stubby

Neither new type appears in the starting deck. Both are available in the shop with 4 named guests each, adding 8 new shop guests (36 existing + 8 = 44 shop guests, 54 total with 10 initial).

The money deficit penalty is applied during the `advancePhase()` Party→BUY transition where resources are calculated. The calculation order is: (1) calculate raw popularity change from all party guests and apply it: newPopularity = max(0, currentPopularity + popularityChange), (2) calculate raw money change from all party guests, (3) if money would go below 0, compute the deficit, set money to 0, and apply a popularity penalty of 7 per deficit point, (4) apply the money deficit penalty to popularity: finalPopularity = max(0, newPopularity - moneyDeficitPenalty). This means popularity from guests is applied first, then money is calculated, and if there is a money deficit the penalty reduces the already-updated popularity.

## Glossary

- **Negative_Resource_Value**: A negative integer for `popularityValue` or `moneyValue` in GuestProperties, representing a cost or drain imposed by a guest at the party
- **Money_Deficit**: The number of points by which the player's money would go below 0 after applying the party's total money change; calculated as `max(0, -(currentMoney + moneyChange))`
- **Money_Deficit_Penalty**: A popularity reduction equal to 7 multiplied by the Money_Deficit; applied to the already-updated popularity after guest popularity contributions have been applied, when the party's money contribution would cause money to go below 0
- **Caterer**: A new guest type granting 4 popularity, 0 trouble, -1 money, and 0 peace, costing 5 popularity to purchase
- **Ticket_Taker**: A new guest type granting -1 popularity, 0 trouble, 2 money, and 0 peace, costing 4 popularity to purchase
- **GuestProperties**: The TypeScript interface defining a guest's resource contributions (popularityValue, troubleValue, moneyValue, peaceValue)
- **GuestType**: The TypeScript union type defining all valid guest categories; extended to include 'CATERER' and 'TICKET_TAKER'
- **GUEST_TYPE_DEFAULTS**: The constant mapping each GuestType to its default GuestProperties
- **GUEST_TYPE_LABELS**: The constant mapping each GuestType to its human-readable display label
- **GUEST_TYPE_COSTS**: The constant mapping each GuestType to its popularity purchase cost (or null if not purchasable)
- **SHOP_GUESTS**: The constant array of named guests available for purchase in the shop
- **INITIAL_GUESTS**: The constant array of named guests included in the player's starting deck
- **Game_Store**: The NgRx SignalStore managing all game state
- **advancePhase**: The Game_Store method that transitions between game phases and calculates resource changes
- **Phase_Content**: The UI component rendering the main content area for the current phase
- **GuestCardComponent**: The Angular component that renders an individual guest card
- **Status_Pane**: The UI component displaying game information in the right-side panel

## Requirements

### Requirement 1: Caterer Guest Type Definition

**User Story:** As a developer, I want the Caterer guest type to be defined in the guest model, so that the game recognizes Caterers as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'CATERER'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'CATERER' to a GuestProperties with popularityValue of 4, troubleValue of 0, moneyValue of -1, and peaceValue of 0
3. THE GUEST_TYPE_LABELS SHALL map 'CATERER' to the display label "Caterer"
4. THE GUEST_TYPE_COSTS SHALL map 'CATERER' to a popularity cost of 5

### Requirement 2: Ticket Taker Guest Type Definition

**User Story:** As a developer, I want the Ticket Taker guest type to be defined in the guest model, so that the game recognizes Ticket Takers as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'TICKET_TAKER'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'TICKET_TAKER' to a GuestProperties with popularityValue of -1, troubleValue of 0, moneyValue of 2, and peaceValue of 0
3. THE GUEST_TYPE_LABELS SHALL map 'TICKET_TAKER' to the display label "Ticket Taker"
4. THE GUEST_TYPE_COSTS SHALL map 'TICKET_TAKER' to a popularity cost of 4

### Requirement 3: Shop Inventory for Negative Resource Guest Types

**User Story:** As a player, I want the shop to stock Caterers and Ticket Takers, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Caterer entries with the names "Ronald", "Wendy", "Mario", and "Tim"
2. THE SHOP_GUESTS SHALL include exactly 4 Ticket_Taker entries with the names "Val", "Grant", "Mark", and "Stubby"
3. WHEN the game is initialized, THE Game_Store SHALL create a Shop_Inventory entry for each negative resource guest type containing 4 named guests and the correct cost
4. THE SHOP_GUESTS SHALL contain exactly 44 total entries (36 existing plus 8 new)

### Requirement 4: Negative Resource Guest Types Excluded from Starting Deck

**User Story:** As a player, I want to start the game without any negative resource guests in my deck, so that they are only obtainable through the shop.

#### Acceptance Criteria

1. THE INITIAL_GUESTS SHALL contain zero entries with type 'CATERER' or 'TICKET_TAKER'
2. WHEN the game is initialized, THE Deck SHALL contain zero Caterer or Ticket_Taker guests
3. THE INITIAL_GUESTS SHALL remain unchanged at exactly 10 entries

### Requirement 5: Negative Resource Values in Party Scoring

**User Story:** As a game designer, I want negative resource values to be added normally during party end scoring, so that guests with negative resources reduce the player's totals.

#### Acceptance Criteria

1. WHEN the Party phase ends without a bust, THE Game_Store SHALL sum the moneyValue of all party guests including negative values to compute the total money change
2. WHEN the Party phase ends without a bust, THE Game_Store SHALL sum the popularityValue of all party guests including negative values to compute the total popularity change
3. WHEN a Caterer is in the party, THE Game_Store SHALL include -1 in the total money change calculation
4. WHEN a Ticket_Taker is in the party, THE Game_Store SHALL include -1 in the total popularity change calculation

### Requirement 6: Money Floor at Zero

**User Story:** As a player, I want my money to never go below zero, so that the resource behaves predictably.

#### Acceptance Criteria

1. WHEN the total money change from the party would cause the player's money to go below 0, THE Game_Store SHALL set money to 0 instead of a negative value
2. THE Game_Store SHALL compute the Money_Deficit as the number of points the player's money would have gone below 0, calculated as max(0, -(currentMoney + moneyChange))

### Requirement 7: Money Deficit Popularity Penalty

**User Story:** As a game designer, I want money deficits to penalize popularity at a rate of 7 per point, so that going into money debt has a steep cost.

#### Acceptance Criteria

1. WHEN the Money_Deficit is greater than 0, THE Game_Store SHALL apply a Money_Deficit_Penalty equal to negative 7 multiplied by the Money_Deficit to the popularity calculation
2. WHEN the player has 3 money and the party's total money change is -7, THE Game_Store SHALL set money to 0 and apply a popularity penalty of -28 (4 deficit points multiplied by 7)
3. WHEN the player has 0 money and the party's total money change is -3, THE Game_Store SHALL set money to 0 and apply a popularity penalty of -21 (3 deficit points multiplied by 7)
4. WHEN the Money_Deficit is 0, THE Game_Store SHALL apply no Money_Deficit_Penalty

### Requirement 8: Popularity Floor at Zero with No Cascading Penalty

**User Story:** As a player, I want my popularity to floor at zero without any further penalty, so that the penalty system does not cascade infinitely.

#### Acceptance Criteria

1. WHEN the total popularity change (including the Money_Deficit_Penalty) would cause the player's popularity to go below 0, THE Game_Store SHALL set popularity to 0
2. WHEN popularity is floored at 0, THE Game_Store SHALL apply no additional penalty or side effect
3. WHEN the player has 5 popularity, the party grants 2 popularity (newPopularity = 7), and a Money_Deficit_Penalty of 28 is applied, THE Game_Store SHALL set popularity to max(0, 7 - 28) = 0 (not negative)

### Requirement 9: Resource Calculation Order in advancePhase

**User Story:** As a developer, I want the resource calculation to follow a specific order during the Party→BUY transition, so that the money deficit penalty is applied correctly.

#### Acceptance Criteria

1. WHEN the Party phase ends, THE Game_Store SHALL first calculate the raw popularity change from all party guests and apply it as newPopularity = max(0, currentPopularity + popularityChange)
2. WHEN the Party phase ends, THE Game_Store SHALL then calculate the raw money change from all party guests
3. WHEN the Party phase ends, THE Game_Store SHALL then determine the Money_Deficit and set money to max(0, currentMoney + moneyChange)
4. WHEN the Party phase ends AND the Money_Deficit is greater than 0, THE Game_Store SHALL apply the Money_Deficit_Penalty to the already-updated popularity as finalPopularity = max(0, newPopularity - Money_Deficit_Penalty)
5. WHEN the Party phase ends AND the Money_Deficit is 0, THE Game_Store SHALL leave the already-updated newPopularity unchanged

### Requirement 10: Purchase Behavior for Negative Resource Guest Types

**User Story:** As a player, I want to buy Caterers and Ticket Takers from the shop and add them to my deck, so that I can use their abilities at future parties.

#### Acceptance Criteria

1. WHEN the player purchases a Caterer AND the Shop_Inventory has at least 1 Caterer remaining AND the player's popularity is greater than or equal to 5, THE Game_Store SHALL add a random named Caterer from the remaining inventory to the Deck and deduct 5 popularity
2. WHEN the player purchases a Ticket_Taker AND the Shop_Inventory has at least 1 Ticket_Taker remaining AND the player's popularity is greater than or equal to 4, THE Game_Store SHALL add a random named Ticket_Taker from the remaining inventory to the Deck and deduct 4 popularity
3. WHEN a successful purchase of either negative resource guest type occurs, THE Game_Store SHALL remove the selected named guest from the Shop_Inventory and decrement that type's stock by 1

### Requirement 11: Party Contributions for Negative Resource Guest Types

**User Story:** As a player, I want each negative resource guest type to contribute its defined resources at parties, so that inviting them has meaningful gameplay impact.

#### Acceptance Criteria

1. WHEN a Caterer guest is in the party, THE Game_Store SHALL include 4 popularity, 0 trouble, -1 money, and 0 peace from that Caterer in the party's total resource calculations
2. WHEN a Ticket_Taker guest is in the party, THE Game_Store SHALL include -1 popularity, 0 trouble, 2 money, and 0 peace from that Ticket_Taker in the party's total resource calculations

### Requirement 12: Shop Display for Negative Resource Guest Types

**User Story:** As a player, I want to see Caterers and Ticket Takers in the shop in the correct order, so that I can compare options and make informed purchases.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE Phase_Content SHALL display a shop card for each negative resource guest type showing the correct label and cost
2. THE Shop SHALL display guest types in ascending cost order, then alphabetical label order for ties, resulting in the order: Old Friend (2), Monkey (3), Rich Pal (3), Hippy (4), Ticket Taker (4), Caterer (5), Rock Star (5), Gangster (6), Cute Dog (7), Gambler (7), Auctioneer (9)
3. Each negative resource guest type shop card SHALL display "Available: {remaining_stock}" reflecting the current inventory count for that type

### Requirement 13: Guest Card Rendering for Negative Resource Guest Types

**User Story:** As a player, I want negative resource guest types in my party to be displayed as cards with their name and type, so that I can identify them during gameplay.

#### Acceptance Criteria

1. WHEN a Caterer guest is in the party, THE GuestCardComponent SHALL display "Caterer" as the card header label and the guest's name as the card caption
2. WHEN a Ticket_Taker guest is in the party, THE GuestCardComponent SHALL display "Ticket Taker" as the card header label and the guest's name as the card caption

### Requirement 14: Guest Conservation Invariant

**User Story:** As a developer, I want the total guest count to remain constant across all game operations, so that no guests are created or destroyed during gameplay.

#### Acceptance Criteria

1. FOR ALL sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan), THE sum of deck.length, party.length, discard.length, and all shopInventory guest counts SHALL equal 54 (10 initial guests plus 44 purchasable shop guests)
