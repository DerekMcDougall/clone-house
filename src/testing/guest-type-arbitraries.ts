import * as fc from 'fast-check';
import { ActionDefinition, EffectDefinition } from '../app/models/effect-definition';
import { GuestProperties } from '../app/models/guest.model';
import { GuestTypeDefinition, PROPERTY_KEYS } from '../app/models/guest-type';

const propertiesArb: fc.Arbitrary<GuestProperties> = fc.record({
  popularityValue: fc.integer({ min: -9, max: 9 }),
  troubleValue: fc.integer({ min: -3, max: 3 }),
  moneyValue: fc.integer({ min: -9, max: 9 }),
  peaceValue: fc.integer({ min: -3, max: 3 }),
  starValue: fc.integer({ min: -2, max: 2 })
});

// Valid definitions with ids starting TEST_, and no effects.
export const arbGuestTypeDefinition = (): fc.Arbitrary<GuestTypeDefinition> =>
  fc.record({
    suffix: fc.stringMatching(/^[A-Z0-9_]{1,12}$/),
    label: fc.string({ minLength: 1, maxLength: 20 }),
    cost: fc.option(fc.integer({ min: 0, max: 60 }), { nil: null }),
    properties: propertiesArb
  }).map(({ suffix, ...rest }) => ({ id: `TEST_${suffix}`, ...rest }));

// Valid autoInvite, adjustSelf and cycleSelf actions, and chooseGuest wrapping one of them.
// Absent bounds are left out rather than set to undefined, as they would be in JSON.
export const arbDataOnlyAction = (): fc.Arbitrary<ActionDefinition> => fc.oneof(
  arbSimpleAction(),
  fc.tuple(fc.string({ minLength: 1, maxLength: 20 }), arbSimpleAction(), arbIcons())
    .map(([prompt, action, icons]) => ({ kind: 'chooseGuest', prompt, from: 'party', action, icons }))
);

const arbIcons = () =>
  fc.array(fc.record({ symbol: fc.string({ minLength: 1, maxLength: 2 }), label: fc.string() }), { minLength: 1, maxLength: 2 });

const arbSimpleAction = (): fc.Arbitrary<ActionDefinition> => fc.oneof(
  fc.integer({ min: 1, max: 5 }).map(count => ({ kind: 'autoInvite', count })),
  fc.record({
    property: fc.constantFrom(...PROPERTY_KEYS),
    values: fc.array(fc.integer({ min: -9, max: 9 }), { minLength: 2, maxLength: 4 }),
    icons: arbIcons()
  }).map(p => ({ kind: 'cycleSelf', ...p })),
  fc.record({
    property: fc.constantFrom(...PROPERTY_KEYS),
    delta: fc.integer({ min: -5, max: 5 }).filter(d => d !== 0),
    bounds: fc.option(fc.integer({ min: -9, max: 9 })).chain(min => fc.tuple(
      fc.constant(min),
      fc.option(fc.integer({ min: min ?? -9, max: 9 }))
    ))
  }).map(({ property, delta, bounds: [min, max] }) => ({
    kind: 'adjustSelf',
    property,
    delta,
    ...(min !== null && { min }),
    ...(max !== null && { max })
  }))
);

// Valid scoreBonus actions. Optional parameters are left out when absent, as in JSON.
const arbScoreBonusAction = (): fc.Arbitrary<ActionDefinition> => fc.record({
  resource: fc.constantFrom('popularity', 'money'),
  // A fixed amount, or a table looked up by count
  value: fc.oneof(
    fc.integer({ min: -5, max: 5 }).filter(n => n !== 0).map(amount => ({ amount })),
    fc.array(fc.integer({ min: -9, max: 20 }), { minLength: 1, maxLength: 4 }).map(amounts => ({ amounts }))
  ),
  per: fc.constantFrom(undefined, 'emptySpace', 'trouble', 'guestOfType'),
  houseFull: fc.boolean(),
  icons: fc.array(fc.record(
    { symbol: fc.string({ minLength: 1, maxLength: 2 }), label: fc.string(), color: fc.string(), bold: fc.boolean() },
    { requiredKeys: ['symbol', 'label'] }
  ), { minLength: 1, maxLength: 2 })
}).map(({ resource, value, per, houseFull, icons }) => ({
  kind: 'scoreBonus',
  resource,
  ...value,
  ...(per && { per }),
  ...(per === 'guestOfType' && { guestType: 'OLD_FRIEND' }),
  ...(houseFull && { when: 'houseFull' }),
  icons
}));

// Valid data-only effects: entrance effects, and scoring bonuses on the score and groupScore
// triggers.
export const arbDataOnlyEffect = (): fc.Arbitrary<EffectDefinition> => fc.oneof(
  arbDataOnlyAction().map(action => ({ trigger: 'entrance' as const, action })),
  fc.tuple(fc.constantFrom('score' as const, 'groupScore' as const), arbScoreBonusAction())
    .map(([trigger, action]) => ({ trigger, action }))
);

// Valid definitions that can be written as JSON: either no effects field, or up to three
// data-only effects.
export const arbDataOnlyDefinition = (): fc.Arbitrary<GuestTypeDefinition> =>
  fc.tuple(arbGuestTypeDefinition(), fc.option(fc.array(arbDataOnlyEffect(), { maxLength: 3 })))
    .map(([def, effects]) => (effects === null ? def : { ...def, effects }));

// Distinct guest names, for starting decks and shop stock.
export const arbGuestNames = (maxLength = 8): fc.Arbitrary<string[]> =>
  fc.uniqueArray(fc.string({ minLength: 1, maxLength: 10 }), { maxLength });

// A valid definition with exactly one rule broken, and the rule's name.
export const arbInvalidGuestTypeDefinition = (): fc.Arbitrary<{ rule: string; def: GuestTypeDefinition }> =>
  fc.tuple(arbDataOnlyDefinition(), fc.constantFrom(
    'empty id', 'empty label', 'negative cost', 'fractional cost', 'non-integer property',
    'unknown trigger', 'unknown action kind', 'bad action parameter', 'custom without icons'
  )).map(([valid, rule]) => {
    const def: GuestTypeDefinition = { ...valid, properties: { ...valid.properties } };
    const addEffect = (effect: unknown) => { def.effects = [...(valid.effects ?? []), effect as EffectDefinition]; };
    switch (rule) {
      case 'empty id': def.id = ''; break;
      case 'empty label': def.label = ''; break;
      case 'negative cost': def.cost = -1; break;
      case 'fractional cost': def.cost = 2.5; break;
      case 'non-integer property': def.properties.moneyValue = 0.5; break;
      case 'unknown trigger': addEffect({ trigger: 'exit', action: { kind: 'autoInvite', count: 1 } }); break;
      case 'unknown action kind': addEffect({ trigger: 'entrance', action: { kind: 'NOPE' } }); break;
      case 'bad action parameter': addEffect({ trigger: 'entrance', action: { kind: 'autoInvite', count: 0 } }); break;
      case 'custom without icons':
        addEffect({ trigger: 'entrance', action: { kind: 'custom', run: () => {}, icons: [] } });
        break;
    }
    return { rule, def };
  });

// JSON for a valid data-only definition with one field broken, and the path its error must
// name.
export const arbBrokenGuestTypeJson = (): fc.Arbitrary<{ rule: string; json: Record<string, unknown>; path: string }> =>
  fc.tuple(arbDataOnlyDefinition(), fc.constantFrom(
    'wrong id type', 'missing label', 'extra field', 'wrong cost type', 'missing property', 'extra property',
    'effects not a list', 'unknown trigger', 'unknown kind', 'bad parameter', 'unknown parameter', 'custom kind',
    'kind on wrong trigger'
  )).map(([valid, rule]) => {
    const json = JSON.parse(JSON.stringify(valid)) as Record<string, unknown>;
    const properties = json['properties'] as Record<string, unknown>;
    const effects = (json['effects'] ?? []) as unknown[];
    // Broken effects are added after the valid ones
    const at = `effects[${effects.length}]`;
    const addEffect = (effect: unknown) => { json['effects'] = [...effects, effect]; };

    switch (rule) {
      case 'wrong id type': json['id'] = 5; return { rule, json, path: 'id' };
      case 'missing label': delete json['label']; return { rule, json, path: 'label' };
      case 'extra field': json['charm'] = 1; return { rule, json, path: 'charm' };
      case 'wrong cost type': json['cost'] = '3'; return { rule, json, path: 'cost' };
      case 'missing property': delete properties['moneyValue']; return { rule, json, path: 'properties.moneyValue' };
      case 'extra property': properties['charmValue'] = 1; return { rule, json, path: 'properties.charmValue' };
      case 'effects not a list': json['effects'] = {}; return { rule, json, path: 'effects' };
      case 'unknown trigger':
        addEffect({ trigger: 'exit', action: { kind: 'autoInvite', count: 1 } });
        return { rule, json, path: `${at}.trigger` };
      case 'unknown kind':
        addEffect({ trigger: 'entrance', action: { kind: 'NOPE' } });
        return { rule, json, path: `${at}.action.kind` };
      case 'bad parameter':
        addEffect({ trigger: 'entrance', action: { kind: 'autoInvite', count: 0 } });
        return { rule, json, path: `${at}.action.count` };
      case 'unknown parameter':
        addEffect({ trigger: 'entrance', action: { kind: 'autoInvite', count: 1, times: 2 } });
        return { rule, json, path: `${at}.action.times` };
      case 'kind on wrong trigger':
        addEffect({ trigger: 'score', action: { kind: 'autoInvite', count: 1 } });
        return { rule, json, path: `${at}.action.kind` };
      default:
        addEffect({ trigger: 'entrance', action: { kind: 'custom', icons: [{ symbol: '?', label: 'Icon' }] } });
        return { rule, json, path: `${at}.action.kind` };
    }
  });
