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

// Valid definitions with ids starting TEST_.
export const arbGuestTypeDefinition = (): fc.Arbitrary<GuestTypeDefinition> =>
  fc.record({
    suffix: fc.stringMatching(/^[A-Z0-9_]{1,12}$/),
    label: fc.string({ minLength: 1, maxLength: 20 }),
    cost: fc.option(fc.integer({ min: 0, max: 60 }), { nil: null }),
    properties: propertiesArb
  }).map(({ suffix, ...rest }) => ({ id: `TEST_${suffix}`, ...rest }));

// Distinct guest names, for starting decks and shop stock.
export const arbGuestNames = (maxLength = 8): fc.Arbitrary<string[]> =>
  fc.uniqueArray(fc.string({ minLength: 1, maxLength: 10 }), { maxLength });

// A valid definition with exactly one rule broken, and the rule's name.
export const arbInvalidGuestTypeDefinition = (): fc.Arbitrary<{ rule: string; def: GuestTypeDefinition }> =>
  fc.tuple(arbGuestTypeDefinition(), fc.constantFrom(
    'empty id', 'empty label', 'negative cost', 'fractional cost', 'non-integer property',
    'effect without icons', 'icons without effect'
  )).map(([valid, rule]) => {
    const def: GuestTypeDefinition = { ...valid, properties: { ...valid.properties } };
    switch (rule) {
      case 'empty id': def.id = ''; break;
      case 'empty label': def.label = ''; break;
      case 'negative cost': def.cost = -1; break;
      case 'fractional cost': def.cost = 2.5; break;
      case 'non-integer property': def.properties.moneyValue = 0.5; break;
      case 'effect without icons': def.entranceEffect = () => {}; delete def.entranceIcons; break;
      case 'icons without effect': def.entranceIcons = [{ symbol: '?', label: 'Icon' }]; delete def.entranceEffect; break;
    }
    return { rule, def };
  });
