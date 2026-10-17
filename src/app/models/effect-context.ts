import { Guest } from './guest.model';

// A unit of work resolved by the store's resolveEffects(). Effects read and write game
// state through the context and may enqueue follow-up effects. These run, in the order
// enqueued, as soon as the current effect finishes and before any effect already waiting.
export type GameEffect = (ctx: EffectContext) => void;

// One option the player can pick.
export interface ChoiceOption {
  id: string;
  label: string;
  // The guest this option stands for, if any; the choice panel shows it as a card.
  guest?: Guest;
}

// Read-only game state, for working out a choice's options.
export interface GameStateView {
  getDeck(): readonly Guest[];
  getParty(): readonly Guest[];
  getDiscard(): readonly Guest[];
  getPopularity(): number;
  getMoney(): number;
}

// A question for the player, asked by an effect through ctx.requestChoice().
export interface ChoiceRequest {
  prompt: string;
  // Runs when the choice is reached, not when it's requested. With no options, the choice
  // is skipped and onChoose never runs.
  options(view: GameStateView): ChoiceOption[];
  // When set, picking an option shows this message with an OK button before resolving.
  confirmMessage?(option: ChoiceOption): string;
  // Runs as the next effect once the player has chosen.
  onChoose(ctx: EffectContext, option: ChoiceOption): void;
  // The guest whose effect is asking, if any.
  sourceGuestId?: string;
}

export interface EffectContext extends GameStateView {
  getDeck(): Guest[];
  setDeck(deck: Guest[]): void;
  getParty(): Guest[];
  setParty(party: Guest[]): void;
  getDiscard(): Guest[];
  setDiscard(discard: Guest[]): void;
  getPopularity(): number;
  setPopularity(value: number): void;
  getMoney(): number;
  setMoney(value: number): void;
  // Replaces the given party guest with the updater's result and returns the updated guest.
  updateGuest(guest: Guest, updater: (g: Guest) => Guest): Guest;
  enqueue(effect: GameEffect): void;
  // Queues a choice exactly where enqueue() would queue an effect. This effect finishes
  // first; resolution pauses when the choice is reached and resumes once the player answers.
  requestChoice(request: ChoiceRequest): void;
}
