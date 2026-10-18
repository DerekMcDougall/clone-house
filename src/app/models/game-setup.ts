import type { GuestType } from './guest.model';
import { findGuestType } from './guest-type-registry';

// Which guests one game starts with: the starting deck, and the guests stocked in the shop.
// Guest types say what a guest is; a setup says which guests are in this game.
export interface GameSetup {
  startingDeck: readonly { type: GuestType; name: string }[];
  shop: readonly { type: GuestType; names: readonly string[] }[];
}

// The standard game: 4 Old Friends, 4 Wild Buddies and 2 Rich Pals to start, and 4 of
// every purchasable type in the shop.
export const DEFAULT_GAME_SETUP: GameSetup = {
  startingDeck: [
    { type: 'OLD_FRIEND', name: 'Brian' },
    { type: 'OLD_FRIEND', name: 'Colin' },
    { type: 'OLD_FRIEND', name: 'Emily' },
    { type: 'OLD_FRIEND', name: 'Rachelle' },
    { type: 'WILD_BUDDY', name: 'Anthony' },
    { type: 'WILD_BUDDY', name: 'Teresa' },
    { type: 'WILD_BUDDY', name: 'Jacco' },
    { type: 'WILD_BUDDY', name: 'Jodie' },
    { type: 'RICH_PAL', name: 'Khalil' },
    { type: 'RICH_PAL', name: 'Renata' }
  ],
  shop: [
    { type: 'OLD_FRIEND', names: ['Matt', 'Chad', 'Wes', 'Caleb'] },
    { type: 'RICH_PAL', names: ['Kevin', 'Arlene', 'Robert', 'Jim'] },
    { type: 'MONKEY', names: ['George', 'Punch', 'Darwin', 'Diddy'] },
    { type: 'AUCTIONEER', names: ['Christie', 'Sotheby', 'Phillip', 'Bonham'] },
    { type: 'GANGSTER', names: ['Tony', 'Legs', 'Louie', 'Johnny'] },
    { type: 'ROCK_STAR', names: ['Alanis', 'Gord', 'Neil', 'Randy'] },
    { type: 'GAMBLER', names: ['Kenny', 'Ace', 'Jack', 'Raymond'] },
    { type: 'CUTE_DOG', names: ['Oreo', 'Lily', 'Pearl', 'Ronnie'] },
    { type: 'HIPPY', names: ['Bob', 'Joni', 'Joan', 'Jerry'] },
    { type: 'CATERER', names: ['Ronald', 'Wendy', 'Mario', 'Tim'] },
    { type: 'TICKET_TAKER', names: ['Val', 'Grant', 'Mark', 'Stubby'] },
    { type: 'CLIMBER', names: ['Ascella', 'Skye', 'Icarus', 'Vela'] },
    { type: 'MR_POPULAR', names: ['Rowan', 'Oscar', 'Lawrence', 'McDougall'] },
    { type: 'CELEBRITY', names: ['Troy', 'Rainier', 'Pedro', 'Kent'] },
    { type: 'ALIEN', names: ['ET', 'Rocky', 'Olimar', 'Alf'] },
    { type: 'LEPRECHAUN', names: ['Lucky', 'Liam', 'Seamus', 'Patrick'] },
    { type: 'DRAGON', names: ['Smaug', 'Clay', 'Malathrax', 'Toothless'] },
    { type: 'DINOSAUR', names: ['Barney', 'Blue', 'Dino', 'Rex'] },
    { type: 'MERMAID', names: ['Ariel', 'Marina', 'Calypso', 'Oceana'] },
    { type: 'UNICORN', names: ['Sparkles', 'Glitter', 'Stardust', 'Moonbeam'] },
    { type: 'SUPERHERO', names: ['Superman', 'Spider-man', 'Batman', 'Iron Man'] },
    { type: 'WEREWOLF', names: ['Remus', 'Lawrence', 'Scott', 'Jacob'] }
  ]
};

// Throws on the first problem found. Every type must be registered, shop types must have
// a cost, and a type can be stocked in the shop only once.
export function validateGameSetup(setup: GameSetup): void {
  const fail = (problem: string): never => {
    throw new Error(`Invalid game setup: ${problem}`);
  };

  setup.startingDeck.forEach(({ type, name }, i) => {
    if (!findGuestType(type)) fail(`startingDeck[${i}] has unknown guest type "${type}"`);
    if (typeof name !== 'string' || name === '') fail(`startingDeck[${i}] needs a name`);
  });

  const stocked = new Set<GuestType>();
  setup.shop.forEach(({ type, names }, i) => {
    const def = findGuestType(type) ?? fail(`shop[${i}] has unknown guest type "${type}"`);
    if (def.cost === null) fail(`shop[${i}]: "${type}" is not for sale`);
    if (stocked.has(type)) fail(`shop[${i}]: "${type}" is stocked more than once`);
    stocked.add(type);
    if (names.some(name => typeof name !== 'string' || name === '')) fail(`shop[${i}] names must be non-empty`);
  });
}
