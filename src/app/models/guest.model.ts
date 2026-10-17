import { EffectContext, GameEffect } from './effect-context';

export type { EffectContext, GameEffect };

export type GuestType = 'OLD_FRIEND' | 'WILD_BUDDY' | 'RICH_PAL' | 'MONKEY'
  | 'AUCTIONEER' | 'GANGSTER' | 'ROCK_STAR' | 'GAMBLER'
  | 'CUTE_DOG' | 'HIPPY'
  | 'CATERER' | 'TICKET_TAKER'
  | 'CLIMBER'
  | 'MR_POPULAR' | 'CELEBRITY'
  | 'ALIEN' | 'LEPRECHAUN' | 'DRAGON' | 'DINOSAUR' | 'MERMAID' | 'UNICORN' | 'SUPERHERO';

export interface GuestProperties {
  popularityValue: number;
  troubleValue: number;
  moneyValue: number;
  peaceValue: number;
  starValue: number;
}

export interface Guest {
  id: string;
  type: GuestType;
  name: string;
  properties: GuestProperties;
}

// Stars needed in a single party, at its normal end, to win the game.
export const WINNING_STAR_COUNT = 4;

export const GUEST_TYPE_LABELS: Record<GuestType, string> = {
  OLD_FRIEND: 'Old Friend',
  WILD_BUDDY: 'Wild Buddy',
  RICH_PAL: 'Rich Pal',
  MONKEY: 'Monkey',
  AUCTIONEER: 'Auctioneer',
  GANGSTER: 'Gangster',
  ROCK_STAR: 'Rock Star',
  GAMBLER: 'Gambler',
  CUTE_DOG: 'Cute Dog',
  HIPPY: 'Hippy',
  CATERER: 'Caterer',
  TICKET_TAKER: 'Ticket Taker',
  CLIMBER: 'Climber',
  MR_POPULAR: 'Mr. Popular',
  CELEBRITY: 'Celebrity',
  ALIEN: 'Alien',
  LEPRECHAUN: 'Leprechaun',
  DRAGON: 'Dragon',
  DINOSAUR: 'Dinosaur',
  MERMAID: 'Mermaid',
  UNICORN: 'Unicorn',
  SUPERHERO: 'Superhero'
};

export const GUEST_TYPE_DEFAULTS: Record<GuestType, GuestProperties> = {
  OLD_FRIEND: {
    popularityValue: 1,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 0
  },
  WILD_BUDDY: {
    popularityValue: 2,
    troubleValue: 1,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 0
  },
  RICH_PAL: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 1,
    peaceValue: 0,
    starValue: 0
  },
  MONKEY: {
    popularityValue: 4,
    troubleValue: 1,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 0
  },
  AUCTIONEER: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 3,
    peaceValue: 0,
    starValue: 0
  },
  GANGSTER: {
    popularityValue: 0,
    troubleValue: 1,
    moneyValue: 4,
    peaceValue: 0,
    starValue: 0
  },
  ROCK_STAR: {
    popularityValue: 3,
    troubleValue: 1,
    moneyValue: 2,
    peaceValue: 0,
    starValue: 0
  },
  GAMBLER: {
    popularityValue: 2,
    troubleValue: 1,
    moneyValue: 3,
    peaceValue: 0,
    starValue: 0
  },
  CUTE_DOG: {
    popularityValue: 2,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 1,
    starValue: 0
  },
  HIPPY: {
    popularityValue: 1,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 1,
    starValue: 0
  },
  CATERER: {
    popularityValue: 4,
    troubleValue: 0,
    moneyValue: -1,
    peaceValue: 0,
    starValue: 0
  },
  TICKET_TAKER: {
    popularityValue: -1,
    troubleValue: 0,
    moneyValue: 2,
    peaceValue: 0,
    starValue: 0
  },
  CLIMBER: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 0
  },
  MR_POPULAR: {
    popularityValue: 3,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 0
  },
  CELEBRITY: {
    popularityValue: 2,
    troubleValue: 0,
    moneyValue: 3,
    peaceValue: 0,
    starValue: 0
  },
  ALIEN: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 1
  },
  LEPRECHAUN: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 3,
    peaceValue: 0,
    starValue: 1
  },
  DRAGON: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: -3,
    peaceValue: 0,
    starValue: 1
  },
  DINOSAUR: {
    popularityValue: 0,
    troubleValue: 1,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 1
  },
  MERMAID: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 1
  },
  UNICORN: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 1,
    starValue: 1
  },
  SUPERHERO: {
    popularityValue: 3,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0,
    starValue: 1
  }
};

export const GUEST_TYPE_COSTS: Record<GuestType, number | null> = {
  OLD_FRIEND: 2,
  WILD_BUDDY: null,
  RICH_PAL: 3,
  MONKEY: 3,
  AUCTIONEER: 9,
  GANGSTER: 6,
  ROCK_STAR: 5,
  GAMBLER: 7,
  CUTE_DOG: 7,
  HIPPY: 4,
  CATERER: 5,
  TICKET_TAKER: 4,
  CLIMBER: 12,
  MR_POPULAR: 5,
  CELEBRITY: 11,
  ALIEN: 40,
  LEPRECHAUN: 50,
  DRAGON: 30,
  DINOSAUR: 25,
  MERMAID: 35,
  UNICORN: 45,
  SUPERHERO: 50
};

export const SHOP_GUESTS: readonly { type: GuestType; name: string }[] = [
  { type: 'OLD_FRIEND', name: 'Matt' },
  { type: 'OLD_FRIEND', name: 'Chad' },
  { type: 'OLD_FRIEND', name: 'Wes' },
  { type: 'OLD_FRIEND', name: 'Caleb' },
  { type: 'RICH_PAL', name: 'Kevin' },
  { type: 'RICH_PAL', name: 'Arlene' },
  { type: 'RICH_PAL', name: 'Robert' },
  { type: 'RICH_PAL', name: 'Jim' },
  { type: 'MONKEY', name: 'George' },
  { type: 'MONKEY', name: 'Punch' },
  { type: 'MONKEY', name: 'Darwin' },
  { type: 'MONKEY', name: 'Diddy' },
  { type: 'AUCTIONEER', name: 'Christie' },
  { type: 'AUCTIONEER', name: 'Sotheby' },
  { type: 'AUCTIONEER', name: 'Phillip' },
  { type: 'AUCTIONEER', name: 'Bonham' },
  { type: 'GANGSTER', name: 'Tony' },
  { type: 'GANGSTER', name: 'Legs' },
  { type: 'GANGSTER', name: 'Louie' },
  { type: 'GANGSTER', name: 'Johnny' },
  { type: 'ROCK_STAR', name: 'Alanis' },
  { type: 'ROCK_STAR', name: 'Gord' },
  { type: 'ROCK_STAR', name: 'Neil' },
  { type: 'ROCK_STAR', name: 'Randy' },
  { type: 'GAMBLER', name: 'Kenny' },
  { type: 'GAMBLER', name: 'Ace' },
  { type: 'GAMBLER', name: 'Jack' },
  { type: 'GAMBLER', name: 'Raymond' },
  { type: 'CUTE_DOG', name: 'Oreo' },
  { type: 'CUTE_DOG', name: 'Lily' },
  { type: 'CUTE_DOG', name: 'Pearl' },
  { type: 'CUTE_DOG', name: 'Ronnie' },
  { type: 'HIPPY', name: 'Bob' },
  { type: 'HIPPY', name: 'Joni' },
  { type: 'HIPPY', name: 'Joan' },
  { type: 'HIPPY', name: 'Jerry' },
  { type: 'CATERER', name: 'Ronald' },
  { type: 'CATERER', name: 'Wendy' },
  { type: 'CATERER', name: 'Mario' },
  { type: 'CATERER', name: 'Tim' },
  { type: 'TICKET_TAKER', name: 'Val' },
  { type: 'TICKET_TAKER', name: 'Grant' },
  { type: 'TICKET_TAKER', name: 'Mark' },
  { type: 'TICKET_TAKER', name: 'Stubby' },
  { type: 'CLIMBER', name: 'Ascella' },
  { type: 'CLIMBER', name: 'Skye' },
  { type: 'CLIMBER', name: 'Icarus' },
  { type: 'CLIMBER', name: 'Vela' },
  { type: 'MR_POPULAR', name: 'Rowan' },
  { type: 'MR_POPULAR', name: 'Oscar' },
  { type: 'MR_POPULAR', name: 'Lawrence' },
  { type: 'MR_POPULAR', name: 'McDougall' },
  { type: 'CELEBRITY', name: 'Troy' },
  { type: 'CELEBRITY', name: 'Rainier' },
  { type: 'CELEBRITY', name: 'Pedro' },
  { type: 'CELEBRITY', name: 'Kent' },
  { type: 'ALIEN', name: 'ET' },
  { type: 'ALIEN', name: 'Rocky' },
  { type: 'ALIEN', name: 'Olimar' },
  { type: 'ALIEN', name: 'Alf' },
  { type: 'LEPRECHAUN', name: 'Lucky' },
  { type: 'LEPRECHAUN', name: 'Liam' },
  { type: 'LEPRECHAUN', name: 'Seamus' },
  { type: 'LEPRECHAUN', name: 'Patrick' },
  { type: 'DRAGON', name: 'Smaug' },
  { type: 'DRAGON', name: 'Clay' },
  { type: 'DRAGON', name: 'Malathrax' },
  { type: 'DRAGON', name: 'Toothless' },
  { type: 'DINOSAUR', name: 'Barney' },
  { type: 'DINOSAUR', name: 'Blue' },
  { type: 'DINOSAUR', name: 'Dino' },
  { type: 'DINOSAUR', name: 'Rex' },
  { type: 'MERMAID', name: 'Ariel' },
  { type: 'MERMAID', name: 'Marina' },
  { type: 'MERMAID', name: 'Calypso' },
  { type: 'MERMAID', name: 'Oceana' },
  { type: 'UNICORN', name: 'Sparkles' },
  { type: 'UNICORN', name: 'Glitter' },
  { type: 'UNICORN', name: 'Stardust' },
  { type: 'UNICORN', name: 'Moonbeam' },
  { type: 'SUPERHERO', name: 'Superman' },
  { type: 'SUPERHERO', name: 'Spider-man' },
  { type: 'SUPERHERO', name: 'Batman' },
  { type: 'SUPERHERO', name: 'Iron Man' },
];

export const INITIAL_GUESTS: readonly { type: GuestType; name: string }[] = [
  { type: 'OLD_FRIEND' as const, name: 'Brian' },
  { type: 'OLD_FRIEND' as const, name: 'Colin' },
  { type: 'OLD_FRIEND' as const, name: 'Emily' },
  { type: 'OLD_FRIEND' as const, name: 'Rachelle' },
  { type: 'WILD_BUDDY' as const, name: 'Anthony' },
  { type: 'WILD_BUDDY' as const, name: 'Teresa' },
  { type: 'WILD_BUDDY' as const, name: 'Jacco' },
  { type: 'WILD_BUDDY' as const, name: 'Jodie' },
  { type: 'RICH_PAL' as const, name: 'Khalil' },
  { type: 'RICH_PAL' as const, name: 'Renata' }
];

export type GuestIdSource = () => string;

// Yields g1, g2, g3, ... A game uses one source so every guest's id is unique.
export function createGuestIdSource(): GuestIdSource {
  let next = 1;
  return () => `g${next++}`;
}

export function createGuest(type: GuestType, name: string, nextId: GuestIdSource): Guest {
  return { id: nextId(), type, name, properties: { ...GUEST_TYPE_DEFAULTS[type] } };
}

// Runs when a guest joins the party. `guest` is the guest as admitted; use
// ctx.updateGuest(guest, ...) to change it in the party.
export type EffectHandler = (ctx: EffectContext, guest: Guest) => void;

export const GUEST_TYPE_ENTRANCE_EFFECTS: Partial<Record<GuestType, EffectHandler>> = {
  CLIMBER: (ctx, guest) => {
    ctx.updateGuest(guest, g => ({
      ...g,
      properties: {
        ...g.properties,
        popularityValue: Math.min(9, g.properties.popularityValue + 1)
      }
    }));
  },
  MR_POPULAR: (ctx) => {
    autoInvite(ctx);
  },
  CELEBRITY: (ctx) => {
    autoInvite(ctx);
    autoInvite(ctx);
  },
  MERMAID: (ctx) => {
    autoInvite(ctx);
  }
};

// A symbol shown in the top right corner of a guest card.
export interface GuestIcon {
  symbol: string;
  label: string;
}

// What a guest card shows: popularity and money are null when zero, icons run left to right.
export interface GuestDetails {
  popularity: number | null;
  money: number | null;
  icons: GuestIcon[];
}

const INVITE_ICON: GuestIcon = { symbol: '👤', label: 'Invites a guest on entrance' };
const PEACE_ICON: GuestIcon = { symbol: '☮️', label: 'Peace' };
const TROUBLE_ICON: GuestIcon = { symbol: '❌', label: 'Trouble' };
const STAR_ICON: GuestIcon = { symbol: '⭐', label: 'Star' };

// Icons for each type's entrance effect, left to right. Every type in
// GUEST_TYPE_ENTRANCE_EFFECTS needs an entry here.
export const GUEST_TYPE_ENTRANCE_ICONS: Partial<Record<GuestType, readonly GuestIcon[]>> = {
  CLIMBER: [{ symbol: '➕', label: 'Gains 1 popularity on entrance' }],
  MR_POPULAR: [INVITE_ICON],
  CELEBRITY: [INVITE_ICON, INVITE_ICON],
  MERMAID: [INVITE_ICON]
};

// Works out what a card shows for a guest of the given type with the given properties.
// Icons: entrance effects, then one per point of peace, trouble and star, in that order.
export function getGuestDetails(type: GuestType, properties: GuestProperties): GuestDetails {
  const repeat = (icon: GuestIcon, count: number): GuestIcon[] =>
    Array.from({ length: Math.max(0, count) }, () => icon);

  return {
    popularity: properties.popularityValue === 0 ? null : properties.popularityValue,
    money: properties.moneyValue === 0 ? null : properties.moneyValue,
    icons: [
      ...(GUEST_TYPE_ENTRANCE_ICONS[type] ?? []),
      ...repeat(PEACE_ICON, properties.peaceValue),
      ...repeat(TROUBLE_ICON, properties.troubleValue),
      ...repeat(STAR_ICON, properties.starValue)
    ]
  };
}

// Formats money with a dollar sign, putting any minus sign first: 3 -> "$3", -3 -> "-$3".
export function formatMoney(value: number): string {
  return value < 0 ? `-$${-value}` : `$${value}`;
}

// Adds a guest to the party, then enqueues its entrance effect (if any).
export function admitGuest(guest: Guest): GameEffect {
  return (ctx) => {
    ctx.setParty([...ctx.getParty(), guest]);

    const entranceEffect = GUEST_TYPE_ENTRANCE_EFFECTS[guest.type];
    if (entranceEffect) {
      ctx.enqueue((c) => entranceEffect(c, guest));
    }
  };
}

// Enqueues an effect that draws the top guest from the deck and admits it to the party.
// The draw happens when the effect runs, not when it is enqueued, so if a bust discards
// the queue first, the guest is never drawn and stays in the deck.
export function autoInvite(ctx: EffectContext): void {
  ctx.enqueue((c) => {
    const [guest, ...remainingDeck] = c.getDeck();
    if (!guest) return;

    c.setDeck(remainingDeck);
    admitGuest(guest)(c);
  });
}
