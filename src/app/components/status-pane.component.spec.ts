import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePhase } from '../models';
import { GameStore } from '../stores/game.store';
import { StatusPaneComponent } from './status-pane.component';

/**
 * Unit Tests for StatusPaneComponent
 * 
 * These tests verify specific examples and edge cases for the status pane
 * component, including store injection, button interactions, display updates,
 * and accessibility attributes.
 */
describe('StatusPaneComponent', () => {
  let component: StatusPaneComponent;
  let fixture: ComponentFixture<StatusPaneComponent>;
  let store: InstanceType<typeof GameStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPaneComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(StatusPaneComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
    
    // Reset store to initial state before each test
    store.resetGame();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject GameStore correctly', () => {
      expect(component.gameStore).toBeDefined();
      expect(component.gameStore).toBe(store);
    });

    it('should render the status pane element', () => {
      fixture.detectChanges();
      const statusPane = fixture.nativeElement.querySelector('.status-pane');
      expect(statusPane).toBeTruthy();
    });
  });

  describe('Remaining Turns Display', () => {
    it('should display 25 remaining turns on initial state', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('25');
    });

    it('should display correct remaining turns for custom turn count', () => {
      store.initializeGame(10);
      fixture.detectChanges();
      
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('10');
    });

    it('should update remaining turns display when turn advances', () => {
      store.initializeGame(5);
      fixture.detectChanges();
      
      // Initial state: turn 1, 5 remaining
      let turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('5');
      
      // Advance to Party phase (same turn)
      store.advancePhase();
      fixture.detectChanges();
      turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('5');
      
      // Advance to next turn
      store.advancePhase();
      fixture.detectChanges();
      turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('4');
    });

    it('should display 1 remaining turn on final turn', () => {
      store.initializeGame(3);
      
      // Advance to final turn (turn 3, BUY phase)
      store.advancePhase(); // Turn 1 PARTY
      store.advancePhase(); // Turn 2 BUY
      store.advancePhase(); // Turn 2 PARTY
      store.advancePhase(); // Turn 3 BUY
      
      fixture.detectChanges();
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('1');
    });
  });

  describe('Phase Button Rendering', () => {
    it('should render phase button element', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button).toBeTruthy();
    });

    it('should display "Start Party" label in BUY phase', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Start Party');
    });

    it('should display "End Party" label in PARTY phase (non-final turn)', () => {
      store.initializeGame(5);
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.isFinalTurn()).toBe(false);
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('End Party');
    });

    it('should display "Game Over" label in PARTY phase on final turn', () => {
      store.initializeGame(2);
      
      // Advance to final turn PARTY phase
      store.advancePhase(); // Turn 1 PARTY
      store.advancePhase(); // Turn 2 BUY
      store.advancePhase(); // Turn 2 PARTY (final)
      
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.isFinalTurn()).toBe(true);
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Game Over');
    });

    it('should update button label when phase changes', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      let button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Advance to PARTY phase
      store.advancePhase();
      fixture.detectChanges();
      button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('End Party');
      
      // Advance to next turn BUY phase
      store.advancePhase();
      fixture.detectChanges();
      button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Start Party');
    });
  });

  describe('Button Click Interaction', () => {
    it('should call advancePhase when button is clicked', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const advancePhaseSpy = vi.spyOn(store, 'advancePhase');
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      button.click();
      
      expect(advancePhaseSpy).toHaveBeenCalledTimes(1);
    });

    it('should advance from BUY to PARTY phase on button click', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      button.click();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
    });

    it('should advance from PARTY to next turn BUY phase on button click', () => {
      store.initializeGame(5);
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      expect(store.currentTurn()).toBe(1);
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      button.click();
      
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      expect(store.currentTurn()).toBe(2);
    });

    it('should mark game complete on final turn button click', () => {
      store.initializeGame(1);
      store.advancePhase(); // Move to final PARTY phase
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(false);
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      button.click();
      
      expect(store.isGameComplete()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label attribute on button', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.hasAttribute('aria-label')).toBe(true);
    });

    it('should set aria-label to "Start Party" in BUY phase', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.getAttribute('aria-label')).toBe('Start Party');
    });

    it('should set aria-label to "End Party" in PARTY phase (non-final)', () => {
      store.initializeGame(5);
      store.advancePhase();
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.getAttribute('aria-label')).toBe('End Party');
    });

    it('should set aria-label to "Game Over" in PARTY phase (final turn)', () => {
      store.initializeGame(1);
      store.advancePhase();
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.getAttribute('aria-label')).toBe('Game Over');
    });

    it('should update aria-label when phase changes', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      let button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.getAttribute('aria-label')).toBe('Start Party');
      
      store.advancePhase();
      fixture.detectChanges();
      button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.getAttribute('aria-label')).toBe('End Party');
    });
  });

  describe('Trouble Display', () => {
    it('should show trouble element during Party phase with correct value', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      
      // Invite some guests to generate trouble
      store.inviteGuest();
      store.inviteGuest();
      store.inviteGuest();
      
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      const troubleCount = fixture.nativeElement.querySelector('.trouble-count');
      expect(troubleCount).toBeTruthy();
      expect(troubleCount.textContent.trim()).toBe(`${store.trouble()} / ${store.effectiveTroubleLimit()}`);
    });

    it('should not show trouble element during Buy phase', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      const troubleCount = fixture.nativeElement.querySelector('.trouble-count');
      expect(troubleCount).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single turn game correctly', () => {
      store.initializeGame(1);
      fixture.detectChanges();
      
      // Turn 1 BUY phase
      expect(store.remainingTurns()).toBe(1);
      let button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Start Party');
      
      // Turn 1 PARTY phase (final)
      store.advancePhase();
      fixture.detectChanges();
      expect(store.remainingTurns()).toBe(1);
      button = fixture.nativeElement.querySelector('.phase-button');
      expect(button.textContent.trim()).toBe('Game Over');
    });

    it('should handle large turn count correctly', () => {
      store.initializeGame(100);
      fixture.detectChanges();
      
      const turnCount = fixture.nativeElement.querySelector('.turn-count');
      expect(turnCount.textContent.trim()).toBe('100');
      expect(store.remainingTurns()).toBe(100);
    });

    it('should not update display after game completion', () => {
      store.initializeGame(1);
      store.advancePhase(); // PARTY phase
      store.advancePhase(); // Game complete
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(true);
      
      // Try to advance again (should be ignored)
      store.advancePhase();
      fixture.detectChanges();
      
      expect(store.isGameComplete()).toBe(true);
    });
  });

  describe('Popularity Display', () => {
    it('should render popularity value from store', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const popularityCount = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityCount).toBeTruthy();
      expect(popularityCount.textContent.trim()).toBe('0');
    });

    it('should display popularity before money before turns remaining in DOM', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const statusInfoElements = fixture.nativeElement.querySelectorAll('.status-info');
      expect(statusInfoElements.length).toBeGreaterThanOrEqual(3);
      
      // First status-info should contain popularity
      const firstSection = statusInfoElements[0];
      expect(firstSection.querySelector('h3').textContent.trim()).toBe('Popularity');
      
      // Second status-info should contain money
      const secondSection = statusInfoElements[1];
      expect(secondSection.querySelector('h3').textContent.trim()).toBe('Money');
      
      // Third status-info should contain turns remaining
      const thirdSection = statusInfoElements[2];
      expect(thirdSection.querySelector('h3').textContent.trim()).toBe('Turns Remaining');
    });

    it('should render with popularity of 0', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      expect(store.popularity()).toBe(0);
      const popularityCount = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityCount.textContent.trim()).toBe('0');
    });

    it('should render with large popularity value', () => {
      store.initializeGame();
      
      // Raise capacity and trouble limit so we can invite many guests per turn without a bust
      patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });
      
      // Manually set a large popularity value by simulating multiple party phases
      // We'll use the store's internal state update mechanism
      // Since we can't directly set popularity, we'll advance through phases with guests
      store.advancePhase(); // Move to PARTY phase
      
      // Invite multiple guests to increase popularity
      for (let i = 0; i < 10; i++) {
        store.inviteGuest();
      }
      
      // Advance phase to calculate popularity (10 guests with mixed types)
      store.advancePhase();
      
      // Repeat multiple times to accumulate large popularity
      for (let turn = 0; turn < 10; turn++) {
        store.advancePhase(); // PARTY phase
        for (let i = 0; i < 10; i++) {
          store.inviteGuest();
        }
        store.advancePhase(); // Next turn
      }
      
      fixture.detectChanges();
      
      // After 11 complete party phases with 10 guests each: popularity depends on guest types
      expect(store.popularity()).toBeGreaterThan(50);
      const popularityCount = fixture.nativeElement.querySelector('.popularity-count');
      expect(popularityCount.textContent.trim()).toBe(store.popularity().toString());
    });
  });

  describe('Money Display', () => {
    it('should render money element with correct value', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const moneyCount = fixture.nativeElement.querySelector('.money-count');
      expect(moneyCount).toBeTruthy();
      expect(moneyCount.textContent.trim()).toBe('0');
    });

    it('should display money between popularity and turns remaining in DOM order', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const statusInfoElements = fixture.nativeElement.querySelectorAll('.status-info');
      const headings = Array.from(statusInfoElements).map(
        (el: any) => el.querySelector('h3').textContent.trim()
      );
      
      const popularityIndex = headings.indexOf('Popularity');
      const moneyIndex = headings.indexOf('Money');
      const turnsIndex = headings.indexOf('Turns Remaining');
      
      expect(popularityIndex).toBeGreaterThanOrEqual(0);
      expect(moneyIndex).toBeGreaterThanOrEqual(0);
      expect(turnsIndex).toBeGreaterThanOrEqual(0);
      expect(moneyIndex).toBeGreaterThan(popularityIndex);
      expect(moneyIndex).toBeLessThan(turnsIndex);
    });
  });

  describe('Invite Guest Button', () => {
    it('should show invite button during Party phase', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
      expect(inviteButton.textContent.trim()).toBe('Invite Guest');
    });

    it('should hide invite button during Buy phase', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeNull();
    });

    it('should call inviteGuest when button is clicked with guests in deck', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();
      
      const inviteGuestSpy = vi.spyOn(store, 'inviteGuest');
      expect(store.canInviteGuest()).toBe(true);
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      
      expect(inviteGuestSpy).toHaveBeenCalledTimes(1);
    });

    it('should call inviteGuest when button is clicked with empty deck', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      
      // Raise capacity and trouble limit so we can drain the entire deck without a bust
      patchState(store, { houseCapacity: 100, baseTroubleLimit: 100 });
      
      // Invite all 10 guests to empty the deck
      for (let i = 0; i < 10; i++) {
        store.inviteGuest();
      }
      
      fixture.detectChanges();
      
      expect(store.canInviteGuest()).toBe(false);
      expect(store.deck().length).toBe(0);
      
      const inviteGuestSpy = vi.spyOn(store, 'inviteGuest');
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      inviteButton.click();
      
      // Should still call inviteGuest (which will set the message flag)
      expect(inviteGuestSpy).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label attribute on invite button', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();
      
      const inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton.hasAttribute('aria-label')).toBe(true);
      expect(inviteButton.getAttribute('aria-label')).toBe('Invite Guest');
    });

    it('should hide invite button when transitioning from Party to Buy phase', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();
      
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
      
      // Advance to next turn BUY phase
      store.advancePhase();
      fixture.detectChanges();
      
      expect(store.currentPhase()).toBe(GamePhase.BUY);
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeNull();
    });

    it('should show invite button again when returning to Party phase', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      // BUY phase - no button
      let inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeNull();
      
      // PARTY phase - button appears
      store.advancePhase();
      fixture.detectChanges();
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
      
      // Next turn BUY phase - button disappears
      store.advancePhase();
      fixture.detectChanges();
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeNull();
      
      // Next turn PARTY phase - button appears again
      store.advancePhase();
      fixture.detectChanges();
      inviteButton = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
    });
  });

  describe('Trouble Limit & Shutdown UI', () => {
    it('should display trouble as "0 / 2" at party start with defaults', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      fixture.detectChanges();

      expect(store.currentPhase()).toBe(GamePhase.PARTY);
      const troubleCount = fixture.nativeElement.querySelector('.trouble-count');
      expect(troubleCount).toBeTruthy();
      expect(troubleCount.textContent.trim()).toBe('0 / 2');
    });

    it('should disable phase button when isPartyShutdown is true', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      patchState(store, { isPartyShutdown: true });
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('.phase-button');
      expect(button.disabled).toBe(true);
    });

    it('should disable invite button when isPartyShutdown is true', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      patchState(store, { isPartyShutdown: true });
      fixture.detectChanges();

      const inviteButton: HTMLButtonElement = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
      expect(inviteButton.disabled).toBe(true);
    });

    it('should enable buttons when isPartyShutdown is false', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      patchState(store, { isPartyShutdown: false });
      fixture.detectChanges();

      const phaseButton: HTMLButtonElement = fixture.nativeElement.querySelector('.phase-button');
      expect(phaseButton.disabled).toBe(false);

      const inviteButton: HTMLButtonElement = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton.disabled).toBe(false);
    });
  });

  describe('Ban Selection Disabled State', () => {
    it('should disable invite button when isBanSelectionActive is true', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      patchState(store, { isBanSelectionActive: true });
      fixture.detectChanges();

      const inviteButton: HTMLButtonElement = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton).toBeTruthy();
      expect(inviteButton.disabled).toBe(true);
    });

    it('should disable phase button when isBanSelectionActive is true', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      patchState(store, { isBanSelectionActive: true });
      fixture.detectChanges();

      const phaseButton: HTMLButtonElement = fixture.nativeElement.querySelector('.phase-button');
      expect(phaseButton.disabled).toBe(true);
    });

    it('should enable buttons when both isPartyShutdown and isBanSelectionActive are false', () => {
      store.initializeGame();
      store.advancePhase(); // Move to PARTY phase
      patchState(store, { isPartyShutdown: false, isBanSelectionActive: false });
      fixture.detectChanges();

      const phaseButton: HTMLButtonElement = fixture.nativeElement.querySelector('.phase-button');
      expect(phaseButton.disabled).toBe(false);

      const inviteButton: HTMLButtonElement = fixture.nativeElement.querySelector('.invite-button');
      expect(inviteButton.disabled).toBe(false);
    });
  });
});
