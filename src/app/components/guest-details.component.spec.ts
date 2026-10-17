import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GUEST_TYPE_DEFAULTS, GuestProperties, GuestType } from '../models/guest.model';
import { GuestDetailsComponent } from './guest-details.component';

describe('GuestDetailsComponent', () => {
  let fixture: ComponentFixture<GuestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestDetailsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestDetailsComponent);
  });

  function render(type: GuestType, properties: GuestProperties = GUEST_TYPE_DEFAULTS[type]): HTMLElement {
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('properties', properties);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows popularity, money and icons for a Celebrity', () => {
    const el = render('CELEBRITY');

    // Visible value plus visually hidden prefix, so screen readers announce "Popularity 2" and "Money $3"
    const popularity = el.querySelector('.guest-popularity');
    expect(popularity?.querySelector('.guest-value')?.textContent?.trim()).toBe('2');
    expect(popularity?.querySelector('.visually-hidden')?.textContent?.trim()).toBe('Popularity');
    expect(popularity?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Popularity 2');

    const money = el.querySelector('.guest-money');
    expect(money?.querySelector('.guest-value')?.textContent?.trim()).toBe('$3');
    expect(money?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Money $3');
    expect(money?.classList.contains('negative')).toBe(false);

    const icons = Array.from(el.querySelectorAll('.guest-icons [role="img"]'));
    expect(icons.map(i => i.textContent?.trim())).toEqual(['👤', '👤']);
    expect(icons[0].getAttribute('aria-label')).toBe('Invites a guest on entrance');
    expect(icons[0].getAttribute('title')).toBe('Invites a guest on entrance');
  });

  it('shows negative money with the minus sign first, marked as negative', () => {
    const el = render('DRAGON');
    expect(el.querySelector('.guest-money .guest-value')?.textContent?.trim()).toBe('-$3');
    expect(el.querySelector('.guest-money')?.classList.contains('negative')).toBe(true);
  });

  it('marks negative popularity as negative', () => {
    const el = render('TICKET_TAKER');
    expect(el.querySelector('.guest-popularity .guest-value')?.textContent?.trim()).toBe('-1');
    expect(el.querySelector('.guest-popularity')?.classList.contains('negative')).toBe(true);
    expect(el.querySelector('.guest-money')?.classList.contains('negative')).toBe(false);
  });

  it('hides zero popularity and money and shows no icons when there are none', () => {
    const el = render('OLD_FRIEND', { popularityValue: 0, troubleValue: 0, moneyValue: 0, peaceValue: 0, starValue: 0 });
    expect(el.querySelector('.guest-popularity')).toBeNull();
    expect(el.querySelector('.guest-money')).toBeNull();
    expect(el.querySelector('.guest-icons')).toBeNull();
  });

  it('puts icons in DOM order: entrance effects, peace, trouble, star', () => {
    const el = render('MERMAID', { popularityValue: 0, troubleValue: 1, moneyValue: 0, peaceValue: 1, starValue: 1 });
    const symbols = Array.from(el.querySelectorAll('.guest-icons [role="img"]')).map(i => i.textContent?.trim());
    expect(symbols).toEqual(['👤', '☮️', '❌', '⭐']);
  });

  it('updates when the properties change', () => {
    let el = render('CLIMBER');
    expect(el.querySelector('.guest-popularity')).toBeNull();

    el = render('CLIMBER', { ...GUEST_TYPE_DEFAULTS['CLIMBER'], popularityValue: 3 });
    expect(el.querySelector('.guest-popularity .guest-value')?.textContent?.trim()).toBe('3');
  });
});
