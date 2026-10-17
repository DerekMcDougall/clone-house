import { effectProblems, GuestTypeDefinition, PROPERTY_KEYS } from './guest-type';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unknownFields = (value: Record<string, unknown>, allowed: readonly string[], prefix = ''): string[] =>
  Object.keys(value).filter(key => !allowed.includes(key)).map(key => `${prefix}${key}: unknown field`);

// Turns parsed JSON into a guest type definition, or throws one error listing every problem,
// each with its path (effects[0].action.count: expected an integer ≥ 1). Only kinds that can
// be written as data are allowed, so custom is rejected.
//
// Parsing doesn't register the type: pass the result to registerGuestType(), which also
// rejects a taken id. A parsed type is only in a game once a GameSetup includes it.
export function parseGuestTypeDefinition(json: unknown): GuestTypeDefinition {
  const problems = guestTypeJsonProblems(json);
  if (problems.length > 0) {
    const id = isObject(json) && typeof json['id'] === 'string' ? ` "${json['id']}"` : '';
    throw new Error(`Invalid guest type JSON${id}:\n${problems.map(p => `  ${p}`).join('\n')}`);
  }

  // Validated above; copy only the known fields, so the result shares nothing with the input
  const def = json as unknown as GuestTypeDefinition;
  return {
    id: def.id,
    label: def.label,
    cost: def.cost,
    properties: { ...def.properties },
    ...(def.effects !== undefined && {
      effects: def.effects.map(e => ({ trigger: e.trigger, action: { ...e.action } }))
    })
  };
}

function guestTypeJsonProblems(json: unknown): string[] {
  if (!isObject(json)) return ['expected an object'];

  const problems = unknownFields(json, ['id', 'label', 'cost', 'properties', 'effects']);

  for (const key of ['id', 'label']) {
    if (typeof json[key] !== 'string' || json[key] === '') problems.push(`${key}: expected a non-empty string`);
  }

  const cost = json['cost'];
  if (cost !== null && !(Number.isInteger(cost) && (cost as number) >= 0)) {
    problems.push('cost: expected null or a non-negative integer');
  }

  const properties = json['properties'];
  if (!isObject(properties)) {
    problems.push('properties: expected an object');
  } else {
    problems.push(...unknownFields(properties, PROPERTY_KEYS, 'properties.'));
    for (const key of PROPERTY_KEYS) {
      if (!Number.isInteger(properties[key])) problems.push(`properties.${key}: expected an integer`);
    }
  }

  if (json['effects'] !== undefined) problems.push(...effectProblems(json['effects'], true));

  return problems;
}
