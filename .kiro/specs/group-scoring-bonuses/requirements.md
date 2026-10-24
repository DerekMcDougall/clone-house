# Requirements Document

## Introduction

This feature adds group scoring bonuses: a bonus that belongs to a guest type rather than to each guest. When a party is scored, a type's group bonus is applied once if one or more of its guests are in the party, however many there are. The size of the bonus can depend on the size of the group.

The first type with a group bonus is the Dancer. Dancers grant nothing in normal scoring. Their group bonus is 1, 4, 9 or 16 popularity for 1, 2, 3 or 4 Dancers in the party.

Today this could be written as an ordinary scoring bonus, with each Dancer granting popularity equal to the number of Dancers. The difference matters for a planned feature: abilities that score a single guest early, an extra time. Scoring one Dancer early will apply the whole group bonus, while scoring one ordinary bonus guest early applies only that guest's bonus. This spec doesn't add early scoring, but it organizes scoring so that early scoring can reuse it.

Group bonuses use a new trigger, `groupScore`, with the existing `scoreBonus` action kind. That kind gains a lookup table, `amounts`, for bonuses that aren't a fixed amount per counted thing.

### Decisions

- **Group bonuses are their own step, after guests' own bonuses.** Scoring has three steps, each settled (totals floored at 0, 7 popularity per point of money below 0) before the next: normal amounts, then each guest's own bonus, then each type's group bonus. So group bonus money can't cover a shortfall from an earlier step, just as bonus money can't cover one from normal scoring.
- **The group is the guests of the same type in the party.** Each type with a group bonus gets its own, so two different group types in one party each pay once.
- **More Dancers than the table covers count as the last entry.** The default game stocks only 4 Dancers, so this matters only for custom game setups: 5 or more Dancers score 16.
- **No group bonus on a bust or a win**, the same as other bonuses.

## Glossary

- **Group_Bonus**: An effect with `trigger: 'groupScore'`. It's applied once per Scoring_Pass for each type that has guests being scored, however many guests of the type there are.
- **Group**: The guests in the party of the same type as the guest whose effect it is
- **Scoring_Pass**: Scoring a set of guests: today, the whole party when the player ends it normally. Within one pass, each type's Group_Bonus is applied at most once.
- **Dancer**: A new guest type with a Group_Bonus
- **Game_Store**: The NgRx SignalStore managing all game state

## Requirements

### Requirement 1: The groupScore Trigger

**User Story:** As a developer, I want effects that apply once per group of guests when a party is scored, so that a type's bonus can depend on the whole group without being paid once per guest.

#### Acceptance Criteria

1. THE `Trigger` type SHALL include `'groupScore'`, and its `triggerPhrase` SHALL be "once per group when scored"
2. THE `scoreBonus` kind SHALL allow both `'score'` and `'groupScore'`; no other built-in kind SHALL allow `'groupScore'`
3. THE Game_Store SHALL NOT run `groupScore` effects when a guest enters the party

### Requirement 2: Bonus Tables in scoreBonus

**User Story:** As a developer, I want a bonus to look up its amount by count, so that bonuses like the Dancer's 1, 4, 9, 16 can be written as data.

#### Acceptance Criteria

1. THE `scoreBonus` kind SHALL accept `amounts`, a non-empty list of integers, as an alternative to `amount`; exactly one of the two SHALL be given
2. WHEN `amounts` is given, THE bonus SHALL be `amounts[count − 1]` for a count of 1 or more, the last entry for a count beyond the list, and 0 for a count of 0
3. WHEN `amounts` is given without `per`, THE count SHALL be 1, so the bonus is `amounts[0]`
4. `when: 'houseFull'` SHALL apply to `amounts` as it does to `amount`
5. THE `scoreBonus` kind SHALL reject both or neither of `amount` and `amounts`, an empty `amounts`, and non-integer entries, with a path in each problem
6. A `scoreBonus` with `amount` SHALL behave exactly as before

### Requirement 3: Scoring Group Bonuses

**User Story:** As a player, I want a group of Dancers to pay out once, by group size, so that collecting Dancers is worth more the more I have.

#### Acceptance Criteria

1. WHEN the player ends a party without a win, THE Game_Store SHALL score the party as one Scoring_Pass in three steps, settling after each: the normal amounts, as today; then every guest's `score` effects, as today; then every type's `groupScore` effects
2. IN a Scoring_Pass, a type's `groupScore` effects SHALL run once, as the effects of the first guest of that type in party order, and not for later guests of the type; different types' group bonuses run in party order of their first guests
3. A `groupScore` effect SHALL be worked out from the whole party, like any other bonus, so a Dancer's group counts every Dancer in the party
4. WHEN a party busts or ends with a win, THE Game_Store SHALL NOT run any `groupScore` effects
5. Scoring for parties with no `groupScore` effects SHALL be unchanged
6. Scoring SHALL be organized so that a Scoring_Pass over a single guest can be added later, for early scoring, with the same steps: that guest's own bonuses, then its type's group bonus, each applied once

### Requirement 4: Dancer Guest Type

**User Story:** As a player, I want to buy Dancers, so that I can build a party around one big group bonus.

#### Acceptance Criteria

1. THE built-in guest types SHALL include `DANCER`, labeled "Dancer", costing 7 popularity, with 0 popularity, trouble, money, peace and stars
2. THE Dancer SHALL have one `groupScore` effect: `scoreBonus` for popularity with `amounts: [1, 4, 9, 16]`, counting Dancers in the party
3. THE Dancer's icon SHALL be 💃, labeled "1, 4, 9 or 16 popularity for 1–4 Dancers, once per group, when scored"
4. THE default game setup SHALL stock 4 Dancers in the shop, named Fred, Carlton, Elaine and Jennifer
5. THE starting deck SHALL contain no Dancers
6. THE Dancer's card SHALL show no popularity or money and the 💃 icon, in the shop and in the house
