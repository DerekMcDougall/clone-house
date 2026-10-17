# Requirements Document

## Introduction

This feature gives every guest instance a stable, unique identifier. Today guests are told apart by object reference (`updateGuest`, `confirmBan`) and by name (the party list's `track guest.name`). Both are fragile: references break as soon as a guest is copied or rebuilt, and names are only unique by convention. Upcoming work — guest types that can be created at runtime, effects that target a chosen guest, and abilities the player activates on a specific guest — all need to refer to "this guest" reliably.

This is step 1 of 5 in the guest extensibility plan:

1. **guest-identity** (this spec)
2. guest-type-registry
3. effect-descriptors
4. effect-choices
5. activated-abilities

There is no player-visible change.

## Glossary

- **Guest_Id**: A string that uniquely identifies one guest instance for the lifetime of a game
- **Guest**: The interface for a guest instance (`type`, `name`, `properties`); extended with `id`
- **createGuest**: A new factory function that builds a guest instance with a fresh Guest_Id and the type's default properties
- **Game_Store**: The NgRx SignalStore managing all game state
- **EffectContext**: The interface effects use to read and write game state
- **Zones**: The deck, party, discard pile, shop inventory and bust party snapshot — every place a guest can be

## Requirements

### Requirement 1: Every Guest Has an Id

**User Story:** As a developer, I want every guest instance to carry a unique id, so that code can refer to a specific guest without relying on object references or names.

#### Acceptance Criteria

1. THE Guest interface SHALL include a required `id: string` field
2. WHEN `initializeGame()` builds the starting deck and the shop inventory, THE Game_Store SHALL create every guest through `createGuest`
3. FOR ALL guests across all Zones after `initializeGame()`, THE Game_Store SHALL assign pairwise distinct Guest_Ids
4. WHEN two guests have the same type and name, THE Game_Store SHALL still assign them distinct Guest_Ids

### Requirement 2: Ids Are Stable

**User Story:** As a developer, I want a guest's id to stay the same wherever the guest moves, so that a reference to a guest stays valid for the whole game.

#### Acceptance Criteria

1. WHEN a guest moves between Zones (purchase, invite, auto-invite, party end, bust, ban), THE Game_Store SHALL preserve that guest's Guest_Id
2. WHEN `EffectContext.updateGuest` replaces a guest, THE replacement SHALL have the same Guest_Id as the original, even if the updater returns a guest with a different `id`
3. WHEN a Climber's entrance effect changes her `popularityValue`, THE updated Climber SHALL keep her Guest_Id

### Requirement 3: Guests Are Matched by Id

**User Story:** As a developer, I want guest lookups to compare ids, so that lookups keep working when guest objects are copied.

#### Acceptance Criteria

1. WHEN `EffectContext.updateGuest(guest, updater)` is called, THE EffectContext SHALL replace the party guest whose Guest_Id equals `guest.id`, whether or not it is the same object
2. WHEN `confirmBan()` runs, THE Game_Store SHALL remove the selected guest from the bust party snapshot by Guest_Id
3. WHEN a guest passed to `updateGuest` is not in the party, THE EffectContext SHALL leave the party unchanged and return the updated guest (current behavior)

### Requirement 4: UI Tracks Guests by Id

**User Story:** As a player, I want the party and ban selection lists to render correctly even when two guests share a name, so that cards are never duplicated, dropped or mixed up.

#### Acceptance Criteria

1. THE Phase_Content party list SHALL track guests by Guest_Id
2. THE Phase_Content ban selection list SHALL track guests by Guest_Id
3. WHEN the party contains two guests with the same name, THE Phase_Content SHALL render one card for each

### Requirement 5: Id Conservation Invariant

**User Story:** As a developer, I want ids to be conserved alongside the existing guest-count invariant, so that tests catch any operation that duplicates or loses a guest.

#### Acceptance Criteria

1. FOR ALL sequences of game operations, THE multiset of Guest_Ids across all Zones SHALL equal the set of Guest_Ids created by `initializeGame()`, with no duplicates and none missing

### Requirement 6: Test Helper

**User Story:** As a developer, I want one helper for building guests in tests, so that adding a field to Guest doesn't mean editing dozens of object literals.

#### Acceptance Criteria

1. THE codebase SHALL provide a test helper that builds a guest from a type, a name and optional property overrides, with a unique Guest_Id
2. THE existing specs SHALL build guests through that helper or through `createGuest` instead of object literals
