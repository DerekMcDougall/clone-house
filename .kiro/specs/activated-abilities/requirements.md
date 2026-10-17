# Requirements Document

## Introduction

This feature lets guests have abilities the player uses on purpose. Today every effect triggers automatically when a guest enters the party. After this feature, a guest type can also list `activated` effects: while a guest of that type is in the party, its card shows a button, and pressing it runs the effect through the normal effect queue, with the usual bust checks and, if the effect asks, a choice.

This is step 5 of 5 in the guest extensibility plan and depends on **effect-choices**. Any action kind can be used as an ability, including `chooseGuest`.

No real guest type with an ability is added here. The first one comes with the guest design that needs it; tests use test-only types.

### Assumptions to confirm

These game rules are the defaults this spec uses. Each is one field or one check, so they're easy to change:

- Abilities can only be used during the PARTY phase, by guests in the party
- Each ability can be used once per party by default; a type can opt into unlimited uses
- Using an ability costs nothing beyond what the effect itself does
- Abilities can be used while the house is full; an ability that invites can overflow it, like an entrance effect

## Glossary

- **Ability**: An Effect_Definition with `trigger: 'activated'`
- **Uses**: How often an Ability can be used: `'oncePerParty'` (default) or `'unlimited'`
- **Used_Abilities**: Store state recording which Abilities each party guest has used this party
- **Ability_Button**: The button on a party guest's card that uses one Ability
- **Effect_Queue**: The store's effect stack, with bust checks after each effect and pauses for choices
- **Game_Store**: The NgRx SignalStore managing all game state

## Requirements

### Requirement 1: Defining Abilities

**User Story:** As a developer, I want to give a guest type an ability using the same effect definitions as entrance effects, so that any action can be used either way.

#### Acceptance Criteria

1. THE `Trigger` type SHALL include `'activated'`
2. THE Effect_Definition SHALL accept optional `uses` (`'oncePerParty'` or `'unlimited'`, default `'oncePerParty'`) and optional `label` (button text), only when `trigger` is `'activated'`
3. WHEN an `entrance` effect has `uses` or `label`, THE Guest_Type_Registry SHALL reject the definition
4. THE `triggerPhrase` for `'activated'` SHALL be "when used", so icon labels read, for example, "Invites a guest when used"
5. THE `parseGuestTypeDefinition` function SHALL accept and round-trip `activated` effects with `uses` and `label`

### Requirement 2: Using an Ability

**User Story:** As a player, I want to press a guest's ability button and see the effect happen, so that I can make tactical decisions during a party.

#### Acceptance Criteria

1. THE Game_Store SHALL provide `useAbility(guestId, effectIndex)`, where `effectIndex` is the Ability's position in the type's `effects` list
2. WHEN `useAbility` is called and the Ability is available (Requirement 3), THE Game_Store SHALL record the use in Used_Abilities and then resolve the Ability's action through the Effect_Queue, with that guest as the triggering guest
3. THE Ability's effect SHALL get the same bust checks, ordering and choice behavior as any other effect, including overflow from invites
4. WHEN using an Ability busts the party, THE use SHALL still count as used (the party is over anyway)
5. WHEN `useAbility` is called and the Ability is not available, THE Game_Store SHALL do nothing

### Requirement 3: Availability

**User Story:** As a player, I want ability buttons enabled only when I can actually use them, so that I'm never offered something that won't work.

#### Acceptance Criteria

1. AN Ability SHALL be available only when all of these hold: the phase is PARTY; the guest is in the party; `effectIndex` names an `activated` effect of the guest's type; the Ability has not been used this party, unless its Uses is `'unlimited'`; no choice is pending; no effects are pending; and the party is not shut down, in ban selection or won
2. THE Game_Store SHALL provide `partyAbilities`, a computed list of every Ability of every party guest with its guest id, effect index, label, icons and availability
3. WHEN a party ends (normally, by bust or by overflow), THE Game_Store SHALL clear Used_Abilities
4. WHEN a guest returns to a later party, THE guest's `'oncePerParty'` Abilities SHALL be available again

### Requirement 4: Ability Buttons

**User Story:** As a player, I want to see and press ability buttons on guest cards, so that it's clear which guests can do something.

#### Acceptance Criteria

1. WHEN a guest in the party has Abilities, THE Guest_Card SHALL show one Ability_Button per Ability
2. THE Ability_Button SHALL show the Ability's `label` or, if none, the label of its first icon
3. THE Ability_Button's accessible name SHALL be "{button text} ({guest name})"
4. WHEN an Ability is not available, THE Ability_Button SHALL be disabled; WHEN it has been used this party, the button SHALL say it's used
5. THE Guest_Card SHALL show Ability_Buttons only in the party list, not in the shop, the choice panel or anywhere else a card is shown; in particular it SHALL never render a button inside another button
6. THE Guest_Details icons SHALL include Ability icons, in effect order, with their "when used" labels

### Requirement 5: Conservation and Turn Flow

**User Story:** As a developer, I want abilities to respect the game's existing invariants, so that they can't break turn flow or lose guests.

#### Acceptance Criteria

1. THE guest id conservation invariant SHALL hold across sequences that include `useAbility`
2. WHEN `advancePhase()` ends a party, THE Game_Store SHALL settle it as today; Abilities SHALL have no effect on settlement except through the state their effects changed
