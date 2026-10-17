import { runEffect } from './action-kinds';
import type { EffectContext, GameEffect } from './effect-context';
import type { Guest } from './guest.model';
import { findGuestType } from './guest-type-registry';

// These are function declarations, initialized before any module body runs, so they work
// despite the module cycle (guest-effects -> action-kinds -> guest-effects).

// Adds a guest to the party, then enqueues each of its type's entrance effects, in order.
export function admitGuest(guest: Guest): GameEffect {
  return (ctx) => {
    ctx.setParty([...ctx.getParty(), guest]);

    for (const effect of findGuestType(guest.type)?.effects ?? []) {
      if (effect.trigger === 'entrance') {
        ctx.enqueue((c) => runEffect(c, guest, effect));
      }
    }
  };
}

// Enqueues an effect that draws the top guest from the deck and admits it to the party.
// The draw happens when the effect runs, not when it is enqueued, so if a bust discards
// the queue first, the guest is never drawn and stays in the deck.
export function autoInvite(ctx: EffectContext): void {
  ctx.enqueue((c) => {
    const [guest, ...remainingDeck] = c.getDeck();
    if (!guest) return;

    c.setDeck(remainingDeck);
    admitGuest(guest)(c);
  });
}
