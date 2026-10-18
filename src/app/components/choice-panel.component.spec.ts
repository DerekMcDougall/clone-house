import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GamePhase } from '../models';
import { ChoiceRequest } from '../models/effect-context';
import { parseGuestTypeDefinition } from '../models/guest-type-json';
import { registerGuestType, resetGuestTypesForTesting } from '../models/guest-type-registry';
import { GameStore } from '../stores/game.store';
import { ChoicePanelComponent } from './choice-panel.component';
import { startBanSelection } from '../../testing/ban';
import { customEntrance, registerTestGuestType, testGuest } from '../../testing/guests';

/**
 * Choice panel: renders the pending choice and passes the player's answer to the store.
 *
 * **Validates: effect-choices Requirements 4, 5.2, 6.4**
 */
describe('ChoicePanelComponent', () => {
  let fixture: ComponentFixture<ChoicePanelComponent>;
  let store: InstanceType<typeof GameStore>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChoicePanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChoicePanelComponent);
    store = TestBed.inject(GameStore);
    element = fixture.nativeElement;
    store.initializeGame();
  });

  afterEach(() => {
    store.resetGame();
    resetGuestTypesForTesting();
  });

  // Invites a guest whose entrance effect requests `request`
  const askChoice = (request: ChoiceRequest): void => {
    const type = registerTestGuestType({ id: 'TEST_ASKER', effects: customEntrance((ctx) => ctx.requestChoice(request)) });
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY,
      deck: [testGuest(type, 'Asker')],
      party: [testGuest('OLD_FRIEND', 'Colin')]
    });
    store.inviteGuest();
    fixture.detectChanges();
  };

  const optionButtons = () => [...element.querySelectorAll<HTMLButtonElement>('.choice-option-button')];

  it('should render nothing while no choice is pending', () => {
    fixture.detectChanges();
    expect(element.querySelector('.choice-panel')).toBeNull();
    expect(element.querySelector('.choice-confirm-overlay')).toBeNull();
  });

  it('should show the prompt and a text button per option without a guest', () => {
    askChoice({ prompt: 'Which way?', options: () => [{ id: 'l', label: 'Left' }, { id: 'r', label: 'Right' }], onChoose: () => {} });

    expect(element.querySelector('.choice-prompt')?.textContent?.trim()).toBe('Which way?');
    expect(optionButtons().map(b => b.textContent?.trim())).toEqual(['Left', 'Right']);
    expect(optionButtons().map(b => b.getAttribute('aria-label'))).toEqual(['Left', 'Right']);
    expect(element.querySelector('app-guest-card')).toBeNull();
  });

  it('should render guest options as guest cards, named by their labels', () => {
    askChoice({
      prompt: 'Who?',
      options: (view) => view.getParty().map(g => ({ id: g.id, label: `Pick ${g.name}`, guest: g })),
      onChoose: () => {}
    });

    expect(optionButtons()).toHaveLength(2);
    optionButtons().forEach(b => expect(b.querySelector('app-guest-card')).toBeTruthy());
    expect(optionButtons().map(b => b.getAttribute('aria-label'))).toEqual(['Pick Colin', 'Pick Asker']);
  });

  it('should resolve on click when there is no confirmation', () => {
    const chosen: string[] = [];
    askChoice({ prompt: 'Which way?', options: () => [{ id: 'l', label: 'Left' }], onChoose: (_c, o) => { chosen.push(o.id); } });

    optionButtons()[0].click();
    fixture.detectChanges();

    expect(chosen).toEqual(['l']);
    expect(element.querySelector('.choice-panel')).toBeNull();
    expect(element.querySelector('.choice-confirm-overlay')).toBeNull();
  });

  it('should show the confirmation dialog only once an option is picked, and resolve on OK', () => {
    const chosen: string[] = [];
    askChoice({
      prompt: 'Which way?',
      options: () => [{ id: 'l', label: 'Left' }],
      confirmMessage: (o) => `Go ${o.label}?`,
      onChoose: (_c, o) => { chosen.push(o.id); }
    });
    expect(element.querySelector('.choice-confirm-overlay')).toBeNull();

    optionButtons()[0].click();
    fixture.detectChanges();
    const dialog = element.querySelector('.choice-confirm-overlay');
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(element.querySelector('#choice-confirm-title')?.textContent?.trim()).toBe('Go Left?');
    expect(chosen).toEqual([]);

    element.querySelector<HTMLButtonElement>('.choice-confirm-button')!.click();
    fixture.detectChanges();
    expect(chosen).toEqual(['l']);
    expect(element.querySelector('.choice-confirm-overlay')).toBeNull();
  });

  it('should show ban selection as before: prompt, guest cards, confirmation and OK', () => {
    const snapshot = [testGuest('OLD_FRIEND', 'Brian'), testGuest('WILD_BUDDY', 'Anthony')];
    startBanSelection(store, snapshot);
    fixture.detectChanges();

    expect(element.querySelector('.choice-prompt')?.textContent?.trim()).toBe('Who takes the blame?');
    expect(optionButtons().map(b => b.getAttribute('aria-label'))).toEqual(['Ban Brian', 'Ban Anthony']);

    optionButtons()[1].click();
    fixture.detectChanges();
    expect(element.querySelector('#choice-confirm-title')?.textContent?.trim())
      .toBe('Wild Buddy Anthony will be banned from the next party.');

    element.querySelector<HTMLButtonElement>('.choice-confirm-button')!.click();
    fixture.detectChanges();
    expect(store.discard().map(g => g.name)).toEqual(['Anthony']);
    expect(store.currentPhase()).toBe(GamePhase.BUY);
  });

  it('should play a JSON-defined chooseGuest type: invite it, pick a guest, and change that guest', () => {
    registerGuestType(parseGuestTypeDefinition({
      id: 'TEST_HYPE_MAN',
      label: 'Hype Man',
      cost: null,
      properties: { popularityValue: 1, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 },
      effects: [{
        trigger: 'entrance',
        action: {
          kind: 'chooseGuest',
          prompt: 'Who does the Hype Man hype?',
          from: 'party',
          action: { kind: 'adjustSelf', property: 'popularityValue', delta: 2 },
          icons: [{ symbol: '📣', label: 'Gives a party guest 2 popularity on entrance' }]
        }
      }]
    }));
    const colin = testGuest('OLD_FRIEND', 'Colin');
    const rich = testGuest('RICH_PAL', 'Khalil');
    patchState(unprotected(store), {
      currentPhase: GamePhase.PARTY,
      deck: [testGuest('TEST_HYPE_MAN', 'Hal')],
      party: [colin, rich]
    });

    store.inviteGuest();
    fixture.detectChanges();
    expect(element.querySelector('.choice-prompt')?.textContent?.trim()).toBe('Who does the Hype Man hype?');
    const khalil = optionButtons().find(b => b.getAttribute('aria-label') === 'Rich Pal Khalil')!;
    khalil.click();
    fixture.detectChanges();

    expect(store.party().map(g => [g.name, g.properties.popularityValue])).toEqual([['Colin', 1], ['Khalil', 2], ['Hal', 1]]);
    expect(element.querySelector('.choice-panel')).toBeNull();
    expect(store.canInviteGuest()).toBe(false); // deck is empty
  });
});
