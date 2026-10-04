import { EffectContext, GameEffect } from './effect-context';

export type { EffectContext, GameEffect };

export type GuestType = 'OLD_FRIEND' | 'WILD_BUDDY' | 'RICH_PAL' | 'MONKEY'
  | 'AUCTIONEER' | 'GANGSTER' | 'ROCK_STAR' | 'GAMBLER'
  | 'CUTE_DOG' | 'HIPPY'
  | 'CATERER' | 'TICKET_TAKER'
  | 'CLIMBER'
  | 'MR_POPULAR' | 'CELEBRITY';

export interface GuestProperties {
  popularityValue: number;
  troubleValue: number;
  moneyValue: number;
  peaceValue: number;
}

export interface Guest {
  type: GuestType;
  name: string;
  properties: GuestProperties;
}

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
  CELEBRITY: 'Celebrity'
};

export const GUEST_TYPE_DEFAULTS: Record<GuestType, GuestProperties> = {
  OLD_FRIEND: {
    popularityValue: 1,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0
  },
  WILD_BUDDY: {
    popularityValue: 2,
    troubleValue: 1,
    moneyValue: 0,
    peaceValue: 0
  },
  RICH_PAL: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 1,
    peaceValue: 0
  },
  MONKEY: {
    popularityValue: 4,
    troubleValue: 1,
    moneyValue: 0,
    peaceValue: 0
  },
  AUCTIONEER: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 3,
    peaceValue: 0
  },
  GANGSTER: {
    popularityValue: 0,
    troubleValue: 1,
    moneyValue: 4,
    peaceValue: 0
  },
  ROCK_STAR: {
    popularityValue: 3,
    troubleValue: 1,
    moneyValue: 2,
    peaceValue: 0
  },
  GAMBLER: {
    popularityValue: 2,
    troubleValue: 1,
    moneyValue: 3,
    peaceValue: 0
  },
  CUTE_DOG: {
    popularityValue: 2,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 1
  },
  HIPPY: {
    popularityValue: 1,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 1
  },
  CATERER: {
    popularityValue: 4,
    troubleValue: 0,
    moneyValue: -1,
    peaceValue: 0
  },
  TICKET_TAKER: {
    popularityValue: -1,
    troubleValue: 0,
    moneyValue: 2,
    peaceValue: 0
  },
  CLIMBER: {
    popularityValue: 0,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0
  },
  MR_POPULAR: {
    popularityValue: 3,
    troubleValue: 0,
    moneyValue: 0,
    peaceValue: 0
  },
  CELEBRITY: {
    popularityValue: 2,
    troubleValue: 0,
    moneyValue: 3,
    peaceValue: 0
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
  CELEBRITY: 11
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
  }
};

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
