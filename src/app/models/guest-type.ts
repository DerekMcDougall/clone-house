import { findActionKind } from './action-kinds';
import type { EffectContext } from './effect-context';
import { EffectDefinition, TRIGGERS } from './effect-definition';
import type { Guest, GuestProperties } from './guest.model';

// The function behind a custom action. `guest` is the guest whose effect this is, as it was
// when the effect was enqueued; use ctx.updateGuest(guest, ...) to change it in the party.
export type EffectHandler = (ctx: EffectContext, guest: Guest) => void;

// What a guest of one type is. Which guests are in a game is up to the game setup
// (game-setup.ts), not the type.
export interface GuestTypeDefinition {
  id: string;
  label: string;
  // Popularity to buy one from the shop; null when the type is never sold.
  cost: number | null;
  properties: GuestProperties;
  // What guests of this type do, and when. Run, and shown on cards, in this order.
  effects?: readonly EffectDefinition[];
}

export const PROPERTY_KEYS: readonly (keyof GuestProperties)[] =
  ['popularityValue', 'troubleValue', 'moneyValue', 'peaceValue', 'starValue'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Every problem with a list of effects, each starting with its path (effects[1].action.count).
// With dataOnly, kinds that can't be written in JSON are rejected too.
export function effectProblems(effects: unknown, dataOnly = false): string[] {
  if (!Array.isArray(effects)) return ['effects: expected a list'];

  return effects.flatMap((effect: unknown, i): string[] => {
    const path = `effects[${i}]`;
    if (!isObject(effect)) return [`${path}: expected an object`];

    const problems = Object.keys(effect)
      .filter(key => key !== 'trigger' && key !== 'action')
      .map(key => `${path}.${key}: unknown field`);

    if (!TRIGGERS.includes(effect['trigger'] as never)) {
      problems.push(`${path}.trigger: expected one of ${TRIGGERS.join(', ')}`);
    }

    const action = effect['action'];
    if (!isObject(action)) return [...problems, `${path}.action: expected an object`];

    const kind = typeof action['kind'] === 'string' ? findActionKind(action['kind']) : undefined;
    if (!kind) return [...problems, `${path}.action.kind: unknown action kind ${JSON.stringify(action['kind'])}`];
    if (dataOnly && !kind.dataOnly) {
      return [...problems, `${path}.action.kind: "${kind.kind}" can't be defined in JSON`];
    }
    return [...problems, ...kind.validate(action, `${path}.action`)];
  });
}

// Throws on the first problem found, naming the type. Effect problems are reported together.
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

  if (def.effects !== undefined) {
    const problems = effectProblems(def.effects);
    if (problems.length > 0) fail(problems.join('; '));
  }
}
