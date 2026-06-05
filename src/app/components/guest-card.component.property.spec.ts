import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { Guest, GUEST_TYPE_DEFAULTS, GuestType } from '../models/guest.model';
import { GuestCardComponent } from './guest-card.component';

/**
 * Property-Based Tests for GuestCardComponent
 * 
 * These tests use fast-check to verify guest card rendering properties
 * across multiple iterations, ensuring the component behaves correctly
 * for all valid guest configurations.
 */
describe('GuestCardComponent - Property-Based Tests', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestCardComponent]
    }).compileComponents();
  });

  /**
   * Property 12: Guest Card Header
   * 
   * **Validates: Requirements 5.2**
   * 
   * For any rendered guest card, the card header SHALL display "Old Friend".
   * 
   * This ensures consistent card labeling for all Old Friend guests. This property
   * test generates random guests with valid names and verifies that the card header
   * always displays "Old Friend" regardless of the guest's name.
   */
  describe('Property 12: Guest Card Header', () => {
    it('should display "Old Friend" header for any guest', () => {
      // Feature: party-guest-deck-system, Property 12: Guest Card Header
      fc.assert(
        fc.property(
          fc.constantFrom('Brian', 'Colin', 'Anthony', 'Emily', 'Rachelle', 'Teresa', 'Jacco', 'Jodie', 'Khalil', 'Renata'),
          (guestName) => {
            // Create a guest with the generated name
            const guest: Guest = {
              type: 'OLD_FRIEND',
              name: guestName,
              properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
            };
            
            // Create a fresh fixture for each iteration to avoid change detection issues
            const testFixture = TestBed.createComponent(GuestCardComponent);
            const testComponent = testFixture.componentInstance;
            
            // Set the guest input directly on the component instance
            testComponent.guest = guest;
            
            // Trigger initial change detection
            testFixture.detectChanges();
            
            // Query for the card header element
            const compiled = testFixture.nativeElement as HTMLElement;
            const header = compiled.querySelector('.card-header');
            
            // Verify header exists and displays "Old Friend"
            expect(header).toBeTruthy();
            expect(header?.textContent).toBe('Old Friend');
            
            // Clean up the fixture
            testFixture.destroy();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 13: Guest Card Name Display
   * 
   * **Validates: Requirements 5.4**
   * 
   * For any rendered guest card for a guest with name N, the card caption SHALL display N.
   * 
   * This ensures each card correctly displays the name of the guest it represents. This property
   * test generates random guest names from the valid set and verifies that the card caption
   * always displays the exact guest name.
   */
  describe('Property 13: Guest Card Name Display', () => {
    it('should display the guest name in the caption for any guest', () => {
      // Feature: party-guest-deck-system, Property 13: Guest Card Name Display
      fc.assert(
        fc.property(
          fc.constantFrom('Brian', 'Colin', 'Anthony', 'Emily', 'Rachelle', 'Teresa', 'Jacco', 'Jodie', 'Khalil', 'Renata'),
          (guestName) => {
            // Create a guest with the generated name
            const guest: Guest = {
              type: 'OLD_FRIEND',
              name: guestName,
              properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
            };
            
            // Create a fresh fixture for each iteration to avoid change detection issues
            const testFixture = TestBed.createComponent(GuestCardComponent);
            const testComponent = testFixture.componentInstance;
            
            // Set the guest input directly on the component instance
            testComponent.guest = guest;
            
            // Trigger initial change detection
            testFixture.detectChanges();
            
            // Query for the card caption element
            const compiled = testFixture.nativeElement as HTMLElement;
            const caption = compiled.querySelector('.card-caption');
            
            // Verify caption exists and displays the guest's name
            expect(caption).toBeTruthy();
            expect(caption?.textContent).toBe(guestName);
            
            // Clean up the fixture
            testFixture.destroy();
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 5: Guest Card Header Matches Type Label
   *
   * **Validates: Requirements 7.1, 7.2**
   *
   * For any guest, the GuestCardComponent SHALL display a header that maps the guest's
   * type to its human-readable label: 'OLD_FRIEND' → "Old Friend", 'WILD_BUDDY' → "Wild Buddy".
   */
  describe('Property 5: Guest Card Header Matches Type Label', () => {
    const EXPECTED_LABELS: Record<GuestType, string> = {
      OLD_FRIEND: 'Old Friend',
      WILD_BUDDY: 'Wild Buddy',
      RICH_PAL: 'Rich Pal'
    };

    it('should display the correct type label in the header for any guest type', () => {
      // Feature: wild-buddy-trouble-resource, Property 5: Guest Card Header Matches Type Label
      const guestTypeArb = fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL');
      const guestNameArb = fc.string({ minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(guestTypeArb, guestNameArb, (guestType, guestName) => {
          const guest: Guest = {
            type: guestType,
            name: guestName,
            properties: { ...GUEST_TYPE_DEFAULTS[guestType] }
          };

          const testFixture = TestBed.createComponent(GuestCardComponent);
          const testComponent = testFixture.componentInstance;

          testComponent.guest = guest;
          testFixture.detectChanges();

          const compiled = testFixture.nativeElement as HTMLElement;
          const header = compiled.querySelector('.card-header');

          expect(header).toBeTruthy();
          expect(header?.textContent).toBe(EXPECTED_LABELS[guestType]);

          testFixture.destroy();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Guest Card Header Matches Type Label
   *
   * **Validates: Requirements 8.1, 8.2, 8.3**
   *
   * For any guest of any type (OLD_FRIEND, WILD_BUDDY, or RICH_PAL), the GuestCardComponent
   * SHALL display a header that maps the guest's type to its human-readable label:
   * 'OLD_FRIEND' → "Old Friend", 'WILD_BUDDY' → "Wild Buddy", 'RICH_PAL' → "Rich Pal".
   */
  describe('Property 6: Guest Card Header Matches Type Label', () => {
    const LABEL_MAP: Record<GuestType, string> = {
      OLD_FRIEND: 'Old Friend',
      WILD_BUDDY: 'Wild Buddy',
      RICH_PAL: 'Rich Pal'
    };

    it('should display the correct type label in the header for any guest of any type', () => {
      // Feature: rich-pal-money-resource, Property 6: Guest Card Header Matches Type Label
      const guestTypeArb = fc.constantFrom<GuestType>('OLD_FRIEND', 'WILD_BUDDY', 'RICH_PAL');
      const guestNameArb = fc.string({ minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(guestTypeArb, guestNameArb, (guestType, guestName) => {
          const guest: Guest = {
            type: guestType,
            name: guestName,
            properties: { ...GUEST_TYPE_DEFAULTS[guestType] }
          };

          const testFixture = TestBed.createComponent(GuestCardComponent);
          const testComponent = testFixture.componentInstance;

          testComponent.guest = guest;
          testFixture.detectChanges();

          const compiled = testFixture.nativeElement as HTMLElement;
          const header = compiled.querySelector('.card-header');

          expect(header).toBeTruthy();
          expect(header?.textContent).toBe(LABEL_MAP[guestType]);

          testFixture.destroy();
        }),
        { numRuns: 100 }
      );
    });
  });
});
