# Requirements Document

## Introduction

This feature lets an effect stop and ask the player to choose, then continue with the answer. Today `resolveEffects` keeps its stack in a local variable and runs every effect to completion, so no effect can wait for player input. Ban selection after a bust is already a choice, but it's built separately from effects, with its own state (`isBanSelectionActive`, `selectedBanGuest`), methods and markup.

After this feature, an effect calls `ctx.requestChoice(...)`. Resolution pauses with the remaining effects saved in store state, a generic choice panel shows the options, and the player's answer resumes resolution exactly where it left off. Ban selection moves onto the same mechanism, which proves it works and removes the special case.

This is step 4 of 5 in the guest extensibility plan and depends on **effect-descriptors**. It's the base for **activated-abilities** (step 5). No real guest type with a choice is added here; tests use test-only types. The only player-visible change is that the ban selection screen is rendered by the generic choice panel, with the same text and flow.

## Glossary

- **Choice_Request**: What an effect passes to `requestChoice`: a prompt, a function that produces the options, an optional confirmation message, and what to do with the chosen option
- **Choice_Option**: One option the player can pick: an id, a label and, optionally, the guest it stands for
- **Choice_Point**: The entry `requestChoice` puts on the Effect_Queue; when reached, resolution pauses
- **Pending_Choice**: Store state describing the choice the player currently has to make
- **Effect_Queue**: The store's effect stack. Effects an effect enqueues run, in order, before effects that were already waiting; the queue is discarded on a bust
- **Choice_Panel**: The UI that renders the Pending_Choice
- **Game_Store**: The NgRx SignalStore managing all game state

## Requirements

### Requirement 1: Requesting a Choice

**User Story:** As a developer, I want an effect to ask the player to choose, so that guests can have interactive effects.

#### Acceptance Criteria

1. THE EffectContext SHALL provide `requestChoice(request: ChoiceRequest)`
2. THE Choice_Request SHALL have a `prompt`, an `options` function that returns Choice_Options from current game state, an optional `confirmMessage` function, and an `onChoose(ctx, option)` continuation
3. WHEN an effect calls `requestChoice`, THE EffectContext SHALL place a Choice_Point on the Effect_Queue at that position in the effect's enqueue order, exactly as if it were an enqueued effect
4. THE effect that calls `requestChoice` SHALL finish running before resolution pauses; its state changes SHALL be committed and bust-checked as usual

### Requirement 2: Pausing

**User Story:** As a player, I want the game to wait for my choice before anything else happens, so that my choice applies to the game state I'm looking at.

#### Acceptance Criteria

1. WHEN resolution reaches a Choice_Point, THE Game_Store SHALL compute its options from the current state, set the Pending_Choice, save the remaining Effect_Queue in store state, and stop resolving
2. WHEN the options function returns no options, THE Game_Store SHALL skip the Choice_Point without pausing and without calling `onChoose`
3. WHILE a Pending_Choice exists, THE Game_Store SHALL ignore `inviteGuest`, `advancePhase`, `purchaseGuest` and `purchaseExpansion`
4. WHILE a Pending_Choice exists, THE `canInviteGuest` signal SHALL be false and the phase button SHALL be disabled
5. WHEN a bust discards the Effect_Queue, THE Game_Store SHALL also discard any Choice_Points on it

### Requirement 3: Choosing and Resuming

**User Story:** As a player, I want to pick an option and see its result immediately, so that the effect finishes the way I chose.

#### Acceptance Criteria

1. THE Game_Store SHALL provide `selectChoiceOption(optionId)` and `confirmChoice()`
2. WHEN `selectChoiceOption` is called with the id of a current option and the Choice_Request has no `confirmMessage`, THE Game_Store SHALL resolve the choice immediately
3. WHEN `selectChoiceOption` is called with the id of a current option and the Choice_Request has a `confirmMessage`, THE Game_Store SHALL record the selection and show the confirmation message; `confirmChoice()` SHALL then resolve the choice
4. WHEN `selectChoiceOption` is called with an id that is not a current option, or no choice is pending, THE Game_Store SHALL do nothing
5. WHEN a choice is resolved, THE Game_Store SHALL clear the Pending_Choice, run `onChoose(ctx, option)` as the next effect, and continue resolving the saved Effect_Queue
6. THE effects enqueued by `onChoose` SHALL run before the rest of the saved Effect_Queue, following the usual ordering rule
7. WHEN `onChoose` itself requests another choice, THE Game_Store SHALL pause again

### Requirement 4: Choice Panel

**User Story:** As a player, I want a clear screen for making choices, so that I know what's being asked and what my options are.

#### Acceptance Criteria

1. WHILE a Pending_Choice exists, THE Choice_Panel SHALL show the prompt and one button per option
2. WHEN an option has a guest, THE Choice_Panel SHALL render that option as the guest's card
3. WHEN an option has no guest, THE Choice_Panel SHALL render the option's label as button text
4. WHEN a selection is awaiting confirmation, THE Choice_Panel SHALL show the confirmation message in a dialog with an OK button
5. EACH option button SHALL have an accessible name; guest options SHALL use the option's label

### Requirement 5: Data-Only Choices

**User Story:** As a developer, I want a choice available as an action kind, so that JSON-defined guest types can be interactive.

#### Acceptance Criteria

1. THE Action_Kind_Registry SHALL include `chooseGuest` with parameters `prompt` (non-empty string), `from` (`'party'`), `action` (an Action_Definition) and `icons` (a non-empty list of `{ symbol, label }`)
2. WHEN `chooseGuest` runs, THE Action_Kind SHALL request a choice whose options are the guests in the party at the time the Choice_Point is reached, and whose `onChoose` runs `action` with the chosen guest as the triggering guest
3. THE `chooseGuest` kind SHALL show its `icons`, which describe the effect on the chosen guest; there is no generic "chooses a guest" icon
4. THE `chooseGuest` kind SHALL validate its nested `action` with that action's kind

### Requirement 6: Ban Selection Uses Choices

**User Story:** As a developer, I want ban selection built on the generic choice mechanism, so that there is one way to ask the player to choose.

#### Acceptance Criteria

1. WHEN a trouble bust is acknowledged on a non-final turn, THE Game_Store SHALL start a choice with the prompt "Who takes the blame?", one option per bust party guest, and the confirmation message "{type label} {name} will be banned from the next party."
2. WHEN the ban choice is resolved, THE Game_Store SHALL apply today's ban outcome: the chosen guest to the discard pile, the other bust party guests shuffled into the deck, and the turn advanced to the next BUY phase
3. THE `isBanSelectionActive`, `selectedBanGuest` and `banConfirmationMessage` signals and the `selectGuestToBan(index)` and `confirmBan()` methods SHALL keep working as `@deprecated` wrappers over the choice state
4. THE ban flow the player sees (prompt, guest cards, confirmation text, OK button) SHALL be unchanged
