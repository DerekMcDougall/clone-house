import * as fc from 'fast-check';
import { GuestProperties } from '../app/models/guest.model';
import { GuestTypeDefinition } from '../app/models/guest-type';

const propertiesArb: fc.Arbitrary<GuestProperties> = fc.record({
  popularityValue: fc.integer({ min: -9, max: 9 }),
  troubleValue: fc.integer({ min: -3, max: 3 }),
  moneyValue: fc.integer({ min: -9, max: 9 }),
  peaceValue: fc.integer({ min: -3, max: 3 }),
  starValue: fc.integer({ min: -2, max: 2 })
});

// Valid definitions with ids starting TEST_ and distinct roster names. Types without a
// cost have no shop roster.
export const arbGuestTypeDefinition = (): fc.Arbitrary<GuestTypeDefinition> =>
  fc.record({
    suffix: fc.stringMatching(/^[A-Z0-9_]{1,12}$/),
    label: fc.string({ minLength: 1, maxLength: 20 }),
    cost: fc.option(fc.integer({ min: 0, max: 60 }), { nil: null }),
    properties: propertiesArb,
    names: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 8 }),
    startingCount: fc.nat({ max: 8 })
  }).map(({ suffix, label, cost, properties, names, startingCount }) => {
    const starting = names.slice(0, startingCount);
    const shop = cost === null ? [] : names.slice(startingCount);
    return { id: `TEST_${suffix}`, label, cost, properties, roster: { starting, shop } };
  });

// A valid definition with exactly one rule broken, and the rule's name.
export const arbInvalidGuestTypeDefinition = (): fc.Arbitrary<{ rule: string; def: GuestTypeDefinition }> =>
  fc.tuple(arbGuestTypeDefinition(), fc.constantFrom(
    'empty id', 'empty label', 'negative cost', 'fractional cost', 'non-integer property',
    'empty roster name', 'duplicate roster name', 'shop roster without cost',
    'effect without icons', 'icons without effect'
  )).map(([valid, rule]) => {
    const def: GuestTypeDefinition = { ...valid, properties: { ...valid.properties }, roster: { ...valid.roster } };
    switch (rule) {
      case 'empty id': def.id = ''; break;
      case 'empty label': def.label = ''; break;
      case 'negative cost': def.cost = -1; break;
      case 'fractional cost': def.cost = 2.5; break;
      case 'non-integer property': def.properties.moneyValue = 0.5; break;
      case 'empty roster name': def.roster = { ...def.roster, starting: [...def.roster.starting, ''] }; break;
      case 'duplicate roster name': def.roster = { starting: ['Dup', 'Dup'], shop: [] }; break;
      case 'shop roster without cost': def.cost = null; def.roster = { starting: [], shop: ['Shopper'] }; break;
      case 'effect without icons': def.entranceEffect = () => {}; delete def.entranceIcons; break;
      case 'icons without effect': def.entranceIcons = [{ symbol: '?', label: 'Icon' }]; delete def.entranceEffect; break;
    }
    return { rule, def };
  });
