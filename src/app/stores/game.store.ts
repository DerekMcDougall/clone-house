import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { GamePhase, GameState } from '../models';
import { EffectContext, GameEffect } from '../models/effect-context';
import { admitGuest, Guest, GUEST_TYPE_COSTS, GUEST_TYPE_DEFAULTS, GUEST_TYPE_LABELS, GuestType, INITIAL_GUESTS, SHOP_GUESTS, WINNING_STAR_COUNT } from '../models/guest.model';

export type { EffectContext };

class EffectContextImpl implements EffectContext {
  private _deck: Guest[];
  private _party: Guest[];
  private _discard: Guest[];
  private _popularity: number;
  private _money: number;
  private _enqueue: (effect: GameEffect) => void;

  constructor(
    deck: Guest[],
    party: Guest[],
    discard: Guest[],
    popularity: number,
    money: number,
    enqueue: (effect: GameEffect) => void
  ) {
    this._deck = deck;
    this._party = party;
    this._discard = discard;
    this._popularity = popularity;
    this._money = money;
    this._enqueue = enqueue;
  }

  getDeck(): Guest[] { return this._deck; }
  setDeck(deck: Guest[]): void { this._deck = deck; }
  getParty(): Guest[] { return this._party; }
  setParty(party: Guest[]): void { this._party = party; }
  getDiscard(): Guest[] { return this._discard; }
  setDiscard(discard: Guest[]): void { this._discard = discard; }

  getPopularity(): number { return this._popularity; }
  setPopularity(value: number): void { this._popularity = value; }
  getMoney(): number { return this._money; }
  setMoney(value: number): void { this._money = value; }

  updateGuest(guest: Guest, updater: (g: Guest) => Guest): Guest {
    const updated = updater(guest);
    this._party = this._party.map(g => (g === guest ? updated : g));
    return updated;
  }

  enqueue(effect: GameEffect): void { this._enqueue(effect); }
}

export interface ShopInventoryEntry {
  type: GuestType;
  guests: Guest[];
  cost: number;
}

export type PurchaseResult =
  | { success: true; guestType: GuestType }
  | { success: false; error: 'sold_out'; message: string }
  | { success: false; error: 'insufficient_popularity'; message: string };

export type ExpansionPurchaseResult =
  | { success: true }
  | { success: false; error: 'insufficient_money'; message: string }
  | { success: false; error: 'sold_out'; message: string };

export interface GameStoreState extends GameState {
  deck: Guest[];
  party: Guest[];
  discard: Guest[];
  showEmptyDeckMessage: boolean;
  isPartyShutdown: boolean;
  isBanSelectionActive: boolean;
  bustPartySnapshot: Guest[];
  selectedBanGuest: Guest | null;
  shopInventory: ShopInventoryEntry[];
  houseCapacity: number;
  expansionsPurchased: number;
  showHouseFullMessage: boolean;
  isOverflowShutdown: boolean;
  isVictory: boolean;
}

const initialState: GameStoreState = {
  currentTurn: 1,
  currentPhase: GamePhase.BUY,
  totalTurns: 25,
  isGameComplete: false,
  popularity: 0,
  money: 0,
  baseTroubleLimit: 2,
  deck: [],
  party: [],
  discard: [],
  showEmptyDeckMessage: false,
  isPartyShutdown: false,
  isBanSelectionActive: false,
  bustPartySnapshot: [],
  selectedBanGuest: null,
  shopInventory: [],
  houseCapacity: 5,
  expansionsPurchased: 0,
  showHouseFullMessage: false,
  isOverflowShutdown: false,
  isVictory: false
};

export const GameStore = signalStore(
  { providedIn: 'root' },
  
  withState(initialState),
  
  withComputed((store) => ({
    remainingTurns: computed(() => 
      store.totalTurns() - store.currentTurn() + 1
    ),
    
    isFinalTurn: computed(() => 
      store.currentTurn() === store.totalTurns()
    ),
    
    phaseButtonLabel: computed(() => {
      if (store.currentPhase() === GamePhase.BUY) {
        return 'Start Party';
      }
      // Check if final turn inline since isFinalTurn is not yet available in this scope
      const isFinalTurn = store.currentTurn() === store.totalTurns();
      return isFinalTurn ? 'Game Over' : 'End Party';
    }),
    
    canInviteGuest: computed(() =>
      store.deck().length > 0 &&
      store.party().length < store.houseCapacity() &&
      !store.isPartyShutdown() &&
      !store.isBanSelectionActive() &&
      !store.isVictory()
    ),

    trouble: computed(() => {
      const party = store.party();
      return party.reduce((sum, guest) => sum + guest.properties.troubleValue, 0);
    }),

    stars: computed(() => {
      const party = store.party();
      return party.reduce((sum, guest) => sum + guest.properties.starValue, 0);
    }),

    partyTroubleLimitModifier: computed(() => {
      const party = store.party();
      return party.reduce((sum, g) => sum + g.properties.peaceValue, 0);
    }),
  })),

  withComputed((store) => ({
    effectiveTroubleLimit: computed(() =>
      Math.max(0, store.baseTroubleLimit() + store.partyTroubleLimitModifier())
    ),
    
    banConfirmationMessage: computed(() => {
      const guest = store.selectedBanGuest();
      if (!guest) return '';
      const typeLabel = GUEST_TYPE_LABELS[guest.type] ?? guest.type;
      return `${typeLabel} ${guest.name} will be banned from the next party.`;
    }),

    purchasableShopItems: computed(() => {
      const inventory = store.shopInventory();
      return [...inventory].sort((a, b) => {
        if (a.cost !== b.cost) return a.cost - b.cost;
        const labelA = GUEST_TYPE_LABELS[a.type] ?? a.type;
        const labelB = GUEST_TYPE_LABELS[b.type] ?? b.type;
        return labelA.localeCompare(labelB);
      });
    }),

    expansionCost: computed(() =>
      Math.min(store.expansionsPurchased() + 2, 12)
    ),

    expansionStock: computed(() =>
      29 - store.expansionsPurchased()
    ),

    emptySlots: computed(() =>
      Math.max(0, store.houseCapacity() - store.party().length)
    ),

    isHouseFull: computed(() =>
      store.party().length >= store.houseCapacity()
    )
  })),
  
  withMethods((store) => {
    // Private method for future extensibility
    // Will be used to determine if Buy phase should be skipped based on game conditions
    const shouldSkipBuyPhase = (): boolean => {
      return false;
    };

    // Private method to calculate popularity change from current party
    const calculatePopularityChange = (): number => {
      const party = store.party();
      return party.reduce((sum, guest) => {
        return sum + guest.properties.popularityValue;
      }, 0);
    };

    // Private method to calculate money change from current party
    const calculateMoneyChange = (): number => {
      const party = store.party();
      return party.reduce((sum, guest) => sum + guest.properties.moneyValue, 0);
    };


    // Private method to shuffle deck using Fisher-Yates algorithm
    const shuffleDeck = (deck: Guest[]): void => {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    };
    // Private method to return all guests from party to the bottom of the deck
    const returnGuestsToDeck = (): void => {
      const party = store.party();
      const deck = store.deck();

      // Move all guests from party to end of deck (maintaining party order)
      const updatedDeck = [...deck, ...party];

      patchState(store, {
        deck: updatedDeck,
        party: []
      });
    };

    // Private method to resolve an effect and every effect it enqueues, depth-first: the
    // effects an effect enqueues run, in the order enqueued, before any effect that was
    // already waiting, so a newly arrived guest's entrance effect interrupts the effect
    // that admitted it. State is committed after each effect, then checked for overflow
    // and trouble; a bust shuts the party down and discards any effects still pending.
    const resolveEffects = (initialEffect: GameEffect): void => {
      const stack: GameEffect[] = [initialEffect];

      while (stack.length > 0) {
        const effect = stack.pop()!;
        const enqueued: GameEffect[] = [];
        const ctx = new EffectContextImpl(
          store.deck(),
          store.party(),
          store.discard(),
          store.popularity(),
          store.money(),
          (next) => enqueued.push(next)
        );

        effect(ctx);
        // Reversed so the first effect enqueued is popped first
        stack.push(...enqueued.reverse());

        patchState(store, {
          deck: ctx.getDeck(),
          party: ctx.getParty(),
          discard: ctx.getDiscard(),
          popularity: ctx.getPopularity(),
          money: ctx.getMoney()
        });

        // Check overflow first (priority over trouble)
        const isOverflow = store.party().length > store.houseCapacity();
        if (isOverflow || store.trouble() > store.effectiveTroubleLimit()) {
          const partySnapshot = [...store.party()];
          patchState(store, {
            deck: [...store.deck(), ...store.discard()],
            party: [],
            discard: [],
            bustPartySnapshot: partySnapshot,
            isPartyShutdown: true,
            isOverflowShutdown: isOverflow
          });
          return;
        }
      }
    };

    return {
      initializeGame(turnCount: number = 25): void {
        if (turnCount <= 0) {
          throw new Error('Turn count must be greater than zero');
        }
        
        // Create 10 guests from INITIAL_GUESTS (4 Old Friends + 4 Wild Buddies + 2 Rich Pals)
        const deck: Guest[] = INITIAL_GUESTS.map((entry: { type: GuestType; name: string }) => ({
          type: entry.type,
          name: entry.name,
          properties: { ...GUEST_TYPE_DEFAULTS[entry.type] }
        }));
        
        // Shuffle the deck
        shuffleDeck(deck);
        
        // Build shop inventory from SHOP_GUESTS, filtering to purchasable types
        const shopMap = new Map<GuestType, Guest[]>();
        for (const entry of SHOP_GUESTS) {
          const cost = GUEST_TYPE_COSTS[entry.type];
          if (cost === null) continue; // Skip non-purchasable types
          if (!shopMap.has(entry.type)) shopMap.set(entry.type, []);
          shopMap.get(entry.type)!.push({
            type: entry.type,
            name: entry.name,
            properties: { ...GUEST_TYPE_DEFAULTS[entry.type] }
          });
        }

        const shopInventory: ShopInventoryEntry[] = [];
        for (const [type, guests] of shopMap) {
          shopInventory.push({ type, guests, cost: GUEST_TYPE_COSTS[type]! });
        }

        patchState(store, {
          currentTurn: 1,
          currentPhase: GamePhase.BUY,
          totalTurns: turnCount,
          isGameComplete: false,
          popularity: 0,
          money: 0,
          baseTroubleLimit: 2,
          deck,
          party: [],
          discard: [],
          showEmptyDeckMessage: false,
          isPartyShutdown: false,
          isBanSelectionActive: false,
          bustPartySnapshot: [],
          selectedBanGuest: null,
          shopInventory,
          houseCapacity: 5,
          expansionsPurchased: 0,
          showHouseFullMessage: false,
          isOverflowShutdown: false,
          isVictory: false
        });
      },
      
      inviteGuest(): void {
        // No inviting while a bust is being resolved (shutdown modal or ban selection) or after a win
        if (store.isPartyShutdown() || store.isBanSelectionActive() || store.isVictory()) {
          return;
        }

        const deck = store.deck();

        if (deck.length === 0) {
          patchState(store, { showEmptyDeckMessage: true });
          return;
        }

        if (store.party().length >= store.houseCapacity()) {
          patchState(store, { showHouseFullMessage: true });
          return;
        }

        patchState(store, { showEmptyDeckMessage: false, showHouseFullMessage: false });

        // Draw the top guest; admitting it (and any effects that follow) is handled by resolveEffects
        const [rawGuest, ...remainingDeck] = deck;
        patchState(store, { deck: remainingDeck });

        resolveEffects(admitGuest(rawGuest));
      },
      
      advancePhase(): void {
        if (store.isGameComplete() || store.isVictory()) {
          console.warn('Cannot advance phase: game is already complete');
          return;
        }
        
        const currentPhase = store.currentPhase();
        const currentTurn = store.currentTurn();
        const totalTurns = store.totalTurns();
        
        if (currentPhase === GamePhase.BUY) {
          patchState(store, { currentPhase: GamePhase.PARTY });
        } else if (currentPhase === GamePhase.PARTY) {
          // Ending a party with enough stars wins immediately: no settlement, no next turn.
          // The party stays in place behind the victory dialog until claimVictory().
          if (store.stars() >= WINNING_STAR_COUNT) {
            patchState(store, { isVictory: true });
            return;
          }

          const MONEY_DEFICIT_PENALTY_RATE = 7;

          // Step 1: Calculate and apply popularity from party guests
          const popularityChange = calculatePopularityChange();
          const currentPopularity = store.popularity();
          const newPopularity = Math.max(0, currentPopularity + popularityChange);

          // Step 2: Calculate money change from party guests
          const moneyChange = calculateMoneyChange();
          const currentMoney = store.money();

          // Step 3: Compute money deficit and clamp money to 0
          const moneyDeficit = Math.max(0, -(currentMoney + moneyChange));
          const newMoney = Math.max(0, currentMoney + moneyChange);

          // Step 4: Apply money deficit penalty to already-updated popularity
          const finalPopularity = moneyDeficit > 0
            ? Math.max(0, newPopularity - moneyDeficit * MONEY_DEFICIT_PENALTY_RATE)
            : newPopularity;

          patchState(store, { popularity: finalPopularity, money: newMoney });

          // Step 2: Return both party guests and discard pile to deck, then shuffle
          const party = store.party();
          const currentDiscard = store.discard();
          const currentDeck = store.deck();
          const finalDeck = [...currentDeck, ...party, ...currentDiscard];
          shuffleDeck(finalDeck);

          patchState(store, {
            deck: finalDeck,
            party: [],
            discard: [],
          });

          // Step 3: Advance turn or complete game
          if (currentTurn === totalTurns) {
            patchState(store, { isGameComplete: true });
          } else {
            patchState(store, {
              currentTurn: currentTurn + 1,
              currentPhase: GamePhase.BUY
            });
          }
        }
      },
      
      resetGame(): void {
        patchState(store, initialState);
      },

      modifyBaseTroubleLimit(delta: number): void {
        const current = store.baseTroubleLimit();
        patchState(store, { baseTroubleLimit: Math.max(0, current + delta) });
      },

      triggerPartyShutdown(): void {
        // Step 1: Snapshot the current party for ban selection
        const partySnapshot = [...store.party()];

        // Step 2: Return discard pile to deck
        const currentDiscard = store.discard();
        const currentDeck = store.deck();
        const deckWithReturned = [...currentDeck, ...currentDiscard];

        // Step 3: Clear party, discard; set shutdown flags
        patchState(store, {
          deck: deckWithReturned,
          party: [],
          discard: [],
          bustPartySnapshot: partySnapshot,
          isPartyShutdown: true,
          isOverflowShutdown: false
        });
      },

      triggerOverflowShutdown(): void {
        // Step 1: Snapshot the current party
        const partySnapshot = [...store.party()];

        // Step 2: Return discard pile to deck
        const currentDiscard = store.discard();
        const currentDeck = store.deck();
        const deckWithReturned = [...currentDeck, ...currentDiscard];

        // Step 3: Clear party, discard; set both shutdown flags
        patchState(store, {
          deck: deckWithReturned,
          party: [],
          discard: [],
          bustPartySnapshot: partySnapshot,
          isPartyShutdown: true,
          isOverflowShutdown: true
        });
      },

      acknowledgeShutdown(): void {
        const currentTurn = store.currentTurn();
        const totalTurns = store.totalTurns();
        const isOverflow = store.isOverflowShutdown();

        if (currentTurn === totalTurns) {
          // Final turn: game over regardless of shutdown type
          patchState(store, {
            isPartyShutdown: false,
            isOverflowShutdown: false,
            isGameComplete: true,
            bustPartySnapshot: [],
            selectedBanGuest: null
          });
        } else if (isOverflow) {
          // Non-final turn with overflow: return every bust party guest to the deck (no ban),
          // shuffle, skip ban selection and advance to next turn Buy phase
          const updatedDeck = [...store.deck(), ...store.bustPartySnapshot()];
          shuffleDeck(updatedDeck);

          patchState(store, {
            deck: updatedDeck,
            isPartyShutdown: false,
            isOverflowShutdown: false,
            bustPartySnapshot: [],
            selectedBanGuest: null,
            currentTurn: currentTurn + 1,
            currentPhase: GamePhase.BUY
          });
        } else {
          // Non-final turn with trouble shutdown: enter ban selection (existing behavior)
          patchState(store, {
            isPartyShutdown: false,
            isBanSelectionActive: true
          });
        }
      },

      selectGuestToBan(index: number): void {
        const snapshot = store.bustPartySnapshot();
        if (index < 0 || index >= snapshot.length) return;
        patchState(store, { selectedBanGuest: snapshot[index] });
      },

      confirmBan(): void {
        const selected = store.selectedBanGuest();
        if (!selected) return;

        const snapshot = store.bustPartySnapshot();
        const remaining = snapshot.filter(g => g !== selected);
        const currentDeck = store.deck();
        const updatedDeck = [...currentDeck, ...remaining];

        // Shuffle the deck
        shuffleDeck(updatedDeck);

        const currentTurn = store.currentTurn();

        patchState(store, {
          discard: [selected],
          deck: updatedDeck,
          isBanSelectionActive: false,
          bustPartySnapshot: [],
          selectedBanGuest: null,
          currentTurn: currentTurn + 1,
          currentPhase: GamePhase.BUY
        });
      },

      purchaseGuest(type: GuestType): PurchaseResult {
        const inventory = store.shopInventory();
        const entry = inventory.find(e => e.type === type);

        if (!entry || entry.guests.length === 0) {
          const label = GUEST_TYPE_LABELS[type] ?? type;
          return { success: false, error: 'sold_out', message: `No ${label} available!` };
        }

        const cost = entry.cost;
        const currentPopularity = store.popularity();

        if (currentPopularity < cost) {
          return { success: false, error: 'insufficient_popularity', message: 'Not enough popularity!' };
        }

        // Random selection from remaining guests
        const randomIndex = Math.floor(Math.random() * entry.guests.length);
        const selectedGuest = entry.guests[randomIndex];

        // Build updated inventory
        const updatedInventory = inventory.map(e => {
          if (e.type !== type) return e;
          return {
            ...e,
            guests: e.guests.filter((_, i) => i !== randomIndex)
          };
        });

        // Add guest to deck, deduct cost
        const updatedDeck = [...store.deck(), selectedGuest];

        patchState(store, {
          shopInventory: updatedInventory,
          deck: updatedDeck,
          popularity: currentPopularity - cost
        });

        return { success: true, guestType: type };
      },

      claimVictory(): void {
        if (!store.isVictory()) return;
        patchState(store, { isVictory: false, isGameComplete: true });
      },

      dismissHouseFullMessage(): void {
        patchState(store, { showHouseFullMessage: false });
      },

      purchaseExpansion(): ExpansionPurchaseResult {
        const purchased = store.expansionsPurchased();
        if (purchased >= 29) {
          return { success: false, error: 'sold_out', message: 'No expansions available!' };
        }

        const cost = Math.min(purchased + 2, 12);
        const currentMoney = store.money();

        if (currentMoney < cost) {
          return { success: false, error: 'insufficient_money', message: 'Not enough money!' };
        }

        patchState(store, {
          houseCapacity: store.houseCapacity() + 1,
          expansionsPurchased: purchased + 1,
          money: currentMoney - cost
        });

        return { success: true };
      }
    };
  })
);
