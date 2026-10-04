import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { Guest, GUEST_TYPE_DEFAULTS } from '../models/guest.model';
import { GameStore } from '../stores/game.store';
import { PhaseContentComponent } from './phase-content.component';

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
      patchState(gameStore, { houseCapacity: 100, baseTroubleLimit: 100 });
      
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
      patchState(gameStore, { isPartyShutdown: true });
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
      patchState(gameStore, { isPartyShutdown: true });
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
      patchState(gameStore, { isPartyShutdown: true, currentTurn: 1, totalTurns: 5 });
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
      patchState(gameStore, { isPartyShutdown: true, currentTurn: 5, totalTurns: 5 });
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
      patchState(gameStore, { isPartyShutdown: false });
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
    const makeGuest = (type: Guest['type'], name: string): Guest => ({
      type,
      name,
      properties: { ...GUEST_TYPE_DEFAULTS[type] }
    });

    it('should display blame prompt when isBanSelectionActive is true', () => {
      // Requirements: 3.3
      patchState(gameStore, {
        isBanSelectionActive: true,
        bustPartySnapshot: [makeGuest('OLD_FRIEND', 'Brian')]
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const prompt = compiled.querySelector('.blame-prompt');

      expect(prompt).toBeTruthy();
      expect(prompt?.textContent?.trim()).toBe('Who takes the blame?');
    });

    it('should render guest cards from bustPartySnapshot', () => {
      // Requirements: 3.4
      const snapshot = [
        makeGuest('OLD_FRIEND', 'Brian'),
        makeGuest('WILD_BUDDY', 'Anthony'),
        makeGuest('RICH_PAL', 'Khalil')
      ];
      patchState(gameStore, {
        isBanSelectionActive: true,
        bustPartySnapshot: snapshot
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const banButtons = compiled.querySelectorAll('.ban-guest-button');

      expect(banButtons.length).toBe(3);
      // Each button should contain a guest card
      banButtons.forEach(btn => {
        expect(btn.querySelector('app-guest-card')).toBeTruthy();
      });
    });

    it('should show confirmation modal when selectedBanGuest is set', () => {
      // Requirements: 5.1
      const guest = makeGuest('WILD_BUDDY', 'Anthony');
      patchState(gameStore, {
        isBanSelectionActive: true,
        bustPartySnapshot: [guest],
        selectedBanGuest: guest
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.ban-modal-overlay');
      const modal = compiled.querySelector('.ban-modal');

      expect(overlay).toBeTruthy();
      expect(modal).toBeTruthy();
    });

    it('should show correct message and OK button in confirmation modal', () => {
      // Requirements: 5.2, 5.3
      const guest = makeGuest('RICH_PAL', 'Khalil');
      patchState(gameStore, {
        isBanSelectionActive: true,
        bustPartySnapshot: [guest],
        selectedBanGuest: guest
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('#ban-title');
      const okButton = compiled.querySelector('.ban-confirm-button');

      expect(message?.textContent?.trim()).toBe(
        'Rich Pal Khalil will be banned from the next party.'
      );
      expect(okButton).toBeTruthy();
      expect(okButton?.textContent?.trim()).toBe('OK');
    });

    it('should hide ban selection view when isBanSelectionActive is false', () => {
      // Requirements: 3.3 (inverse)
      patchState(gameStore, {
        isBanSelectionActive: false,
        bustPartySnapshot: [],
        selectedBanGuest: null
      });
      component.phase = GamePhase.PARTY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const banSelection = compiled.querySelector('.ban-selection');
      const blamePrompt = compiled.querySelector('.blame-prompt');
      const banModal = compiled.querySelector('.ban-modal-overlay');

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

      // Should have 14 purchasable guest types (including MR_POPULAR, CELEBRITY) + 1 Expand House card = 15
      expect(shopCards.length).toBe(15);
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
      // Monkey is at index 1 (Old Friend=0, Monkey=1, Rich Pal=2, Expand House=3)
      const monkeyCard = shopCards[1];
      const price = monkeyCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 3');
    });

    it('should show "Available: 4" on Monkey shop card initially', () => {
      // Requirements: 7.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      // Monkey is at index 1
      const monkeyCard = shopCards[1];
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
      // Rock Star is at index 6 (Old Friend=0, Monkey=1, Rich Pal=2, Hippy=3, Ticket Taker=4, Caterer=5, Rock Star=6)
      const rockStarCard = shopCards[6];
      const price = rockStarCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 5');
    });

    it('should show "Available: 4" on Rock Star shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const rockStarCard = shopCards[6];
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
      // Gangster is at index 8 (Old Friend=0, Monkey=1, Rich Pal=2, Hippy=3, Ticket Taker=4, Caterer=5, Mr. Popular=6, Rock Star=7, Gangster=8)
      const gangsterCard = shopCards[8];
      const price = gangsterCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 6');
    });

    it('should show "Available: 4" on Gangster shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const gangsterCard = shopCards[7];
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
      // Gambler is at index 9 (Old Friend=0, Monkey=1, Rich Pal=2, Hippy=3, Ticket Taker=4, Caterer=5, Rock Star=6, Gangster=7, Cute Dog=8, Gambler=9)
      const gamblerCard = shopCards[9];
      const price = gamblerCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 7');
    });

    it('should show "Available: 4" on Gambler shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const gamblerCard = shopCards[9];
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
      // Auctioneer is at index 11 (Old Friend=0, Monkey=1, Rich Pal=2, Hippy=3, Ticket Taker=4, Caterer=5, Mr. Popular=6, Rock Star=7, Gangster=8, Cute Dog=9, Gambler=10, Auctioneer=11)
      const auctioneerCard = shopCards[11];
      const price = auctioneerCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 9');
    });

    it('should show "Available: 4" on Auctioneer shop card initially', () => {
      // Requirements: 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      const auctioneerCard = shopCards[10];
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
      // Climber is at index 13 (Old Friend=0, Monkey=1, Rich Pal=2, Hippy=3, Ticket Taker=4, Caterer=5, Mr. Popular=6, Rock Star=7, Gangster=8, Cute Dog=9, Gambler=10, Auctioneer=11, Celebrity=12, Climber=13)
      const climberCard = shopCards[13];
      const price = climberCard?.querySelector('.shop-price');

      expect(price?.textContent?.trim()).toBe('Price: 12');
    });

    it('should show "Available: 4" on Climber shop card on a fresh game', () => {
      // Requirements: 9.2, 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const shopCards = compiled.querySelectorAll('.shop-card');
      // Climber is at index 11
      const climberCard = shopCards[11];
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

    it('should display shop cards in correct order: Old Friend, Monkey, Rich Pal, Hippy, Ticket Taker, Caterer, Mr. Popular, Rock Star, Gangster, Cute Dog, Gambler, Auctioneer, Celebrity, Climber, Expand House', () => {
      // Requirements: 9.2, 9.3
      component.phase = GamePhase.BUY;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const headers = compiled.querySelectorAll('.shop-card .card-header');

      expect(headers.length).toBe(15);
      expect(headers[0].textContent?.trim()).toBe('Old Friend');
      expect(headers[1].textContent?.trim()).toBe('Monkey');
      expect(headers[2].textContent?.trim()).toBe('Rich Pal');
      expect(headers[3].textContent?.trim()).toBe('Hippy');
      expect(headers[4].textContent?.trim()).toBe('Ticket Taker');
      expect(headers[5].textContent?.trim()).toBe('Caterer');
      expect(headers[6].textContent?.trim()).toBe('Mr. Popular');
      expect(headers[7].textContent?.trim()).toBe('Rock Star');
      expect(headers[8].textContent?.trim()).toBe('Gangster');
      expect(headers[9].textContent?.trim()).toBe('Cute Dog');
      expect(headers[10].textContent?.trim()).toBe('Gambler');
      expect(headers[11].textContent?.trim()).toBe('Auctioneer');
      expect(headers[12].textContent?.trim()).toBe('Celebrity');
      expect(headers[13].textContent?.trim()).toBe('Climber');
      expect(headers[14].textContent?.trim()).toBe('Expand House');
    });
  });

  describe('Card Shadow Rendering', () => {
    const makeGuest = (type: Guest['type'], name: string): Guest => ({
      type,
      name,
      properties: { ...GUEST_TYPE_DEFAULTS[type] }
    });

    it('should render shadow count equal to houseCapacity minus party length', () => {
      // Requirements: 8.1
      const partyGuests = [
        makeGuest('OLD_FRIEND', 'Brian'),
        makeGuest('WILD_BUDDY', 'Anthony')
      ];
      patchState(gameStore, {
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
        makeGuest('OLD_FRIEND', 'Brian'),
        makeGuest('OLD_FRIEND', 'Colin'),
        makeGuest('WILD_BUDDY', 'Anthony')
      ];
      patchState(gameStore, {
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
      patchState(gameStore, {
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
      patchState(gameStore, { showHouseFullMessage: true });
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
      patchState(gameStore, { showHouseFullMessage: true });
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
      patchState(gameStore, { expansionsPurchased: 29 });
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
