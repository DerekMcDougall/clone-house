import { describe, expect, it } from 'vitest';
import { GUEST_TYPE_COSTS, GUEST_TYPE_DEFAULTS, GUEST_TYPE_LABELS, INITIAL_GUESTS, SHOP_GUESTS, type Guest } from './guest.model';

/**
 * Unit Tests for Guest Model
 * 
 * These tests verify that guest creation properly initializes the properties
 * field with correct default values from GUEST_TYPE_DEFAULTS.
 * 
 * **Validates: Requirements 4.3**
 */
describe('Guest Model - Unit Tests', () => {
  describe('Guest Creation with Properties', () => {
    /**
     * Test that created guests have properties object
     * **Validates: Requirements 4.3**
     */
    it('should create guests with properties object', () => {
      const guest: Guest = {
        type: 'OLD_FRIEND',
        name: 'Brian',
        properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
      };

      expect(guest.properties).toBeDefined();
      expect(guest.properties).toHaveProperty('popularityValue');
    });

    /**
     * Test that OLD_FRIEND guests have popularityValue of 1
     * **Validates: Requirements 4.3**
     */
    it('should create OLD_FRIEND guests with popularityValue of 1', () => {
      const guest: Guest = {
        type: 'OLD_FRIEND',
        name: 'Colin',
        properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
      };

      expect(guest.properties.popularityValue).toBe(1);
    });

    /**
     * Test that GUEST_TYPE_DEFAULTS has correct structure for OLD_FRIEND
     * **Validates: Requirements 4.3**
     */
    it('should have GUEST_TYPE_DEFAULTS with OLD_FRIEND popularityValue of 1', () => {
      expect(GUEST_TYPE_DEFAULTS['OLD_FRIEND']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['OLD_FRIEND'].popularityValue).toBe(1);
    });

    /**
     * Test that properties are properly copied (not referenced)
     * This ensures modifications to one guest don't affect others
     */
    it('should create independent properties objects for each guest', () => {
      const guest1: Guest = {
        type: 'OLD_FRIEND',
        name: 'Anthony',
        properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
      };

      const guest2: Guest = {
        type: 'OLD_FRIEND',
        name: 'Emily',
        properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] }
      };

      // Modify guest1's properties
      guest1.properties.popularityValue = 5;

      // guest2 should remain unchanged
      expect(guest2.properties.popularityValue).toBe(1);
    });

    /**
     * Test that all INITIAL_GUESTS can be created with properties
     * **Validates: Requirements 10.1**
     */
    it('should create all INITIAL_GUESTS with properties', () => {
      const guests: Guest[] = INITIAL_GUESTS.map(({ type, name }) => ({
        type,
        name,
        properties: { ...GUEST_TYPE_DEFAULTS[type] }
      }));

      expect(guests).toHaveLength(10);
      guests.forEach(guest => {
        expect(guest.properties).toBeDefined();
        expect(typeof guest.properties.popularityValue).toBe('number');
      });
    });
  });
});

/**
 * Unit Tests for Wild Buddy Guest Type & Trouble Value
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 9.1, 9.2, 9.3**
 */
describe('Guest Model - Wild Buddy', () => {
  describe('GUEST_TYPE_DEFAULTS', () => {
    /**
     * WILD_BUDDY exists with correct popularityValue and troubleValue
     * **Validates: Requirements 1.1, 1.2, 1.3**
     */
    it('should define WILD_BUDDY with popularityValue 2 and troubleValue 1', () => {
      expect(GUEST_TYPE_DEFAULTS['WILD_BUDDY']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['WILD_BUDDY'].popularityValue).toBe(2);
      expect(GUEST_TYPE_DEFAULTS['WILD_BUDDY'].troubleValue).toBe(1);
    });

    /**
     * OLD_FRIEND has troubleValue of 0
     * **Validates: Requirements 1.4**
     */
    it('should define OLD_FRIEND with troubleValue 0', () => {
      expect(GUEST_TYPE_DEFAULTS['OLD_FRIEND'].troubleValue).toBe(0);
    });
  });

  describe('INITIAL_GUESTS', () => {
    /**
     * OLD_FRIEND names are Brian, Colin, Emily, Rachelle
     * **Validates: Requirements 9.2**
     */
    it('should have correct Old Friend names', () => {
      const oldFriendNames = INITIAL_GUESTS
        .filter(g => g.type === 'OLD_FRIEND')
        .map(g => g.name)
        .sort();

      expect(oldFriendNames).toEqual(['Brian', 'Colin', 'Emily', 'Rachelle']);
    });

    /**
     * WILD_BUDDY names are Anthony, Teresa, Jacco, Jodie
     * **Validates: Requirements 9.3**
     */
    it('should have correct Wild Buddy names', () => {
      const wildBuddyNames = INITIAL_GUESTS
        .filter(g => g.type === 'WILD_BUDDY')
        .map(g => g.name)
        .sort();

      expect(wildBuddyNames).toEqual(['Anthony', 'Jacco', 'Jodie', 'Teresa']);
    });
  });
});

/**
 * Unit Tests for Rich Pal Guest Type & Money Value
 *
 * **Validates: Requirements 1.1–1.4, 2.1–2.4, 9.1, 9.2, 10.1–10.4**
 */
describe('Guest Model - Rich Pal & Money Value', () => {
  describe('GUEST_TYPE_DEFAULTS', () => {
    /**
     * RICH_PAL exists with correct defaults
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     */
    it('should define RICH_PAL with popularityValue 0, troubleValue 0, moneyValue 1', () => {
      expect(GUEST_TYPE_DEFAULTS['RICH_PAL']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['RICH_PAL'].popularityValue).toBe(0);
      expect(GUEST_TYPE_DEFAULTS['RICH_PAL'].troubleValue).toBe(0);
      expect(GUEST_TYPE_DEFAULTS['RICH_PAL'].moneyValue).toBe(1);
    });

    /**
     * OLD_FRIEND has moneyValue of 0
     * **Validates: Requirements 2.3**
     */
    it('should define OLD_FRIEND with moneyValue 0', () => {
      expect(GUEST_TYPE_DEFAULTS['OLD_FRIEND'].moneyValue).toBe(0);
    });

    /**
     * WILD_BUDDY has moneyValue of 0
     * **Validates: Requirements 2.4**
     */
    it('should define WILD_BUDDY with moneyValue 0', () => {
      expect(GUEST_TYPE_DEFAULTS['WILD_BUDDY'].moneyValue).toBe(0);
    });
  });

  describe('INITIAL_GUESTS', () => {
    /**
     * INITIAL_GUESTS has 10 entries: 4 OLD_FRIEND, 4 WILD_BUDDY, 2 RICH_PAL
     * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
     */
    it('should have 10 entries with 4 OLD_FRIEND, 4 WILD_BUDDY, and 2 RICH_PAL', () => {
      expect(INITIAL_GUESTS).toHaveLength(10);

      const oldFriends = INITIAL_GUESTS.filter(g => g.type === 'OLD_FRIEND');
      const wildBuddies = INITIAL_GUESTS.filter(g => g.type === 'WILD_BUDDY');
      const richPals = INITIAL_GUESTS.filter(g => g.type === 'RICH_PAL');

      expect(oldFriends).toHaveLength(4);
      expect(wildBuddies).toHaveLength(4);
      expect(richPals).toHaveLength(2);
    });

    /**
     * Rich Pal names are Khalil and Renata
     * **Validates: Requirements 9.1, 9.2**
     */
    it('should have Rich Pal names Khalil and Renata', () => {
      const richPalNames = INITIAL_GUESTS
        .filter(g => g.type === 'RICH_PAL')
        .map(g => g.name)
        .sort();

      expect(richPalNames).toEqual(['Khalil', 'Renata']);
    });

    /**
     * All names in INITIAL_GUESTS are unique
     * **Validates: Requirements 9.1, 9.2**
     */
    it('should have all unique names', () => {
      const names = INITIAL_GUESTS.map(g => g.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });
});

/**
 * Unit Tests for Shop Constants (GUEST_TYPE_COSTS and SHOP_GUESTS)
 *
 * **Validates: Requirements 1.2, 1.3, 1.4, 7.1, 7.2**
 */
describe('Guest Model - Shop Constants', () => {
  describe('GUEST_TYPE_COSTS', () => {
    /**
     * OLD_FRIEND costs 2 popularity
     * **Validates: Requirements 1.2**
     */
    it('should assign OLD_FRIEND a cost of 2', () => {
      expect(GUEST_TYPE_COSTS['OLD_FRIEND']).toBe(2);
    });

    /**
     * RICH_PAL costs 3 popularity
     * **Validates: Requirements 1.3**
     */
    it('should assign RICH_PAL a cost of 3', () => {
      expect(GUEST_TYPE_COSTS['RICH_PAL']).toBe(3);
    });

    /**
     * WILD_BUDDY is not purchasable (null cost)
     * **Validates: Requirements 1.4**
     */
    it('should assign WILD_BUDDY a cost of null', () => {
      expect(GUEST_TYPE_COSTS['WILD_BUDDY']).toBeNull();
    });
  });

  describe('SHOP_GUESTS', () => {
    /**
     * SHOP_GUESTS has exactly 4 OLD_FRIEND entries
     * **Validates: Requirements 7.1**
     */
    it('should have 4 OLD_FRIEND entries', () => {
      const oldFriends = SHOP_GUESTS.filter(g => g.type === 'OLD_FRIEND');
      expect(oldFriends).toHaveLength(4);
    });

    /**
     * SHOP_GUESTS has exactly 4 RICH_PAL entries
     * **Validates: Requirements 7.2**
     */
    it('should have 4 RICH_PAL entries', () => {
      const richPals = SHOP_GUESTS.filter(g => g.type === 'RICH_PAL');
      expect(richPals).toHaveLength(4);
    });

    /**
     * SHOP_GUESTS has no WILD_BUDDY entries
     * **Validates: Requirements 1.4**
     */
    it('should have no WILD_BUDDY entries', () => {
      const wildBuddies = SHOP_GUESTS.filter(g => g.type === 'WILD_BUDDY');
      expect(wildBuddies).toHaveLength(0);
    });

    /**
     * OLD_FRIEND names are Matt, Chad, Wes, Caleb
     * **Validates: Requirements 7.1**
     */
    it('should have OLD_FRIEND names Matt, Chad, Wes, Caleb', () => {
      const names = SHOP_GUESTS
        .filter(g => g.type === 'OLD_FRIEND')
        .map(g => g.name)
        .sort();
      expect(names).toEqual(['Caleb', 'Chad', 'Matt', 'Wes']);
    });

    /**
     * RICH_PAL names are Kevin, Arlene, Robert, Jim
     * **Validates: Requirements 7.2**
     */
    it('should have RICH_PAL names Kevin, Arlene, Robert, Jim', () => {
      const names = SHOP_GUESTS
        .filter(g => g.type === 'RICH_PAL')
        .map(g => g.name)
        .sort();
      expect(names).toEqual(['Arlene', 'Jim', 'Kevin', 'Robert']);
    });
  });
});

/**
 * Unit Tests for Monkey Guest Type Constants
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 3.1, 4.1**
 */
describe('Guest Model - Monkey Constants', () => {
  describe('GUEST_TYPE_DEFAULTS', () => {
    /**
     * MONKEY exists with correct popularityValue, troubleValue, and moneyValue
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should define MONKEY with popularityValue 4, troubleValue 1, moneyValue 0', () => {
      expect(GUEST_TYPE_DEFAULTS['MONKEY']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['MONKEY'].popularityValue).toBe(4);
      expect(GUEST_TYPE_DEFAULTS['MONKEY'].troubleValue).toBe(1);
      expect(GUEST_TYPE_DEFAULTS['MONKEY'].moneyValue).toBe(0);
    });
  });

  describe('GUEST_TYPE_LABELS', () => {
    /**
     * MONKEY label is 'Monkey'
     * **Validates: Requirements 1.3**
     */
    it('should map MONKEY to label "Monkey"', () => {
      expect(GUEST_TYPE_LABELS['MONKEY']).toBe('Monkey');
    });
  });

  describe('GUEST_TYPE_COSTS', () => {
    /**
     * MONKEY costs 3 popularity
     * **Validates: Requirements 2.1**
     */
    it('should assign MONKEY a cost of 3', () => {
      expect(GUEST_TYPE_COSTS['MONKEY']).toBe(3);
    });
  });

  describe('SHOP_GUESTS', () => {
    /**
     * SHOP_GUESTS has exactly 4 MONKEY entries with names George, Punch, Darwin, Diddy
     * **Validates: Requirements 3.1**
     */
    it('should have exactly 4 MONKEY entries with names George, Punch, Darwin, Diddy', () => {
      const monkeys = SHOP_GUESTS.filter(g => g.type === 'MONKEY');
      expect(monkeys).toHaveLength(4);

      const names = monkeys.map(g => g.name).sort();
      expect(names).toEqual(['Darwin', 'Diddy', 'George', 'Punch']);
    });
  });

  describe('INITIAL_GUESTS', () => {
    /**
     * INITIAL_GUESTS has zero MONKEY entries
     * **Validates: Requirements 4.1**
     */
    it('should have zero MONKEY entries', () => {
      const monkeys = INITIAL_GUESTS.filter(g => g.type === 'MONKEY');
      expect(monkeys).toHaveLength(0);
    });
  });
});

/**
 * Unit Tests for New Guest Type Model Constants (Auctioneer, Gangster, Rock Star, Gambler)
 *
 * **Validates: Requirements 1.1–1.4, 2.1–2.4, 3.1–3.4, 4.1–4.4, 5.1–5.6, 6.1–6.3**
 */
describe('Guest Model - New Guest Types (Auctioneer, Gangster, Rock Star, Gambler)', () => {
  describe('GUEST_TYPE_DEFAULTS', () => {
    /**
     * AUCTIONEER has popularityValue 0, troubleValue 0, moneyValue 3
     * **Validates: Requirements 1.2**
     */
    it('should define AUCTIONEER with popularityValue 0, troubleValue 0, moneyValue 3', () => {
      expect(GUEST_TYPE_DEFAULTS['AUCTIONEER']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['AUCTIONEER'].popularityValue).toBe(0);
      expect(GUEST_TYPE_DEFAULTS['AUCTIONEER'].troubleValue).toBe(0);
      expect(GUEST_TYPE_DEFAULTS['AUCTIONEER'].moneyValue).toBe(3);
    });

    /**
     * GANGSTER has popularityValue 0, troubleValue 1, moneyValue 4
     * **Validates: Requirements 2.2**
     */
    it('should define GANGSTER with popularityValue 0, troubleValue 1, moneyValue 4', () => {
      expect(GUEST_TYPE_DEFAULTS['GANGSTER']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['GANGSTER'].popularityValue).toBe(0);
      expect(GUEST_TYPE_DEFAULTS['GANGSTER'].troubleValue).toBe(1);
      expect(GUEST_TYPE_DEFAULTS['GANGSTER'].moneyValue).toBe(4);
    });

    /**
     * ROCK_STAR has popularityValue 3, troubleValue 1, moneyValue 2
     * **Validates: Requirements 3.2**
     */
    it('should define ROCK_STAR with popularityValue 3, troubleValue 1, moneyValue 2', () => {
      expect(GUEST_TYPE_DEFAULTS['ROCK_STAR']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['ROCK_STAR'].popularityValue).toBe(3);
      expect(GUEST_TYPE_DEFAULTS['ROCK_STAR'].troubleValue).toBe(1);
      expect(GUEST_TYPE_DEFAULTS['ROCK_STAR'].moneyValue).toBe(2);
    });

    /**
     * GAMBLER has popularityValue 2, troubleValue 1, moneyValue 3
     * **Validates: Requirements 4.2**
     */
    it('should define GAMBLER with popularityValue 2, troubleValue 1, moneyValue 3', () => {
      expect(GUEST_TYPE_DEFAULTS['GAMBLER']).toBeDefined();
      expect(GUEST_TYPE_DEFAULTS['GAMBLER'].popularityValue).toBe(2);
      expect(GUEST_TYPE_DEFAULTS['GAMBLER'].troubleValue).toBe(1);
      expect(GUEST_TYPE_DEFAULTS['GAMBLER'].moneyValue).toBe(3);
    });
  });

  describe('GUEST_TYPE_LABELS', () => {
    /**
     * New types have correct display labels
     * **Validates: Requirements 1.3, 2.3, 3.3, 4.3**
     */
    it('should map AUCTIONEER to "Auctioneer"', () => {
      expect(GUEST_TYPE_LABELS['AUCTIONEER']).toBe('Auctioneer');
    });

    it('should map GANGSTER to "Gangster"', () => {
      expect(GUEST_TYPE_LABELS['GANGSTER']).toBe('Gangster');
    });

    it('should map ROCK_STAR to "Rock Star"', () => {
      expect(GUEST_TYPE_LABELS['ROCK_STAR']).toBe('Rock Star');
    });

    it('should map GAMBLER to "Gambler"', () => {
      expect(GUEST_TYPE_LABELS['GAMBLER']).toBe('Gambler');
    });
  });

  describe('GUEST_TYPE_COSTS', () => {
    /**
     * New types have correct purchase costs
     * **Validates: Requirements 1.4, 2.4, 3.4, 4.4**
     */
    it('should assign AUCTIONEER a cost of 9', () => {
      expect(GUEST_TYPE_COSTS['AUCTIONEER']).toBe(9);
    });

    it('should assign GANGSTER a cost of 6', () => {
      expect(GUEST_TYPE_COSTS['GANGSTER']).toBe(6);
    });

    it('should assign ROCK_STAR a cost of 5', () => {
      expect(GUEST_TYPE_COSTS['ROCK_STAR']).toBe(5);
    });

    it('should assign GAMBLER a cost of 7', () => {
      expect(GUEST_TYPE_COSTS['GAMBLER']).toBe(7);
    });
  });

  describe('SHOP_GUESTS - new type entries', () => {
    /**
     * SHOP_GUESTS has exactly 4 AUCTIONEER entries with correct names
     * **Validates: Requirements 5.1**
     */
    it('should have exactly 4 AUCTIONEER entries with names Christie, Sotheby, Phillip, Bonham', () => {
      const auctioneers = SHOP_GUESTS.filter(g => g.type === 'AUCTIONEER');
      expect(auctioneers).toHaveLength(4);

      const names = auctioneers.map(g => g.name).sort();
      expect(names).toEqual(['Bonham', 'Christie', 'Phillip', 'Sotheby']);
    });

    /**
     * SHOP_GUESTS has exactly 4 GANGSTER entries with correct names
     * **Validates: Requirements 5.2**
     */
    it('should have exactly 4 GANGSTER entries with names Tony, Legs, Louie, Johnny', () => {
      const gangsters = SHOP_GUESTS.filter(g => g.type === 'GANGSTER');
      expect(gangsters).toHaveLength(4);

      const names = gangsters.map(g => g.name).sort();
      expect(names).toEqual(['Johnny', 'Legs', 'Louie', 'Tony']);
    });

    /**
     * SHOP_GUESTS has exactly 4 ROCK_STAR entries with correct names
     * **Validates: Requirements 5.3**
     */
    it('should have exactly 4 ROCK_STAR entries with names Alanis, Gord, Neil, Randy', () => {
      const rockStars = SHOP_GUESTS.filter(g => g.type === 'ROCK_STAR');
      expect(rockStars).toHaveLength(4);

      const names = rockStars.map(g => g.name).sort();
      expect(names).toEqual(['Alanis', 'Gord', 'Neil', 'Randy']);
    });

    /**
     * SHOP_GUESTS has exactly 4 GAMBLER entries with correct names
     * **Validates: Requirements 5.4**
     */
    it('should have exactly 4 GAMBLER entries with names Kenny, Ace, Jack, Raymond', () => {
      const gamblers = SHOP_GUESTS.filter(g => g.type === 'GAMBLER');
      expect(gamblers).toHaveLength(4);

      const names = gamblers.map(g => g.name).sort();
      expect(names).toEqual(['Ace', 'Jack', 'Kenny', 'Raymond']);
    });

    /**
     * SHOP_GUESTS has exactly 56 total entries (48 previous + 8 new overflow guests)
     * **Validates: Requirements 5.6**
     */
    it('should have exactly 56 total entries', () => {
      expect(SHOP_GUESTS).toHaveLength(56);
    });
  });

  describe('INITIAL_GUESTS - new types excluded', () => {
    /**
     * INITIAL_GUESTS has zero entries for any new type
     * **Validates: Requirements 6.1**
     */
    it('should have zero AUCTIONEER, GANGSTER, ROCK_STAR, or GAMBLER entries', () => {
      const newTypeGuests = INITIAL_GUESTS.filter(g =>
        g.type === 'AUCTIONEER' || g.type === 'GANGSTER' || g.type === 'ROCK_STAR' || g.type === 'GAMBLER'
      );
      expect(newTypeGuests).toHaveLength(0);
    });

    /**
     * INITIAL_GUESTS remains at exactly 10 entries
     * **Validates: Requirements 6.3**
     */
    it('should remain at exactly 10 entries', () => {
      expect(INITIAL_GUESTS).toHaveLength(10);
    });
  });
});
