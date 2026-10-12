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

    const popularity = el.querySelector('.guest-popularity');
    expect(popularity?.textContent?.trim()).toBe('2');
    expect(popularity?.getAttribute('aria-label')).toBe('Popularity 2');

    const money = el.querySelector('.guest-money');
    expect(money?.textContent?.trim()).toBe('$3');
    expect(money?.getAttribute('aria-label')).toBe('Money $3');

    const icons = Array.from(el.querySelectorAll('.guest-icons [role="img"]'));
    expect(icons.map(i => i.textContent?.trim())).toEqual(['👤', '👤']);
    expect(icons[0].getAttribute('aria-label')).toBe('Invites a guest on entrance');
    expect(icons[0].getAttribute('title')).toBe('Invites a guest on entrance');
  });

  it('shows negative money with the minus sign first', () => {
    const el = render('DRAGON');
    expect(el.querySelector('.guest-money')?.textContent?.trim()).toBe('-$3');
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

    el = render('CLIMBER', { ...GUEST_TYPE_DEFAULTS.CLIMBER, popularityValue: 3 });
    expect(el.querySelector('.guest-popularity')?.textContent?.trim()).toBe('3');
  });
});
