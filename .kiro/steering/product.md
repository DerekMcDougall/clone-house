# Product Overview

Clone House is a single-player deck-building party game, built as an installable Angular PWA. The player builds a deck of guests, throws a party each turn by inviting guests from the deck, and spends what the parties earn on new guests and a bigger house.

This file describes the game as it is now. Planned features go in `.kiro/scratchpad.md`, not here.

## Goal

Win by ending a party with 4 or more stars in it. If 25 turns pass without a win, the game ends.

## Turn Structure

Each turn has two phases.

1. **Buy**: spend popularity on guests from the shop (they go into the deck) and money on house expansions.
2. **Party**: invite guests one at a time from the top of the deck, then end the party, or bust.

When a party ends normally:

- with 4+ stars, the player wins immediately ("Congrats! You threw the ultimate party!") and nothing is scored
- otherwise the party is scored: each guest's popularity and money are added to the totals (and settled: see Resources), then each guest's scoring bonus is added and the totals are settled again. The party and discard pile are then shuffled back into the deck.

## Resources

- **Popularity**: earned from parties; buys guests. It can't go below 0.
- **Money**: earned from parties; buys house expansions. It can't go below 0. Each point it would drop below 0 costs 7 popularity instead.
- **Trouble**: counted only during a party. Exceeding the trouble limit (base 2) busts the party.
- **Peace**: counted only during a party. Each point raises the trouble limit by 1.
- **Stars**: counted only during a party. 4 at the end of a party wins.

Guests can grant negative popularity or money; those amounts are subtracted when the party is scored. Scoring bonuses come after the money penalty is applied, so bonus money can't cover a shortfall from the guests' normal money.

## The House

The house starts with room for 5 guests. Expansions add 1 space each, cost money (2, then 3, rising to a cap of 12), and up to 29 can be bought. The player can't invite into a full house, but effects can.

## Busting

A party busts as soon as either of these happens, and any effects still waiting are dropped:

- **Trouble**: trouble exceeds the trouble limit. The player picks one guest from the party to ban; that guest sits out the next party. Everyone else goes back to the deck.
- **Overflow**: the party has more guests than the house has room for. No guest is banned. Overflow takes priority if both happen at once.

A busted party scores nothing. On the final turn a bust just ends the game.

## Guests

Every guest has a type and a unique name. A type sets the guest's cost, popularity, money, trouble, peace and stars, and any effects. Guest cards show these values and an icon for each effect.

The starting deck has 4 Old Friends, 4 Wild Buddies and 2 Rich Pals. The shop stocks 4 of each type that's for sale, listed by cost.

### Effects

Most effects run when a guest enters the party; scoring bonuses run when the party is scored. A guest's effect runs before anything already in progress continues, so if a Celebrity invites a Climber, the Climber's effect happens before the Celebrity's second invite. Effects can change the guest itself; those changes stay with that guest for the rest of the game.

- **Auto-invite** (👤): invites the top guest of the deck, exactly as the player would, except it can overflow the house.
- **Climber** (➕): gains 1 popularity on each entrance, up to 9.
- **Werewolf** (🌙): switches between 0 and 1 trouble on each entrance. The switch happens before the trouble check.

Effects can also ask the player to choose (for example, to pick a guest), pausing the party until they do.

Scoring bonuses are worked out from the finished party, after its normal popularity and money:

- **Comedian** (🏠): 5 popularity if the house is full.
- **Mascot** (bold O): 1 popularity per Old Friend.
- **Introvert** (🏡): 1 popularity per empty space.
- **Bartender** (🍸): 2 money per trouble.
- **Writer** (bold gold X): 2 popularity per trouble.

Trouble here is the party's trouble before peace.

### Guest Types

| Type | Cost | Popularity | Money | Other |
|---|---|---|---|---|
| Old Friend | 2 | 1 | | |
| Wild Buddy | not sold | 2 | | 1 trouble |
| Rich Pal | 3 | | 1 | |
| Monkey | 3 | 4 | | 1 trouble |
| Ticket Taker | 4 | -1 | 2 | |
| Hippy | 4 | 1 | | 1 peace |
| Introvert | 4 | 1 | | bonus: 1 popularity per empty space |
| Caterer | 5 | 4 | -1 | |
| Comedian | 5 | | -1 | bonus: 5 popularity if the house is full |
| Mascot | 5 | 1 | | bonus: 1 popularity per Old Friend |
| Rock Star | 5 | 3 | 2 | 1 trouble |
| Mr. Popular | 5 | 3 | | auto-invites 1 |
| Werewolf | 5 | 4 | | 0 or 1 trouble, switches each entrance |
| Gangster | 6 | | 4 | 1 trouble |
| Gambler | 7 | 2 | 3 | 1 trouble |
| Cute Dog | 7 | 2 | | 1 peace |
| Writer | 8 | 1 | | bonus: 2 popularity per trouble |
| Auctioneer | 9 | | 3 | |
| Bartender | 11 | 1 | | bonus: 2 money per trouble |
| Celebrity | 11 | 2 | 3 | auto-invites 2 |
| Climber | 12 | 0, +1 each entrance (max 9) | | |
| Dinosaur | 25 | | | 1 star, 1 trouble |
| Dragon | 30 | | -3 | 1 star |
| Mermaid | 35 | | | 1 star, auto-invites 1 |
| Alien | 40 | | | 1 star |
| Unicorn | 45 | | | 1 star, 1 peace |
| Leprechaun | 50 | | 3 | 1 star |
| Superhero | 50 | 3 | | 1 star |

The source of truth is `src/app/models/built-in-guest-types.ts` (types) and `src/app/models/game-setup.ts` (starting deck, shop and names).
