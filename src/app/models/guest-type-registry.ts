import { BUILT_IN_GUEST_TYPES } from './built-in-guest-types';
import { GuestTypeDefinition, validateGuestType } from './guest-type';

const registry = new Map<string, GuestTypeDefinition>();
let builtInsRegistered = false;

const add = (def: GuestTypeDefinition): void => {
  if (registry.has(def.id)) throw new Error(`Guest type "${def.id}" is already registered`);
  validateGuestType(def);
  registry.set(def.id, def);
};

// The built-ins are registered on first use rather than when this module loads: the
// built-in definitions import guest-effects, which imports this module, so at load time
// BUILT_IN_GUEST_TYPES may not exist yet.
const ensureBuiltIns = (): void => {
  if (builtInsRegistered) return;
  builtInsRegistered = true;
  BUILT_IN_GUEST_TYPES.forEach(add);
};

// Adds a guest type. Throws if the id is taken or the definition is invalid; types can't be
// replaced, because guests of the old definition may already be in play.
export function registerGuestType(def: GuestTypeDefinition): void {
  ensureBuiltIns();
  add(def);
}

export function getGuestType(id: string): GuestTypeDefinition {
  const def = findGuestType(id);
  if (!def) throw new Error(`Unknown guest type "${id}"`);
  return def;
}

export function findGuestType(id: string): GuestTypeDefinition | undefined {
  ensureBuiltIns();
  return registry.get(id);
}

// Every registered type, in registration order.
export function listGuestTypes(): GuestTypeDefinition[] {
  ensureBuiltIns();
  return [...registry.values()];
}

// The type's label, or the id itself for an unregistered type.
export function guestTypeLabel(id: string): string {
  return findGuestType(id)?.label ?? id;
}

// Removes every type except the built-ins. For tests only.
export function resetGuestTypesForTesting(): void {
  registry.clear();
  builtInsRegistered = false;
  ensureBuiltIns();
}
