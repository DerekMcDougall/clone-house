import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { Guest } from '../app/models/guest.model';
import { GameStore } from '../app/stores/game.store';

// Starts ban selection over the given bust party the way the game does: a trouble bust,
// acknowledged on a non-final turn. With selectedIndex, also selects that guest, so the
// confirmation is showing. Leaves the deck, party and discard pile as they are.
export function startBanSelection(
  store: InstanceType<typeof GameStore>,
  bustParty: Guest[],
  selectedIndex?: number
): void {
  if (store.currentTurn() >= store.totalTurns()) {
    throw new Error('startBanSelection needs a non-final turn; the final turn ends the game instead');
  }
  patchState(unprotected(store), { bustPartySnapshot: bustParty, isPartyShutdown: true, isOverflowShutdown: false });
  store.acknowledgeShutdown();
  if (selectedIndex !== undefined) store.selectGuestToBan(selectedIndex);
}
