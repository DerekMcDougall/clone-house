import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { GamePhase, GameState } from '../models';
import { ChoiceOption, ChoiceRequest, EffectContext, GameEffect, GameStateView } from '../models/effect-context';
import { admitGuest, createGuest, createGuestIdSource, Guest, GuestType, WINNING_STAR_COUNT } from '../models/guest.model';
import { DEFAULT_GAME_SETUP, GameSetup, validateGameSetup } from '../models/game-setup';
import { getGuestType, guestTypeLabel } from '../models/guest-type-registry';

export type { EffectContext };

class EffectContextImpl implements EffectContext {
  private _deck: Guest[];
  private _party: Guest[];
  private _discard: Guest[];
  private _popularity: number;
  private _money: number;
  // What the effect enqueues and requests, in order
  readonly queued: QueueEntry[] = [];

  constructor(
    deck: Guest[],
    party: Guest[],
    discard: Guest[],
    popularity: number,
    money: number
  ) {
    this._deck = deck;
    this._party = party;
    this._discard = discard;
    this._popularity = popularity;
    this._money = money;
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
    const updated = { ...updater(guest), id: guest.id };
    this._party = this._party.map(g => (g.id === guest.id ? updated : g));
    return updated;
  }

  enqueue(effect: GameEffect): void { this.queued.push({ kind: 'effect', run: effect }); }
  requestChoice(request: ChoiceRequest): void { this.queued.push({ kind: 'choice', request }); }
}

// An entry on the effect queue: an effect to run, or a choice to ask the player.
export type QueueEntry =
  | { kind: 'effect'; run: GameEffect }
  | { kind: 'choice'; request: ChoiceRequest };

// The choice the player has to make now. `resume` carries on with the chosen option: for an
// effect's choice it runs onChoose and the rest of the queue; for ban selection it applies
// the ban.
export interface ActiveChoice {
  source: 'effect' | 'ban';
  prompt: string;
  options: ChoiceOption[];
  confirmMessage?: (option: ChoiceOption) => string;
  selectedOptionId: string | null;
  sourceGuestId?: string;
  resume: (option: ChoiceOption) => void;
}

// What the choice panel shows.
export interface PendingChoice {
  prompt: string;
  options: ChoiceOption[];
  // The confirmation message for the selected option, while it awaits OK.
  confirmation: string | null;
  sourceGuestId: string | null;
}

export const BAN_PROMPT = 'Who takes the blame?';

export interface ShopInventoryEntry {
  type: GuestType;
  guests: Guest[];
  cost: number;
}

export type PurchaseResult =
  | { success: true; guestType: GuestType }
  | { success: false; error: 'sold_out'; message: string }
  | { success: false; error: 'insufficient_popularity'; message: string }
  | { success: false; error: 'choice_pending'; message: string };

export type ExpansionPurchaseResult =
  | { success: true }
  | { success: false; error: 'insufficient_money'; message: string }
  | { success: false; error: 'sold_out'; message: string }
  | { success: false; error: 'choice_pending'; message: string };

export interface GameStoreState extends GameState {
  deck: Guest[];
  party: Guest[];
  discard: Guest[];
  showEmptyDeckMessage: boolean;
  isPartyShutdown: boolean;
  bustPartySnapshot: Guest[];
  shopInventory: ShopInventoryEntry[];
  houseCapacity: number;
  expansionsPurchased: number;
  showHouseFullMessage: boolean;
  isOverflowShutdown: boolean;
  isVictory: boolean;
  // The effect queue, as a stack: the last entry runs next. Saved here so resolution can
  // pause for a choice.
  pendingEffects: QueueEntry[];
  choice: ActiveChoice | null;
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
  bustPartySnapshot: [],
  shopInventory: [],
  houseCapacity: 5,
  expansionsPurchased: 0,
  showHouseFullMessage: false,
  isOverflowShutdown: false,
  isVictory: false,
  pendingEffects: [],
  choice: null
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
      store.choice() === null &&
      !store.isVictory()
    ),

    isAwaitingChoice: computed(() => store.choice() !== null),

    pendingChoice: computed((): PendingChoice | null => {
      const choice = store.choice();
      if (!choice) return null;
      const selected = choice.options.find(o => o.id === choice.selectedOptionId);
      return {
        prompt: choice.prompt,
        options: choice.options,
        confirmation: selected && choice.confirmMessage ? choice.confirmMessage(selected) : null,
        sourceGuestId: choice.sourceGuestId ?? null
      };
    }),

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

    purchasableShopItems: computed(() => {
      const inventory = store.shopInventory();
      return [...inventory].sort((a, b) => {
        if (a.cost !== b.cost) return a.cost - b.cost;
        const labelA = guestTypeLabel(a.type);
        const labelB = guestTypeLabel(b.type);
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

    // Read-only view of the game, for working out a choice's options
    const view: GameStateView = {
      getDeck: () => store.deck(),
      getParty: () => store.party(),
      getDiscard: () => store.discard(),
      getPopularity: () => store.popularity(),
      getMoney: () => store.money()
    };

    // Puts entries on the queue so the first of them runs next.
    const pushEntries = (entries: readonly QueueEntry[]): void => {
      patchState(store, { pendingEffects: [...store.pendingEffects(), ...[...entries].reverse()] });
    };

    // Shuts the party down: the party is kept aside for ban selection, the discard pile goes
    // back to the deck, and any effects and choices still queued are dropped.
    const bust = (isOverflow: boolean): void => {
      patchState(store, {
        deck: [...store.deck(), ...store.discard()],
        party: [],
        discard: [],
        bustPartySnapshot: [...store.party()],
        isPartyShutdown: true,
        isOverflowShutdown: isOverflow,
        pendingEffects: [],
        choice: null
      });
    };

    const startChoice = (
      source: ActiveChoice['source'],
      info: Pick<ChoiceRequest, 'prompt' | 'confirmMessage' | 'sourceGuestId'>,
      options: ChoiceOption[],
      resume: (option: ChoiceOption) => void
    ): void => {
      patchState(store, {
        choice: {
          source,
          prompt: info.prompt,
          options,
          confirmMessage: info.confirmMessage?.bind(info),
          selectedOptionId: null,
          sourceGuestId: info.sourceGuestId,
          resume
        }
      });
    };

    // Runs queued entries, depth-first: the entries an effect queues run, in the order
    // queued, before any entry that was already waiting, so a newly arrived guest's entrance
    // effect interrupts the effect that admitted it. State is committed after each effect,
    // then checked for overflow and trouble; a bust shuts the party down and drops whatever
    // is still queued. A choice pauses resolution, with the rest of the queue kept in
    // pendingEffects, until the player answers.
    const runQueue = (): void => {
      while (store.pendingEffects().length > 0 && !store.choice()) {
        const stack = [...store.pendingEffects()];
        const entry = stack.pop()!;
        patchState(store, { pendingEffects: stack });

        if (entry.kind === 'choice') {
          const { request } = entry;
          // Options come from the game as it is now, which may differ from when it was requested
          const options = request.options(view);
          if (options.length === 0) continue;

          startChoice('effect', request, options, (option) => {
            pushEntries([{ kind: 'effect', run: (ctx) => request.onChoose(ctx, option) }]);
            runQueue();
          });
          return;
        }

        const ctx = new EffectContextImpl(
          store.deck(),
          store.party(),
          store.discard(),
          store.popularity(),
          store.money()
        );
        entry.run(ctx);
        pushEntries(ctx.queued);

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
          bust(isOverflow);
          return;
        }
      }
    };

    // Resolves an effect and everything it queues.
    const resolveEffects = (effect: GameEffect): void => {
      pushEntries([{ kind: 'effect', run: effect }]);
      runQueue();
    };

    // The ban outcome: the chosen guest sits out the next party in the discard pile, the
    // rest of the bust party is shuffled into the deck, and the next turn starts.
    const applyBan = (banned: Guest): void => {
      const remaining = store.bustPartySnapshot().filter(g => g.id !== banned.id);
      const updatedDeck = [...store.deck(), ...remaining];
      shuffleDeck(updatedDeck);

      patchState(store, {
        discard: [banned],
        deck: updatedDeck,
        bustPartySnapshot: [],
        currentTurn: store.currentTurn() + 1,
        currentPhase: GamePhase.BUY
      });
    };

    const resolveChoice = (choice: ActiveChoice, option: ChoiceOption): void => {
      patchState(store, { choice: null });
      choice.resume(option);
    };

    const selectChoiceOption = (optionId: string): void => {
      const choice = store.choice();
      const option = choice?.options.find(o => o.id === optionId);
      if (!choice || !option) return;

      if (choice.confirmMessage) {
        patchState(store, { choice: { ...choice, selectedOptionId: optionId } });
      } else {
        resolveChoice(choice, option);
      }
    };

    const confirmChoice = (): void => {
      const choice = store.choice();
      const option = choice?.options.find(o => o.id === choice.selectedOptionId);
      if (!choice || !option) return;
      resolveChoice(choice, option);
    };

    return {
      // The setup decides which guests this game starts with and stocks in the shop.
      initializeGame(turnCount: number = 25, setup: GameSetup = DEFAULT_GAME_SETUP): void {
        if (turnCount <= 0) {
          throw new Error('Turn count must be greater than zero');
        }
        validateGameSetup(setup);

        // One id source for the whole game, so every guest's id is unique
        const nextId = createGuestIdSource();

        const deck: Guest[] = setup.startingDeck.map(({ type, name }) => createGuest(type, name, nextId));
        shuffleDeck(deck);

        // Costs are read once here, so the shop keeps its prices for the whole game
        const shopInventory: ShopInventoryEntry[] = setup.shop.map(({ type, names }) => ({
          type,
          guests: names.map(name => createGuest(type, name, nextId)),
          cost: getGuestType(type).cost!
        }));

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
          bustPartySnapshot: [],
          shopInventory,
          houseCapacity: 5,
          expansionsPurchased: 0,
          showHouseFullMessage: false,
          isOverflowShutdown: false,
          isVictory: false,
          pendingEffects: [],
          choice: null
        });
      },
      
      inviteGuest(): void {
        // No inviting while a bust is being resolved, a choice (including ban selection) is
        // waiting, or after a win
        if (store.isPartyShutdown() || store.isAwaitingChoice() || store.isVictory()) {
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
        if (store.isAwaitingChoice()) return;
        
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
        bust(false);
      },

      triggerOverflowShutdown(): void {
        bust(true);
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
            bustPartySnapshot: []
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
            currentTurn: currentTurn + 1,
            currentPhase: GamePhase.BUY
          });
        } else {
          // Non-final turn with trouble shutdown: the player picks a bust guest to ban
          patchState(store, { isPartyShutdown: false });
          startChoice(
            'ban',
            {
              prompt: BAN_PROMPT,
              confirmMessage: (o) => `${guestTypeLabel(o.guest!.type)} ${o.guest!.name} will be banned from the next party.`
            },
            store.bustPartySnapshot().map(g => ({ id: g.id, label: `Ban ${g.name}`, guest: g })),
            (option) => applyBan(option.guest!)
          );
        }
      },

      selectChoiceOption,
      confirmChoice,

      purchaseGuest(type: GuestType): PurchaseResult {
        if (store.isAwaitingChoice()) {
          return { success: false, error: 'choice_pending', message: 'Finish choosing first!' };
        }
        const inventory = store.shopInventory();
        const entry = inventory.find(e => e.type === type);

        if (!entry || entry.guests.length === 0) {
          const label = guestTypeLabel(type);
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
        if (store.isAwaitingChoice()) {
          return { success: false, error: 'choice_pending', message: 'Finish choosing first!' };
        }
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
