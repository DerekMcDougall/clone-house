import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { Guest } from '../app/models/guest.model';
import { GameStore } from '../app/stores/game.store';

type Store = InstanceType<typeof GameStore>;

// Starts ban selection over the given bust party the way the game does: a trouble bust,
// acknowledged on a non-final turn. With selectedIndex, also picks that guest, so the
// confirmation is showing. Leaves the deck, party and discard pile as they are.
export function startBanSelection(store: Store, bustParty: Guest[], selectedIndex?: number): void {
  if (store.currentTurn() >= store.totalTurns()) {
    throw new Error('startBanSelection needs a non-final turn; the final turn ends the game instead');
  }
  patchState(unprotected(store), { bustPartySnapshot: bustParty, isPartyShutdown: true, isOverflowShutdown: false });
  store.acknowledgeShutdown();
  if (selectedIndex !== undefined) pickBan(store, selectedIndex);
}

// True while the player is choosing a bust guest to ban.
export const isChoosingBan = (store: Store): boolean => store.choice()?.source === 'ban';

// Picks the bust guest at `index`, as clicking their card does. Does nothing when there is
// no such guest or no ban to choose.
export function pickBan(store: Store, index: number): void {
  const guest = store.bustPartySnapshot()[index];
  if (guest && isChoosingBan(store)) store.selectChoiceOption(guest.id);
}

// The bust guest picked for banning, or null when none is picked.
export function pickedBan(store: Store): Guest | null {
  const choice = store.choice();
  if (choice?.source !== 'ban') return null;
  return choice.options.find(o => o.id === choice.selectedOptionId)?.guest ?? null;
}
