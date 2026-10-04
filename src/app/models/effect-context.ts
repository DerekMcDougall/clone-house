import { Guest } from './guest.model';

// A unit of work resolved by the store's effect queue. Effects read and write game
// state through the context and may enqueue follow-up effects, which run after all
// effects already in the queue (FIFO).
export type GameEffect = (ctx: EffectContext) => void;

export interface EffectContext {
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
}
