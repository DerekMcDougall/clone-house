# Requirements Document

## Introduction

This feature introduces the "peace" resource to the party card game. Peace is a new guest property that raises the effective trouble limit while the granting guest is in the party. Each point of peace in the party increases the effective trouble limit by 1. Peace does not accumulate past the current turn — it resets when the party ends, just like trouble. Two new guest types are added that grant peace: Cute Dog (2 popularity, 1 peace, cost 7) and Hippy (1 popularity, 1 peace, cost 4). Neither appears in the starting deck. Both are available in the shop with a stock of 4 each, adding 8 new shop guests (28 existing + 8 = 36 shop guests, 46 total with 10 initial). The existing `GuestProperties` interface is extended with a `peaceValue` field. The existing `partyTroubleLimitModifier` store field is repurposed as the computed sum of peaceValue across all party guests, so the effective trouble limit remains `baseTroubleLimit + partyTroubleLimitModifier` — no formula change needed, only the source of `partyTroubleLimitModifier` changes from a manually-set value to a derived computation from party peace.

## Glossary

- **Peace**: A non-negative integer guest property representing the amount by which a guest raises the effective trouble limit while in the party; resets when the party ends
- **Cute_Dog**: A new guest type granting 2 popularity, 0 trouble, 0 money, and 1 peace, costing 7 popularity to purchase
- **Hippy**: A new guest type granting 1 popularity, 0 trouble, 0 money, and 1 peace, costing 4 popularity to purchase
- **GuestProperties**: The TypeScript interface defining a guest's resource contributions; extended to include peaceValue
- **GuestType**: The TypeScript union type defining all valid guest categories; extended to include 'CUTE_DOG' and 'HIPPY'
- **GUEST_TYPE_DEFAULTS**: The constant mapping each GuestType to its default GuestProperties (popularity, trouble, money, peace)
- **GUEST_TYPE_LABELS**: The constant mapping each GuestType to its human-readable display label
- **GUEST_TYPE_COSTS**: The constant mapping each GuestType to its popularity purchase cost (or null if not purchasable)
- **SHOP_GUESTS**: The constant array of named guests available for purchase in the shop
- **INITIAL_GUESTS**: The constant array of named guests included in the player's starting deck
- **Effective_Trouble_Limit**: The computed value equal to baseTroubleLimit + partyTroubleLimitModifier, where partyTroubleLimitModifier is derived from the sum of peaceValue across all party guests
- **partyTroubleLimitModifier**: A computed non-negative integer equal to the sum of peaceValue for all guests currently in the party; replaces the previous manually-set modifier
- **Game_Store**: The NgRx SignalStore managing all game state
- **Status_Pane**: The UI component displaying game information in the right-side panel
- **Phase_Content**: The UI component rendering the main content area for the current phase
- **GuestCardComponent**: The Angular component that renders an individual guest card

## Requirements

### Requirement 1: Add peaceValue to GuestProperties

**User Story:** As a developer, I want every guest type to have a peaceValue property, so that the system can calculate peace contributions uniformly.

#### Acceptance Criteria

1. THE GuestProperties interface SHALL include a peaceValue field of type number
2. THE GUEST_TYPE_DEFAULTS SHALL map every existing GuestType to a GuestProperties with peaceValue of 0
3. THE GUEST_TYPE_DEFAULTS SHALL map 'CUTE_DOG' to a GuestProperties with peaceValue of 1
4. THE GUEST_TYPE_DEFAULTS SHALL map 'HIPPY' to a GuestProperties with peaceValue of 1

### Requirement 2: Cute Dog Guest Type Definition

**User Story:** As a developer, I want the Cute Dog guest type to be defined in the guest model, so that the game recognizes Cute Dogs as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'CUTE_DOG'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'CUTE_DOG' to a GuestProperties with popularityValue of 2, troubleValue of 0, moneyValue of 0, and peaceValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'CUTE_DOG' to the display label "Cute Dog"
4. THE GUEST_TYPE_COSTS SHALL map 'CUTE_DOG' to a popularity cost of 7

### Requirement 3: Hippy Guest Type Definition

**User Story:** As a developer, I want the Hippy guest type to be defined in the guest model, so that the game recognizes Hippies as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'HIPPY'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'HIPPY' to a GuestProperties with popularityValue of 1, troubleValue of 0, moneyValue of 0, and peaceValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'HIPPY' to the display label "Hippy"
4. THE GUEST_TYPE_COSTS SHALL map 'HIPPY' to a popularity cost of 4

### Requirement 4: Shop Inventory for Peace Guest Types

**User Story:** As a player, I want the shop to stock Cute Dogs and Hippies, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Cute_Dog entries with the names "Oreo", "Lily", "Pearl", and "Ronnie"
2. THE SHOP_GUESTS SHALL include exactly 4 Hippy entries with the names "Bob", "Joni", "Joan", and "Jerry"
3. WHEN the game is initialized, THE Game_Store SHALL create a Shop_Inventory entry for each peace guest type containing 4 named guests and the correct cost
4. THE SHOP_GUESTS SHALL contain exactly 36 total entries (28 existing plus 8 new)

### Requirement 5: Peace Guest Types Excluded from Starting Deck

**User Story:** As a player, I want to start the game without any peace-granting guests in my deck, so that they are only obtainable through the shop.

#### Acceptance Criteria

1. THE INITIAL_GUESTS SHALL contain zero entries with type 'CUTE_DOG' or 'HIPPY'
2. WHEN the game is initialized, THE Deck SHALL contain zero Cute_Dog or Hippy guests
3. THE INITIAL_GUESTS SHALL remain unchanged at exactly 10 entries

### Requirement 6: Peace Drives partyTroubleLimitModifier

**User Story:** As a game designer, I want the game to compute partyTroubleLimitModifier from the sum of peace in the party, so that the effective trouble limit is raised accordingly.

#### Acceptance Criteria

1. THE Game_Store SHALL derive partyTroubleLimitModifier as a computed value equal to the sum of peaceValue for all guests currently in the party
2. WHEN the party is empty, THE partyTroubleLimitModifier SHALL equal 0
3. WHEN one or more guests with peaceValue greater than 0 are in the party, THE partyTroubleLimitModifier SHALL equal the sum of their peaceValue fields

### Requirement 7: Peace Raises Effective Trouble Limit

**User Story:** As a player, I want peace-granting guests to raise the trouble limit while they are in my party, so that I can invite more troublesome guests without triggering a shutdown.

#### Acceptance Criteria

1. THE Game_Store SHALL derive the Effective_Trouble_Limit as a computed value equal to baseTroubleLimit plus partyTroubleLimitModifier, with a minimum of 0
2. WHEN a guest with peaceValue of 1 is in the party and baseTroubleLimit is 2, THE Effective_Trouble_Limit SHALL equal 3
3. WHEN multiple guests with peaceValue greater than 0 are in the party, THE Effective_Trouble_Limit SHALL reflect the sum of all peaceValue contributions via partyTroubleLimitModifier
4. WHEN a peace-granting guest is removed from the party (via party shutdown or party end), THE partyTroubleLimitModifier SHALL decrease by that guest's peaceValue

### Requirement 8: Peace Does Not Persist Past Current Turn

**User Story:** As a game designer, I want peace to reset each turn, so that the trouble limit bonus is temporary and tied to the current party composition.

#### Acceptance Criteria

1. WHEN the Party phase ends normally (player presses End Party or Game Over), THE partyTroubleLimitModifier SHALL equal 0 because all guests return to the deck
2. WHEN the Party phase ends due to a Party_Shutdown, THE partyTroubleLimitModifier SHALL equal 0 because all guests return to the deck
3. WHEN a new Party phase begins, THE partyTroubleLimitModifier SHALL equal 0 because the party starts empty

### Requirement 9: Purchase Behavior for Peace Guest Types

**User Story:** As a player, I want to buy Cute Dogs and Hippies from the shop and add them to my deck, so that I can use their peace ability at future parties.

#### Acceptance Criteria

1. WHEN the player purchases a Cute_Dog AND the Shop_Inventory has at least 1 Cute_Dog remaining AND the player's popularity is greater than or equal to 7, THE Game_Store SHALL add a random named Cute_Dog from the remaining inventory to the Deck and deduct 7 popularity
2. WHEN the player purchases a Hippy AND the Shop_Inventory has at least 1 Hippy remaining AND the player's popularity is greater than or equal to 4, THE Game_Store SHALL add a random named Hippy from the remaining inventory to the Deck and deduct 4 popularity
3. WHEN a successful purchase of either peace guest type occurs, THE Game_Store SHALL remove the selected named guest from the Shop_Inventory and decrement that type's stock by 1

### Requirement 10: Party Contributions for Peace Guest Types

**User Story:** As a player, I want each peace guest type to contribute its defined resources at parties, so that inviting them has meaningful gameplay impact.

#### Acceptance Criteria

1. WHEN a Cute_Dog guest is in the party, THE Game_Store SHALL include 2 popularity, 0 trouble, 0 money, and 1 peace from that Cute_Dog in the party's total resource calculations
2. WHEN a Hippy guest is in the party, THE Game_Store SHALL include 1 popularity, 0 trouble, 0 money, and 1 peace from that Hippy in the party's total resource calculations

### Requirement 11: Shop Display for Peace Guest Types

**User Story:** As a player, I want to see Cute Dogs and Hippies in the shop in the correct order, so that I can compare options and make informed purchases.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE Phase_Content SHALL display a shop card for each peace guest type showing the correct label and cost
2. THE Shop SHALL display guest types in ascending cost order, then alphabetical label order for ties, resulting in the order: Old Friend (2), Monkey (3), Rich Pal (3), Hippy (4), Rock Star (5), Gangster (6), Cute Dog (7), Gambler (7), Auctioneer (9)
3. Each peace guest type shop card SHALL display "Available: {remaining_stock}" reflecting the current inventory count for that type

### Requirement 12: Guest Card Rendering for Peace Guest Types

**User Story:** As a player, I want peace guest types in my party to be displayed as cards with their name and type, so that I can identify them during gameplay.

#### Acceptance Criteria

1. WHEN a Cute_Dog guest is in the party, THE GuestCardComponent SHALL display "Cute Dog" as the card header label and the guest's name as the card caption
2. WHEN a Hippy guest is in the party, THE GuestCardComponent SHALL display "Hippy" as the card header label and the guest's name as the card caption

### Requirement 13: Trouble Limit Display Reflects Peace

**User Story:** As a player, I want the trouble display to reflect the peace-boosted trouble limit, so that I can see the actual threshold during the party.

#### Acceptance Criteria

1. WHILE the current phase is Party, THE Status_Pane SHALL display trouble in the format "{current trouble} / {Effective_Trouble_Limit}" where Effective_Trouble_Limit includes the peace contribution
2. WHEN a peace-granting guest is invited to the party, THE Status_Pane SHALL update the displayed Effective_Trouble_Limit to reflect the increased value

### Requirement 14: Guest Conservation Invariant

**User Story:** As a developer, I want the total guest count to remain constant across all game operations, so that no guests are created or destroyed during gameplay.

#### Acceptance Criteria

1. FOR ALL sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan), THE sum of deck.length, party.length, discard.length, and all shopInventory guest counts SHALL equal 46 (10 initial guests plus 36 purchasable shop guests)
