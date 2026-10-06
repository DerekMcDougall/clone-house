# Requirements Document

## Introduction

This feature gives the party game a win condition. The goal of the game is to have 4 stars in a party at once. Stars are a new guest property (`starValue`) that, like trouble and peace, counts only while the granting guest is in the party and does not persist past the current party. When the player ends a party normally (not by a trouble or overflow shutdown) with 4 or more stars, the player immediately wins: instead of proceeding to the next turn's BUY phase, a victory dialog reading "Congrats! You threw the ultimate party!" is shown, and its "Victory" button ends the game and returns to the home screen.

Seven new star guest types are added. All of them grant exactly 1 star, cost more than any existing guest type, and are available only through the shop with a stock of 4 named guests each:

| Guest Type | Cost | Stars | Other contributions / effects |
|------------|------|-------|-------------------------------|
| Dinosaur   | 25   | 1     | 1 trouble |
| Dragon     | 30   | 1     | -3 money |
| Mermaid    | 35   | 1     | Entrance effect: automatically invites one other guest (same as Mr. Popular) |
| Alien      | 40   | 1     | None |
| Unicorn    | 45   | 1     | 1 peace |
| Leprechaun | 50   | 1     | 3 money |
| Superhero  | 50   | 1     | 3 popularity |

This adds 28 new shop guests (56 existing + 28 = 84 shop guests, 94 total with 10 initial). The star model is a signed integer so that future guest types may grant multiple or negative stars.

## Glossary

- **Star**: An integer guest property representing a guest's contribution toward the win condition while in the party; resets when the party ends, like trouble
- **Party_Stars**: The computed sum of `starValue` across all guests currently in the party
- **Winning_Star_Count**: The constant number of Party_Stars required to win, equal to 4
- **Victory**: The game state reached when the player ends a party normally with Party_Stars greater than or equal to Winning_Star_Count
- **Victory_Dialog**: The modal dialog shown on Victory, containing the message "Congrats! You threw the ultimate party!" and a "Victory" button
- **Normal_Party_End**: Ending the PARTY phase by the player's End Party (or Game Over) action, as opposed to a trouble-limit shutdown or overflow shutdown
- **Star_Guest**: Any guest type whose default `starValue` is non-zero; in this feature, Alien, Leprechaun, Dragon, Dinosaur, Mermaid, Unicorn, and Superhero
- **Alien**: A new guest type granting 1 star and nothing else, costing 40 popularity
- **Leprechaun**: A new guest type granting 1 star and 3 money, costing 50 popularity
- **Dragon**: A new guest type granting 1 star and -3 money, costing 30 popularity
- **Dinosaur**: A new guest type granting 1 star and 1 trouble, costing 25 popularity
- **Mermaid**: A new guest type granting 1 star with an entrance effect that automatically invites one guest from the deck, costing 35 popularity
- **Unicorn**: A new guest type granting 1 star and 1 peace, costing 45 popularity
- **Superhero**: A new guest type granting 1 star and 3 popularity, costing 50 popularity
- **Auto_Invite**: The existing entrance-effect behavior (used by Mr. Popular) that draws the top guest of the deck and admits it to the party via the effect queue
- **GuestProperties**: The TypeScript interface defining a guest's resource contributions; extended to include starValue
- **GuestType**: The TypeScript union type defining all valid guest categories
- **GUEST_TYPE_DEFAULTS**, **GUEST_TYPE_LABELS**, **GUEST_TYPE_COSTS**, **GUEST_TYPE_ENTRANCE_EFFECTS**: The existing guest model constants
- **SHOP_GUESTS**: The constant array of named guests available for purchase in the shop
- **INITIAL_GUESTS**: The constant array of named guests included in the player's starting deck
- **Game_Store**: The NgRx SignalStore managing all game state
- **Status_Pane**: The UI component displaying game information in the right-side panel
- **Phase_Content**: The UI component rendering the main content area and modal dialogs
- **GameplayComponent**: The route component that hosts the game and navigates home when the game is complete

## Requirements

### Requirement 1: Add starValue to GuestProperties

**User Story:** As a developer, I want every guest type to have a starValue property, so that the system can calculate star contributions uniformly.

#### Acceptance Criteria

1. THE GuestProperties interface SHALL include a starValue field of type number
2. THE GUEST_TYPE_DEFAULTS SHALL map every existing GuestType to a GuestProperties with starValue of 0
3. THE GUEST_TYPE_DEFAULTS SHALL map every Star_Guest type to a GuestProperties with starValue of 1
4. THE starValue field SHALL permit any integer value, including values greater than 1 and negative values, so that future guest types may grant multiple or negative stars

### Requirement 2: Alien Guest Type Definition

**User Story:** As a player, I want the Alien to be available as a pure star guest, so that I can work toward the win condition.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'ALIEN'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'ALIEN' to a GuestProperties with popularityValue of 0, troubleValue of 0, moneyValue of 0, peaceValue of 0, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'ALIEN' to the display label "Alien"
4. THE GUEST_TYPE_COSTS SHALL map 'ALIEN' to a popularity cost of 40
5. THE GUEST_TYPE_ENTRANCE_EFFECTS SHALL NOT contain an entry for 'ALIEN'

### Requirement 3: Leprechaun Guest Type Definition

**User Story:** As a player, I want the Leprechaun to grant a star and money, so that I can win while funding house expansions.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'LEPRECHAUN'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'LEPRECHAUN' to a GuestProperties with popularityValue of 0, troubleValue of 0, moneyValue of 3, peaceValue of 0, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'LEPRECHAUN' to the display label "Leprechaun"
4. THE GUEST_TYPE_COSTS SHALL map 'LEPRECHAUN' to a popularity cost of 50

### Requirement 4: Dragon Guest Type Definition

**User Story:** As a player, I want the Dragon to be a cheaper star guest with a money drawback, so that I face a cost/benefit tradeoff.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'DRAGON'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'DRAGON' to a GuestProperties with popularityValue of 0, troubleValue of 0, moneyValue of -3, peaceValue of 0, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'DRAGON' to the display label "Dragon"
4. THE GUEST_TYPE_COSTS SHALL map 'DRAGON' to a popularity cost of 30

### Requirement 5: Dinosaur Guest Type Definition

**User Story:** As a player, I want the Dinosaur to be the cheapest star guest with a trouble drawback, so that I must manage the trouble limit to use it.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'DINOSAUR'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'DINOSAUR' to a GuestProperties with popularityValue of 0, troubleValue of 1, moneyValue of 0, peaceValue of 0, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'DINOSAUR' to the display label "Dinosaur"
4. THE GUEST_TYPE_COSTS SHALL map 'DINOSAUR' to a popularity cost of 25

### Requirement 6: Mermaid Guest Type Definition

**User Story:** As a player, I want the Mermaid to grant a star and bring another guest along, so that I can fill my party faster at the risk of overflow or trouble.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'MERMAID'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'MERMAID' to a GuestProperties with popularityValue of 0, troubleValue of 0, moneyValue of 0, peaceValue of 0, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'MERMAID' to the display label "Mermaid"
4. THE GUEST_TYPE_COSTS SHALL map 'MERMAID' to a popularity cost of 35
5. THE GUEST_TYPE_ENTRANCE_EFFECTS SHALL map 'MERMAID' to an entrance effect that performs exactly one Auto_Invite
6. WHEN a Mermaid is admitted to the party, THE Game_Store SHALL resolve the Mermaid's Auto_Invite with the same behavior as Mr. Popular's Auto_Invite, including overflow and trouble-limit checks after each effect and no draw when the deck is empty

### Requirement 7: Unicorn Guest Type Definition

**User Story:** As a player, I want the Unicorn to grant a star and peace, so that it helps me win while keeping the party under control.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'UNICORN'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'UNICORN' to a GuestProperties with popularityValue of 0, troubleValue of 0, moneyValue of 0, peaceValue of 1, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'UNICORN' to the display label "Unicorn"
4. THE GUEST_TYPE_COSTS SHALL map 'UNICORN' to a popularity cost of 45

### Requirement 8: Superhero Guest Type Definition

**User Story:** As a player, I want the Superhero to grant a star and popularity, so that it helps me win while building toward more purchases.

#### Acceptance Criteria

1. THE GuestType union SHALL include the value 'SUPERHERO'
2. THE GUEST_TYPE_DEFAULTS SHALL map 'SUPERHERO' to a GuestProperties with popularityValue of 3, troubleValue of 0, moneyValue of 0, peaceValue of 0, and starValue of 1
3. THE GUEST_TYPE_LABELS SHALL map 'SUPERHERO' to the display label "Superhero"
4. THE GUEST_TYPE_COSTS SHALL map 'SUPERHERO' to a popularity cost of 50

### Requirement 9: Shop Inventory for Star Guests

**User Story:** As a player, I want the shop to stock all seven star guest types, so that I can purchase them during the BUY phase.

#### Acceptance Criteria

1. THE SHOP_GUESTS SHALL include exactly 4 Alien entries with the names "ET", "Rocky", "Olimar", and "Alf"
2. THE SHOP_GUESTS SHALL include exactly 4 Leprechaun entries with the names "Lucky", "Liam", "Seamus", and "Patrick"
3. THE SHOP_GUESTS SHALL include exactly 4 Dragon entries with the names "Smaug", "Clay", "Malathrax", and "Toothless"
4. THE SHOP_GUESTS SHALL include exactly 4 Dinosaur entries with the names "Barney", "Blue", "Dino", and "Rex"
5. THE SHOP_GUESTS SHALL include exactly 4 Mermaid entries with the names "Ariel", "Marina", "Calypso", and "Oceana"
6. THE SHOP_GUESTS SHALL include exactly 4 Unicorn entries with the names "Sparkles", "Glitter", "Stardust", and "Moonbeam"
7. THE SHOP_GUESTS SHALL include exactly 4 Superhero entries with the names "Superman", "Spider-man", "Batman", and "Iron Man"
8. THE SHOP_GUESTS SHALL contain exactly 84 total entries (56 existing plus 28 new)
9. WHEN the game is initialized, THE Game_Store SHALL create a shop inventory entry for each Star_Guest type containing 4 named guests and the correct cost
10. EVERY guest name across INITIAL_GUESTS and SHOP_GUESTS SHALL be unique

### Requirement 10: Star Guests Excluded from Starting Deck

**User Story:** As a player, I want to start the game without star guests, so that winning requires building up popularity and buying them.

#### Acceptance Criteria

1. THE INITIAL_GUESTS SHALL contain zero Star_Guest entries
2. WHEN the game is initialized, THE deck SHALL contain zero Star_Guest guests
3. THE INITIAL_GUESTS SHALL remain unchanged at exactly 10 entries

### Requirement 11: Star Guest Pricing

**User Story:** As a player, I want star guests to be the most expensive guests, so that winning is a long-term goal.

#### Acceptance Criteria

1. THE GUEST_TYPE_COSTS of every Star_Guest type SHALL be greater than the GUEST_TYPE_COSTS of every non-star purchasable guest type
2. THE shop SHALL display guest types in ascending cost order, then alphabetical label order for ties, resulting in the order: Old Friend (2), Monkey (3), Rich Pal (3), Hippy (4), Ticket Taker (4), Caterer (5), Mr. Popular (5), Rock Star (5), Gangster (6), Cute Dog (7), Gambler (7), Auctioneer (9), Celebrity (11), Climber (12), Dinosaur (25), Dragon (30), Mermaid (35), Alien (40), Unicorn (45), Leprechaun (50), Superhero (50)

### Requirement 12: Party Stars

**User Story:** As a player, I want stars to count only while their guests are at the party, so that I must assemble 4 stars in a single party to win.

#### Acceptance Criteria

1. THE Game_Store SHALL expose Party_Stars as a computed value equal to the sum of starValue across all guests currently in the party
2. WHEN the party is empty, THE Party_Stars SHALL equal 0
3. WHEN a party ends by Normal_Party_End, trouble-limit shutdown, or overflow shutdown, THE Party_Stars SHALL reset to 0 because the party is cleared
4. THE Game_Store SHALL NOT store stars as persistent state carried between parties

### Requirement 13: Star Guest Party Contributions

**User Story:** As a player, I want each star guest's non-star resources to apply just like any other guest's, so that their tradeoffs are meaningful.

#### Acceptance Criteria

1. WHEN a Star_Guest is in the party, THE Game_Store SHALL include that guest's popularityValue, troubleValue, moneyValue, and peaceValue in the existing trouble, effective trouble limit, popularity, and money calculations
2. WHEN a Dinosaur is admitted and its trouble causes trouble to exceed the effective trouble limit, THE Game_Store SHALL trigger the existing trouble-limit shutdown
3. WHEN a Dragon is in the party at Normal_Party_End without Victory, THE Game_Store SHALL apply its -3 money using the existing money deficit rules

### Requirement 14: Victory on Normal Party End

**User Story:** As a player, I want to win immediately when I end a party with 4 or more stars, so that the game has a clear goal.

#### Acceptance Criteria

1. THE Winning_Star_Count SHALL equal 4
2. WHEN the player performs a Normal_Party_End AND Party_Stars is greater than or equal to Winning_Star_Count, THE Game_Store SHALL enter Victory
3. WHEN the Game_Store enters Victory, THE Game_Store SHALL NOT advance to the next turn's BUY phase
4. WHEN the Game_Store enters Victory on the final turn, THE Game_Store SHALL enter Victory instead of completing the game as a normal Game Over
5. WHEN the player performs a Normal_Party_End AND Party_Stars is less than Winning_Star_Count, THE Game_Store SHALL perform the existing party-end behavior unchanged
6. WHEN a party ends by trouble-limit shutdown or overflow shutdown, THE Game_Store SHALL NOT enter Victory, regardless of the stars present in the party before the shutdown
7. WHILE Party_Stars is greater than or equal to Winning_Star_Count during the PARTY phase, THE Game_Store SHALL NOT enter Victory until the player performs a Normal_Party_End
8. WHILE Victory is active, THE Game_Store SHALL ignore inviteGuest and advancePhase calls

### Requirement 15: Victory Dialog

**User Story:** As a player, I want a celebratory dialog when I win, so that I know I have won before returning home.

#### Acceptance Criteria

1. WHILE Victory is active, THE Phase_Content SHALL display a modal dialog with role "dialog" containing the text "Congrats! You threw the ultimate party!"
2. THE Victory_Dialog SHALL contain exactly one button labeled "Victory"
3. WHILE Victory is active, THE Status_Pane SHALL disable the Invite Guest and phase buttons
4. WHILE Victory is active, THE Phase_Content SHALL continue to display the winning party's guest cards behind the Victory_Dialog
5. WHEN the player activates the "Victory" button, THE Game_Store SHALL mark the game complete
6. WHEN the game is marked complete after Victory, THE GameplayComponent SHALL navigate to the home screen

### Requirement 16: Star Display in Status Pane

**User Story:** As a player, I want to see how many stars are in my current party, so that I know when I can win.

#### Acceptance Criteria

1. WHILE the current phase is PARTY, THE Status_Pane SHALL display a "Stars" section showing Party_Stars and Winning_Star_Count in the format "{Party_Stars} / {Winning_Star_Count}"
2. WHILE the current phase is BUY, THE Status_Pane SHALL NOT display the "Stars" section

### Requirement 17: Shop and Guest Card Display for Star Guests

**User Story:** As a player, I want star guests to appear in the shop and in my party like other guests, so that I can identify and buy them.

#### Acceptance Criteria

1. WHILE the current phase is BUY, THE Phase_Content SHALL display a shop card for each Star_Guest type showing the correct label, price, and "Available: {remaining_stock}"
2. WHEN a Star_Guest is in the party, THE GuestCardComponent SHALL display the type's label as the card header and the guest's name as the card caption

### Requirement 18: New Game Resets Victory

**User Story:** As a player, I want a new game to start fresh after a win, so that the victory state does not carry over.

#### Acceptance Criteria

1. WHEN the game is initialized, THE Game_Store SHALL set Victory to inactive
2. WHEN the game is reset, THE Game_Store SHALL set Victory to inactive

### Requirement 19: Guest Conservation Invariant

**User Story:** As a developer, I want the total guest count to remain constant across all game operations, so that no guests are created or destroyed during gameplay.

#### Acceptance Criteria

1. FOR ALL sequences of game operations (purchaseGuest, inviteGuest, advancePhase, acknowledgeShutdown, confirmBan, claimVictory), THE sum of deck.length, party.length, discard.length, bustPartySnapshot.length, and all shopInventory guest counts SHALL equal 94 (10 initial guests plus 84 purchasable shop guests)
