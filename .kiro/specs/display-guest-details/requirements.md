# Requirements Document

## Introduction

Guest cards currently show only a guest's type, a placeholder image and the guest's name, so players cannot see what a guest will do before inviting or buying it. This feature adds the important details to every guest card: the popularity and money the guest grants, plus icons for stars, trouble, peace and entrance effects.

The details appear wherever a guest or guest type is shown as a card. Today that is the party in the house, the "Who takes the blame?" ban selection, and the shop. If the deck or discard pile becomes viewable later, its cards show the same details. A card for a specific guest shows that guest's current properties. A shop card for a guest type shows the properties a guest of that type has when it is first added to the deck.

## Glossary

- **Guest_Card**: The `GuestCardComponent` card that shows one specific guest instance (party, ban selection, and any future deck or discard view)
- **Shop_Card**: The button in the Buy phase's shop that shows one purchasable guest type
- **Card**: A Guest_Card or a Shop_Card
- **Guest_Details**: The popularity, money and icons shown on a Card
- **Detail_Properties**: The `GuestProperties` a Card shows. For a Guest_Card this is the guest instance's current `properties`. For a Shop_Card it is `GUEST_TYPE_DEFAULTS` for that type.
- **Popularity_Value**, **Money_Value**, **Trouble_Value**, **Peace_Value**, **Star_Value**: The matching fields of the Detail_Properties
- **Icon_Corner**: The top right corner of a Card, where the icons are shown
- **Entrance_Effect**: A side effect that runs when a guest joins the party, defined per guest type in `GUEST_TYPE_ENTRANCE_EFFECTS`
- **Auto_Invite**: An Entrance_Effect action that draws the top guest of the deck and admits it to the party

## Requirements

### Requirement 1: Details Reflect the Right State

**User Story:** As a player, I want each card to show the values that apply to it, so that I can judge a guest in the house by its current state and a guest type in the shop by what I would get.

#### Acceptance Criteria

1. THE Guest_Card SHALL derive its Guest_Details from the Detail_Properties of the guest instance it shows, so changes made by Entrance_Effects (such as a Climber's popularity increase) are reflected
2. THE Shop_Card SHALL derive its Guest_Details from `GUEST_TYPE_DEFAULTS` for its guest type (for example, a Climber Shop_Card shows no popularity)
3. THE icons for Entrance_Effects SHALL depend only on the guest type, not on the Detail_Properties
4. WHEN a guest's properties change while its Guest_Card is shown, THE Guest_Card SHALL update its Guest_Details
5. ANY future view that shows guests from the deck or discard pile with the Guest_Card SHALL show Guest_Details without further changes

### Requirement 2: Popularity

**User Story:** As a player, I want to see how much popularity a guest grants, so that I can plan my popularity for the shop.

#### Acceptance Criteria

1. WHEN the Popularity_Value is not zero, THE Card SHALL show the Popularity_Value against the right edge of the card, centered vertically
2. WHEN the Popularity_Value is negative, THE Card SHALL show it with a leading minus sign (for example, `-1` for a Ticket Taker)
3. WHEN the Popularity_Value is zero, THE Card SHALL NOT show a popularity value

### Requirement 3: Money

**User Story:** As a player, I want to see how much money a guest grants, so that I can plan my money for the shop.

#### Acceptance Criteria

1. WHEN the Money_Value is not zero, THE Card SHALL show the Money_Value in the bottom right corner with a dollar sign in front (for example, `$3`)
2. WHEN the Money_Value is negative, THE Card SHALL put the minus sign before the dollar sign (for example, `-$3` for a Dragon)
3. WHEN the Money_Value is zero, THE Card SHALL NOT show a money value

### Requirement 4: Star and Trouble Icons

**User Story:** As a player, I want to see at a glance which guests bring stars and which bring trouble, so that I can manage my chance of winning and of a bust.

#### Acceptance Criteria

1. WHEN the Star_Value is greater than zero, THE Card SHALL show one gold star emoji (⭐) per star as the rightmost icons in the Icon_Corner
2. WHEN the Trouble_Value is greater than zero, THE Card SHALL show one red X emoji (❌) per point of trouble in the Icon_Corner, directly to the left of any star icons, otherwise as the rightmost icons
3. WHEN the Star_Value or Trouble_Value is zero or less, THE Card SHALL NOT show the matching icon
4. THE number of star, trouble and peace icons SHALL equal the Star_Value, Trouble_Value and Peace_Value respectively (for example, a guest with 2 trouble shows ❌❌)

### Requirement 5: Other Effect Icons

**User Story:** As a player, I want to see which guests bring peace or have an entrance effect, so that I know what will happen when they arrive.

#### Acceptance Criteria

1. THE Card SHALL show every other icon in the Icon_Corner to the left of any star and trouble icons
2. WHEN the Peace_Value is greater than zero, THE Card SHALL show one peace symbol emoji (☮️) per point of peace
3. WHEN the guest type is Climber, THE Card SHALL show a plus sign emoji (➕) for its Entrance_Effect
4. WHEN the guest type's Entrance_Effect performs Auto_Invites, THE Card SHALL show one person silhouette emoji (👤) per Auto_Invite: one for Mr. Popular and Mermaid, two for Celebrity
5. From left to right, THE Card SHALL show the icons in this order: Entrance_Effect icons, peace, trouble, star
6. WHEN a guest type has no Entrance_Effect and its Peace_Value, Trouble_Value and Star_Value are all zero or less, THE Card SHALL show no icons

### Requirement 6: Layout and Accessibility

**User Story:** As a player, I want the details to be readable and not cover the rest of the card, including when I use a screen reader.

#### Acceptance Criteria

1. THE Guest_Details SHALL NOT overlap the card's type label, image, name, price or stock text
2. EACH icon SHALL have an accessible name and a hover tooltip that describe its meaning (for example, "Star", "Trouble", "Peace", "Gains 1 popularity on entrance", "Invites a guest on entrance")
3. THE popularity and money values SHALL be announced with what they are (for example, "Popularity 3", "Money -$3")
4. ON a Shop_Card, THE button's existing accessible name ("Buy <type>") SHALL be kept, and THE Guest_Details SHALL be its accessible description
5. THE icon row SHALL stay within the card's width, wrapping onto more rows if needed
6. NEGATIVE popularity and money values SHALL be shown in red, and positive money in green, so a cost cannot be mistaken for a gain
