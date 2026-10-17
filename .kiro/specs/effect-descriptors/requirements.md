# Requirements Document

## Introduction

This feature describes guest effects as data instead of opaque functions. Today an entrance effect is an `EffectHandler` function, with its card icons listed separately. A guest type created at runtime, for example from JSON, can't say "invite two guests on entrance" without someone writing code.

After this feature, a guest type lists its effects as descriptors such as `{ trigger: 'entrance', action: { kind: 'autoInvite', count: 2 } }`. Each action kind is implemented once, in code, and knows how to run itself and which icons to show. A guest type made only of data can be validated and registered from JSON. A `custom` action keeps code-defined effects possible.

This is step 3 of 5 in the guest extensibility plan and depends on **guest-type-registry**. It adds the `trigger` field that **activated-abilities** (step 5) extends, and the action-kind registry that **effect-choices** (step 4) adds choice-based kinds to.

There is no player-visible change: the four existing entrance effects (Climber, Mr. Popular, Celebrity, Mermaid) behave and display exactly as before.

## Glossary

- **Effect_Definition**: Data describing one effect of a guest type: a `trigger` and an `action`
- **Trigger**: When an effect runs. This feature defines only `entrance` (the guest joins the party)
- **Action_Definition**: Data describing what an effect does: a `kind` plus that kind's parameters
- **Action_Kind**: Code that implements one kind of action: parameter validation, running it and the icons it shows
- **Action_Kind_Registry**: Holds every Action_Kind by name
- **Data_Only_Definition**: A Guest_Type_Definition whose effects use no `custom` actions, so it can be written as JSON
- **Guest_Type_Registry**: From guest-type-registry
- **Effect_Queue**: The store's `resolveEffects` stack: effects enqueued by an effect run, in order, before effects already waiting

## Requirements

### Requirement 1: Effects as Data

**User Story:** As a developer, I want a guest type's effects described as data, so that a type can be defined without writing a function.

#### Acceptance Criteria

1. THE Guest_Type_Definition SHALL replace `entranceEffect` and `entranceIcons` with an optional `effects: EffectDefinition[]`
2. THE Effect_Definition SHALL have a `trigger` (this feature: `'entrance'`) and an `action: ActionDefinition`
3. THE Action_Definition SHALL have a `kind` string naming a registered Action_Kind, plus that kind's parameters

### Requirement 2: Built-in Action Kinds

**User Story:** As a developer, I want the existing effects available as reusable action kinds, so that new guest types can combine them.

#### Acceptance Criteria

1. THE Action_Kind_Registry SHALL include `autoInvite` with an integer parameter `count` ≥ 1, which enqueues `count` auto-invites, in order, each behaving exactly like today's `autoInvite`
2. THE Action_Kind_Registry SHALL include `adjustSelf` with parameters `property` (a GuestProperties key), integer `delta`, and optional integer `min` and `max`, which changes that property of the triggering guest by `delta`, clamped to `[min, max]` when given
3. WHEN `adjustSelf` runs, THE Action_Kind SHALL apply the change to the triggering guest's current state in the party (found by Guest_Id), not to the guest as it was when the effect was enqueued
4. WHEN `adjustSelf` runs and the triggering guest is no longer in the party, THE Action_Kind SHALL do nothing
5. THE Action_Kind_Registry SHALL include `custom` with parameters `run` (an EffectHandler) and `icons`, for effects that can only be written in code

### Requirement 3: Icons Come From Effects

**User Story:** As a developer, I want each effect to supply its own card icons, so that icons can't fall out of sync with effects.

#### Acceptance Criteria

1. EACH Action_Kind SHALL provide its icons from the action's parameters and the effect's trigger
2. THE `autoInvite` kind SHALL show one invite icon (👤, "Invites a guest on entrance") per `count`
3. THE `adjustSelf` kind SHALL show ➕ for a positive `delta` and ➖ for a negative one, labeled "Gains {delta} {property name} on entrance" or "Loses {|delta|} {property name} on entrance"
4. THE `custom` kind SHALL show its `icons` parameter
5. THE `getGuestDetails` function SHALL list effect icons in the order the effects are defined, before the peace, trouble and star icons

### Requirement 4: Running Entrance Effects

**User Story:** As a developer, I want entrance effects dispatched from their definitions, so that the store and `admitGuest` never need per-type code.

#### Acceptance Criteria

1. WHEN a guest is admitted to the party, THE `admitGuest` effect SHALL enqueue one effect per `entrance` Effect_Definition of the guest's type, in definition order
2. THE effects enqueued by `admitGuest` SHALL keep today's ordering on the Effect_Queue: they run after the admission and before any effect that was already waiting
3. WHEN a guest type has no `entrance` effects, THE `admitGuest` effect SHALL enqueue nothing

### Requirement 5: Built-in Types Use Descriptors

**User Story:** As a player, I want the existing entrance effects to work exactly as before, so that this refactor changes no rules.

#### Acceptance Criteria

1. THE Climber definition SHALL use `adjustSelf` with `property: 'popularityValue'`, `delta: 1`, `max: 9`
2. THE Mr. Popular and Mermaid definitions SHALL each use `autoInvite` with `count: 1`
3. THE Celebrity definition SHALL use `autoInvite` with `count: 2`
4. THE icons shown on Climber, Mr. Popular, Celebrity and Mermaid cards SHALL be unchanged, including their labels
5. THE existing entrance effect, auto-invite, overflow and effect-order tests SHALL pass

### Requirement 6: Validation

**User Story:** As a developer, I want bad effect definitions rejected when a type is registered, so that errors surface immediately.

#### Acceptance Criteria

1. WHEN a definition has an effect with an unknown `trigger`, THE Guest_Type_Registry SHALL reject it
2. WHEN a definition has an effect whose `kind` is not registered, THE Guest_Type_Registry SHALL reject it
3. WHEN an action's parameters fail its Action_Kind's validation, THE Guest_Type_Registry SHALL reject the definition, with a message naming the type, the effect's position and the problem

### Requirement 7: Guest Types From JSON

**User Story:** As a developer, I want to define a guest type in JSON and register it, so that guest types can be created dynamically, for example by a designer or loaded from a file.

#### Acceptance Criteria

1. THE codebase SHALL provide `parseGuestTypeDefinition(json: unknown)`, which returns a Guest_Type_Definition or throws on invalid input
2. WHEN the input is a valid Data_Only_Definition, THE `parseGuestTypeDefinition` function SHALL return a definition that registers and plays exactly like the same definition written in TypeScript
3. WHEN the input uses the `custom` kind, THE `parseGuestTypeDefinition` function SHALL reject it, since functions can't be expressed in JSON
4. WHEN the input has missing fields, wrong types or unknown extra fields, THE `parseGuestTypeDefinition` function SHALL reject it with a message giving the path to the problem
5. FOR ALL Data_Only_Definitions, `parseGuestTypeDefinition(JSON.parse(JSON.stringify(def)))` SHALL equal `def`

### Requirement 8: Custom Action Kinds

**User Story:** As a developer, I want to add new action kinds in code, so that new effects become available to every guest type, including JSON-defined ones.

#### Acceptance Criteria

1. THE Action_Kind_Registry SHALL provide `registerActionKind(kind)`, which throws when the kind name is already registered
2. WHEN a new Action_Kind is registered, THE `parseGuestTypeDefinition` function and the Guest_Type_Registry SHALL accept definitions that use it
