import { Guest } from './guest.model';

export interface EffectContext {
  readonly guest: Guest;
  updateGuest(updater: (g: Guest) => Guest): void;
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
  autoInvite(): void;
}
