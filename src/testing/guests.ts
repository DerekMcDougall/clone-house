import { Guest, GUEST_TYPE_DEFAULTS, GuestProperties, GuestType } from '../app/models/guest.model';

let counter = 0;

// Builds a guest for tests. Ids are unique within a test run (t1, t2, ...), and the
// t prefix keeps them apart from the g ids that initializeGame() assigns.
export function testGuest(type: GuestType, name: string, overrides: Partial<GuestProperties> = {}): Guest {
  return {
    id: `t${++counter}`,
    type,
    name,
    properties: { ...GUEST_TYPE_DEFAULTS[type], ...overrides }
  };
}
