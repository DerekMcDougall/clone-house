# Requirements Document

## Introduction

This feature replaces the parallel per-type tables in `guest.model.ts` with one definition object per guest type, held in a registry. Today, adding a guest type means editing `GuestType`, `GUEST_TYPE_LABELS`, `GUEST_TYPE_DEFAULTS`, `GUEST_TYPE_COSTS`, `SHOP_GUESTS` and, for types with an entrance effect, `GUEST_TYPE_ENTRANCE_EFFECTS` and `GUEST_TYPE_ENTRANCE_ICONS`, which only a comment keeps in sync. The closed `GuestType` union also rules out guest types created at runtime.

After this feature, adding a guest type means writing one definition. Types can also be registered at runtime, before a game starts.

This is step 2 of 5 in the guest extensibility plan and depends on **guest-identity**. Entrance effects keep their current function form here; **effect-descriptors** (step 3) replaces them with data.

There is no player-visible change: the same 22 types, with the same stats, costs, rosters and shop order.

## Glossary

- **Guest_Type_Definition**: One object describing a guest type: id, label, cost, default properties, starting and shop rosters, and entrance effect with its icons
- **Guest_Type_Registry**: The module that holds every registered Guest_Type_Definition, in registration order
- **Built_In_Guest_Types**: The list of definitions for the game's 22 current guest types
- **Derived_Views**: The existing constants (`GUEST_TYPE_LABELS`, `GUEST_TYPE_DEFAULTS`, `GUEST_TYPE_COSTS`, `SHOP_GUESTS`, `INITIAL_GUESTS`, `GUEST_TYPE_ENTRANCE_EFFECTS`, `GUEST_TYPE_ENTRANCE_ICONS`), kept as values computed from Built_In_Guest_Types
- **Roster**: The names of a type's guests in the starting deck (`starting`) and in the shop (`shop`)
- **Game_Store**: The NgRx SignalStore managing all game state

## Requirements

### Requirement 1: One Definition Per Guest Type

**User Story:** As a developer, I want everything about a guest type in one place, so that adding a type means writing one object.

#### Acceptance Criteria

1. THE codebase SHALL define a `GuestTypeDefinition` interface with `id`, `label`, `cost` (a number, or null when not sold), `properties`, `roster` (`starting` and `shop` name lists), and optional `entranceEffect` with `entranceIcons`
2. THE Built_In_Guest_Types SHALL contain one definition for each of the 22 current guest types, with the same label, default properties, cost and roster names as today
3. WHEN a definition has an `entranceEffect`, THE definition SHALL also have at least one entry in `entranceIcons`, and vice versa
4. THE `GuestType` type SHALL be `string`, so guest types are not limited to a compile-time list

### Requirement 2: Registry

**User Story:** As a developer, I want to register guest types and look them up by id, so that game code doesn't depend on which types exist.

#### Acceptance Criteria

1. THE Guest_Type_Registry SHALL provide `registerGuestType(definition)`, `getGuestType(id)`, `findGuestType(id)` and `listGuestTypes()`
2. WHEN `getGuestType` is called with an unregistered id, THE Guest_Type_Registry SHALL throw an error naming the id
3. WHEN `findGuestType` is called with an unregistered id, THE Guest_Type_Registry SHALL return `undefined`
4. THE `listGuestTypes()` function SHALL return definitions in registration order
5. WHEN the app starts, THE Built_In_Guest_Types SHALL be registered in their current table order
6. THE Guest_Type_Registry SHALL provide a way for tests to restore the registry to only the Built_In_Guest_Types

### Requirement 3: Definition Validation

**User Story:** As a developer, I want invalid definitions rejected when registered, so that mistakes show up immediately instead of mid-game.

#### Acceptance Criteria

1. WHEN `registerGuestType` is called with an id that is already registered, THE Guest_Type_Registry SHALL throw an error and leave the existing definition in place
2. WHEN a definition has an empty id or label, THE Guest_Type_Registry SHALL throw an error
3. WHEN a definition's `cost` is not null and not a non-negative integer, THE Guest_Type_Registry SHALL throw an error
4. WHEN any property in a definition's `properties` is not an integer, THE Guest_Type_Registry SHALL throw an error
5. WHEN a definition's roster contains an empty name, or the same name twice across `starting` and `shop`, THE Guest_Type_Registry SHALL throw an error
6. WHEN a definition has `entranceEffect` without `entranceIcons`, or `entranceIcons` without `entranceEffect`, THE Guest_Type_Registry SHALL throw an error
7. WHEN a definition has a non-empty `shop` roster and `cost` is null, THE Guest_Type_Registry SHALL throw an error

### Requirement 4: Game Code Reads the Registry

**User Story:** As a developer, I want the store and components to look up types through the registry, so that runtime-registered types work everywhere built-in types do.

#### Acceptance Criteria

1. THE Game_Store SHALL build the starting deck from the `starting` rosters of all registered types, in registration order, before shuffling
2. THE Game_Store SHALL build the shop inventory from the `shop` rosters and costs of all registered types with a non-null cost
3. THE Game_Store, `admitGuest`, `getGuestDetails`, Guest_Card and Phase_Content SHALL get labels, default properties, costs, entrance effects and entrance icons from the Guest_Type_Registry, not from the Derived_Views
4. WHEN a guest's type is not registered, THE Guest_Card SHALL show the type id as its label (current fallback behavior)

### Requirement 5: Runtime-Registered Types

**User Story:** As a developer, I want to register a new guest type at runtime and have it appear in the next game, so that guest types can be created dynamically.

#### Acceptance Criteria

1. WHEN a guest type is registered before `initializeGame()`, THE Game_Store SHALL include its starting roster in the deck and its shop roster in the shop inventory
2. WHEN a guest type is registered after `initializeGame()`, THE Game_Store SHALL NOT change the current game's deck or shop inventory
3. WHEN a guest of a runtime-registered type is in the party, THE Game_Store SHALL count its properties in trouble, peace, stars and party settlement exactly like a built-in type

### Requirement 6: Derived Views Kept for Compatibility

**User Story:** As a developer, I want the existing constants to keep working during the migration, so that hundreds of existing test assertions don't have to change at once.

#### Acceptance Criteria

1. THE Derived_Views SHALL remain exported, with the same values as today, computed from Built_In_Guest_Types
2. THE Derived_Views SHALL be marked `@deprecated` in favor of the registry
3. THE Derived_Views SHALL NOT include runtime-registered types

### Requirement 7: Unchanged Gameplay

**User Story:** As a player, I want the game to play exactly as before, so that this refactor doesn't change any rules.

#### Acceptance Criteria

1. WHEN `initializeGame()` runs with only Built_In_Guest_Types registered, THE Game_Store SHALL produce the same deck contents (before shuffling) and the same shop inventory as before this feature
2. THE shop SHALL keep its current display order (ascending cost, then label)
3. THE existing test suite SHALL pass with only mechanical changes
