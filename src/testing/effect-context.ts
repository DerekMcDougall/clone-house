import { EffectContext, GameEffect } from '../app/models/effect-context';
import { Guest } from '../app/models/guest.model';

// An in-memory EffectContext for running effects without the store. resolve() runs effects
// the way the store's resolveEffects() does: depth-first, with the effects an effect enqueues
// running, in order, before any effect already waiting. There are no bust checks.
export class TestEffectContext implements EffectContext {
  deck: Guest[];
  party: Guest[];
  discard: Guest[] = [];
  popularity = 0;
  money = 0;
  private pending: GameEffect[] = [];

  constructor({ deck = [], party = [] }: { deck?: Guest[]; party?: Guest[] } = {}) {
    this.deck = deck;
    this.party = party;
  }

  getDeck(): Guest[] { return this.deck; }
  setDeck(deck: Guest[]): void { this.deck = deck; }
  getParty(): Guest[] { return this.party; }
  setParty(party: Guest[]): void { this.party = party; }
  getDiscard(): Guest[] { return this.discard; }
  setDiscard(discard: Guest[]): void { this.discard = discard; }
  getPopularity(): number { return this.popularity; }
  setPopularity(value: number): void { this.popularity = value; }
  getMoney(): number { return this.money; }
  setMoney(value: number): void { this.money = value; }

  // Same as the store's: applies the updater to `guest` and replaces the party guest with its id.
  updateGuest(guest: Guest, updater: (g: Guest) => Guest): Guest {
    const updated = { ...updater(guest), id: guest.id };
    this.party = this.party.map(g => (g.id === guest.id ? updated : g));
    return updated;
  }

  enqueue(effect: GameEffect): void { this.pending.push(effect); }

  // Runs the given effect, if any, then everything enqueued, until nothing is left.
  resolve(effect?: GameEffect): void {
    if (effect) this.enqueue(effect);
    const stack: GameEffect[] = [];
    const flush = () => { stack.push(...this.pending.reverse()); this.pending = []; };
    flush();
    while (stack.length > 0) {
      stack.pop()!(this);
      flush();
    }
  }
}
