import type { EffectContext, GameEffect } from './effect-context';
import type { Guest } from './guest.model';
import { findGuestType } from './guest-type-registry';

// These are function declarations, initialized before any module body runs, so the
// built-in guest type definitions can refer to them despite the module cycle
// (guest-effects -> registry -> built-in types -> guest-effects).

// Adds a guest to the party, then enqueues its entrance effect (if any).
export function admitGuest(guest: Guest): GameEffect {
  return (ctx) => {
    ctx.setParty([...ctx.getParty(), guest]);

    const entranceEffect = findGuestType(guest.type)?.entranceEffect;
    if (entranceEffect) {
      ctx.enqueue((c) => entranceEffect(c, guest));
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
