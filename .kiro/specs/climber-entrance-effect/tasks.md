# Implementation Plan: Climber Entrance Effect

## Overview

Introduce the Climber guest type and an extensible entrance effect system. The implementation touches three layers: the guest model constants, the game store's `inviteGuest()` method, and the existing unit/property test files. No UI components need changes — `PhaseContentComponent` and `GuestCardComponent` pick up the new type automatically from the existing constants.

## Tasks

- [x] 1. Extend guest model with Climber type and entrance effect registry
  - [x] 1.1 Add CLIMBER to GuestType union and all model constants
    - Add `'CLIMBER'` to the `GuestType` union in `guest.model.ts`
    - Add `CLIMBER` entry to `GUEST_TYPE_DEFAULTS` with all-zero properties
    - Add `CLIMBER` entry to `GUEST_TYPE_LABELS` mapping to `"Climber"`
    - Add `CLIMBER` entry to `GUEST_TYPE_COSTS` mapping to `12`
    - Add 4 Climber entries to `SHOP_GUESTS`: Ascella, Skye, Icarus, Vela
    - Do NOT add any Climber entries to `INITIAL_GUESTS`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 3.1, 3.3_

  - [ ]* 1.2 Write unit tests for Climber model constants
    - In `guest.model.spec.ts`, add a describe block for Climber constants
    - Test `GUEST_TYPE_DEFAULTS['CLIMBER']` equals all-zero properties
    - Test `GUEST_TYPE_LABELS['CLIMBER']` equals `'Climber'`
    - Test `GUEST_TYPE_COSTS['CLIMBER']` equals `12`
    - Test `SHOP_GUESTS` filtered by `'CLIMBER'` has exactly 4 entries with names Ascella, Skye, Icarus, Vela
    - Test `SHOP_GUESTS.length` equals `48`
    - Test `INITIAL_GUESTS` filtered by `'CLIMBER'` has length `0`
    - Test `INITIAL_GUESTS.length` remains `10`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 3.1, 3.3_

  - [x] 1.3 Add EffectContext interface, EffectContextImpl class, and EffectHandler type to guest model and store
    - Export `EffectHandler` type alias `(ctx: EffectContext) => void` from `guest.model.ts`
    - Export `GUEST_TYPE_ENTRANCE_EFFECTS: Partial<Record<GuestType, EffectHandler>>` constant from `guest.model.ts` with the CLIMBER handler that calls `ctx.updateGuest(g => ({ ...g, properties: { ...g.properties, popularityValue: Math.min(9, g.properties.popularityValue + 1) } }))`
    - Define `EffectContext` interface in `game.store.ts` (or a co-located `effect-context.ts`) with `guest`, `updateGuest`, `getDeck/setDeck`, `getParty/setParty`, `getDiscard/setDiscard`, `getPopularity/setPopularity`, `getMoney/setMoney`
    - Implement `EffectContextImpl` class (private to the store module) that holds mutable snapshots of all context fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3_

  - [ ]* 1.4 Write property tests for entrance effect handler isolation (Properties 1–3)
    - In `game.store.property.spec.ts`, add property tests using mock `EffectContext` objects (no store setup needed)
    - **Property 1: Climber Entrance Effect Increments popularityValue** — generate `popularityValue` in [0, 8], verify handler increments by 1; also verify cap at 9 stays 9
      - `// Feature: climber-entrance-effect, Property 1: Climber Entrance Effect Increments popularityValue`
      - **Validates: Requirements 4.1, 4.4**
    - **Property 2: Non-Climber Guests Are Unaffected by Entrance Effect** — generate non-Climber type, verify `GUEST_TYPE_ENTRANCE_EFFECTS[type]` is `undefined`
      - `// Feature: climber-entrance-effect, Property 2: Non-Climber Guests Are Unaffected by Entrance Effect`
      - **Validates: Requirements 4.3, 6.2**
    - **Property 3: Per-Instance popularityValue Tracking** — generate two independent popularityValues in [0, 8], construct two independent mock contexts, invoke handler on each, verify each increments independently
      - `// Feature: climber-entrance-effect, Property 3: Per-Instance popularityValue Tracking`
      - **Validates: Requirements 5.1, 5.2**
    - _Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 6.2_

- [x] 2. Update inviteGuest() in GameStore to apply entrance effects
  - [x] 2.1 Modify inviteGuest() to construct EffectContextImpl and dispatch entrance effects
    - In `game.store.ts`, update `inviteGuest()` to: destructure `[rawGuest, ...remainingDeck]` from deck, construct `new EffectContextImpl(rawGuest, remainingDeck, store.party(), store.discard(), store.popularity(), store.money())`, look up `GUEST_TYPE_ENTRANCE_EFFECTS[rawGuest.type]`, call handler if present, then commit via single `patchState({ deck: ctx.getDeck(), party: [...ctx.getParty(), ctx.guest], discard: ctx.getDiscard(), popularity: ctx.getPopularity(), money: ctx.getMoney() })`
    - Non-Climber guests must pass through unchanged (no handler → no property mutation)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3_

  - [x] 2.2 Write unit tests for Climber entrance effect in GameStore
    - In `game.store.spec.ts`, add a describe block for Climber entrance effect behavior
    - After `initializeGame()`, verify `shopInventory` has a CLIMBER entry with 4 guests and cost 12
    - After `initializeGame()`, verify `deck` contains zero CLIMBER guests
    - Verify `purchasableShopItems()` returns CLIMBER last (cost 12, highest)
    - Patch deck with a Climber at `popularityValue` 0, call `inviteGuest()`, verify party guest has `popularityValue` 1
    - Patch deck with a Climber at `popularityValue` 9, call `inviteGuest()`, verify party guest has `popularityValue` 9 (cap)
    - Patch deck with a non-Climber guest, call `inviteGuest()`, verify `popularityValue` is unchanged
    - Verify a Climber's `popularityValue` is preserved when it returns to the deck after `advancePhase()`
    - _Requirements: 2.2, 3.2, 4.1, 4.2, 4.3, 4.4, 5.3, 9.2_

  - [ ]* 2.3 Write property tests for store-level Climber behavior (Properties 4–7)
    - In `game.store.property.spec.ts`, add store-integrated property tests
    - **Property 4: popularityValue Preserved Across Party Cycles** — generate `popularityValue` in [0, 7], patch deck with Climber at that value, `inviteGuest()` (→ n+1), `advancePhase()` (returns to deck), `inviteGuest()` again, verify party guest has `popularityValue` n+2
      - `// Feature: climber-entrance-effect, Property 4: popularityValue Preserved Across Party Cycles`
      - **Validates: Requirements 5.3**
    - **Property 5: Climber Party Contribution** — generate `popularityValue` in [0, 9], patch store with Climber in party and popularity at 0, `advancePhase()` from PARTY, verify `store.popularity() === v`
      - `// Feature: climber-entrance-effect, Property 5: Climber Party Contribution`
      - **Validates: Requirements 8.1, 8.2**
    - **Property 6: Climber Purchase Yields Valid Guest** — generate popularity >= 12, initialize game, patch popularity, call `purchaseGuest('CLIMBER')`, verify success, deck grew by 1, new guest has type CLIMBER, name in {Ascella, Skye, Icarus, Vela}, `popularityValue === 0`, popularity decreased by 12, shop stock decreased by 1
      - `// Feature: climber-entrance-effect, Property 6: Climber Purchase Yields Valid Guest`
      - **Validates: Requirements 7.1, 7.2, 7.3_
    - **Property 7: Guest Conservation Invariant** — generate random sequences of purchaseGuest/inviteGuest/advancePhase operations including Climber purchases; after each operation verify `deck.length + party.length + discard.length + sum(shopInventory[*].guests.length) === 58`
      - `// Feature: climber-entrance-effect, Property 7: Guest Conservation Invariant`
      - **Validates: Requirements 11.1, 11.2**
    - _Requirements: 5.3, 7.1, 7.2, 7.3, 8.1, 8.2, 11.1, 11.2_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Extend component tests for Climber rendering
  - [x] 4.1 Write unit tests for Climber shop card in PhaseContentComponent
    - In `phase-content.component.spec.ts`, add tests for CLIMBER shop display during BUY phase
    - Verify a shop card for CLIMBER is rendered with label "Climber" and cost 12
    - Verify the CLIMBER shop card displays "Available: 4" on a fresh game
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 4.2 Write unit tests for Climber guest card in GuestCardComponent
    - In `guest-card.component.spec.ts`, add a test for CLIMBER guest card rendering
    - Verify `GuestCardComponent` renders "Climber" as the `.card-header` text for a CLIMBER guest
    - Verify the guest's name appears in `.card-caption`
    - _Requirements: 10.1_

- [x] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Properties 1–3 test `GUEST_TYPE_ENTRANCE_EFFECTS` handler functions in isolation using a mock `EffectContext` — no NgRx store setup required
- Properties 4–7 require a full store setup via `TestBed`
- `PhaseContentComponent` and `GuestCardComponent` require no implementation changes — they pick up CLIMBER automatically from the updated constants
- The `EffectContext` interface is designed as the universal effect API for all future trigger points (end-of-party, on-discard, etc.) without modification

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.1"] },
    { "id": 4, "tasks": ["4.2"] }
  ]
}
```
