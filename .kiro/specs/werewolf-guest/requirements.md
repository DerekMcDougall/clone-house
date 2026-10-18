# Requirements Document

## Introduction

This feature adds the Werewolf, a guest whose entrance effect permanently changes the guest instance, like the Climber's. Each time a Werewolf enters the party, it switches between granting 0 trouble and granting 1 trouble. A new Werewolf has 0 trouble, so its first entrance switches it to 1.

The entrance effect has to finish before the trouble limit is checked. A Werewolf that comes back with 1 trouble switches to 0 as it enters, so it can be invited safely even when the party is already at the trouble limit. Today the store checks for a bust straight after a guest is admitted, before the guest's entrance effects run, so this feature changes when the trouble check happens. Overflow is still checked straight away.

The switch is a new data-only action kind, `cycleSelf`, so the Werewolf is defined as data like the other built-in types, and JSON-defined types can use the same behavior.

## Glossary

- **Werewolf**: A new guest type: 4 popularity, 0 or 1 trouble, costs 5 popularity, with an entrance effect that switches its trouble between 0 and 1
- **cycleSelf**: A new action kind that sets one property of the guest whose effect it is to the next value in a list, wrapping around
- **Arrival**: An effect that adds a guest to the party: the player's invite, or an auto-invite's draw
- **Trouble_Check**: The check that ends the party when trouble exceeds the effective trouble limit
- **Overflow_Check**: The check that ends the party when the party has more guests than the house capacity
- **Game_Store**: The NgRx SignalStore managing all game state

## Requirements

### Requirement 1: The cycleSelf Action Kind

**User Story:** As a developer, I want an action that steps a guest's property through a list of values, so that guests like the Werewolf can be defined as data.

#### Acceptance Criteria

1. THE Action_Kind_Registry SHALL include `cycleSelf` with parameters `property` (a guest property key), `values` (a list of at least 2 integers) and `icons` (a non-empty list of `{ symbol, label }`)
2. WHEN `cycleSelf` runs, THE Action_Kind SHALL set `property` on the current party version of the guest whose effect it is to the value after the current one in `values`, wrapping from the last value to the first
3. WHEN the guest's current value is not in `values`, THE Action_Kind SHALL set it to the first value in `values`
4. WHEN the guest is no longer in the party, THE Action_Kind SHALL do nothing
5. THE `cycleSelf` kind SHALL show its `icons`
6. THE `cycleSelf` kind SHALL be data-only, so JSON-defined guest types can use it
7. THE `cycleSelf` kind SHALL reject an unknown property, a `values` list with fewer than 2 entries or any non-integer entry, missing or empty `icons`, and unknown parameters, with a path in each problem

### Requirement 2: Werewolf Guest Type

**User Story:** As a player, I want to buy Werewolves, so that I have a guest whose trouble changes every time it comes to a party.

#### Acceptance Criteria

1. THE built-in guest types SHALL include `WEREWOLF`, labeled "Werewolf", costing 5 popularity, with 4 popularity, 0 trouble, 0 money, 0 peace and 0 stars
2. THE Werewolf SHALL have one entrance effect: `cycleSelf` on `troubleValue` with values `[0, 1]` and a 🌙 icon labeled "Switches between 0 and 1 trouble on entrance"
3. THE default game setup SHALL stock 4 Werewolves in the shop, named Remus, Lawrence, Scott and Jacob
4. THE starting deck SHALL contain no Werewolves

### Requirement 3: Trouble Checked After a Guest's Entrance Effects

**User Story:** As a player, I want a Werewolf's switch to happen before trouble is counted, so that a Werewolf coming back with 1 trouble doesn't bust a party that's at the limit.

#### Acceptance Criteria

1. WHEN an Arrival adds a guest whose type has entrance effects, THE Game_Store SHALL skip the Trouble_Check after the Arrival, so that the next Trouble_Check comes after that guest's first entrance effect has run
2. WHEN an Arrival adds a guest whose type has no entrance effects, THE Game_Store SHALL run the Trouble_Check straight after the Arrival, as today
3. THE Game_Store SHALL run the Overflow_Check after every effect, Arrivals included, as today; an Arrival that overflows the house SHALL end the party before the arriving guest's entrance effects run
4. WHEN the party is at the trouble limit AND the player invites a Werewolf with 1 trouble, THE Werewolf SHALL switch to 0 trouble and THE party SHALL continue
5. WHEN the player invites a Werewolf with 0 trouble AND the switch to 1 trouble takes the party over the trouble limit, THE Game_Store SHALL end the party with a trouble bust, with the Werewolf at 1 trouble in the bust party
6. THE Werewolf's trouble SHALL persist on the guest instance across parties, busts and bans, in the same way as a Climber's popularity

### Requirement 4: Werewolf Card

**User Story:** As a player, I want a Werewolf's card to show whether it brings trouble right now, so that I can plan around it.

#### Acceptance Criteria

1. THE Werewolf's card SHALL show the 🌙 icon to the left of any trouble icon, wherever the card is shown
2. A Werewolf card in the house SHALL show the ❌ trouble icon when that Werewolf has 1 trouble and no trouble icon when it has 0
3. THE Werewolf's card in the shop SHALL show the type's starting state: 4 popularity, the 🌙 icon and no trouble icon
