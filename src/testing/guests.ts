import { Guest, GuestProperties, GuestType } from '../app/models/guest.model';
import { GuestTypeDefinition } from '../app/models/guest-type';
import { getGuestType, registerGuestType } from '../app/models/guest-type-registry';

let counter = 0;

// Builds a guest for tests. Ids are unique within a test run (t1, t2, ...), and the
// t prefix keeps them apart from the g ids that initializeGame() assigns.
export function testGuest(type: GuestType, name: string, overrides: Partial<GuestProperties> = {}): Guest {
  return {
    id: `t${++counter}`,
    type,
    name,
    properties: { ...getGuestType(type).properties, ...overrides }
  };
}

// Registers a guest type for one test and returns its id. Unless overridden it has Old
// Friend's properties and no rosters, so it doesn't change the deck or the shop. Call
// resetGuestTypesForTesting() in afterEach.
export function registerTestGuestType(def: Partial<GuestTypeDefinition> & { id: string }): GuestType {
  registerGuestType({
    label: def.id,
    cost: null,
    properties: { ...getGuestType('OLD_FRIEND').properties },
    roster: { starting: [], shop: [] },
    ...def
  });
  return def.id;
}
