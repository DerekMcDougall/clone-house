# Technology Stack

- **Angular 21** with standalone components and signals, set up as a PWA (`@angular/service-worker`)
- **NgRx SignalStore** (`@ngrx/signals`) for game state
- **TypeScript 5.9**
- **Vitest** with jsdom for tests, and **fast-check** for property-based tests
- **Yarn 1** as the package manager

## Common Commands

```bash
yarn install      # install dependencies
yarn start        # dev server at http://localhost:4200 (service worker disabled)
yarn test         # type-check specs, then run all tests
yarn typecheck    # type-check specs only
yarn build        # production build into dist/
```

`yarn test` type-checks the specs before running them, so a type error in a spec fails the run.
