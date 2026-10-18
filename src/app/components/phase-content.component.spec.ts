import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GUEST_TYPE_DEFAULTS } from '../models/guest.model';
import { GameStore } from '../stores/game.store';
import { PhaseContentComponent } from './phase-content.component';
import { registerTestGuestType, testGuest } from '../../testing/guests';
import { startBanSelection } from '../../testing/ban';
import { resetGuestTypesForTesting } from '../models/guest-type-registry';
import { DEFAULT_GAME_SETUP, GameSetup } from '../models/game-setup';

// The card whose header is `label`, so tests don't depend on where it sorts in the shop
const cardLabeled = (cards: NodeListOf<Element>, label: string): Element | undefined =>
  Array.from(cards).find(card => card.querySelector('.card-header')?.textContent?.trim() === label);

describe('PhaseContentComponent', () => {
  let component: PhaseContentComponent;
  let fixture: ComponentFixture<PhaseContentComponent>;
  let gameStore: InstanceType<typeof GameStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseContentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PhaseContentComponent);
    component = fixture.componentInstance;
    gameStore = TestBed.inject(GameStore);
    
    // Initialize game for tests that need it
    gameStore.initializeGame();
  });

  it('should create', () => {
    component.phase = GamePhase.BUY;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Buy Phase Rendering', () => {
    it('should render Shop heading when phase is BUY', () => {
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('h2');

      expect(heading).toBeTruthy();
      expect(heading?.textContent?.trim()).toBe('Shop');
    });

    it('should render phase-content container in BUY phase', () => {
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.phase-content');

      expect(container).toBeTruthy();
    });
  });

  describe('Party Phase Rendering', () => {
    it('should render Party heading when phase is PARTY', () => {
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('h2');

      expect(heading).toBeTruthy();
      expect(heading?.textContent?.trim()).toBe('Party');
    });

    it('should render phase-content container in PARTY phase', () => {
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.phase-content');

      expect(container).toBeTruthy();
    });
  });

  describe('Guest Display', () => {
    it('should render guest cards during Party phase', () => {
      // Advance to Party phase
      gameStore.advancePhase();
      patchState(unprotected(gameStore), { baseTroubleLimit: 100 });

      // Invite some guests
      gameStore.inviteGuest();
      gameStore.inviteGuest();
      gameStore.inviteGuest();
      
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const guestCards = compiled.querySelectorAll('app-guest-card');

      expect(guestCards.length).toBe(3);
    });

    it('should render one card per guest when two party guests share a name', () => {
      // guest-identity Requirement 4.3: tracking by name would give Angular duplicate keys
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        patchState(unprotected(gameStore), { party: [testGuest('OLD_FRIEND', 'Matt'), testGuest('OLD_FRIEND', 'Matt')] });
        component.phase = GamePhase.PARTY;
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelectorAll('app-guest-card').length).toBe(2);
        expect(warn.mock.calls.some(args => String(args[0]).includes('NG0955'))).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });

    it('should hide guest cards during BUY phase', () => {
      // Start in BUY phase, invite some guests (shouldn't happen in real game but testing component behavior)
      gameStore.inviteGuest();
      gameStore.inviteGuest();
      
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const guestCards = compiled.querySelectorAll('app-guest-card');
      const guestCardsContainer = compiled.querySelector('.guest-cards-container');

      // Guest cards should not be rendered in BUY phase
      expect(guestCards.length).toBe(0);
      expect(guestCardsContainer).toBeFalsy();
    });

    it('should display "No more guests!" message when deck empty and button clicked', () => {
      // Advance to Party phase
      gameStore.advancePhase();
      
      // Raise capacity and trouble limit so we can drain the entire deck without a bust
      patchState(unprotected(gameStore), { houseCapacity: 100, baseTroubleLimit: 100 });
      
      // Invite all guests to empty the deck
      while (gameStore.canInviteGuest()) {
        gameStore.inviteGuest();
      }
      
      // Try to invite when deck is empty (this sets the message flag)
      gameStore.inviteGuest();
      
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.empty-deck-message');

      expect(message).toBeTruthy();
      expect(message?.textContent?.trim()).toBe('No more guests!');
    });

    it('should display guests in reverse chronological order (newest first)', () => {
      // Advance to Party phase
      gameStore.advancePhase();
      patchState(unprotected(gameStore), { baseTroubleLimit: 100 });

      // Invite guests one by one and track their names
      const invitedGuestNames: string[] = [];
      
      gameStore.inviteGuest();
      invitedGuestNames.push(gameStore.party()[0].name);
      
      gameStore.inviteGuest();
      invitedGuestNames.push(gameStore.party()[1].name);
      
      gameStore.inviteGuest();
      invitedGuestNames.push(gameStore.party()[2].name);
      
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      // Get the reversed party from the component
      const reversedParty = component.reversedParty();
      
      // Verify the order is reversed (newest first)
      expect(reversedParty[0].name).toBe(invitedGuestNames[2]); // Most recent
      expect(reversedParty[1].name).toBe(invitedGuestNames[1]); // Middle
      expect(reversedParty[2].name).toBe(invitedGuestNames[0]); // Oldest
    });
  });

  describe('Shutdown Modal', () => {
    it('should render shutdown modal when isPartyShutdown is true', () => {
      // Requirements: 6.1
      gameStore.initializeGame();
      gameStore.advancePhase(); // Move to PARTY phase
      patchState(unprotected(gameStore), { isPartyShutdown: true });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.shutdown-modal-overlay');
      const modal = compiled.querySelector('.shutdown-modal');

      expect(overlay).toBeTruthy();
      expect(modal).toBeTruthy();
    });

    it('should display the exact shutdown message text', () => {
      // Requirements: 6.2
      gameStore.initializeGame();
      gameStore.advancePhase();
      patchState(unprotected(gameStore), { isPartyShutdown: true });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('#shutdown-title');

      expect(title).toBeTruthy();
      expect(title?.textContent?.trim()).toBe(
        'The party has gotten out of control and has been shut down!'
      );
    });

    it('should show "End Party" button on non-final turn', () => {
      // Requirements: 6.3
      gameStore.initializeGame();
      gameStore.advancePhase();
      patchState(unprotected(gameStore), { isPartyShutdown: true, currentTurn: 1, totalTurns: 5 });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.shutdown-button');

      expect(button).toBeTruthy();
      expect(button?.textContent?.trim()).toBe('End Party');
    });

    it('should show "Game Over" button on final turn', () => {
      // Requirements: 6.4
      gameStore.initializeGame();
      gameStore.advancePhase();
      patchState(unprotected(gameStore), { isPartyShutdown: true, currentTurn: 5, totalTurns: 5 });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.shutdown-button');

      expect(button).toBeTruthy();
      expect(button?.textContent?.trim()).toBe('Game Over');
    });

    it('should not render shutdown modal when isPartyShutdown is false', () => {
      // Requirements: 6.1 (inverse)
      gameStore.initializeGame();
      gameStore.advancePhase();
      patchState(unprotected(gameStore), { isPartyShutdown: false });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.shutdown-modal-overlay');
      const modal = compiled.querySelector('.shutdown-modal');

      expect(overlay).toBeFalsy();
      expect(modal).toBeFalsy();
    });
  });

  describe('Ban Selection UI', () => {

    it('should display blame prompt when a ban is being chosen', () => {
      // Requirements: 3.3
      startBanSelection(gameStore, [testGuest('OLD_FRIEND', 'Brian')]);
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const prompt = compiled.querySelector('.choice-prompt');

      expect(prompt).toBeTruthy();
      expect(prompt?.textContent?.trim()).toBe('Who takes the blame?');
    });

    it('should render guest cards from bustPartySnapshot', () => {
      // Requirements: 3.4
      const snapshot = [
        testGuest('OLD_FRIEND', 'Brian'),
        testGuest('WILD_BUDDY', 'Anthony'),
        testGuest('RICH_PAL', 'Khalil')
      ];
      startBanSelection(gameStore, snapshot);
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const banButtons = compiled.querySelectorAll('.choice-option-button');

      expect(banButtons.length).toBe(3);
      // Each button should contain a guest card
      banButtons.forEach(btn => {
        expect(btn.querySelector('app-guest-card')).toBeTruthy();
      });
    });

    it('should show confirmation modal when a guest is picked for banning', () => {
      // Requirements: 5.1
      startBanSelection(gameStore, [testGuest('WILD_BUDDY', 'Anthony')], 0);
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.choice-confirm-overlay');
      const modal = compiled.querySelector('.choice-confirm-modal');

      expect(overlay).toBeTruthy();
      expect(modal).toBeTruthy();
    });

    it('should show correct message and OK button in confirmation modal', () => {
      // Requirements: 5.2, 5.3
      startBanSelection(gameStore, [testGuest('RICH_PAL', 'Khalil')], 0);
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('#choice-confirm-title');
      const okButton = compiled.querySelector('.choice-confirm-button');

      expect(message?.textContent?.trim()).toBe(
        'Rich Pal Khalil will be banned from the next party.'
      );
      expect(okButton).toBeTruthy();
      expect(okButton?.textContent?.trim()).toBe('OK');
    });

    it('should hide ban selection view when no ban is being chosen', () => {
      // Requirements: 3.3 (inverse)
      patchState(unprotected(gameStore), { bustPartySnapshot: [] });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const banSelection = compiled.querySelector('.choice-panel');
      const blamePrompt = compiled.querySelector('.choice-prompt');
      const banModal = compiled.querySelector('.choice-confirm-overlay');

      expect(banSelection).toBeFalsy();
      expect(blamePrompt).toBeFalsy();
      expect(banModal).toBeFalsy();
    });
  });

  describe('Shop UI', () => {
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 4.1, 4.2, 5.1, 5.2, 7.4, 9.3

    it('should render shop cards for each purchasable type during BUY phase', () => {
      // Requirements: 2.1, 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');

      // Should have 22 purchasable guest types (including the 7 star types) + 1 Expand House card = 23
      expect(shopCards.length).toBe(23);
    });

    it('should show type labels on shop cards', () => {
      // Requirements: 2.2, 7.4
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');

      const labels = Array.from(headers).map(h => h.textContent?.trim());
      expect(labels).toContain('Old Friend');
      expect(labels).toContain('Monkey');
      expect(labels).toContain('Rich Pal');
      expect(labels).toContain('Hippy');
      expect(labels).toContain('Ticket Taker');
      expect(labels).toContain('Caterer');
      expect(labels).toContain('Rock Star');
      expect(labels).toContain('Gangster');
      expect(labels).toContain('Cute Dog');
      expect(labels).toContain('Gambler');
      expect(labels).toContain('Auctioneer');
    });

    it('should show price on shop cards', () => {
      // Requirements: 2.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const prices = compiled.querySelectorAll('.shop-price');

      const priceTexts = Array.from(prices).map(p => p.textContent?.trim());
      expect(priceTexts).toContain('Price: 2');
      expect(priceTexts).toContain('Price: 3');
      expect(priceTexts).toContain('Price: 4');
      expect(priceTexts).toContain('Price: 5');
      expect(priceTexts).toContain('Price: 6');
      expect(priceTexts).toContain('Price: 7');
      expect(priceTexts).toContain('Price: 9');
    });

    it('should show available stock on shop cards', () => {
      // Requirements: 2.4
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const stocks = compiled.querySelectorAll('.shop-stock');

      // Both types start with 4 guests
      const stockTexts = Array.from(stocks).map(s => s.textContent?.trim());
      expect(stockTexts).toContain('Available: 4');
    });

    it('should render a shop card with "Monkey" label during BUY phase', () => {
      // Requirements: 7.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');
      const labels = Array.from(headers).map(h => h.textContent?.trim());

      expect(labels).toContain('Monkey');
    });

    it('should show "Price: 3" on Monkey shop card', () => {
      // Requirements: 7.2
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const monkeyCard = cardLabeled(shopCards, 'Monkey');
      const price = monkeyCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 3');
    });

    it('should show "Available: 4" on Monkey shop card initially', () => {
      // Requirements: 7.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const monkeyCard = cardLabeled(shopCards, 'Monkey');
      const stock = monkeyCard?.querySelector('.shop-stock');

      expect(stock?.textContent?.trim()).toBe('Available: 4');
    });

    it('should render a shop card with "Rock Star" label during BUY phase', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');
      const labels = Array.from(headers).map(h => h.textContent?.trim());

      expect(labels).toContain('Rock Star');
    });

    it('should show "Price: 5" on Rock Star shop card', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const rockStarCard = cardLabeled(shopCards, 'Rock Star');
      const price = rockStarCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 5');
    });

    it('should show "Available: 4" on Rock Star shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const rockStarCard = cardLabeled(shopCards, 'Rock Star');
      const stock = rockStarCard?.querySelector('.shop-stock');

      expect(stock?.textContent?.trim()).toBe('Available: 4');
    });

    it('should render a shop card with "Gangster" label during BUY phase', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');
      const labels = Array.from(headers).map(h => h.textContent?.trim());

      expect(labels).toContain('Gangster');
    });

    it('should show "Price: 6" on Gangster shop card', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const gangsterCard = cardLabeled(shopCards, 'Gangster');
      const price = gangsterCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 6');
    });

    it('should show "Available: 4" on Gangster shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const gangsterCard = cardLabeled(shopCards, 'Gangster');
      const stock = gangsterCard?.querySelector('.shop-stock');

      expect(stock?.textContent?.trim()).toBe('Available: 4');
    });

    it('should render a shop card with "Gambler" label during BUY phase', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');
      const labels = Array.from(headers).map(h => h.textContent?.trim());

      expect(labels).toContain('Gambler');
    });

    it('should show "Price: 7" on Gambler shop card', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const gamblerCard = cardLabeled(shopCards, 'Gambler');
      const price = gamblerCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 7');
    });

    it('should show "Available: 4" on Gambler shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const gamblerCard = cardLabeled(shopCards, 'Gambler');
      const stock = gamblerCard?.querySelector('.shop-stock');

      expect(stock?.textContent?.trim()).toBe('Available: 4');
    });

    it('should render a shop card with "Auctioneer" label during BUY phase', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');
      const labels = Array.from(headers).map(h => h.textContent?.trim());

      expect(labels).toContain('Auctioneer');
    });

    it('should show "Price: 9" on Auctioneer shop card', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const auctioneerCard = cardLabeled(shopCards, 'Auctioneer');
      const price = auctioneerCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 9');
    });

    it('should show "Available: 4" on Auctioneer shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const auctioneerCard = cardLabeled(shopCards, 'Auctioneer');
      const stock = auctioneerCard?.querySelector('.shop-stock');

      expect(stock?.textContent?.trim()).toBe('Available: 4');
    });

    it('should render a shop card with "Climber" label during BUY phase', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');
      const labels = Array.from(headers).map(h => h.textContent?.trim());

      expect(labels).toContain('Climber');
    });

    it('should show "Price: 12" on Climber shop card', () => {
      // Requirements: 9.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const climberCard = cardLabeled(shopCards, 'Climber');
      const price = climberCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 12');
    });

    it('should show "Available: 4" on Climber shop card on a fresh game', () => {
      // Requirements: 9.2, 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const climberCard = cardLabeled(shopCards, 'Climber');
      const stock = climberCard?.querySelector('.shop-stock');

      expect(stock?.textContent?.trim()).toBe('Available: 4');
    });

    it('should not display individual guest names on shop cards', () => {
      // Requirements: 2.2, 7.4
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopContainer = compiled.querySelector('.shop-cards-container');
      const text = shopContainer?.textContent ?? '';

      // Shop guest names should not appear
      expect(text).not.toContain('Matt');
      expect(text).not.toContain('Chad');
      expect(text).not.toContain('Wes');
      expect(text).not.toContain('Caleb');
      expect(text).not.toContain('Kevin');
      expect(text).not.toContain('Arlene');
      expect(text).not.toContain('Robert');
      expect(text).not.toContain('Jim');
      expect(text).not.toContain('George');
      expect(text).not.toContain('Punch');
      expect(text).not.toContain('Darwin');
      expect(text).not.toContain('Diddy');
      // New type guest names should not appear
      expect(text).not.toContain('Christie');
      expect(text).not.toContain('Sotheby');
      expect(text).not.toContain('Phillip');
      expect(text).not.toContain('Bonham');
      expect(text).not.toContain('Tony');
      expect(text).not.toContain('Legs');
      expect(text).not.toContain('Louie');
      expect(text).not.toContain('Johnny');
      expect(text).not.toContain('Alanis');
      expect(text).not.toContain('Gord');
      expect(text).not.toContain('Neil');
      expect(text).not.toContain('Randy');
      expect(text).not.toContain('Kenny');
      expect(text).not.toContain('Ace');
      expect(text).not.toContain('Raymond');
    });

    it('should not display shop during PARTY phase', () => {
      // Requirements: 2.5
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopContainer = compiled.querySelector('.shop-cards-container');
      const shopCards = compiled.querySelectorAll('.shop-card');

      expect(shopContainer).toBeFalsy();
      expect(shopCards.length).toBe(0);
    });

    it('should show error modal when shopErrorMessage signal is set', () => {
      // Requirements: 4.1, 5.1
      component.phase = GamePhase.BUY;
      component.shopErrorMessage.set('No Old Friend available!');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.shop-error-overlay');
      const modal = compiled.querySelector('.shop-error-modal');
      const message = compiled.querySelector('#shop-error-title');

      expect(overlay).toBeTruthy();
      expect(modal).toBeTruthy();
      expect(message?.textContent?.trim()).toBe('No Old Friend available!');
    });

    it('should dismiss error modal when OK button is clicked', () => {
      // Requirements: 4.2, 5.2
      component.phase = GamePhase.BUY;
      component.shopErrorMessage.set('Not enough popularity!');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const okButton = compiled.querySelector('.shop-error-button') as HTMLButtonElement;

      expect(okButton).toBeTruthy();
      expect(okButton?.textContent?.trim()).toBe('OK');

      // Click OK to dismiss
      okButton.click();
      fixture.detectChanges();

      // Error modal should be gone
      const overlay = compiled.querySelector('.shop-error-overlay');
      expect(overlay).toBeFalsy();
      expect(component.shopErrorMessage()).toBeNull();
    });

    it('should show "Added!" text when shopAddedFeedback matches card type', () => {
      // Requirements: 3.4
      component.phase = GamePhase.BUY;
      component.shopAddedFeedback.set('OLD_FRIEND');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const addedFeedback = compiled.querySelector('.added-feedback');

      expect(addedFeedback).toBeTruthy();
      expect(addedFeedback?.textContent?.trim()).toBe('Added!');
    });

    it('should not show "Added!" text when shopAddedFeedback is null', () => {
      // Requirements: 3.4 (inverse)
      component.phase = GamePhase.BUY;
      component.shopAddedFeedback.set(null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const addedFeedback = compiled.querySelector('.added-feedback');

      expect(addedFeedback).toBeFalsy();
    });

    it('should display shop cards in correct order: Old Friend, Monkey, Rich Pal, Hippy, Ticket Taker, Caterer, Mr. Popular, Rock Star, Werewolf, Gangster, Cute Dog, Gambler, Auctioneer, Celebrity, Climber, Dinosaur, Dragon, Mermaid, Alien, Unicorn, Leprechaun, Superhero, Expand House', () => {
      // Requirements: 9.2, 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');

      expect(Array.from(headers, h => h.textContent?.trim())).toEqual([
        'Old Friend', 'Monkey', 'Rich Pal', 'Hippy', 'Ticket Taker', 'Caterer', 'Mr. Popular', 'Rock Star',
        'Werewolf', 'Gangster', 'Cute Dog', 'Gambler', 'Auctioneer', 'Celebrity', 'Climber', 'Dinosaur', 'Dragon',
        'Mermaid', 'Alien', 'Unicorn', 'Leprechaun', 'Superhero', 'Expand House'
      ]);
    });
  });

  describe('Card Shadow Rendering', () => {

    it('should render shadow count equal to houseCapacity minus party length', () => {
      // Requirements: 8.1
      const partyGuests = [
        testGuest('OLD_FRIEND', 'Brian'),
        testGuest('WILD_BUDDY', 'Anthony')
      ];
      patchState(unprotected(gameStore), {
        currentPhase: GamePhase.PARTY,
        houseCapacity: 5,
        party: partyGuests
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shadows = compiled.querySelectorAll('.card-shadow');

      // 5 capacity - 2 guests = 3 shadows
      expect(shadows.length).toBe(3);
    });

    it('should render zero shadows when party is full', () => {
      // Requirements: 8.4
      const partyGuests = [
        testGuest('OLD_FRIEND', 'Brian'),
        testGuest('OLD_FRIEND', 'Colin'),
        testGuest('WILD_BUDDY', 'Anthony')
      ];
      patchState(unprotected(gameStore), {
        currentPhase: GamePhase.PARTY,
        houseCapacity: 3,
        party: partyGuests
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shadows = compiled.querySelectorAll('.card-shadow');

      expect(shadows.length).toBe(0);
    });

    it('should not render shadows during BUY phase', () => {
      // Requirements: 8.3
      patchState(unprotected(gameStore), {
        currentPhase: GamePhase.BUY,
        houseCapacity: 5,
        party: []
      });
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shadows = compiled.querySelectorAll('.card-shadow');

      expect(shadows.length).toBe(0);
    });
  });

  describe('House Full and Expansion Error Modals', () => {
    it('should render House Full modal when showHouseFullMessage is true', () => {
      // Requirements: 2.2
      patchState(unprotected(gameStore), { showHouseFullMessage: true });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.house-full-overlay');
      const modal = compiled.querySelector('.house-full-modal');
      const message = compiled.querySelector('#house-full-title');

      expect(overlay).toBeTruthy();
      expect(modal).toBeTruthy();
      expect(message?.textContent?.trim()).toBe('The house is full!');
    });

    it('should dismiss House Full modal on OK click', () => {
      // Requirements: 2.3
      patchState(unprotected(gameStore), { showHouseFullMessage: true });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const okButton = compiled.querySelector('.house-full-button') as HTMLButtonElement;

      expect(okButton).toBeTruthy();
      expect(okButton?.textContent?.trim()).toBe('OK');

      okButton.click();
      fixture.detectChanges();

      const overlay = compiled.querySelector('.house-full-overlay');
      expect(overlay).toBeFalsy();
    });

    it('should render Expansion Error modal with "Not enough money!" message', () => {
      // Requirements: 6.1
      component.phase = GamePhase.BUY;
      component.expansionErrorMessage.set('Not enough money!');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.expansion-error-overlay');
      const modal = compiled.querySelector('.expansion-error-modal');
      const message = compiled.querySelector('#expansion-error-title');

      expect(overlay).toBeTruthy();
      expect(modal).toBeTruthy();
      expect(message?.textContent?.trim()).toBe('Not enough money!');
    });

    it('should dismiss Expansion Error modal on OK click', () => {
      // Requirements: 6.2
      component.phase = GamePhase.BUY;
      component.expansionErrorMessage.set('Not enough money!');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const okButton = compiled.querySelector('.expansion-error-button') as HTMLButtonElement;

      expect(okButton).toBeTruthy();
      expect(okButton?.textContent?.trim()).toBe('OK');

      okButton.click();
      fixture.detectChanges();

      const overlay = compiled.querySelector('.expansion-error-overlay');
      expect(overlay).toBeFalsy();
      expect(component.expansionErrorMessage()).toBeNull();
    });
  });

  describe('Expand House Shop Item', () => {
    it('should render expansion card as last shop item during BUY phase', () => {
      // Requirements: 3.1
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const lastCard = shopCards[shopCards.length - 1];

      expect(lastCard).toBeTruthy();
      expect(lastCard.classList.contains('expand-house-card')).toBe(true);
      expect(lastCard.querySelector('.card-header')?.textContent?.trim()).toBe('Expand House');
    });

    it('should hide expansion card when stock is 0', () => {
      // Requirements: 3.3
      patchState(unprotected(gameStore), { expansionsPurchased: 29 });
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const expandCard = compiled.querySelector('.expand-house-card');

      expect(expandCard).toBeFalsy();
    });

    it('should hide expansion card during PARTY phase', () => {
      // Requirements: 3.4
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const expandCard = compiled.querySelector('.expand-house-card');

      expect(expandCard).toBeFalsy();
    });

    it('should display cost with "$" prefix', () => {
      // Requirements: 3.2
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const expandCard = compiled.querySelector('.expand-house-card');
      const price = expandCard?.querySelector('.shop-price');

      // Initial cost is $2 (min(0 + 2, 12))
      expect(price?.textContent?.trim()).toBe('$2');
    });
  });
});

/**
 * PhaseContentComponent — Victory Dialog and Star Shop Cards
 *
 * **Validates: Requirements 15.1, 15.2, 15.4, 15.5, 17.1 (star-guests-winning)**
 */
describe('PhaseContentComponent - Victory and Star Guests', () => {
  let component: PhaseContentComponent;
  let fixture: ComponentFixture<PhaseContentComponent>;
  let gameStore: InstanceType<typeof GameStore>;

  const aliens = (count: number): Guest[] =>
    Array.from({ length: count }, (_, i) => testGuest('ALIEN', `Alien${i}`));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseContentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PhaseContentComponent);
    component = fixture.componentInstance;
    gameStore = TestBed.inject(GameStore);
    gameStore.initializeGame();
  });

  const winParty = () => {
    patchState(unprotected(gameStore), { currentPhase: GamePhase.PARTY, party: aliens(4) });
    gameStore.advancePhase();
    component.phase = GamePhase.PARTY;
    fixture.detectChanges();
  };

  it('should not show the victory dialog before winning', () => {
    component.phase = GamePhase.PARTY;
    patchState(unprotected(gameStore), { currentPhase: GamePhase.PARTY, party: aliens(4) });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.victory-modal-overlay')).toBeNull();
  });

  it('should show the victory dialog with the congratulations message', () => {
    winParty();

    const overlay = fixture.nativeElement.querySelector('.victory-modal-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.querySelector('#victory-title')?.textContent?.trim()).toBe('Congrats! You threw the ultimate party!');
  });

  it('should have exactly one button labeled "Victory"', () => {
    winParty();

    const buttons = fixture.nativeElement.querySelectorAll('.victory-modal button') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toBe('Victory');
    expect(buttons[0].getAttribute('aria-label')).toBe('Victory');
  });

  it('should keep the winning party cards rendered behind the dialog', () => {
    winParty();

    const captions = Array.from(fixture.nativeElement.querySelectorAll('.guest-cards-container .card-caption') as NodeListOf<HTMLElement>)
      .map(c => c.textContent?.trim());
    expect(captions).toHaveLength(4);
    expect(captions).toContain('Alien0');
  });

  it('should complete the game and close the dialog when Victory is clicked', () => {
    winParty();

    (fixture.nativeElement.querySelector('.victory-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(gameStore.isGameComplete()).toBe(true);
    expect(gameStore.isVictory()).toBe(false);
    expect(fixture.nativeElement.querySelector('.victory-modal-overlay')).toBeNull();
  });

  it('should show a shop card with label, price and stock for each star type', () => {
    component.phase = GamePhase.BUY;
    fixture.detectChanges();

    const expected: [string, number][] = [
      ['Dinosaur', 25], ['Dragon', 30], ['Mermaid', 35], ['Alien', 40],
      ['Unicorn', 45], ['Leprechaun', 50], ['Superhero', 50]
    ];
    for (const [label, cost] of expected) {
      const card = fixture.nativeElement.querySelector(`.shop-card[aria-label="Buy ${label}"]`) as HTMLElement;
      expect(card).toBeTruthy();
      expect(card.querySelector('.card-header')?.textContent?.trim()).toBe(label);
      expect(card.querySelector('.shop-price')?.textContent?.trim()).toBe(`Price: ${cost}`);
      expect(card.querySelector('.shop-stock')?.textContent?.trim()).toBe('Available: 4');
    }
  });

  describe('Shop Card Guest Details', () => {
    function shopCard(label: string): HTMLElement {
      component.phase = GamePhase.BUY;
      fixture.detectChanges();
      const cards = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.shop-card'));
      const card = cards.find(c => c.querySelector('.card-header')?.textContent?.trim() === label);
      expect(card).toBeTruthy();
      return card!;
    }

    it('shows the Climber as first added to the deck: a plus and no popularity', () => {
      const card = shopCard('Climber');
      expect(card.querySelector('.guest-popularity')).toBeNull();
      expect(card.querySelector('.guest-icons')?.textContent?.trim()).toBe('➕');
    });

    it('shows popularity, money and two invite icons on the Celebrity card', () => {
      const card = shopCard('Celebrity');
      expect(card.querySelector('.guest-popularity .guest-value')?.textContent?.trim()).toBe('2');
      expect(card.querySelector('.guest-money .guest-value')?.textContent?.trim()).toBe('$3');
      const icons = Array.from(card.querySelectorAll('.guest-icons [role="img"]')).map(i => i.textContent?.trim());
      expect(icons).toEqual(['👤', '👤']);
    });

    it('shows the Werewolf as first added to the deck: 4 popularity, a moon and no trouble', () => {
      // werewolf-guest Requirements 4.1, 4.3
      const card = shopCard('Werewolf');
      expect(card.querySelector('.guest-popularity .guest-value')?.textContent?.trim()).toBe('4');
      const icons = Array.from(card.querySelectorAll('.guest-icons [role="img"]')).map(i => i.textContent?.trim());
      expect(icons).toEqual(['🌙']);
      expect(card.querySelector('.shop-price')?.textContent?.trim()).toBe('Price: 5');
    });

    it('keeps the "Buy <type>" accessible name', () => {
      expect(shopCard('Celebrity').getAttribute('aria-label')).toBe('Buy Celebrity');
    });

    it('describes the button with its guest details', () => {
      const card = shopCard('Celebrity');
      const describedBy = card.getAttribute('aria-describedby');
      expect(describedBy).toBe('shop-details-CELEBRITY');

      const details = (fixture.nativeElement as HTMLElement).querySelector(`#${describedBy}`);
      expect(details?.tagName.toLowerCase()).toBe('app-guest-details');
      expect(card.contains(details)).toBe(true);
    });

    it('does not add details to the Expand House card', () => {
      component.phase = GamePhase.BUY;
      fixture.detectChanges();
      const expand = (fixture.nativeElement as HTMLElement).querySelector('.expand-house-card');
      expect(expand?.querySelector('app-guest-details')).toBeNull();
      expect(expand?.querySelector('.shop-price')?.textContent?.trim()).toBe(`$${gameStore.expansionCost()}`);
    });

    it('still buys the guest when the card is clicked', () => {
      patchState(unprotected(gameStore), { popularity: 100 });
      const before = gameStore.deck().length;
      shopCard('Old Friend').click();
      fixture.detectChanges();
      expect(gameStore.deck().length).toBe(before + 1);
    });
  });
});

describe('PhaseContentComponent - Runtime Guest Types', () => {
  afterEach(() => resetGuestTypesForTesting());

  it('shows a shop card for a runtime guest type the setup stocks', async () => {
    // guest-type-registry Requirements 4.2, 5.1, 8.3
    const planner = registerTestGuestType({ id: 'TEST_PARTY_PLANNER', label: 'Party Planner', cost: 8 });
    const setup: GameSetup = {
      ...DEFAULT_GAME_SETUP,
      shop: [...DEFAULT_GAME_SETUP.shop, { type: planner, names: ['Pat', 'Sam'] }]
    };

    await TestBed.configureTestingModule({ imports: [PhaseContentComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PhaseContentComponent);
    TestBed.inject(GameStore).initializeGame(25, setup);
    fixture.componentInstance.phase = GamePhase.BUY;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('[aria-label="Buy Party Planner"]');
    expect(card).toBeTruthy();
    expect(card?.querySelector('.card-header')?.textContent?.trim()).toBe('Party Planner');
  });
});
