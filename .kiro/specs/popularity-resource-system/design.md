# Design Document: Popularity Resource System

## Overview

The popularity resource system introduces a new player resource that tracks social standing throughout the game. This resource accumulates based on the guests present at the end of each Party phase, creating a strategic layer where guest selection impacts long-term resource availability.

The system integrates with the existing turn-based gameplay by calculating popularity changes during phase transitions, specifically when advancing from Party phase to Buy phase. The popularity value is stored in the game state, displayed in the status pane, and maintained across turns as a cumulative resource.

This design extends the existing Guest model to include popularity values per guest type, modifies the GameStore to manage the popularity resource, and updates the StatusPaneComponent to display the current popularity value.

## Architecture

The popularity system follows the existing architecture patterns in the Angular PWA game:

- **State Management**: NgRx SignalStore (GameStore) manages the popularity value as part of the game state
- **Data Flow**: Unidirectional data flow from store to components
- **Computation**: Popularity calculation occurs in the GameStore's `advancePhase()` method
- **Display**: StatusPaneComponent reads popularity from the store via signals and displays it reactively

### Integration Points

1. **GameStore**: Extends state to include `popularity: number`, adds calculation logic to `advancePhase()`
2. **Guest Model**: Extends guest type definitions to include `popularityValue: number`
3. **GameState Interface**: Adds `popularity` property to the base game state
4. **StatusPaneComponent**: Adds popularity display above turns remaining

### Calculation Timing

Popularity is calculated at the transition from Party phase to Buy phase (or game completion). This occurs in the `advancePhase()` method when `currentPhase === GamePhase.PARTY`. The calculation happens after guests are still in the party but before they are returned to the deck, ensuring the calculation reflects the party composition.

## Components and Interfaces

### Modified Interfaces

#### GameState Interface
```typescript
export interface GameState {
  currentTurn: number;
  currentPhase: GamePhase;
  totalTurns: number;
  isGameComplete: boolean;
  popularity: number;  // NEW: Non-negative integer tracking social standing
}
```

#### GameStoreState Interface
```typescript
export interface GameStoreState extends GameState {
  deck: Guest[];
  party: Guest[];
  showEmptyDeckMessage: boolean;
  // popularity inherited from GameState
}
```

#### Guest Type Definition
```typescript
export type GuestType = 'OLD_FRIEND';

export interface GuestTypeProperties {
  popularityValue: number;  // Integer (can be negative, zero, or positive)
}

export const GUEST_TYPE_PROPERTIES: Record<GuestType, GuestTypeProperties> = {
  OLD_FRIEND: {
    popularityValue: 1
  }
};
```

#### Guest Interface
```typescript
export interface GuestProperties {
  popularityValue: number;  // Integer (can be negative, zero, or positive)
  // Future properties will be added here (e.g., resourceGeneration, specialAbilities, etc.)
}

export interface Guest {
  type: GuestType;
  name: string;
  properties: GuestProperties;  // NEW: Modifiable properties copied from type defaults
}
```

**Rationale**: Using a `properties` subobject allows for clean separation between immutable guest identity (`type`, `name`) and mutable game properties. When new guest properties are added in future features (e.g., resource generation, special abilities), they can be added to `GuestProperties` without changing the Guest interface structure. This also makes it clear which properties can be modified by game effects.

#### Guest Type Default Properties
```typescript
export type GuestType = 'OLD_FRIEND';

export interface GuestTypeDefaults {
  popularityValue: number;  // Default popularity for this guest type
  // Future: Add more default properties here as new features are developed
}

export const GUEST_TYPE_DEFAULTS: Record<GuestType, GuestTypeDefaults> = {
  OLD_FRIEND: {
    popularityValue: 1
  }
};
```

**Usage**: When creating new guests, copy the entire `GUEST_TYPE_DEFAULTS[guestType]` object to the guest's `properties` field. This provides all default values that can later be modified on a per-instance basis.

```typescript
// Example: Creating a guest with default properties
const guest: Guest = {
  type: 'OLD_FRIEND',
  name: 'Brian',
  properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }  // Deep copy of defaults
};

// Future: Modifying a specific guest's properties
guest.properties.popularityValue = 2;  // This guest now grants 2 popularity
```

### Modified Components

#### GameStore

**New State Property**:
- `popularity: number` - Initialized to 0, maintained as non-negative

**Modified Methods**:

1. `initializeGame(turnCount?: number): void`
   - Sets `popularity: 0` in initial state

2. `advancePhase(): void`
   - When transitioning from PARTY phase, calculates popularity change before returning guests to deck
   - Sums `popularityValue` for each guest in party
   - Adds sum to current popularity
   - Applies non-negative constraint (Math.max(0, newPopularity))

3. `resetGame(): void`
   - Sets `popularity: 0` in reset state

**New Private Method**:
```typescript
const calculatePopularityChange = (): number => {
  const party = store.party();
  return party.reduce((sum, guest) => {
    return sum + guest.properties.popularityValue;  // Read from guest.properties
  }, 0);
};
```

#### StatusPaneComponent

**Template Changes**:
```html
<aside class="status-pane">
  <div class="status-info">
    <!-- NEW: Popularity display -->
    <h3>Popularity</h3>
    <p class="popularity-count">{{ gameStore.popularity() }}</p>
  </div>
  
  <div class="status-info">
    <h3>Turns Remaining</h3>
    <p class="turn-count">{{ gameStore.remainingTurns() }}</p>
  </div>
  
  <!-- Existing buttons remain unchanged -->
</aside>
```

**Component Class**:
No changes needed - the component already injects GameStore and can access the new `popularity()` signal.

## Data Models

### Popularity Value

- **Type**: `number` (integer)
- **Range**: Non-negative integers (0, 1, 2, 3, ...)
- **Initial Value**: 0
- **Persistence**: Maintained in GameStore state throughout game lifecycle
- **Calculation**: At end of Party phase:
  1. Sum all party guests' `properties.popularityValue` values
  2. Add this sum to the current popularity
  3. If the result would be negative, set popularity to 0 instead (non-negative constraint)

### Guest Instance Properties

Each guest instance has a `properties` object that contains all modifiable game properties:

- **Structure**: `properties: GuestProperties` containing `popularityValue` and future properties
- **Initialization**: When guests are created, their `properties` object is initialized by copying `GUEST_TYPE_DEFAULTS[guestType]`
- **Instance Modification**: Future features may modify individual guest instances' properties (e.g., power-ups, debuffs)
- **Calculation**: The popularity calculation sums `guest.properties.popularityValue` from each guest instance

```typescript
// Example: Creating a guest with default properties
const guest: Guest = {
  type: 'OLD_FRIEND',
  name: 'Brian',
  properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }  // { popularityValue: 1 }
};

// Future: Modifying a specific guest's properties
guest.properties.popularityValue = 2;  // This guest now grants 2 popularity instead of 1

// Future: When new properties are added
guest.properties.resourceGeneration = 5;  // New property from future feature
```

### State Flow

```
Game Initialization
  ↓
popularity = 0
  ↓
Party Phase (guests invited)
  ↓
advancePhase() called
  ↓
Calculate: sum of party guests' properties.popularityValue (from guest instances)
  ↓
New popularity = max(0, current + sum)
  ↓
Update state with new popularity
  ↓
Return guests to deck
  ↓
Transition to next phase/turn
  ↓
Popularity preserved across turns
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Popularity Non-Negative Invariant

*For any* sequence of game operations (initialization, phase advances, guest invitations), the popularity value SHALL always be a non-negative integer (>= 0).

This invariant ensures that popularity never becomes negative regardless of guest compositions or game states. Even when guests with negative popularity values are introduced in future features, the system will clamp the result to zero.

**Validates: Requirements 2.1, 2.2, 5.4**

### Property 2: Status Pane Displays Current Popularity

*For any* game state with a popularity value, the StatusPaneComponent SHALL display that exact popularity value in its rendered output.

This property ensures the UI accurately reflects the game state at all times. Since the component uses Angular signals, changes to popularity in the store should automatically propagate to the display.

**Validates: Requirements 3.1, 3.3**

### Property 3: Popularity Calculation Formula

*For any* party composition at the end of Party phase, the popularity change SHALL equal the sum of each guest's `properties.popularityValue` (subject to the non-negative constraint applied to the final result).

More formally: If the party contains guests g₁, g₂, ..., gₙ, then:
- popularity_change = g₁.properties.popularityValue + g₂.properties.popularityValue + ... + gₙ.properties.popularityValue
- new_popularity = max(0, current_popularity + popularity_change)

This property validates the core calculation logic that determines how guests affect popularity. It ensures the calculation correctly sums individual guest property values regardless of guest types or modifications to individual guests.

**Validates: Requirements 5.1, 5.2, 5.3, 7.2**

### Property 4: Popularity Preservation During Phase Transitions

*For any* game state where advancePhase() is called during Buy phase (transitioning to Party phase), the popularity value SHALL remain unchanged.

This property ensures that popularity only changes at the specific moment when Party phase ends, not during other phase transitions. It validates that the calculation timing is correct and that popularity is not inadvertently modified during Buy→Party transitions.

**Validates: Requirements 6.1, 6.2**

### Property 5: Popularity Accumulation Across Turns

*For any* sequence of complete turns (Buy phase → Party phase → next Buy phase), the final popularity SHALL equal the initial popularity plus the sum of all popularity changes from each Party phase (subject to the non-negative constraint applied after each calculation).

This integration property validates that popularity correctly accumulates over multiple turns, combining the calculation logic (Property 3) with the preservation logic (Property 4). It ensures the cumulative nature of the resource across the entire game.

**Validates: Requirements 6.3**

## Error Handling

### Invalid States

The popularity system is designed to prevent invalid states through type safety and constraints:

1. **Negative Popularity**: Prevented by applying `Math.max(0, newPopularity)` after each calculation
2. **Non-Integer Popularity**: Prevented by TypeScript type system (`popularity: number`) and integer arithmetic
3. **Undefined Guest Type**: Prevented by TypeScript's type system requiring `GuestType` union type

### Edge Cases

1. **Empty Party**: When party is empty at end of Party phase, popularity change is 0 (sum of empty array)
2. **Mixed Positive/Negative Values**: Future feature - calculation sums all values, then applies non-negative constraint
3. **Maximum Popularity**: No upper bound defined - popularity can grow indefinitely

### Error Scenarios

No explicit error throwing is required for the popularity system as all edge cases are handled gracefully:

- Empty party → popularity change of 0
- Negative result → clamped to 0
- Missing guest type → prevented by TypeScript at compile time

## Testing Strategy

### Dual Testing Approach

The popularity system requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, initialization/reset behavior, edge cases, and UI rendering
- **Property Tests**: Verify universal properties across all possible game states and guest compositions

### Property-Based Testing

**Library**: fast-check (already in use in the project)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference

**Property Test Suite**:

1. **Property 1 Test**: Generate random sequences of operations (invite, advancePhase, reset), verify popularity >= 0 after each operation
   - Tag: `Feature: popularity-resource-system, Property 1: Popularity Non-Negative Invariant`

2. **Property 2 Test**: Generate random popularity values, set store state, render component, verify displayed value matches store
   - Tag: `Feature: popularity-resource-system, Property 2: Status Pane Displays Current Popularity`

3. **Property 3 Test**: Generate random party compositions (varying guest counts and types), calculate expected popularity change, advance phase, verify actual matches expected
   - Tag: `Feature: popularity-resource-system, Property 3: Popularity Calculation Formula`

4. **Property 4 Test**: Generate random game states in Buy phase, capture popularity, advance to Party phase, verify popularity unchanged
   - Tag: `Feature: popularity-resource-system, Property 4: Popularity Preservation During Phase Transitions`

5. **Property 5 Test**: Generate random sequences of complete turns with varying party compositions, verify final popularity equals sum of all changes (with non-negative constraint)
   - Tag: `Feature: popularity-resource-system, Property 5: Popularity Accumulation Across Turns`

### Unit Testing

**Unit Test Suite**:

1. **Initialization Tests**:
   - Verify `initializeGame()` sets popularity to 0 (Requirement 1.1)
   - Verify `resetGame()` sets popularity to 0 (Requirement 1.2)

2. **Configuration Tests**:
   - Verify GUEST_TYPE_PROPERTIES structure has popularityValue property (Requirement 4.1)
   - Verify OLD_FRIEND has popularityValue of 1 (Requirement 4.3)

3. **Calculation Example Tests**:
   - Verify 4 OLD_FRIEND guests increase popularity by 4 (Requirement 7.1)
   - Verify empty party results in no popularity change
   - Verify single guest increases popularity by guest's popularityValue

4. **UI Tests**:
   - Verify StatusPaneComponent template includes popularity display element
   - Verify popularity display appears before turns remaining in DOM order (Requirement 3.2)
   - Verify component renders without errors when popularity is 0
   - Verify component renders without errors when popularity is large (e.g., 1000)

5. **Edge Case Tests**:
   - Verify empty party at Party phase end results in popularity change of 0
   - Verify popularity calculation with all guests of same type
   - Test with future negative popularity values to verify non-negative constraint

### Integration Testing

Integration tests should verify the complete flow:

1. Initialize game → verify popularity is 0
2. Advance to Party phase → invite guests → advance phase → verify popularity increased correctly
3. Continue through multiple turns → verify popularity accumulates
4. Reset game → verify popularity returns to 0

### Test Organization

```
src/app/
  stores/
    game.store.spec.ts              # Unit tests for GameStore
    game.store.property.spec.ts     # Property tests for GameStore
  components/
    status-pane.component.spec.ts   # Unit tests for StatusPaneComponent
    status-pane.component.property.spec.ts  # Property tests for StatusPaneComponent
  models/
    guest.model.spec.ts             # Unit tests for guest type properties
```

### Testing Priorities

1. **Critical**: Property 1 (non-negative invariant), Property 3 (calculation formula)
2. **High**: Property 5 (accumulation), initialization/reset unit tests
3. **Medium**: Property 2 (UI display), Property 4 (preservation), UI unit tests
4. **Low**: Edge case unit tests, configuration tests
