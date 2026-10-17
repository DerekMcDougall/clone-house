import { Guest, GuestProperties, GuestType } from '../app/models/guest.model';
import { EffectDefinition } from '../app/models/effect-definition';
import { GuestIcon } from '../app/models/guest-icons';
import { EffectHandler, GuestTypeDefinition } from '../app/models/guest-type';
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
// Friend's properties and isn't for sale. Call resetGuestTypesForTesting() in afterEach.
export function registerTestGuestType(def: Partial<GuestTypeDefinition> & { id: string }): GuestType {
  registerGuestType({
    label: def.id,
    cost: null,
    properties: { ...getGuestType('OLD_FRIEND').properties },
    ...def
  });
  return def.id;
}

const TEST_EFFECT_ICON: GuestIcon = { symbol: '🧪', label: 'Test effect' };

// An entrance effect written in code, for registerTestGuestType({ effects: customEntrance(...) }).
export function customEntrance(run: EffectHandler, icons: readonly GuestIcon[] = [TEST_EFFECT_ICON]): EffectDefinition[] {
  return [{ trigger: 'entrance', action: { kind: 'custom', run, icons } }];
}
