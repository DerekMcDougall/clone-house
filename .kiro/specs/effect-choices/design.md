# Design Document: Effect Choices

## Overview

Let resolution pause for player input. The effect stack moves from a local variable in `resolveEffects` into store state. `ctx.requestChoice()` puts a choice point on the stack. When resolution reaches it, the store records a pending choice and stops. The player's answer resumes resolution with the choice's continuation on top. Ban selection becomes the first user of the mechanism.

Step 4 of 5 in the guest extensibility plan. Depends on **effect-descriptors**.

### Key Design Decisions

1. **A choice point is a queue entry**: `requestChoice` doesn't pause immediately. It enqueues a choice point in the same order as any `enqueue` call from that effect. That means the depth-first ordering rule from #7 already says when a choice happens relative to other effects, and nothing new has to be specified. The current effect always finishes first, so effects never run half-way.

2. **Options are computed when the choice is reached**: Between `requestChoice` and the choice point, earlier effects may change the party. Computing options at that point means the player picks from what's actually on screen.

3. **One pending choice, one resume function**: The pending choice holds a `resume(option)` function. For effect choices, `resume` pushes the continuation and runs the queue. For ban selection, `resume` applies the ban. The panel, the gating and the select/confirm flow are shared; only the outcome differs. Ban selection doesn't fit the effect model directly: it changes turn and phase, which `EffectContext` deliberately doesn't expose.

4. **Closures in store state**: Saved effects and `resume` are functions, so this state can't be serialized. That's fine today, since nothing persists the game. Saving a game mid-choice would need effects stored as descriptors; that's out of scope, but data-only types (effect-descriptors) are the path there.

5. **Empty options skip the choice**: "Choose a party guest" with an empty party has nothing to ask. Skipping is simpler for the player than a choice with no options. A request that wants a "do nothing" option includes one explicitly.

6. **No cancel**: Effects run to completion once started, and today's ban flow has no cancel either. A request that wants an opt-out includes a "Skip" option.

7. **Compatibility wrappers for ban**: About 80 spec lines use `isBanSelectionActive`, `selectGuestToBan` and friends. They stay as deprecated wrappers, so this change doesn't have to rewrite those specs. CSS class names in the markup do change, and the specs that query them are updated.

## Architecture

### Modified Files

```
models/effect-context.ts
├── ChoiceOption { id, label, guest? }
├── ChoiceRequest { prompt, options(view), confirmMessage?(option), onChoose(ctx, option), sourceGuestId? }
├── GameStateView: read-only getters (deck, party, discard, popularity, money)
└── EffectContext: + requestChoice(request)

models/action-kinds.ts
└── + chooseGuest kind

stores/game.store.ts
├── QueueEntry = { kind: 'effect'; run: GameEffect } | { kind: 'choice'; request: ChoiceRequest }
├── state: + pendingEffects: QueueEntry[], + choice: ActiveChoice | null
├── computed: + pendingChoice (UI view), + isAwaitingChoice
├── computed (deprecated wrappers): isBanSelectionActive, selectedBanGuest, banConfirmationMessage
├── runQueue(): the loop from resolveEffects, reading and writing pendingEffects
├── resolveEffects(effect): pushes effect, calls runQueue()
├── startChoice(info, options, resume): shared by effect choices and ban;
│   info = Pick<ChoiceRequest, 'prompt' | 'confirmMessage' | 'sourceGuestId'>
├── methods: + selectChoiceOption(id), + confirmChoice()
├── acknowledgeShutdown(): trouble branch starts the ban choice
└── selectGuestToBan(index), confirmBan(): deprecated wrappers

components/choice-panel.component.{ts,html,scss} [new]
└── renders pendingChoice; replaces the ban-selection markup in phase-content

components/phase-content.component.html
└── ban selection and ban modal markup replaced by <app-choice-panel />
```

### Resolution Flow

```mermaid
sequenceDiagram
    participant Player
    participant Store
    participant Queue as pendingEffects
    participant Panel as Choice_Panel

    Player->>Store: inviteGuest()
    Store->>Queue: push admitGuest(g)
    loop runQueue
        Store->>Queue: pop entry
        alt effect entry
            Store->>Store: run, commit, bust check
        else choice entry
            Store->>Store: options = request.options(view)
            alt options empty
                Store->>Store: skip
            else
                Store->>Store: choice = { request, options, resume }
                Store-->>Panel: pendingChoice()
                Note over Store: stop; queue stays saved
            end
        end
    end
    Player->>Panel: pick option
    Panel->>Store: selectChoiceOption(id)
    opt confirmMessage
        Panel->>Player: confirmation dialog
        Player->>Store: confirmChoice()
    end
    Store->>Store: choice.resume(option)
    Store->>Queue: push onChoose(option) continuation
    Store->>Store: runQueue() resumes
```

## Components and Interfaces

### Choice types (models/effect-context.ts)

```typescript
export interface ChoiceOption {
  id: string;
  label: string;
  guest?: Guest;
}

// Read-only game state, for computing options.
export interface GameStateView {
  getDeck(): readonly Guest[];
  getParty(): readonly Guest[];
  getDiscard(): readonly Guest[];
  getPopularity(): number;
  getMoney(): number;
}

export interface ChoiceRequest {
  prompt: string;
  // Runs when the choice is reached, not when it's requested.
  options(view: GameStateView): ChoiceOption[];
  // When set, picking an option shows this message with an OK button before resolving.
  confirmMessage?(option: ChoiceOption): string;
  // Runs as the next effect once the player has chosen.
  onChoose(ctx: EffectContext, option: ChoiceOption): void;
  // The guest whose effect is asking, if any. Shown by the panel.
  sourceGuestId?: string;
}

export interface EffectContext {
  // ...existing members...
  requestChoice(request: ChoiceRequest): void;
}
```

`EffectContextImpl.requestChoice(request)` pushes `{ kind: 'choice', request }` to the same list `enqueue` writes to, so order is preserved.

### Store state (stores/game.store.ts)

```typescript
type QueueEntry =
  | { kind: 'effect'; run: GameEffect }
  | { kind: 'choice'; request: ChoiceRequest };

interface ActiveChoice {
  prompt: string;
  options: ChoiceOption[];
  confirmMessage?: (option: ChoiceOption) => string;
  selectedOptionId: string | null;
  sourceGuestId?: string;
  resume: (option: ChoiceOption) => void;
}

// GameStoreState additions
pendingEffects: QueueEntry[];   // stack; the last entry runs next
choice: ActiveChoice | null;
```

Computed:

```typescript
isAwaitingChoice: computed(() => store.choice() !== null),

pendingChoice: computed(() => {
  const c = store.choice();
  if (!c) return null;
  const selected = c.options.find(o => o.id === c.selectedOptionId) ?? null;
  return {
    prompt: c.prompt,
    options: c.options,
    confirmation: selected && c.confirmMessage ? c.confirmMessage(selected) : null,
    sourceGuestId: c.sourceGuestId ?? null
  };
}),
```

### runQueue (stores/game.store.ts)

```typescript
const runQueue = (): void => {
  while (store.pendingEffects().length > 0 && !store.choice()) {
    const stack = [...store.pendingEffects()];
    const entry = stack.pop()!;
    patchState(store, { pendingEffects: stack });

    if (entry.kind === 'choice') {
      const options = entry.request.options(viewOf(store));
      if (options.length === 0) continue;
      startChoice(entry.request, options, (option) => {
        pushEntries([{ kind: 'effect', run: (ctx) => entry.request.onChoose(ctx, option) }]);
        runQueue();
      });
      return;
    }

    const enqueued: QueueEntry[] = [];
    const ctx = new EffectContextImpl(/* state */, enqueued);
    entry.run(ctx);
    pushEntries(enqueued);   // reversed internally so the first enqueued runs first
    commit(ctx);

    if (isBust()) { bust(); return; }   // bust() clears pendingEffects
  }
};

const resolveEffects = (effect: GameEffect): void => {
  pushEntries([{ kind: 'effect', run: effect }]);
  runQueue();
};
```

`bust()` is the bust branch of today's `resolveEffects`, plus `pendingEffects: []`. It replaces the duplicated logic in `triggerPartyShutdown` and `triggerOverflowShutdown`, which become calls to `bust(false)` and `bust(true)`.

### selectChoiceOption / confirmChoice

```typescript
selectChoiceOption(optionId: string): void {
  const c = store.choice();
  const option = c?.options.find(o => o.id === optionId);
  if (!c || !option) return;
  if (c.confirmMessage) {
    patchState(store, { choice: { ...c, selectedOptionId: optionId } });
  } else {
    resolveChoice(c, option);
  }
},

confirmChoice(): void {
  const c = store.choice();
  const option = c?.options.find(o => o.id === c.selectedOptionId);
  if (!c || !option) return;
  resolveChoice(c, option);
},

// private
const resolveChoice = (c: ActiveChoice, option: ChoiceOption) => {
  patchState(store, { choice: null });
  c.resume(option);
};
```

### Gating

`inviteGuest`, `advancePhase`, `purchaseGuest` and `purchaseExpansion` return early when `isAwaitingChoice()` is true. `purchaseGuest` returns its existing failure type with a new `error: 'choice_pending'`; nothing in the UI can call it during a choice, so no message is needed. `canInviteGuest` gains `&& !store.isAwaitingChoice()`. The status pane's phase button is disabled the same way.

### chooseGuest kind (models/action-kinds.ts)

```typescript
const chooseGuestKind: ActionKind<{ prompt: string; from: 'party'; action: ActionDefinition }> = {
  kind: 'chooseGuest',
  dataOnly: true,   // dataOnly only if the nested action's kind is
  validate: /* prompt non-empty; from === 'party'; nested action valid via its kind */,
  run: (ctx, guest, { prompt, action }) => ctx.requestChoice({
    prompt,
    sourceGuestId: guest.id,
    options: (view) => view.getParty().map(g => ({ id: g.id, label: `${guestTypeLabel(g.type)} ${g.name}`, guest: g })),
    onChoose: (c, option) => getActionKind(action.kind).run(c, option.guest!, action)
  }),
  icons: (_p, trigger) => [{ symbol: '🎯', label: `Chooses a party guest ${triggerPhrase(trigger)}` }]
};
```

The nested action treats the chosen guest as its triggering guest, so `adjustSelf` inside `chooseGuest` changes the chosen guest. Its validation is recursive, and `dataOnly` is computed from the nested action (a `custom` action inside makes the whole thing code-only).

### Ban selection

```typescript
// acknowledgeShutdown, trouble branch on a non-final turn
patchState(store, { isPartyShutdown: false });
startChoice(
  {
    prompt: 'Who takes the blame?',
    confirmMessage: (o) => `${guestTypeLabel(o.guest!.type)} ${o.guest!.name} will be banned from the next party.`,
  },
  store.bustPartySnapshot().map(g => ({ id: g.id, label: `Ban ${g.name}`, guest: g })),
  (option) => applyBan(option.guest!)   // today's confirmBan body, matching by id
);
```

Deprecated wrappers:

```typescript
isBanSelectionActive: computed(() => store.choice()?.prompt === BAN_PROMPT),
selectedBanGuest: computed(() => /* the selected option's guest while banning, else null */),
banConfirmationMessage: computed(() => store.pendingChoice()?.confirmation ?? ''),
selectGuestToBan(index) { const g = store.bustPartySnapshot()[index]; if (g) this.selectChoiceOption(g.id); },
confirmBan() { this.confirmChoice(); },
```

`BAN_PROMPT` is a constant. A `kind` tag on `ActiveChoice` would be sturdier than matching the prompt; it's worth adding when a second system-level choice appears.

### Choice_Panel (components/choice-panel.component.*)

```html
@if (gameStore.pendingChoice(); as choice) {
  <div class="choice-panel">
    <h3 class="choice-prompt">{{ choice.prompt }}</h3>
    <div class="guest-cards-container">
      @for (option of choice.options; track option.id) {
        <button class="choice-option-button" (click)="gameStore.selectChoiceOption(option.id)" [attr.aria-label]="option.label">
          @if (option.guest) { <app-guest-card [guest]="option.guest" /> } @else { {{ option.label }} }
        </button>
      }
    </div>
  </div>
  @if (choice.confirmation) {
    <div class="choice-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="choice-confirm-title">
      <div class="choice-confirm-modal">
        <p id="choice-confirm-title">{{ choice.confirmation }}</p>
        <button class="choice-confirm-button" (click)="gameStore.confirmChoice()" aria-label="OK">OK</button>
      </div>
    </div>
  }
}
```

Styles move over from the `.ban-selection` and `.ban-modal` rules in `phase-content.component.scss`, renamed. Ban option labels are `Ban {name}`, so the accessible names stay as today.

## Data Models

| State | Type | Initial |
|---|---|---|
| `pendingEffects` | `QueueEntry[]` | `[]` |
| `choice` | `ActiveChoice \| null` | `null` |

`selectedBanGuest` and `isBanSelectionActive` leave state and become computed. `initializeGame`, `resetGame` and every bust clear both new fields.

## Correctness Properties

### Property 1: Choices Keep Queue Order

*For any* tree of test effects where some effects enqueue effects and some request choices, answered with arbitrary options, the order in which effects run SHALL equal the order produced by treating each choice point as an effect that runs `onChoose` inline. In other words, pausing doesn't reorder anything.

**Validates: Requirements 1.3, 2.1, 3.5, 3.6, 3.7**

### Property 2: Nothing Happens While Waiting

*For any* game state with a pending choice, calling `inviteGuest`, `advancePhase`, `purchaseGuest` or `purchaseExpansion` SHALL leave all state unchanged.

**Validates: Requirements 2.3, 2.4**

### Property 3: Options Reflect State When Reached

*For any* party, a `chooseGuest` effect queued behind an effect that adds or removes party guests SHALL offer exactly the party guests present when the choice point is reached.

**Validates: Requirements 2.1, 5.2**

### Property 4: Empty Options Skip

*For any* choice whose options function returns `[]`, resolution SHALL continue past it without setting `choice` and without calling `onChoose`.

**Validates: Requirements 2.2**

### Property 5: Invalid Selections Are Ignored

*For any* pending choice and any id not among its options, `selectChoiceOption(id)` SHALL change nothing. With no pending choice, `selectChoiceOption` and `confirmChoice` SHALL change nothing.

**Validates: Requirements 3.4**

### Property 6: Bust Clears Pending Effects

*For any* queue where an effect busts the party while choice points are still queued behind it, after the bust `pendingEffects` SHALL be empty and `choice` SHALL be null.

**Validates: Requirements 2.5**

### Property 7: Ban Outcome Unchanged

*For any* bust party snapshot and chosen index, the deck, discard pile, turn and phase after `selectGuestToBan(i)` + `confirmBan()` SHALL match the outcome of today's implementation (same multiset of deck ids, chosen guest alone in discard, turn + 1, BUY phase).

**Validates: Requirements 6.1–6.3**

### Property 8: Guest Conservation Holds

The id conservation invariant from guest-identity SHALL hold across operation sequences that include choices (test types with `chooseGuest` effects, answered randomly).

**Validates: Requirements 3.5, 6.2**

## Error Handling

- `onChoose` receiving an option whose guest has since left the party: can't happen, since nothing runs between the choice point and `onChoose`. `adjustSelf` already ignores guests not in the party.
- `requestChoice` from inside an options function: options get a read-only `GameStateView`, which has no `requestChoice`.

## Testing Strategy

**Library**: fast-check, minimum 100 iterations per property, tagged `// Feature: effect-choices, Property {n}: {title}`.

- Property 1 uses a generator of effect trees: each node either records its label, enqueues children, or requests a choice whose `onChoose` enqueues children. The expected order comes from a reference interpreter that runs `onChoose` inline. The test drives the store, answering each pending choice with a random option.
- Test-only guest types (registered and reset per spec) provide entrance effects with `chooseGuest` and `custom` choices.
- Ban specs: the existing ones stay, run through the wrappers. Specs that query `.ban-guest-button`, `.ban-confirm-button` or `.blame-prompt` switch to the new class names.
- Choice_Panel unit tests: guest options render cards, label-only options render text, the confirmation dialog appears only with `confirmMessage`, and accessible names match labels.
