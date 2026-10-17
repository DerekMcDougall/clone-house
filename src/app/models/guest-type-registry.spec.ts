import * as fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILT_IN_GUEST_TYPES } from './built-in-guest-types';
import { BUILT_IN_TABLES_SNAPSHOT } from './built-in-tables.snapshot';
import {
  GUEST_TYPE_COSTS, GUEST_TYPE_DEFAULTS, GUEST_TYPE_ENTRANCE_EFFECTS, GUEST_TYPE_ENTRANCE_ICONS,
  GUEST_TYPE_LABELS, INITIAL_GUESTS, SHOP_GUESTS
} from './guest.model';
import { GuestTypeDefinition } from './guest-type';
import {
  findGuestType, getGuestType, guestTypeLabel, listGuestTypes, registerGuestType, resetGuestTypesForTesting
} from './guest-type-registry';
import { arbGuestTypeDefinition, arbInvalidGuestTypeDefinition } from '../../testing/guest-type-arbitraries';
import { DEFAULT_GAME_SETUP, validateGameSetup } from './game-setup';

/**
 * Guest type registry: built-in definitions, derived views, registration and validation.
 *
 * **Validates: guest-type-registry Requirements 1, 2, 3, 6, 8.1**
 */
describe('Guest Type Registry', () => {
  afterEach(() => resetGuestTypesForTesting());

  const validDef = (overrides: Partial<GuestTypeDefinition> = {}): GuestTypeDefinition => ({
    id: 'TEST_TYPE',
    label: 'Test Type',
    cost: 4,
    properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
    ...overrides
  });

  describe('Property 1: Derived Views Match the Old Tables', () => {
    it('should keep every view equal to the pre-registry tables', () => {
      // Feature: guest-type-registry, Property 1: Derived Views Match the Old Tables
      expect(GUEST_TYPE_LABELS).toEqual(BUILT_IN_TABLES_SNAPSHOT.labels);
      expect(GUEST_TYPE_DEFAULTS).toEqual(BUILT_IN_TABLES_SNAPSHOT.defaults);
      expect(GUEST_TYPE_COSTS).toEqual(BUILT_IN_TABLES_SNAPSHOT.costs);
      expect(SHOP_GUESTS).toEqual(BUILT_IN_TABLES_SNAPSHOT.shopGuests);
      expect(INITIAL_GUESTS).toEqual(BUILT_IN_TABLES_SNAPSHOT.initialGuests);
      expect(Object.keys(GUEST_TYPE_ENTRANCE_EFFECTS)).toEqual(BUILT_IN_TABLES_SNAPSHOT.entranceEffectTypes);
      expect(GUEST_TYPE_ENTRANCE_ICONS).toEqual(BUILT_IN_TABLES_SNAPSHOT.entranceIcons);
    });

    it('should register the 22 built-in types in table order', () => {
      expect(listGuestTypes().map(d => d.id)).toEqual(Object.keys(BUILT_IN_TABLES_SNAPSHOT.labels));
    });

    it('should leave runtime-registered types out of the views', () => {
      registerGuestType(validDef());
      expect(GUEST_TYPE_LABELS['TEST_TYPE']).toBeUndefined();
      expect(SHOP_GUESTS.some(g => g.type === 'TEST_TYPE')).toBe(false);
    });
  });

  describe('Property 2: Registration Round-Trips', () => {
    it('should return a registered definition and list it last', () => {
      // Feature: guest-type-registry, Property 2: Registration Round-Trips
      fc.assert(
        fc.property(arbGuestTypeDefinition(), (def) => {
          resetGuestTypesForTesting();
          registerGuestType(def);
          expect(getGuestType(def.id)).toBe(def);
          expect(listGuestTypes().at(-1)).toBe(def);
          expect(listGuestTypes()).toHaveLength(BUILT_IN_GUEST_TYPES.length + 1);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Invalid Definitions Are Rejected Without Side Effects', () => {
    it('should throw and leave the registry unchanged', () => {
      // Feature: guest-type-registry, Property 3: Invalid Definitions Are Rejected Without Side Effects
      fc.assert(
        fc.property(arbInvalidGuestTypeDefinition(), ({ def }) => {
          resetGuestTypesForTesting();
          const before = listGuestTypes();
          expect(() => registerGuestType(def)).toThrow(/Invalid guest type/);
          expect(listGuestTypes()).toEqual(before);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject a duplicate id and keep the existing definition', () => {
      const climber = getGuestType('CLIMBER');
      expect(() => registerGuestType(validDef({ id: 'CLIMBER' }))).toThrow('Guest type "CLIMBER" is already registered');
      expect(getGuestType('CLIMBER')).toBe(climber);
    });
  });

  describe('Lookups', () => {
    it('should throw on an unknown id from getGuestType, naming the id', () => {
      expect(() => getGuestType('NOPE')).toThrow('Unknown guest type "NOPE"');
    });

    it('should return undefined on an unknown id from findGuestType', () => {
      expect(findGuestType('NOPE')).toBeUndefined();
    });

    it('should fall back to the id for an unknown type label', () => {
      expect(guestTypeLabel('NOPE')).toBe('NOPE');
      expect(guestTypeLabel('MR_POPULAR')).toBe('Mr. Popular');
    });

    it('should drop runtime types on reset and keep the built-ins', () => {
      registerGuestType(validDef());
      resetGuestTypesForTesting();
      expect(findGuestType('TEST_TYPE')).toBeUndefined();
      expect(listGuestTypes()).toHaveLength(BUILT_IN_GUEST_TYPES.length);
    });
  });

  describe('Module load order', () => {
    // The model modules import each other in a cycle; each must work when loaded first.
    const modules = [
      './guest-type-registry', './guest-effects', './built-in-guest-types', './guest.model', './guest-type', './game-setup',
      './action-kinds', './effect-definition', './guest-type-json'
    ];

    for (const path of modules) {
      it(`should load cleanly when ${path} is imported first`, async () => {
        vi.resetModules();
        await import(/* @vite-ignore */ path);
        const registry = await import('./guest-type-registry');
        const { effectIcons } = await import('./action-kinds');
        const model = await import('./guest.model');
        expect(registry.listGuestTypes()).toHaveLength(BUILT_IN_GUEST_TYPES.length);
        expect(effectIcons(registry.getGuestType('CELEBRITY').effects ?? [])).toHaveLength(2);
        expect(model.GUEST_TYPE_ENTRANCE_ICONS['CELEBRITY']).toHaveLength(2);
      });
    }
  });
});

describe('Default Game Setup', () => {
  it('should be a valid setup', () => {
    expect(() => validateGameSetup(DEFAULT_GAME_SETUP)).not.toThrow();
  });

  it('should reproduce the pre-registry starting deck and shop', () => {
    expect(DEFAULT_GAME_SETUP.startingDeck).toEqual(BUILT_IN_TABLES_SNAPSHOT.initialGuests);
    expect(DEFAULT_GAME_SETUP.shop.flatMap(e => e.names.map(name => ({ type: e.type, name }))))
      .toEqual(BUILT_IN_TABLES_SNAPSHOT.shopGuests);
  });
});
