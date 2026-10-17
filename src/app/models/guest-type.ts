import type { EffectContext } from './effect-context';
import type { Guest, GuestProperties } from './guest.model';
import type { GuestIcon } from './guest-icons';

// Runs when a guest joins the party. `guest` is the guest as admitted; use
// ctx.updateGuest(guest, ...) to change it in the party.
export type EffectHandler = (ctx: EffectContext, guest: Guest) => void;

// What a guest of one type is. Which guests are in a game is up to the game setup
// (game-setup.ts), not the type.
export interface GuestTypeDefinition {
  id: string;
  label: string;
  // Popularity to buy one from the shop; null when the type is never sold.
  cost: number | null;
  properties: GuestProperties;
  // Runs when a guest of this type joins the party. Requires entranceIcons.
  entranceEffect?: EffectHandler;
  entranceIcons?: readonly GuestIcon[];
}

const PROPERTY_KEYS: readonly (keyof GuestProperties)[] =
  ['popularityValue', 'troubleValue', 'moneyValue', 'peaceValue', 'starValue'];

// Throws on the first problem found, naming the type.
export function validateGuestType(def: GuestTypeDefinition): void {
  const fail = (problem: string): never => {
    throw new Error(`Invalid guest type "${def.id}": ${problem}`);
  };

  if (typeof def.id !== 'string' || def.id === '') fail('id must be a non-empty string');
  if (typeof def.label !== 'string' || def.label === '') fail('label must be a non-empty string');

  if (def.cost !== null && !(Number.isInteger(def.cost) && def.cost >= 0)) {
    fail('cost must be null or a non-negative integer');
  }

  for (const key of PROPERTY_KEYS) {
    if (!Number.isInteger(def.properties?.[key])) fail(`properties.${key} must be an integer`);
  }

  const hasIcons = (def.entranceIcons?.length ?? 0) > 0;
  if (def.entranceEffect && !hasIcons) fail('entranceEffect needs entranceIcons');
  if (hasIcons && !def.entranceEffect) fail('entranceIcons need an entranceEffect');
}
