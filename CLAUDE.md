# Clone House

A single-player deck-building party game built with Angular. Read these before working on the game:

- `.kiro/steering/product.md`: the game rules as currently built
- `.kiro/steering/tech.md`: stack and commands (`yarn test`, `yarn build`)
- `.kiro/steering/structure.md`: where things live and how guest types and effects work

## Feature Workflow

1. **Idea**: the user writes new features in `.kiro/scratchpad.md`.
2. **Spec**: each feature gets `.kiro/specs/<feature>/` with `requirements.md`, `design.md` and `tasks.md`, in the format of the existing specs. Keep small features (such as a single new guest type) short; the design file can be skipped when there's nothing to design.
3. **Build**: work through `tasks.md`, ticking each checkbox (`- [x]`) as the task is done, so an open box always means unfinished work. Don't mark tasks optional; include a test task only if it will be written.
4. **Ship**: when the feature is merged, remove its entry from the scratchpad and update `product.md` if the game's rules changed.

`product.md` describes only what's built. Don't add planned features to it.

## Testing

Run `yarn test` before finishing a change; it type-checks the specs, then runs Vitest.
