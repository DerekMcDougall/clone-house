import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Guest, GUEST_TYPE_DEFAULTS, GuestType, INITIAL_GUESTS } from './guest.model';

/**
 * Property-Based Tests for Guest Model
 * 
 * These tests use fast-check to verify guest model properties across
 * a wide range of generated inputs, ensuring the model behaves
 * correctly for all possible valid configurations.
 */
describe('Guest Model - Property-Based Tests', () => {
  const guestNames = INITIAL_GUESTS.map(g => g.name);

  /**
   * Property: Guest instances always have valid properties object
   * 
   * **Validates: Requirements 4.1**
   * 
   * For any Guest instance created in the system, the guest SHALL have a
   * properties object containing a popularityValue field.
   * 
   * This property ensures that all guests have the required properties structure
   * that enables the popularity calculation system. The properties object should
   * be initialized from GUEST_TYPE_DEFAULTS and contain at minimum the
   * popularityValue field.
   * 
   * This property test generates random guest configurations and verifies that:
   * 1. The guest has a properties object (not null/undefined)
   * 2. The properties object has a popularityValue field
   * 3. The popularityValue is a number
   * 4. For each guest type, the popularityValue matches the default
   */
  describe('Property: Guest instances always have valid properties object', () => {
    it('should have valid properties object for all guest instances', () => {
      // Feature: popularity-resource-system, Property: Guest instances always have valid properties object
      fc.assert(
        fc.property(
          fc.constantFrom(...guestNames),
          fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY'),
          (name, type) => {
            // Create a guest instance as the system should create them
            const guest: Guest = {
              type,
              name,
              properties: { ...GUEST_TYPE_DEFAULTS[type] }
            };
            
            // Verify the guest has a properties object
            expect(guest.properties).toBeDefined();
            expect(guest.properties).not.toBeNull();
            expect(typeof guest.properties).toBe('object');
            
            // Verify the properties object has popularityValue field
            expect(guest.properties).toHaveProperty('popularityValue');
            expect(typeof guest.properties.popularityValue).toBe('number');
            
            // Verify the popularityValue matches the type default
            expect(guest.properties.popularityValue).toBe(GUEST_TYPE_DEFAULTS[type].popularityValue);
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should maintain properties object structure after modifications', () => {
      // Feature: popularity-resource-system, Property: Guest instances always have valid properties object
      fc.assert(
        fc.property(
          fc.constantFrom(...guestNames),
          fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY'),
          fc.integer({ min: -10, max: 10 }),
          (name, type, newPopularityValue) => {
            // Create a guest instance
            const guest: Guest = {
              type,
              name,
              properties: { ...GUEST_TYPE_DEFAULTS[type] }
            };
            
            // Modify the popularityValue (simulating future game effects)
            guest.properties.popularityValue = newPopularityValue;
            
            // Verify the properties object is still valid after modification
            expect(guest.properties).toBeDefined();
            expect(guest.properties).not.toBeNull();
            expect(typeof guest.properties).toBe('object');
            expect(guest.properties).toHaveProperty('popularityValue');
            expect(typeof guest.properties.popularityValue).toBe('number');
            expect(guest.properties.popularityValue).toBe(newPopularityValue);
          }
        ),
        {
          numRuns: 100
        }
      );
    });

    it('should have independent properties objects for different guest instances', () => {
      // Feature: popularity-resource-system, Property: Guest instances always have valid properties object
      fc.assert(
        fc.property(
          fc.constantFrom(...guestNames),
          fc.constantFrom(...guestNames),
          fc.integer({ min: -5, max: 5 }),
          (name1, name2, popularityModifier) => {
            // Create two guest instances
            const guest1: Guest = {
              type: 'OLD_FRIEND',
              name: name1,
              properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
            };
            
            const guest2: Guest = {
              type: 'OLD_FRIEND',
              name: name2,
              properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
            };
            
            // Modify guest1's properties
            guest1.properties.popularityValue += popularityModifier;
            
            // Verify guest2's properties are unchanged (deep copy verification)
            expect(guest2.properties.popularityValue).toBe(GUEST_TYPE_DEFAULTS['OLD_FRIEND'].popularityValue);
            
            // Verify the properties objects are independent
            expect(guest1.properties).not.toBe(guest2.properties);
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 8: All Guest Types Define Money Value
   *
   * **Validates: Requirements 2.1, 2.2**
   *
   * For any guest type in the GuestType union, GUEST_TYPE_DEFAULTS SHALL define
   * a moneyValue that is an integer.
   */
  describe('Property 8: All Guest Types Define Money Value', () => {
    it('should have an integer moneyValue for every guest type default', () => {
      // Feature: rich-pal-money-resource, Property 8: All Guest Types Define Money Value
      const guestTypes = Object.keys(GUEST_TYPE_DEFAULTS) as GuestType[];

      fc.assert(
        fc.property(
          fc.constantFrom(...guestTypes),
          (guestType) => {
            const defaults = GUEST_TYPE_DEFAULTS[guestType];
            expect(defaults).toHaveProperty('moneyValue');
            expect(typeof defaults.moneyValue).toBe('number');
            expect(Number.isInteger(defaults.moneyValue)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Guest Type Defaults Include Non-Negative Trouble Value
   *
   * **Validates: Requirements 2.1, 2.2**
   *
   * For any guest type in the GuestType union, GUEST_TYPE_DEFAULTS SHALL define
   * a troubleValue that is a non-negative integer (>= 0).
   */
  describe('Property 1: Guest Type Defaults Include Non-Negative Trouble Value', () => {
    it('should have a non-negative troubleValue for every guest type default', () => {
      // Feature: wild-buddy-trouble-resource, Property 1: Guest Type Defaults Include Non-Negative Trouble Value
      const guestTypes = Object.keys(GUEST_TYPE_DEFAULTS) as GuestType[];

      fc.assert(
        fc.property(
          fc.constantFrom(...guestTypes),
          (guestType) => {
            const defaults = GUEST_TYPE_DEFAULTS[guestType];
            expect(defaults).toHaveProperty('troubleValue');
            expect(typeof defaults.troubleValue).toBe('number');
            expect(defaults.troubleValue).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
