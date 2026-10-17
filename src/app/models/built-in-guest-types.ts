import { autoInvite } from './guest-effects';
import { INVITE_ICON } from './guest-icons';
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
  | 'SUPERHERO';

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
    entranceEffect: (ctx, guest) => {
      ctx.updateGuest(guest, g => ({
        ...g,
        properties: {
          ...g.properties,
          popularityValue: Math.min(9, g.properties.popularityValue + 1)
        }
      }));
    },
    entranceIcons: [{ symbol: '➕', label: 'Gains 1 popularity on entrance' }]
  },
  {
    id: 'MR_POPULAR',
    label: 'Mr. Popular',
    cost: 5,
    properties: { popularityValue: 3, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    entranceEffect: (ctx) => {
      autoInvite(ctx);
    },
    entranceIcons: [INVITE_ICON]
  },
  {
    id: 'CELEBRITY',
    label: 'Celebrity',
    cost: 11,
    properties: { popularityValue: 2, troubleValue: 0, moneyValue: 3, peaceValue: 0, starValue: 0 },
    entranceEffect: (ctx) => {
      autoInvite(ctx);
      autoInvite(ctx);
    },
    entranceIcons: [INVITE_ICON, INVITE_ICON]
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
    entranceEffect: (ctx) => {
      autoInvite(ctx);
    },
    entranceIcons: [INVITE_ICON]
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
  }
];
