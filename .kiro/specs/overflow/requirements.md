# Requirements Document

## Introduction

This feature introduces the overflow mechanic and two new guest types — Mr. Popular and Celebrity — to the party card game. While the player can never manually invite more guests than the house capacity allows, entrance effects can automatically invite additional guests that push the party beyond capacity. When the party exceeds the house capacity at any point during an effect chain, the party ends immediately without scoring and without banning any guest. If the trouble limit is exceeded during an effect chain, the normal trouble-limit shutdown applies (including ban selection). If an Auto_Invite would simultaneously trigger both overflow and a trouble-limit violation, overflow is checked first and the party ends without a ban. The two new guest types each have entrance effects that automatically invite additional guests from the deck, enabling overflow scenarios.

## Glossary

- **Game_Store**: The NgRx SignalStore managing all game state
- **House_Capacity**: The maximum number of guests the house can hold; set at game start and modified by expansions
- **Overflow**: The condition where the party size exceeds House_Capacity as a result of an entrance effect automatically inviting a guest
- **Overflow_Shutdown**: A Party_Shutdown triggered by Overflow; the party ends immediately without scoring, all guests return to the deck, and no guest is banned from the next party
- **Party_Shutdown**: The event that ends the party immediately without granting popularity or money from party guests
- **Trouble_Limit_Shutdown**: A Party_Shutdown triggered when accumulated trouble exceeds the Effective_Trouble_Limit
- **Entrance_Effect**: A side effect that triggers when a guest is moved from the deck to the party; defined per guest type in GUEST_TYPE_ENTRANCE_EFFECTS
- **Effect_Chain**: The sequence of entrance effects that may be triggered when one entrance effect automatically invites a guest that itself has an entrance effect
- **Auto_Invite**: An action performed by an entrance effect that draws the top guest from the deck and adds it to the party, subject to overflow rules; behaves like inviteGuest() except it can exceed House_Capacity
- **Pending_Effect**: An entrance effect that has been queued but not yet executed because a prior entrance effect has not yet fully completed
- **Mr_Popular**: A new guest type with popularityValue 3, no trouble, no money, no peace, and an entrance effect that performs one Auto_Invite
- **Celebrity**: A new guest type with popularityValue 2, moneyValue 3, no trouble, no peace, and an entrance effect that performs two sequential Auto_Invites
- **Phase_Content**: The Angular component rendering the main content area for the current phase
- **Status_Pane**: The Angular component displaying game stats and action buttons in the right sidebar
- **GUEST_TYPE_ENTRANCE_EFFECTS**: The constant mapping guest types to their entrance effect handlers
- **SHOP_GUESTS**: The constant array of named guests available for purchase in the shop
- **GuestType**: The TypeScript union type defining all valid guest categories
- **GUEST_TYPE_DEFAULTS**: The constant mapping each GuestType to its default GuestProperties
- **GUEST_TYPE_LABELS**: The constant mapping each GuestType to its human-readable display label
- **GUEST_TYPE_COSTS**: The constant mapping each GuestType to its popularity purchase cost

## Requirements

### Requirement 1: Mr. Popular Guest Type Definition

**User Story:** As a player, I want Mr. Popular to be available as a guest type with defined stats, so that I can purchase and invite him to my parties.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'MR_POPULAR'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'MR_POPULAR' to a GuestProperties with popularityValue of 3, troubleValue of 0, moneyValue of 0, and peaceValue of 0
3. THE GUEST_TYPE_LABELS SHALL map 'MR_POPULAR' to the display label "Mr. Popular"
4. THE GUEST_TYPE_COSTS SHALL map 'MR_POPULAR' to a popularity cost of 5

### Requirement 2: Celebrity Guest Type Definition

**User Story:** As a player, I want Celebrity to be available as a guest type with defined stats, so that I can purchase and invite her to my parties.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'CELEBRITY'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'CELEBRITY' to a GuestProperties with popularityValue of 2, troubleValue of 0, moneyValue of 3, and peaceValue of 0
3. THE GUEST_TYPE_LABELS SHALL map 'CELEBRITY' to the display label "Celebrity"
4. THE GUEST_TYPE_COSTS SHALL map 'CELEBRITY' to a popularity cost of 11

### Requirement 3: Mr. Popular and Celebrity Shop Inventory

**User Story:** As a player, I want to find Mr. Popular and Celebrity in the shop, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Mr. Popular entries with the names "Rowan", "Oscar", "Lawrence", and "McDougall"
2. THE SHOP_GUESTS SHALL include exactly 4 Celebrity entries with the names "Troy", "Rainier", "Pedro", and "Kent"
3. WHEN the game is initialized, THE Game_Store SHALL create a Shop_Inventory entry for MR_POPULAR containing 4 named guests and a cost of 5
4. WHEN the game is initialized, THE Game_Store SHALL create a Shop_Inventory entry for CELEBRITY containing 4 named guests and a cost of 11

### Requirement 4: Mr. Popular Entrance Effect — Auto-Invite One Guest

**User Story:** As a player, I want Mr. Popular to automatically invite one more guest when he arrives, so that his presence grows the party beyond what I could invite manually.

#### Acceptance Criteria

1. WHEN `inviteGuest()` is called AND the top guest of the deck is a MR_POPULAR, THE Game_Store SHALL perform one Auto_Invite after adding Mr. Popular to the party
2. WHEN the Auto_Invite triggered by Mr. Popular's entrance effect draws a guest from the deck, THE Game_Store SHALL add that guest to the party even if the party size would exceed House_Capacity
3. WHEN the deck is empty at the time Mr. Popular's entrance effect triggers, THE Game_Store SHALL not perform the Auto_Invite and the effect SHALL complete without error
4. WHEN the Auto_Invite triggered by Mr. Popular's entrance effect draws a guest that itself has an entrance effect, THE Game_Store SHALL queue that guest's entrance effect as a Pending_Effect to be resolved after Mr. Popular's effect fully completes

### Requirement 5: Celebrity Entrance Effect — Auto-Invite Two Guests

**User Story:** As a player, I want Celebrity to automatically invite two more guests when she arrives, so that her entrance has a dramatic effect on the party.

#### Acceptance Criteria

1. WHEN `inviteGuest()` is called AND the top guest of the deck is a CELEBRITY, THE Game_Store SHALL perform two sequential Auto_Invites after adding Celebrity to the party
2. WHEN the Auto_Invites triggered by Celebrity's entrance effect draw guests from the deck, THE Game_Store SHALL add each guest to the party even if the party size would exceed House_Capacity
3. WHEN the deck is empty before the first Auto_Invite, THE Game_Store SHALL not perform either Auto_Invite and the effect SHALL complete without error
4. WHEN the deck is empty before the second Auto_Invite but not the first, THE Game_Store SHALL perform the first Auto_Invite and skip the second without error
5. WHEN an Auto_Invite triggered by Celebrity's entrance effect draws a guest that itself has an entrance effect, THE Game_Store SHALL queue that guest's entrance effect as a Pending_Effect to be resolved after Celebrity's second Auto_Invite completes

### Requirement 6: Entrance Effect Sequencing

> **Superseded:** Requirements 5.5, 6.1, 6.2 and 6.3 are replaced by the `entrance-effect-order` spec. An arriving guest's entrance effect now interrupts the current effect instead of waiting for it to complete. Requirement 6.4 still applies.

**User Story:** As a player, I want each entrance effect to fully complete before the next one begins, so that the order of guest arrivals is predictable and consistent.

#### Acceptance Criteria

1. WHEN an entrance effect performs an Auto_Invite that draws a guest with its own entrance effect, THE Game_Store SHALL complete all remaining Auto_Invites of the current effect before triggering the newly arrived guest's entrance effect
2. WHEN Celebrity performs her first Auto_Invite and the drawn guest has an entrance effect, THE Game_Store SHALL perform Celebrity's second Auto_Invite before triggering the drawn guest's entrance effect
3. WHEN multiple guests with entrance effects arrive during an effect chain, THE Game_Store SHALL trigger their entrance effects in the order that those guests arrived at the party
4. WHEN a Pending_Effect is about to be triggered AND the party has already been shut down, THE Game_Store SHALL not execute that Pending_Effect

### Requirement 7: Overflow Condition

**User Story:** As a player, I want the party to end immediately if an entrance effect causes the guest count to exceed the house capacity, so that the overflow mechanic has clear and immediate consequences.

#### Acceptance Criteria

1. WHEN an Auto_Invite adds a guest to the party AND the resulting party size exceeds House_Capacity, THE Game_Store SHALL trigger an Overflow_Shutdown immediately
2. WHEN an Overflow_Shutdown is triggered, THE Game_Store SHALL not execute any remaining Pending_Effects
3. WHEN an Overflow_Shutdown is triggered, THE Game_Store SHALL apply the same party shutdown behavior as a Trouble_Limit_Shutdown with respect to forfeiting resources and returning guests to the deck
4. WHEN an Overflow_Shutdown is triggered, THE Game_Store SHALL NOT enter the Ban_Selection_Phase and SHALL NOT require the player to ban a guest

### Requirement 8: Trouble Limit Exceeded During Effect Chain

**User Story:** As a player, I want the party to end with normal ban selection if an entrance effect causes trouble to exceed the limit, so that the trouble limit is enforced consistently regardless of how guests arrive.

#### Acceptance Criteria

1. WHEN an Auto_Invite adds a guest to the party AND the resulting trouble exceeds the Effective_Trouble_Limit AND the resulting party size does NOT exceed House_Capacity, THE Game_Store SHALL trigger a Trouble_Limit_Shutdown immediately
2. WHEN a Trouble_Limit_Shutdown is triggered during an effect chain, THE Game_Store SHALL not execute any remaining Pending_Effects
3. WHEN a Trouble_Limit_Shutdown is triggered during an effect chain, THE Game_Store SHALL apply the same ban selection behavior as a normal Trouble_Limit_Shutdown (ban selection on non-final turns, no ban on final turn)
4. WHEN an Auto_Invite adds a guest to the party AND the resulting party size exceeds House_Capacity AND the resulting trouble also exceeds the Effective_Trouble_Limit, THE Game_Store SHALL trigger an Overflow_Shutdown (overflow takes priority over trouble-limit)

### Requirement 9: Overflow Shutdown Display

**User Story:** As a player, I want to see a distinct shutdown modal when the party overflows, so that I understand why the party ended.

#### Acceptance Criteria

1. WHEN an Overflow_Shutdown occurs, THE Phase_Content SHALL display a modal with the message "Party exceeded capacity! Fire department has shut it down!"
2. WHEN an Overflow_Shutdown occurs on a non-final turn, THE Phase_Content SHALL display a button labelled "End Party"
3. WHEN an Overflow_Shutdown occurs on the final turn, THE Phase_Content SHALL display a button labelled "Game Over"
4. WHEN the player clicks the button on the Overflow_Shutdown modal on a non-final turn, THE Game_Store SHALL advance to the Buy_Phase of the next turn without entering Ban_Selection_Phase
5. WHEN the player clicks the button on the Overflow_Shutdown modal on the final turn, THE Game_Store SHALL mark the game as complete

### Requirement 10: Player Cannot Manually Overflow

**User Story:** As a player, I want the invite button to prevent me from exceeding the house capacity manually, so that overflow can only happen through entrance effects.

#### Acceptance Criteria

1. WHEN the player clicks the invite button AND the party size equals House_Capacity, THE Game_Store SHALL set the `showHouseFullMessage` flag and not modify the party or deck
2. THE Game_Store SHALL only allow the party to exceed House_Capacity as a result of an Auto_Invite performed by an entrance effect

### Requirement 11: Guest Conservation Invariant

**User Story:** As a developer, I want the total guest count to remain constant across all game operations including Auto_Invites and overflow shutdowns, so that no guests are created or destroyed.

#### Acceptance Criteria

1. FOR ALL sequences of game operations (purchaseGuest, inviteGuest, advancePhase, triggerPartyShutdown, confirmBan), THE sum of deck.length, party.length, discard.length, and all shopInventory guest counts SHALL remain equal to the total number of guests initialized at game start
2. WHEN an entrance effect performs an Auto_Invite, THE total guest count SHALL remain unchanged (the Auto_Invite moves a guest from the deck to the party, it does not create guests)
3. WHEN an Overflow_Shutdown occurs, THE Game_Store SHALL return all party guests to the deck and SHALL preserve the counts in all other locations (discard and shopInventory) without modification, preserving each guest's type, name, and accumulated properties

## Correctness Properties

### Property 1: Mr. Popular Auto-Invite Draws From Deck

*For any* game state in the PARTY phase where the deck contains at least one guest and Mr. Popular is the top of the deck, after calling `inviteGuest()`, the party SHALL contain Mr. Popular plus the guest that was second in the deck, and the deck SHALL be shorter by 2.

**Validates: Requirements 4.1, 4.2**

### Property 2: Celebrity Auto-Invite Draws Two From Deck

*For any* game state in the PARTY phase where the deck contains at least two guests and Celebrity is the top of the deck, after calling `inviteGuest()`, the party SHALL contain Celebrity plus the two guests that were second and third in the deck (in arrival order), and the deck SHALL be shorter by 3.

**Validates: Requirements 5.1, 5.2**

### Property 3: Overflow Triggers Shutdown When Party Exceeds Capacity

*For any* game state where the party size equals House_Capacity and an Auto_Invite is about to be performed, after the Auto_Invite completes, the Game_Store SHALL be in a shutdown state (isPartyShutdown true) and the party SHALL be empty (guests returned to deck).

**Validates: Requirements 7.1, 7.3**

### Property 4: Overflow Shutdown Skips Ban Selection

*For any* Overflow_Shutdown on a non-final turn, after the player dismisses the shutdown modal, the Game_Store SHALL advance to the Buy_Phase of the next turn with isBanSelectionActive equal to false.

**Validates: Requirements 7.4, 9.2**

### Property 5: Entrance Effect Sequencing — Celebrity Chain

*For any* deck where Celebrity is first, a guest with an entrance effect is second, and at least one more guest is third, after calling `inviteGuest()`, the party SHALL contain Celebrity, the second guest, and the third guest (in that order), and the second guest's entrance effect SHALL have been applied after the third guest arrived.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: Trouble Limit Enforced During Effect Chain (No Overflow)

*For any* game state where an Auto_Invite draws a guest whose troubleValue would push total trouble above the Effective_Trouble_Limit AND the resulting party size does NOT exceed House_Capacity, the Game_Store SHALL trigger a Trouble_Limit_Shutdown, SHALL NOT execute any remaining Pending_Effects, and SHALL enter ban selection on non-final turns.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Overflow Takes Priority Over Trouble Limit

*For any* game state where an Auto_Invite simultaneously causes the party to exceed House_Capacity AND causes trouble to exceed the Effective_Trouble_Limit, the Game_Store SHALL trigger an Overflow_Shutdown (not a Trouble_Limit_Shutdown), and SHALL NOT enter ban selection.

**Validates: Requirement 8.4**

### Property 7: Guest Conservation Invariant

*For any* sequence of game operations including Auto_Invites and overflow shutdowns, the sum of deck.length + party.length + discard.length + sum(shopInventory[*].guests.length) SHALL remain constant and equal to the total number of guests at game initialization.

**Validates: Requirements 11.1, 11.2, 11.3**
