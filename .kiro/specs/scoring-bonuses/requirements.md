# Requirements Document

## Introduction

This feature adds scoring bonuses: guests that earn extra popularity or money when a party is scored, depending on what's in the house. After the party's normal popularity and money are added up, scoring goes through each guest in the party and adds any bonus that guest has.

Bonuses are a new kind of effect with a new trigger, `score`, so the five new guest types are defined as data like the others, and JSON-defined types can have bonuses too. A party is scored only when it ends normally without a win, so bonuses never apply to a bust or a winning party.

Two of the new icons aren't emoji (a bold "O" and a yellow X), so card icons gain optional color and bold settings.

### Decisions

- **Normal scoring comes first, then bonuses.** The party's normal popularity and money are settled exactly as today: totals kept at 0 or above, and any money shortfall costing 7 popularity per point. Bonuses are then added to the settled totals, which are settled the same way again. So a Bartender's bonus money can't cover a Comedian's -1 money: if that -1 takes money below 0, the penalty applies before the Bartender pays out.
- **"Trouble in the house" is the party's trouble before peace.** It's the same count as the trouble shown during the party. Peace raises the trouble limit but doesn't remove trouble.
- **Icons**: Comedian 🏠 (red roof), Introvert 🏡 (green garden), Mascot a bold "O", Writer a bold "X" in gold, Bartender 🍸. There's no yellow X emoji, so the Writer's X is text.
- **No score breakdown is shown.** The totals go up by the bonus, as they do for normal scoring. Showing where each point came from is left for later.

## Glossary

- **Scoring**: Adding the party's popularity and money to the player's totals when the player ends a party without busting or winning
- **Scoring_Bonus**: An effect with `trigger: 'score'` that adds popularity or money at Scoring
- **scoreBonus**: A new action kind: adds `amount` of `resource`, multiplied by a count of something in the house, optionally only when a condition holds
- **Empty_Space**: A space in the house with no guest in it: house capacity minus party size
- **House_Full**: The party has as many guests as the house has space
- **Party_Trouble**: The sum of the trouble of every guest in the party
- **Game_Store**: The NgRx SignalStore managing all game state

## Requirements

### Requirement 1: The score Trigger

**User Story:** As a developer, I want effects that run when a party is scored, so that guests can earn bonuses from what's in the house.

#### Acceptance Criteria

1. THE `Trigger` type SHALL include `'score'`, and its `triggerPhrase` SHALL be "when scored"
2. AN Action_Kind SHALL list the triggers it can be used with; existing kinds SHALL allow only `'entrance'`, and `scoreBonus` SHALL allow only `'score'`
3. WHEN an effect's action kind doesn't allow the effect's trigger, THE Guest_Type_Registry SHALL reject the definition, including for actions nested inside another action (such as `chooseGuest`'s action)
4. THE Game_Store SHALL NOT run `score` effects when a guest enters the party

### Requirement 2: The scoreBonus Action Kind

**User Story:** As a developer, I want one action kind that covers flat, per-count and conditional bonuses, so that bonus guests can be defined as data.

#### Acceptance Criteria

1. THE Action_Kind_Registry SHALL include `scoreBonus` with parameters:
   - `resource`: `'popularity'` or `'money'`
   - `amount`: a non-zero integer
   - `per` (optional): `'emptySpace'`, `'trouble'` or `'guestOfType'`
   - `guestType`: a non-empty string, required when `per` is `'guestOfType'` and not allowed otherwise
   - `when` (optional): `'houseFull'`
   - `icons`: a non-empty list of icons
2. WHEN `scoreBonus` runs, THE Action_Kind SHALL add `amount × count` of `resource`, where count is:
   - the number of Empty_Spaces, for `per: 'emptySpace'`
   - the Party_Trouble, for `per: 'trouble'`
   - the number of party guests of type `guestType`, for `per: 'guestOfType'`
   - 1, when `per` is not given
3. WHEN `when` is `'houseFull'` AND the house is not full, THE Action_Kind SHALL add nothing
4. THE `scoreBonus` kind SHALL show its `icons`, and SHALL be data-only, so JSON-defined guest types can use it
5. THE `scoreBonus` kind SHALL reject each invalid parameter and unknown parameters, with a path in each problem

### Requirement 3: Scoring With Bonuses

**User Story:** As a player, I want bonus guests to pay out when my party ends, so that how I fill the house matters.

#### Acceptance Criteria

1. WHEN the player ends a party without a win, THE Game_Store SHALL first settle the party's normal popularity and money exactly as today: add them to the totals, keep popularity and money at 0 or above, and apply the money shortfall penalty (7 popularity per point of money below 0)
2. AFTER normal scoring, THE Game_Store SHALL run every `score` effect of every party guest, in party order and in each type's effect order, adding each bonus to the settled totals, then settle the result the same way (floor at 0, money shortfall penalty)
3. EVERY bonus SHALL be worked out from the party as it was when the party ended; one bonus SHALL NOT change another, and bonus money SHALL NOT offset a shortfall from normal scoring
4. WHEN a party busts or ends with a win, THE Game_Store SHALL NOT run any `score` effects
5. Scoring for parties with no `score` effects SHALL be unchanged

### Requirement 4: Bonus Guest Types

**User Story:** As a player, I want to buy guests with scoring bonuses, so that I have new ways to build a party.

#### Acceptance Criteria

1. THE built-in guest types SHALL include these, each with one `score` effect and no trouble, peace or stars:

   | Id | Label | Cost | Popularity | Money | Bonus | Icon |
   |---|---|---|---|---|---|---|
   | `COMEDIAN` | Comedian | 5 | 0 | -1 | 5 popularity when the house is full | 🏠 |
   | `MASCOT` | Mascot | 5 | 1 | 0 | 1 popularity per Old Friend | bold "O" |
   | `INTROVERT` | Introvert | 4 | 1 | 0 | 1 popularity per Empty_Space | 🏡 |
   | `BARTENDER` | Bartender | 11 | 1 | 0 | 2 money per Party_Trouble | 🍸 |
   | `WRITER` | Writer | 8 | 1 | 0 | 2 popularity per Party_Trouble | bold gold "X" |

2. Each icon's label SHALL describe the bonus, for example "5 popularity when scored if the house is full" or "1 popularity per Old Friend when scored"
3. THE default game setup SHALL stock 4 of each in the shop:
   - Comedian: Jerry, Nate, Bill, Norm
   - Mascot: Sparty, Gritty, Goofball, Benny
   - Introvert: Sheldon, Leonard, Raj, Howard
   - Bartender: Sam, Woody, Diane, Carla
   - Writer: Franklin, Carolyn, Laura, Erin
4. THE starting deck SHALL contain none of them

### Requirement 5: Styled Card Icons

**User Story:** As a player, I want the Mascot's and Writer's icons to look like their descriptions, so that I can tell them apart at a glance.

#### Acceptance Criteria

1. A Guest_Icon SHALL accept optional `color` (a CSS color string) and `bold` (a boolean)
2. THE guest card SHALL show an icon with `color` in that color and an icon with `bold: true` in bold
3. Icons without `color` or `bold` SHALL look as they do today
4. Validation of given icons SHALL reject a `color` that isn't a string and a `bold` that isn't a boolean, including in JSON-defined types
5. A bonus guest's icons SHALL appear on its card in the shop and in the house, to the left of any peace, trouble or star icons, like other effect icons
