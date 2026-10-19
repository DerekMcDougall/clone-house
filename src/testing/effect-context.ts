import { ChoiceOption, ChoiceRequest, EffectContext, GameEffect, QueueEntry } from '../app/models/effect-context';
import { Guest } from '../app/models/guest.model';

// An in-memory EffectContext for running effects without the store. resolve() runs effects
// the way the store's runQueue() does: depth-first, with the entries an effect queues
// running, in order, before any entry already waiting. A choice with options pauses
// resolution until choose() is called. There are no bust checks.
export class TestEffectContext implements EffectContext {
  deck: Guest[];
  party: Guest[];
  discard: Guest[] = [];
  popularity = 0;
  money = 0;
  houseCapacity: number;
  // The choice resolution is paused on, with the options worked out when it was reached
  pendingChoice: { request: ChoiceRequest; options: ChoiceOption[] } | null = null;
  private queued: QueueEntry[] = [];
  private stack: QueueEntry[] = [];

  constructor({ deck = [], party = [], houseCapacity = 5 }: { deck?: Guest[]; party?: Guest[]; houseCapacity?: number } = {}) {
    this.deck = deck;
    this.party = party;
    this.houseCapacity = houseCapacity;
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
  getHouseCapacity(): number { return this.houseCapacity; }

  // Same as the store's: applies the updater to `guest` and replaces the party guest with its id.
  updateGuest(guest: Guest, updater: (g: Guest) => Guest): Guest {
    const updated = { ...updater(guest), id: guest.id };
    this.party = this.party.map(g => (g.id === guest.id ? updated : g));
    return updated;
  }

  enqueue(effect: GameEffect): void { this.queued.push({ kind: 'effect', run: effect }); }
  requestChoice(request: ChoiceRequest): void { this.queued.push({ kind: 'choice', request }); }

  // Runs the given effect, if any, then everything queued, until nothing is left or a
  // choice is reached. Throws while a choice is pending, since the store can't resolve
  // anything then either.
  resolve(effect?: GameEffect): void {
    if (this.pendingChoice) throw new Error('A choice is pending; call choose() first');
    if (effect) this.enqueue(effect);
    this.flush();
    while (this.stack.length > 0 && !this.pendingChoice) {
      const entry = this.stack.pop()!;
      if (entry.kind === 'choice') {
        const options = entry.request.options(this);
        if (options.length > 0) this.pendingChoice = { request: entry.request, options };
      } else {
        entry.run(this);
        this.flush();
      }
    }
  }

  // Answers the pending choice and carries on resolving.
  choose(optionId: string): void {
    if (!this.pendingChoice) throw new Error('No choice is pending');
    const { request, options } = this.pendingChoice;
    const option = options.find(o => o.id === optionId);
    if (!option) throw new Error(`No option "${optionId}"`);
    this.pendingChoice = null;
    this.resolve((ctx) => request.onChoose(ctx, option));
  }

  private flush(): void {
    this.stack.push(...this.queued.reverse());
    this.queued = [];
  }
}
