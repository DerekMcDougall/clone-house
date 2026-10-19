# Project Structure

```
.kiro/
  scratchpad.md     # planned features not yet specced or built
  specs/<feature>/  # requirements.md, design.md, tasks.md for each feature
  steering/         # project context: product, tech, structure
src/app/
  app.routes.ts     # '' landing page, 'game' gameplay, '**' redirect
  components/       # standalone components; templates and styles in separate files
  models/           # guest types, effects, action kinds, game setup
  stores/
    game.store.ts   # GameStore: all game state, turn flow, effect queue, shop
  services/         # PWA service
```

## Key Concepts

- **Guest types are data.** Each type is a `GuestTypeDefinition` in `models/built-in-guest-types.ts`, registered in `models/guest-type-registry.ts`. Types can also be loaded from JSON (`models/guest-type-json.ts`).
- **Effects are data.** An effect is a trigger plus an action (`models/effect-definition.ts`). Each action kind (`autoInvite`, `adjustSelf`, `cycleSelf`, `chooseGuest`, ...) is registered in `models/action-kinds.ts` and validates its parameters, runs, and supplies its card icons.
- **The game setup** (`models/game-setup.ts`) decides the starting deck and shop stock, separately from what each type is.
- **The effect queue** in `GameStore` is a stack: effects a guest's entrance queues run before the rest. Busts are checked after every effect, and the queue can pause for a player choice.

## Conventions

- Tests sit next to the code: `*.spec.ts` for unit tests, `*.property.spec.ts` for fast-check property tests, `*.integration.spec.ts` for tests through the UI.
- Comments explain why or describe game rules, in plain sentences.
