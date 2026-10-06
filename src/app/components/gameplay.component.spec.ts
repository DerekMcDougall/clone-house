import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { patchState } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePhase } from '../models';
import { GUEST_TYPE_DEFAULTS } from '../models/guest.model';
import { GameStore } from '../stores/game.store';
import { GameplayComponent } from './gameplay.component';

/**
 * Unit Tests for GameplayComponent
 * 
 * These tests verify specific examples and edge cases for the gameplay
 * container component, including game initialization, navigation on completion,
 * and component composition.
 */
describe('GameplayComponent', () => {
  let component: GameplayComponent;
  let fixture: ComponentFixture<GameplayComponent>;
  let store: InstanceType<typeof GameStore>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameplayComponent],
      providers: [
        provideRouter([
          { path: '', component: GameplayComponent },
          { path: 'gameplay', component: GameplayComponent }
        ])
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(GameplayComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
    router = TestBed.inject(Router);
    
    // Reset store to initial state before each test
    store.resetGame();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject GameStore correctly', () => {
      expect(component['gameStore']).toBeDefined();
      expect(component['gameStore']).toBe(store);
    });

    it('should inject Router correctly', () => {
      expect(component['router']).toBeDefined();
      expect(component['router']).toBe(router);
    });

    it('should initialize game on ngOnInit', () => {
      const initSpy = vi.spyOn(store, 'initializeGame');
      
      component.ngOnInit();
      
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledWith();
    });

    it('should initialize game with default 25 turns', () => {
      component.ngOnInit();
      
      expect(store.totalTurns()).toBe(25);
      expect(store.currentTurn()).toBe(1);
      expect(store.currentPhase()).toBe('BUY');
      expect(store.isGameComplete()).toBe(false);
    });
  });

  describe('Navigation on Game Completion', () => {
    it('should navigate to landing page when game completes', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      // Initialize component (sets up effect)
      fixture.detectChanges();
      
      // Initialize with 1 turn for quick completion
      store.initializeGame(1);
      
      // Complete the game
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> Complete
      
      expect(store.isGameComplete()).toBe(true);
      
      // Wait for effect to trigger
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should not navigate when game is not complete', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      // Initialize component
      fixture.detectChanges();
      
      // Initialize game
      store.initializeGame(5);
      
      // Advance but don't complete
      store.advancePhase(); // BUY -> PARTY
      
      expect(store.isGameComplete()).toBe(false);
      
      // Wait to ensure effect doesn't trigger
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should trigger navigation effect for multi-turn game completion', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      // Initialize component
      fixture.detectChanges();
      
      // Initialize with 3 turns
      store.initializeGame(3);
      
      // Complete all turns
      for (let turn = 1; turn <= 3; turn++) {
        store.advancePhase(); // BUY -> PARTY
        store.advancePhase(); // PARTY -> next turn or complete
      }
      
      expect(store.isGameComplete()).toBe(true);
      
      // Wait for effect to trigger
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(navigateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Composition', () => {
    it('should render PhaseContentComponent', () => {
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      expect(phaseContent).toBeTruthy();
    });

    it('should render StatusPaneComponent', () => {
      fixture.detectChanges();
      
      const statusPane = fixture.nativeElement.querySelector('app-status-pane');
      expect(statusPane).toBeTruthy();
    });

    it('should render both PhaseContentComponent and StatusPaneComponent', () => {
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      const statusPane = fixture.nativeElement.querySelector('app-status-pane');
      
      expect(phaseContent).toBeTruthy();
      expect(statusPane).toBeTruthy();
    });

    it('should have main-content class on PhaseContentComponent', () => {
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      expect(phaseContent.classList.contains('main-content')).toBe(true);
    });

    it('should have status-pane class on StatusPaneComponent', () => {
      fixture.detectChanges();
      
      const statusPane = fixture.nativeElement.querySelector('app-status-pane');
      expect(statusPane.classList.contains('status-pane')).toBe(true);
    });
  });

  describe('Phase Prop Passing', () => {
    it('should pass currentPhase signal to PhaseContentComponent', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      expect(phaseContent).toBeTruthy();
      
      // Verify initial phase is BUY
      expect(store.currentPhase()).toBe('BUY');
      
      // Check that the phase content shows "Shop" heading (BUY phase)
      const heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
    });

    it('should update PhaseContentComponent when phase changes', () => {
      store.initializeGame();
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      
      // Initial phase: BUY (Shop)
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Advance to PARTY phase
      store.advancePhase();
      fixture.detectChanges();
      
      // Updated phase: PARTY (Party)
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
    });

    it('should pass phase signal reactively through multiple transitions', () => {
      store.initializeGame(3);
      fixture.detectChanges();
      
      const phaseContent = fixture.nativeElement.querySelector('app-phase-content');
      
      // Turn 1 BUY
      let heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Turn 1 PARTY
      store.advancePhase();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
      
      // Turn 2 BUY
      store.advancePhase();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Shop');
      
      // Turn 2 PARTY
      store.advancePhase();
      fixture.detectChanges();
      heading = phaseContent.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Party');
    });
  });

  describe('Layout Structure', () => {
    it('should render main gameplay-layout container', () => {
      fixture.detectChanges();
      
      const layout = fixture.nativeElement.querySelector('.gameplay-layout');
      expect(layout).toBeTruthy();
      expect(layout.tagName.toLowerCase()).toBe('main');
    });

    it('should have flexbox layout structure', () => {
      fixture.detectChanges();
      
      const layout = fixture.nativeElement.querySelector('.gameplay-layout');
      const computedStyle = window.getComputedStyle(layout);
      
      expect(computedStyle.display).toBe('flex');
    });
  });

  describe('Layout Overflow Behavior', () => {
    it('should have overflow-y auto on main content area', () => {
      fixture.detectChanges();

      const mainContent = fixture.nativeElement.querySelector('.main-content');
      const computedStyle = window.getComputedStyle(mainContent);

      expect(computedStyle.overflowY).toBe('auto');
    });

    it('should have overflow-x hidden on main content area', () => {
      fixture.detectChanges();

      const mainContent = fixture.nativeElement.querySelector('.main-content');
      const computedStyle = window.getComputedStyle(mainContent);

      expect(computedStyle.overflowX).toBe('hidden');
    });

    it('should have position sticky on status pane', () => {
      fixture.detectChanges();

      const statusPane = fixture.nativeElement.querySelector('.status-pane');
      const computedStyle = window.getComputedStyle(statusPane);

      expect(computedStyle.position).toBe('sticky');
    });

    it('should have overflow hidden on status pane', () => {
      fixture.detectChanges();

      const statusPane = fixture.nativeElement.querySelector('.status-pane');
      const computedStyle = window.getComputedStyle(statusPane);

      expect(computedStyle.overflow).toBe('hidden');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single turn game correctly', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      
      fixture.detectChanges();
      store.initializeGame(1);
      
      // Complete single turn
      store.advancePhase(); // BUY -> PARTY
      store.advancePhase(); // PARTY -> Complete
      
      expect(store.isGameComplete()).toBe(true);
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should handle component destruction gracefully', () => {
      fixture.detectChanges();
      
      // Destroy component
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should not cause memory leaks when destroyed before game completion', () => {
      fixture.detectChanges();
      store.initializeGame(10);
      
      // Advance partway through game
      store.advancePhase();
      store.advancePhase();
      
      // Destroy component before completion
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});

/**
 * GameplayComponent — Victory Navigation
 *
 * **Validates: Requirements 15.6 (star-guests-winning)**
 */
describe('GameplayComponent - Victory', () => {
  let fixture: ComponentFixture<GameplayComponent>;
  let store: InstanceType<typeof GameStore>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameplayComponent],
      providers: [provideRouter([{ path: '', component: GameplayComponent }])]
    }).compileComponents();

    fixture = TestBed.createComponent(GameplayComponent);
    store = TestBed.inject(GameStore);
    router = TestBed.inject(Router);
    store.resetGame();
  });

  it('should navigate home only after the victory is claimed', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();

    const aliens = Array.from({ length: 4 }, (_, i) => ({
      type: 'ALIEN' as const,
      name: `Alien${i}`,
      properties: { ...GUEST_TYPE_DEFAULTS['ALIEN'] }
    }));
    patchState(store, { currentPhase: GamePhase.PARTY, party: aliens });
    store.advancePhase();
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(store.isVictory()).toBe(true);
    expect(navigateSpy).not.toHaveBeenCalled();

    store.claimVictory();
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
