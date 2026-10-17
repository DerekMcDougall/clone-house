import type { EffectContext } from './effect-context';
import { EffectDefinition, Trigger, triggerPhrase } from './effect-definition';
import { autoInvite } from './guest-effects';
import type { GuestIcon } from './guest-icons';
import type { EffectHandler } from './guest-type';
import type { Guest, GuestProperties } from './guest.model';

// The code behind one kind of action. Guest types choose a kind and give its parameters
// as data (an ActionDefinition); the kind validates them, runs them and supplies icons.
export interface ActionKind<P = Record<string, unknown>> {
  kind: string;
  // False for kinds whose parameters can't be written in JSON, such as custom.
  dataOnly: boolean;
  // Returns every problem with the parameters, each starting with `path`; empty when valid.
  // `params` is the whole ActionDefinition, including `kind`.
  validate(params: Record<string, unknown>, path: string): string[];
  // `guest` is the guest whose effect this is, as it was when the effect was enqueued.
  run(ctx: EffectContext, guest: Guest, params: P): void;
  icons(params: P, trigger: Trigger): readonly GuestIcon[];
}

// How icon labels name each property, as in "Gains 1 popularity on entrance".
const PROPERTY_NAMES: Record<keyof GuestProperties, string> = {
  popularityValue: 'popularity',
  troubleValue: 'trouble',
  moneyValue: 'money',
  peaceValue: 'peace',
  starValue: 'star'
};

const isInteger = (value: unknown): value is number => Number.isInteger(value);

// Problems for every parameter not in `allowed`.
const unknownParams = (params: Record<string, unknown>, path: string, allowed: readonly string[]): string[] =>
  Object.keys(params)
    .filter(key => key !== 'kind' && !allowed.includes(key))
    .map(key => `${path}.${key}: unknown parameter`);

const isIcon = (value: unknown): boolean => {
  const icon = value as Partial<GuestIcon> | null;
  return typeof icon === 'object' && icon !== null && typeof icon.symbol === 'string' && typeof icon.label === 'string';
};

// Invites the top `count` guests from the deck, one after another, each exactly like an
// ordinary auto-invite.
const autoInviteKind: ActionKind<{ count: number }> = {
  kind: 'autoInvite',
  dataOnly: true,
  validate: (p, path) => [
    ...(isInteger(p['count']) && p['count'] >= 1 ? [] : [`${path}.count: expected an integer ≥ 1`]),
    ...unknownParams(p, path, ['count'])
  ],
  run: (ctx, _guest, { count }) => {
    for (let i = 0; i < count; i++) autoInvite(ctx);
  },
  icons: ({ count }, trigger) =>
    Array.from({ length: count }, () => ({ symbol: '👤', label: `Invites a guest ${triggerPhrase(trigger)}` }))
};

type AdjustSelfParams = { property: keyof GuestProperties; delta: number; min?: number; max?: number };

// Changes one property of the guest whose effect this is, clamped to [min, max] when given.
// Reads the guest's current version in the party, so changes made since the effect was
// enqueued aren't lost; does nothing if the guest has left the party.
const adjustSelfKind: ActionKind<AdjustSelfParams> = {
  kind: 'adjustSelf',
  dataOnly: true,
  validate: (p, path) => {
    const problems: string[] = [];
    if (typeof p['property'] !== 'string' || !Object.hasOwn(PROPERTY_NAMES, p['property'])) {
      problems.push(`${path}.property: expected one of ${Object.keys(PROPERTY_NAMES).join(', ')}`);
    }
    // Zero would do nothing and has no icon
    if (!isInteger(p['delta']) || p['delta'] === 0) problems.push(`${path}.delta: expected a non-zero integer`);
    for (const bound of ['min', 'max']) {
      if (p[bound] !== undefined && !isInteger(p[bound])) problems.push(`${path}.${bound}: expected an integer`);
    }
    if (isInteger(p['min']) && isInteger(p['max']) && p['min'] > p['max']) {
      problems.push(`${path}.min: expected min ≤ max`);
    }
    return [...problems, ...unknownParams(p, path, ['property', 'delta', 'min', 'max'])];
  },
  run: (ctx, guest, { property, delta, min, max }) => {
    const current = ctx.getParty().find(g => g.id === guest.id);
    if (!current) return;

    let value = current.properties[property] + delta;
    if (min !== undefined) value = Math.max(min, value);
    if (max !== undefined) value = Math.min(max, value);
    ctx.updateGuest(current, g => ({ ...g, properties: { ...g.properties, [property]: value } }));
  },
  icons: ({ property, delta }, trigger) => [{
    symbol: delta > 0 ? '➕' : '➖',
    label: `${delta > 0 ? 'Gains' : 'Loses'} ${Math.abs(delta)} ${PROPERTY_NAMES[property]} ${triggerPhrase(trigger)}`
  }]
};

// An effect written in code, for one-offs that no kind covers. Can't be used from JSON.
const customKind: ActionKind<{ run: EffectHandler; icons: readonly GuestIcon[] }> = {
  kind: 'custom',
  dataOnly: false,
  validate: (p, path) => {
    const icons = p['icons'];
    return [
      ...(typeof p['run'] === 'function' ? [] : [`${path}.run: expected a function`]),
      ...(Array.isArray(icons) && icons.length > 0 && icons.every(isIcon)
        ? [] : [`${path}.icons: expected a non-empty list of { symbol, label }`]),
      ...unknownParams(p, path, ['run', 'icons'])
    ];
  },
  run: (ctx, guest, p) => p.run(ctx, guest),
  icons: (p) => p.icons
};

const kinds = new Map<string, ActionKind>();
let builtInsRegistered = false;

const add = (kind: ActionKind): void => {
  if (kinds.has(kind.kind)) throw new Error(`Action kind "${kind.kind}" is already registered`);
  kinds.set(kind.kind, kind);
};

// Registered on first use, like the built-in guest types, so module load order doesn't matter.
const ensureBuiltIns = (): void => {
  if (builtInsRegistered) return;
  builtInsRegistered = true;
  [autoInviteKind, adjustSelfKind, customKind].forEach(add);
};

// Adds an action kind, making it available to every guest type, including ones from JSON.
// Throws if the name is taken.
export function registerActionKind<P>(kind: ActionKind<P>): void {
  ensureBuiltIns();
  add(kind as unknown as ActionKind);
}

export function getActionKind(name: string): ActionKind {
  const kind = findActionKind(name);
  if (!kind) throw new Error(`Unknown action kind "${name}"`);
  return kind;
}

export function findActionKind(name: string): ActionKind | undefined {
  ensureBuiltIns();
  return kinds.get(name);
}

// Removes every kind except the built-ins. For tests only.
export function resetActionKindsForTesting(): void {
  kinds.clear();
  builtInsRegistered = false;
  ensureBuiltIns();
}

// Runs one effect of `guest` through its action kind.
export function runEffect(ctx: EffectContext, guest: Guest, effect: EffectDefinition): void {
  getActionKind(effect.action.kind).run(ctx, guest, effect.action);
}

// The card icons for a list of effects, in order.
export function effectIcons(effects: readonly EffectDefinition[]): GuestIcon[] {
  return effects.flatMap(e => [...getActionKind(e.action.kind).icons(e.action, e.trigger)]);
}
