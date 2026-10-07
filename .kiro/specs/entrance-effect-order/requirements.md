# Requirements Document

## Introduction

This tweak changes the order in which entrance effects resolve. Previously an entrance effect ran to completion before the entrance effect of any guest it brought in (see Requirement 6 of the overflow spec). Now an arriving guest's entrance effect interrupts the effect that is currently running: it resolves immediately, together with every effect it triggers, and only then does the interrupted effect continue. In practice, if the first guest auto-invited by a Celebrity has an entrance effect, that effect happens before the Celebrity auto-invites her second guest.

This matters for upcoming entrance effects that can change the trouble level. A trouble change made by an arriving guest takes effect, and can bust the party, before any further guests are drawn.

With the current guest types, the party that results from an invite (and the guest that triggers a bust) is the same under either order, because every Auto_Invite draws the top guest of the deck when it runs. The visible difference today is that an entrance effect such as the Climber's is applied before the rest of the chain continues, so it is reflected in the bust party if a later arrival in the same chain busts the party.

## Glossary

- **Game_Store**: The NgRx SignalStore managing all game state
- **Entrance_Effect**: A side effect that triggers when a guest joins the party; defined per guest type in GUEST_TYPE_ENTRANCE_EFFECTS
- **Auto_Invite**: An action performed by an entrance effect that draws the top guest from the deck and admits it to the party
- **Effect**: A unit of work resolved by the Game_Store's `resolveEffects()`; admitting a guest, an Auto_Invite and an Entrance_Effect are each effects
- **Interrupting_Effect**: An effect enqueued by the effect currently running; it runs before any effect that was already waiting
- **Pending_Effect**: An effect that has been enqueued but not yet run
- **Celebrity**: A guest type whose entrance effect performs two Auto_Invites
- **Mr_Popular**: A guest type whose entrance effect performs one Auto_Invite
- **Bust**: A Party_Shutdown caused by overflow or by trouble exceeding the Effective_Trouble_Limit

## Requirements

### Requirement 1: Entrance Effects Interrupt the Current Effect

**User Story:** As a player, I want a guest's entrance effect to happen as soon as that guest arrives, so that its consequences are applied before anyone else walks in.

#### Acceptance Criteria

1. WHEN a guest with an Entrance_Effect arrives while another effect is resolving, THE Game_Store SHALL resolve the arriving guest's Entrance_Effect, and every effect it triggers, before resuming the interrupted effect
2. WHEN Celebrity's first Auto_Invite draws a guest with an Entrance_Effect, THE Game_Store SHALL resolve that guest's Entrance_Effect before performing Celebrity's second Auto_Invite
3. WHEN an interrupting Entrance_Effect itself admits a guest with an Entrance_Effect, THE Game_Store SHALL resolve the innermost Entrance_Effect first, then resume each interrupted effect from the most recently interrupted outward
4. WHEN a single effect enqueues several effects (such as Celebrity's two Auto_Invites), THE Game_Store SHALL run those effects in the order they were enqueued

### Requirement 2: Bust Checks Apply Between Interrupting Effects

**User Story:** As a player, I want a trouble change from an arriving guest to end the party immediately if it goes over the limit, so that no more guests arrive at a party that has already been shut down.

#### Acceptance Criteria

1. THE Game_Store SHALL check for a Bust (overflow first, then trouble) after every effect, including Interrupting_Effects
2. WHEN an Interrupting_Effect causes a Bust, THE Game_Store SHALL NOT run any Pending_Effect, including the remaining Auto_Invites of the interrupted effects, and any guest those Auto_Invites would have drawn SHALL remain in the deck

### Requirement 3: Relationship to the Overflow Spec

#### Acceptance Criteria

1. THIS spec SHALL supersede overflow Requirements 5.5, 6.1, 6.2 and 6.3
2. Overflow Requirement 6.4 (Pending_Effects do not run after a shutdown) SHALL continue to apply
