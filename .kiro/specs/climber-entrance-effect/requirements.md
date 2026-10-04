# Requirements Document

## Introduction

This feature introduces the Climber guest type and an entrance effect system to the party card game. The Climber is the first guest type with an entrance effect: each time a specific Climber instance is invited to a party, her `popularityValue` increments by 1 (capped at 9) before she is moved from the deck to the party. This increment is tracked per guest instance, not per type — two different Climbers each track their own entry count independently. The entrance effect system is designed to be extensible so that future guest types can define entirely different entrance effects.

Climbers cost 12 popularity to purchase from the shop. There are 4 named Climbers available: Ascella, Skye, Icarus, and Vela. Climbers do not appear in the starting deck.

## Glossary

- **Climber**: A new guest type with an entrance effect; starts with `popularityValue` of 0 and increments it by 1 (capped at 9) each time that specific guest instance is invited to a party
- **Entrance_Effect**: A per-instance side effect that triggers on a guest when `inviteGuest()` is called and that guest is moved from the deck to the party; the effect mutates the guest's properties before the guest is added to the party
- **Entrance_Effect_System**: The extensible mechanism in the Game_Store that checks whether an invited guest has an entrance effect and applies it; designed to support future guest types with different entrance effects
- **Entry_Count**: The number of times a specific guest instance has been invited to a party; tracked implicitly via the guest's `popularityValue` for Climbers (popularityValue equals entry count, capped at 9)
- **GuestType**: The TypeScript union type defining all valid guest categories; extended to include 'CLIMBER'
- **GUEST_TYPE_DEFAULTS**: The constant mapping each GuestType to its default GuestProperties
- **GUEST_TYPE_LABELS**: The constant mapping each GuestType to its human-readable display label
- **GUEST_TYPE_COSTS**: The constant mapping each GuestType to its popularity purchase cost (or null if not purchasable)
- **SHOP_GUESTS**: The constant array of named guests available for purchase in the shop
- **INITIAL_GUESTS**: The constant array of named guests included in the player's starting deck
- **Game_Store**: The NgRx SignalStore managing all game state
- **inviteGuest**: The Game_Store method that moves the top guest from the deck to the party, triggering entrance effects if applicable
- **GuestProperties**: The TypeScript interface defining a guest's resource contributions (popularityValue, troubleValue, moneyValue, peaceValue)
- **Phase_Content**: The UI component rendering the main content area for the current phase
- **GuestCardComponent**: The Angular component that renders an individual guest card

## Requirements

### Requirement 1: Climber Guest Type Definition

**User Story:** As a developer, I want the Climber guest type to be defined in the guest model, so that the game recognizes Climbers as a valid guest category.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'CLIMBER'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'CLIMBER' to a GuestProperties with popularityValue of 0, troubleValue of 0, moneyValue of 0, and peaceValue of 0
3. THE GUEST_TYPE_LABELS SHALL map 'CLIMBER' to the display label "Climber"
4. THE GUEST_TYPE_COSTS SHALL map 'CLIMBER' to a popularity cost of 12

### Requirement 2: Climber Shop Inventory

**User Story:** As a player, I want the shop to stock Climbers, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Climber entries with the names "Ascella", "Skye", "Icarus", and "Vela"
2. WHEN the game is initialized, THE Game_Store SHALL create a Shop_Inventory entry for CLIMBER containing 4 named guests and a cost of 12
3. THE SHOP_GUESTS SHALL contain exactly 48 total entries (44 existing plus 4 new Climbers)

### Requirement 3: Climbers Excluded from Starting Deck

**User Story:** As a player, I want to start the game without any Climbers in my deck, so that they are only obtainable through the shop.

#### Acceptance Criteria

1. THE INITIAL_GUESTS SHALL contain zero entries with type 'CLIMBER'
2. WHEN the game is initialized, THE Deck SHALL contain zero Climber guests (since INITIAL_GUESTS contains no Climbers)
3. THE INITIAL_GUESTS SHALL remain unchanged at exactly 10 entries

### Requirement 4: Climber Entrance Effect — popularityValue Increment

**User Story:** As a player, I want each Climber's popularity to grow each time she enters the party, so that repeatedly inviting the same Climber becomes more rewarding over time.

#### Acceptance Criteria

1. WHEN `inviteGuest()` is called AND the top guest of the deck is a CLIMBER, THE Game_Store SHALL increment that guest's `popularityValue` by 1 before adding her to the party, subject to the cap in criterion 2
2. WHEN a Climber's `popularityValue` is already at 9 and `inviteGuest()` is called for that Climber, THE Game_Store SHALL keep the `popularityValue` at 9 and not increment further
3. WHEN `inviteGuest()` is called AND the top guest of the deck is NOT a CLIMBER, THE Game_Store SHALL not apply any entrance effect modification to that guest's `popularityValue`
4. WHEN a Climber guest is added to the party after the entrance effect, THE Game_Store SHALL reflect the incremented `popularityValue` on the guest object in the party array

### Requirement 5: Entrance Effect is Per-Instance

**User Story:** As a player, I want each Climber to track her own entry count independently, so that having multiple Climbers in my deck produces distinct progression for each one.

#### Acceptance Criteria

1. WHEN two different Climber instances are in the deck, THE Game_Store SHALL track the `popularityValue` of each Climber instance independently
2. WHEN Climber instance A has been invited 3 times and Climber instance B has been invited 1 time, THE Game_Store SHALL reflect `popularityValue` of 3 on instance A and `popularityValue` of 1 on instance B
3. WHEN a Climber returns to the deck after a party (via `advancePhase()`), THE Game_Store SHALL preserve that Climber's accumulated `popularityValue` on the guest object

### Requirement 6: Entrance Effect System Extensibility

**User Story:** As a developer, I want the entrance effect logic to be structured so that future guest types can define different entrance effects, so that the system is maintainable and extensible.

#### Acceptance Criteria

1. WHEN `inviteGuest()` is called, THE Game_Store SHALL apply entrance effects through a dedicated code path that checks the guest type and dispatches the appropriate effect
2. WHEN a guest type has no defined entrance effect, THE Game_Store SHALL invite that guest without modifying its properties
3. THE entrance effect dispatch mechanism SHALL be structured so that adding a new guest type's entrance effect requires only adding a new case to the dispatch logic, without modifying the core invite flow

### Requirement 7: Climber Purchase Behavior

**User Story:** As a player, I want to buy Climbers from the shop and add them to my deck, so that I can use their entrance effect at future parties.

#### Acceptance Criteria

1. WHEN the player purchases a Climber AND the Shop_Inventory has at least 1 Climber remaining AND the player's popularity is greater than or equal to 12, THE Game_Store SHALL add a random named Climber from the remaining inventory to the Deck and deduct 12 popularity
2. WHEN a successful Climber purchase occurs, THE Game_Store SHALL remove the selected named guest from the Shop_Inventory and decrement the CLIMBER stock by 1
3. WHEN a newly purchased Climber is added to the deck, THE Game_Store SHALL use the `popularityValue` from the Climber's guest data as initialized (which is 0 per GUEST_TYPE_DEFAULTS)

### Requirement 8: Climber Party Contribution

**User Story:** As a player, I want the Climber's current popularityValue to be counted when the party ends, so that her accumulated value contributes to my score.

#### Acceptance Criteria

1. WHEN a Climber guest is in the party at the end of the PARTY phase, THE Game_Store SHALL include that Climber's current `popularityValue` (which may have been incremented by the entrance effect) in the party's total popularity calculation
2. WHEN a Climber with `popularityValue` of 5 is in the party, THE Game_Store SHALL add 5 to the total popularity change from the party

### Requirement 9: Climber Shop Display

**User Story:** As a player, I want to see Climbers in the shop in the correct position, so that I can compare options and make informed purchases.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE Phase_Content SHALL display a shop card for CLIMBER showing the label "Climber" and the actual cost from GUEST_TYPE_COSTS
2. THE Shop SHALL display CLIMBER in ascending cost order among all guest types, placing it after Auctioneer (9) as the most expensive option at cost 12
3. THE CLIMBER shop card SHALL display "Available: {remaining_stock}" reflecting the current inventory count, including when stock is 0

### Requirement 10: Climber Guest Card Rendering

**User Story:** As a player, I want Climbers in my party to be displayed as cards with their name and type, so that I can identify them during gameplay.

#### Acceptance Criteria

1. WHEN a Climber guest is in the party, THE GuestCardComponent SHALL display "Climber" as the card header label and the guest's name as the card caption

### Requirement 11: Guest Conservation Invariant

**User Story:** As a developer, I want the total guest count to remain constant across all game operations including entrance effects, so that no guests are created or destroyed during gameplay.

#### Acceptance Criteria

1. FOR ALL sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan), THE sum of deck.length, party.length, discard.length, and all shopInventory guest counts SHALL equal 58 (10 initial guests plus 48 purchasable shop guests)
2. WHEN `inviteGuest()` triggers a Climber entrance effect, THE total guest count SHALL remain unchanged (the entrance effect only mutates the guest's properties, it does not create or remove guests)
