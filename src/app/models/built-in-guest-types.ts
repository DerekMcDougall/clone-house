import type { GuestTypeDefinition } from './guest-type';

export type BuiltInGuestType =
  | 'OLD_FRIEND'
  | 'WILD_BUDDY'
  | 'RICH_PAL'
  | 'MONKEY'
  | 'AUCTIONEER'
  | 'GANGSTER'
  | 'ROCK_STAR'
  | 'GAMBLER'
  | 'CUTE_DOG'
  | 'HIPPY'
  | 'CATERER'
  | 'TICKET_TAKER'
  | 'CLIMBER'
  | 'MR_POPULAR'
  | 'CELEBRITY'
  | 'ALIEN'
  | 'LEPRECHAUN'
  | 'DRAGON'
  | 'DINOSAUR'
  | 'MERMAID'
  | 'UNICORN'
  | 'SUPERHERO'
  | 'WEREWOLF'
  | 'COMEDIAN'
  | 'MASCOT'
  | 'INTROVERT'
  | 'BARTENDER'
  | 'WRITER'
  | 'DANCER';

// The game's own guest types, in registration order. Which of them are in a game is up to
// the game setup; see game-setup.ts.
export const BUILT_IN_GUEST_TYPES: readonly GuestTypeDefinition[] = [
  {
    id: 'OLD_FRIEND',
    label: 'Old Friend',
    cost: 2,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'WILD_BUDDY',
    label: 'Wild Buddy',
    cost: null,
    properties: { popularityValue: 2, troubleValue: 1, moneyValue: 0, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'RICH_PAL',
    label: 'Rich Pal',
    cost: 3,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 1, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'MONKEY',
    label: 'Monkey',
    cost: 3,
    properties: { popularityValue: 4, troubleValue: 1, moneyValue: 0, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'AUCTIONEER',
    label: 'Auctioneer',
    cost: 9,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 3, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'GANGSTER',
    label: 'Gangster',
    cost: 6,
    properties: { popularityValue: 0, troubleValue: 1, moneyValue: 4, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'ROCK_STAR',
    label: 'Rock Star',
    cost: 5,
    properties: { popularityValue: 3, troubleValue: 1, moneyValue: 2, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'GAMBLER',
    label: 'Gambler',
    cost: 7,
    properties: { popularityValue: 2, troubleValue: 1, moneyValue: 3, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'CUTE_DOG',
    label: 'Cute Dog',
    cost: 7,
    properties: { popularityValue: 2, troubleValue: 0, moneyValue: 0, peaceValue: 1, starValue: 0 }
  },
  {
    id: 'HIPPY',
    label: 'Hippy',
    cost: 4,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 1, starValue: 0 }
  },
  {
    id: 'CATERER',
    label: 'Caterer',
    cost: 5,
    properties: { popularityValue: 4, troubleValue: 0, moneyValue: -1, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'TICKET_TAKER',
    label: 'Ticket Taker',
    cost: 4,
    properties: { popularityValue: -1, troubleValue: 0, moneyValue: 2, peaceValue: 0, starValue: 0 }
  },
  {
    id: 'CLIMBER',
    label: 'Climber',
    cost: 12,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [
      { trigger: 'entrance', action: { kind: 'adjustSelf', property: 'popularityValue', delta: 1, max: 9 } }
    ]
  },
  {
    id: 'MR_POPULAR',
    label: 'Mr. Popular',
    cost: 5,
    properties: { popularityValue: 3, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{ trigger: 'entrance', action: { kind: 'autoInvite', count: 1 } }]
  },
  {
    id: 'CELEBRITY',
    label: 'Celebrity',
    cost: 11,
    properties: { popularityValue: 2, troubleValue: 0, moneyValue: 3, peaceValue: 0, starValue: 0 },
    effects: [{ trigger: 'entrance', action: { kind: 'autoInvite', count: 2 } }]
  },
  {
    id: 'ALIEN',
    label: 'Alien',
    cost: 40,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 1 }
  },
  {
    id: 'LEPRECHAUN',
    label: 'Leprechaun',
    cost: 50,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 3, peaceValue: 0, starValue: 1 }
  },
  {
    id: 'DRAGON',
    label: 'Dragon',
    cost: 30,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: -3, peaceValue: 0, starValue: 1 }
  },
  {
    id: 'DINOSAUR',
    label: 'Dinosaur',
    cost: 25,
    properties: { popularityValue: 0, troubleValue: 1, moneyValue: 0, peaceValue: 0, starValue: 1 }
  },
  {
    id: 'MERMAID',
    label: 'Mermaid',
    cost: 35,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 1 },
    effects: [{ trigger: 'entrance', action: { kind: 'autoInvite', count: 1 } }]
  },
  {
    id: 'UNICORN',
    label: 'Unicorn',
    cost: 45,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 1, starValue: 1 }
  },
  {
    id: 'SUPERHERO',
    label: 'Superhero',
    cost: 50,
    properties: { popularityValue: 3, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 1 }
  },
  {
    id: 'WEREWOLF',
    label: 'Werewolf',
    cost: 5,
    properties: { popularityValue: 4, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'entrance',
      action: {
        kind: 'cycleSelf',
        property: 'troubleValue',
        values: [0, 1],
        icons: [{ symbol: '🌙', label: 'Switches between 0 and 1 trouble on entrance' }]
      }
    }]
  },
  {
    id: 'COMEDIAN',
    label: 'Comedian',
    cost: 5,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: -1, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'score',
      action: {
        kind: 'scoreBonus',
        resource: 'popularity',
        amount: 5,
        when: 'houseFull',
        icons: [{ symbol: '🏘️', label: '5 popularity when scored if the house is full' }]
      }
    }]
  },
  {
    id: 'MASCOT',
    label: 'Mascot',
    cost: 5,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'score',
      action: {
        kind: 'scoreBonus',
        resource: 'popularity',
        amount: 1,
        per: 'guestOfType',
        guestType: 'OLD_FRIEND',
        icons: [{ symbol: 'O', label: '1 popularity per Old Friend when scored', bold: true }]
      }
    }]
  },
  {
    id: 'INTROVERT',
    label: 'Introvert',
    cost: 4,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'score',
      action: {
        kind: 'scoreBonus',
        resource: 'popularity',
        amount: 1,
        per: 'emptySpace',
        icons: [{ symbol: '🛖', label: '1 popularity per empty space when scored' }]
      }
    }]
  },
  {
    id: 'BARTENDER',
    label: 'Bartender',
    cost: 11,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'score',
      action: {
        kind: 'scoreBonus',
        resource: 'money',
        amount: 2,
        per: 'trouble',
        icons: [{ symbol: '🍸', label: '2 money per trouble when scored' }]
      }
    }]
  },
  {
    id: 'WRITER',
    label: 'Writer',
    cost: 8,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'score',
      action: {
        kind: 'scoreBonus',
        resource: 'popularity',
        amount: 2,
        per: 'trouble',
        icons: [{ symbol: 'X', label: '2 popularity per trouble when scored', color: '#f9a825', bold: true }]
      }
    }]
  },
  {
    id: 'DANCER',
    label: 'Dancer',
    cost: 7,
    properties: { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    effects: [{
      trigger: 'groupScore',
      action: {
        kind: 'scoreBonus',
        resource: 'popularity',
        amounts: [1, 4, 9, 16],
        per: 'guestOfType',
        guestType: 'DANCER',
        icons: [{ symbol: '💃', label: '1, 4, 9 or 16 popularity for 1–4 Dancers, once per group, when scored' }]
      }
    }]
  }
];
