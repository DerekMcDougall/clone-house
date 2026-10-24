// When an effect runs. 'entrance': the guest has just joined the party. 'score': the party
// is being scored, after its normal popularity and money.
export type Trigger = 'entrance' | 'score';

export const TRIGGERS: readonly Trigger[] = ['entrance', 'score'];

// What an effect does: the name of a registered action kind (see action-kinds.ts) and
// that kind's parameters.
export interface ActionDefinition {
  kind: string;
  [param: string]: unknown;
}

// One effect of a guest type.
export interface EffectDefinition {
  trigger: Trigger;
  action: ActionDefinition;
}

const TRIGGER_PHRASES: Record<Trigger, string> = { entrance: 'on entrance', score: 'when scored' };

// How icon labels say when an effect runs, as in "Invites a guest on entrance".
export function triggerPhrase(trigger: Trigger): string {
  return TRIGGER_PHRASES[trigger];
}
