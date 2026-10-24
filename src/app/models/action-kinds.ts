import type { EffectContext } from './effect-context';
import { ActionDefinition, EffectDefinition, Trigger, triggerPhrase } from './effect-definition';
import { autoInvite } from './guest-effects';
import type { GuestIcon } from './guest-icons';
import type { EffectHandler } from './guest-type';
import { guestTypeLabel } from './guest-type-registry';
import type { Guest, GuestProperties } from './guest.model';

// The code behind one kind of action. Guest types choose a kind and give its parameters
// as data (an ActionDefinition); the kind validates them, runs them and supplies icons.
export interface ActionKind<P = Record<string, unknown>> {
  kind: string;
  // False for kinds whose parameters can't be written in JSON, such as custom.
  dataOnly: boolean;
  // The triggers effects of this kind can have; each effect has one of them. Score effects
  // run outside the effect queue, so kinds that queue effects or choices can't be used there.
  triggers: readonly [Trigger, ...Trigger[]];
  // Returns every problem with the parameters, each starting with `path`; empty when valid.
  // `params` is the whole ActionDefinition, including `kind`. A kind whose parameters
  // include another action checks it with `validateAction`, which applies the same rules
  // as for a top-level action (including, for JSON, that its kind is dataOnly).
  validate(params: Record<string, unknown>, path: string, validateAction: ValidateAction): string[];
  // `guest` is the guest whose effect this is, as it was when the effect was enqueued.
  run(ctx: EffectContext, guest: Guest, params: P): void;
  icons(params: P, trigger: Trigger): readonly GuestIcon[];
}

export type ValidateAction = (action: unknown, path: string) => string[];

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

// Problems with an `icons` parameter, for kinds whose icons are given rather than derived.
const iconsProblems = (icons: unknown, path: string): string[] => {
  if (!(Array.isArray(icons) && icons.length > 0 && icons.every(isIcon))) {
    return [`${path}.icons: expected a non-empty list of { symbol, label }`];
  }
  return icons.flatMap((icon: Partial<GuestIcon>, i) => [
    ...(icon.color === undefined || typeof icon.color === 'string' ? [] : [`${path}.icons[${i}].color: expected a string`]),
    ...(icon.bold === undefined || typeof icon.bold === 'boolean' ? [] : [`${path}.icons[${i}].bold: expected a boolean`])
  ]);
};

// Invites the top `count` guests from the deck, one after another, each exactly like an
// ordinary auto-invite.
const autoInviteKind: ActionKind<{ count: number }> = {
  kind: 'autoInvite',
  triggers: ['entrance'],
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

// Problems with a `property` parameter naming one of the guest's properties.
const propertyProblems = (property: unknown, path: string): string[] =>
  typeof property === 'string' && Object.hasOwn(PROPERTY_NAMES, property)
    ? [] : [`${path}.property: expected one of ${Object.keys(PROPERTY_NAMES).join(', ')}`];

// The current party version of the guest whose effect this is, or undefined if they've left.
const currentVersion = (ctx: EffectContext, guest: Guest): Guest | undefined =>
  ctx.getParty().find(g => g.id === guest.id);

const setProperty = (ctx: EffectContext, guest: Guest, property: keyof GuestProperties, value: number): void => {
  ctx.updateGuest(guest, g => ({ ...g, properties: { ...g.properties, [property]: value } }));
};

type AdjustSelfParams = { property: keyof GuestProperties; delta: number; min?: number; max?: number };

// Changes one property of the guest whose effect this is, clamped to [min, max] when given.
// Reads the guest's current version in the party, so changes made since the effect was
// enqueued aren't lost; does nothing if the guest has left the party.
const adjustSelfKind: ActionKind<AdjustSelfParams> = {
  kind: 'adjustSelf',
  triggers: ['entrance'],
  dataOnly: true,
  validate: (p, path) => {
    const problems = propertyProblems(p['property'], path);
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
    const current = currentVersion(ctx, guest);
    if (!current) return;

    let value = current.properties[property] + delta;
    if (min !== undefined) value = Math.max(min, value);
    if (max !== undefined) value = Math.min(max, value);
    setProperty(ctx, current, property, value);
  },
  icons: ({ property, delta }, trigger) => [{
    symbol: delta > 0 ? '➕' : '➖',
    label: `${delta > 0 ? 'Gains' : 'Loses'} ${Math.abs(delta)} ${PROPERTY_NAMES[property]} ${triggerPhrase(trigger)}`
  }]
};

type CycleSelfParams = { property: keyof GuestProperties; values: readonly number[]; icons: readonly GuestIcon[] };

// Sets one property of the guest whose effect this is to the value after its current one in
// `values`, wrapping around, or to the first value if the current one isn't listed. Reads
// the guest's current party version, like adjustSelf. Its icons are given: a derived one
// couldn't say what the change means for the guest.
const cycleSelfKind: ActionKind<CycleSelfParams> = {
  kind: 'cycleSelf',
  triggers: ['entrance'],
  dataOnly: true,
  validate: (p, path) => {
    const values = p['values'];
    return [
      ...propertyProblems(p['property'], path),
      ...(Array.isArray(values) && values.length >= 2 && values.every(isInteger)
        ? [] : [`${path}.values: expected a list of at least 2 integers`]),
      ...iconsProblems(p['icons'], path),
      ...unknownParams(p, path, ['property', 'values', 'icons'])
    ];
  },
  run: (ctx, guest, { property, values }) => {
    const current = currentVersion(ctx, guest);
    if (!current) return;

    // indexOf is -1 for a value that isn't listed, which gives the first value
    const next = values[(values.indexOf(current.properties[property]) + 1) % values.length];
    setProperty(ctx, current, property, next);
  },
  icons: (p) => p.icons
};

type ScoreBonusParams = {
  resource: 'popularity' | 'money';
  amount: number;
  per?: 'emptySpace' | 'trouble' | 'guestOfType';
  guestType?: string;
  when?: 'houseFull';
  icons: readonly GuestIcon[];
};

const SCORE_BONUS_PER = ['emptySpace', 'trouble', 'guestOfType'];

// Adds `amount` of `resource` for each counted thing in the house (once, without `per`), or
// nothing when `when` doesn't hold. Runs at scoring, on the finished party. A guestType that
// isn't registered counts 0: JSON types can be registered in any order, so it isn't checked.
const scoreBonusKind: ActionKind<ScoreBonusParams> = {
  kind: 'scoreBonus',
  dataOnly: true,
  triggers: ['score'],
  validate: (p, path) => {
    const problems: string[] = [];
    if (p['resource'] !== 'popularity' && p['resource'] !== 'money') {
      problems.push(`${path}.resource: expected "popularity" or "money"`);
    }
    if (!isInteger(p['amount']) || p['amount'] === 0) problems.push(`${path}.amount: expected a non-zero integer`);
    if (p['per'] !== undefined && !SCORE_BONUS_PER.includes(p['per'] as string)) {
      problems.push(`${path}.per: expected one of ${SCORE_BONUS_PER.join(', ')}`);
    }
    if (p['per'] === 'guestOfType') {
      if (typeof p['guestType'] !== 'string' || p['guestType'] === '') {
        problems.push(`${path}.guestType: expected a non-empty string`);
      }
    } else if (p['guestType'] !== undefined) {
      problems.push(`${path}.guestType: only allowed when per is "guestOfType"`);
    }
    if (p['when'] !== undefined && p['when'] !== 'houseFull') problems.push(`${path}.when: expected "houseFull"`);
    return [
      ...problems,
      ...iconsProblems(p['icons'], path),
      ...unknownParams(p, path, ['resource', 'amount', 'per', 'guestType', 'when', 'icons'])
    ];
  },
  run: (ctx, _guest, { resource, amount, per, guestType, when }) => {
    const party = ctx.getParty();
    const capacity = ctx.getHouseCapacity();
    if (when === 'houseFull' && party.length < capacity) return;

    const count =
      per === 'emptySpace' ? Math.max(0, capacity - party.length) :
      per === 'trouble' ? party.reduce((sum, g) => sum + g.properties.troubleValue, 0) :
      per === 'guestOfType' ? party.filter(g => g.type === guestType).length :
      1;

    if (resource === 'popularity') ctx.setPopularity(ctx.getPopularity() + amount * count);
    else ctx.setMoney(ctx.getMoney() + amount * count);
  },
  icons: (p) => p.icons
};

// An effect written in code, for one-offs that no kind covers. Can't be used from JSON.
const customKind: ActionKind<{ run: EffectHandler; icons: readonly GuestIcon[] }> = {
  kind: 'custom',
  triggers: ['entrance'],
  dataOnly: false,
  validate: (p, path) => [
    ...(typeof p['run'] === 'function' ? [] : [`${path}.run: expected a function`]),
    ...iconsProblems(p['icons'], path),
    ...unknownParams(p, path, ['run', 'icons'])
  ],
  run: (ctx, guest, p) => p.run(ctx, guest),
  icons: (p) => p.icons
};

type ChooseGuestParams = { prompt: string; from: 'party'; action: ActionDefinition; icons: readonly GuestIcon[] };

// Asks the player to pick a party guest, then runs `action` with that guest as the guest
// whose effect it is, so an adjustSelf inside changes the chosen guest. The options are
// the party when the choice is reached. Its icons are given, not taken from `action`,
// whose labels describe the guest itself rather than the one chosen.
const chooseGuestKind: ActionKind<ChooseGuestParams> = {
  kind: 'chooseGuest',
  triggers: ['entrance'],
  // Can be written in JSON whenever its action can, which validateAction checks
  dataOnly: true,
  validate: (p, path, validateAction) => [
    ...(typeof p['prompt'] === 'string' && p['prompt'] !== '' ? [] : [`${path}.prompt: expected a non-empty string`]),
    ...(p['from'] === 'party' ? [] : [`${path}.from: expected "party"`]),
    ...validateAction(p['action'], `${path}.action`),
    ...iconsProblems(p['icons'], path),
    ...unknownParams(p, path, ['prompt', 'from', 'action', 'icons'])
  ],
  run: (ctx, guest, { prompt, action }) => ctx.requestChoice({
    prompt,
    sourceGuestId: guest.id,
    options: (view) => view.getParty().map(g => ({ id: g.id, label: `${guestTypeLabel(g.type)} ${g.name}`, guest: g })),
    onChoose: (c, option) => getActionKind(action.kind).run(c, option.guest!, action)
  }),
  icons: (p) => p.icons
};

const kinds = new Map<string, ActionKind>();
let builtInsRegistered = false;

const add = (kind: ActionKind): void => {
  if (kinds.has(kind.kind)) throw new Error(`Action kind "${kind.kind}" is already registered`);
  // The type requires this too; checked here for kinds built without type checking
  if (!Array.isArray(kind.triggers) || kind.triggers.length === 0) {
    throw new Error(`Action kind "${kind.kind}" must list at least one trigger`);
  }
  kinds.set(kind.kind, kind);
};

// Registered on first use, like the built-in guest types, so module load order doesn't matter.
const ensureBuiltIns = (): void => {
  if (builtInsRegistered) return;
  builtInsRegistered = true;
  [autoInviteKind, adjustSelfKind, cycleSelfKind, scoreBonusKind, customKind, chooseGuestKind].forEach(add);
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
