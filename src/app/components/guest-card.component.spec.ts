import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Guest, GUEST_TYPE_DEFAULTS } from '../models/guest.model';
import { GuestCardComponent } from './guest-card.component';

describe('GuestCardComponent', () => {
  let component: GuestCardComponent;
  let fixture: ComponentFixture<GuestCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    const guest: Guest = { type: 'OLD_FRIEND', name: 'Brian', properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] } };
    component.guest = guest;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const guest: Guest = { type: 'OLD_FRIEND', name: 'Brian', properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.guest-card')).toBeTruthy();
    expect(compiled.querySelector('.card-header')).toBeTruthy();
    expect(compiled.querySelector('.card-image')).toBeTruthy();
    expect(compiled.querySelector('.card-caption')).toBeTruthy();
  });

  it('should display guest name in caption', () => {
    const guest: Guest = { type: 'OLD_FRIEND', name: 'Emily', properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Emily');
  });

  it('should display "Old Friend" in header for OLD_FRIEND type', () => {
    const guest: Guest = { type: 'OLD_FRIEND', name: 'Colin', properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Old Friend');
  });

  it('should display "Wild Buddy" in header for WILD_BUDDY type', () => {
    const guest: Guest = { type: 'WILD_BUDDY', name: 'Anthony', properties: { ...GUEST_TYPE_DEFAULTS['WILD_BUDDY'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Wild Buddy');
  });

  it('should display "Rich Pal" in header for RICH_PAL type', () => {
    const guest: Guest = { type: 'RICH_PAL', name: 'Khalil', properties: { ...GUEST_TYPE_DEFAULTS['RICH_PAL'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Rich Pal');
  });

  it('should display "Monkey" in header for MONKEY type', () => {
    // Requirements: 8.1
    const guest: Guest = { type: 'MONKEY', name: 'George', properties: { ...GUEST_TYPE_DEFAULTS['MONKEY'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Monkey');
  });

  it('should display Monkey guest name as caption', () => {
    // Requirements: 8.2
    const guest: Guest = { type: 'MONKEY', name: 'Darwin', properties: { ...GUEST_TYPE_DEFAULTS['MONKEY'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Darwin');
  });

  it('should display person placeholder icon', () => {
    const guest: Guest = { type: 'OLD_FRIEND', name: 'Anthony', properties: { ...GUEST_TYPE_DEFAULTS['OLD_FRIEND'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('.card-image svg');
    expect(svg).toBeTruthy();
  });

  it('should display "Auctioneer" in header for AUCTIONEER type', () => {
    // Requirements: 10.1
    const guest: Guest = { type: 'AUCTIONEER', name: 'Christie', properties: { ...GUEST_TYPE_DEFAULTS['AUCTIONEER'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Auctioneer');
  });

  it('should display Auctioneer guest name as caption', () => {
    // Requirements: 10.1
    const guest: Guest = { type: 'AUCTIONEER', name: 'Sotheby', properties: { ...GUEST_TYPE_DEFAULTS['AUCTIONEER'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Sotheby');
  });

  it('should display "Gangster" in header for GANGSTER type', () => {
    // Requirements: 10.2
    const guest: Guest = { type: 'GANGSTER', name: 'Tony', properties: { ...GUEST_TYPE_DEFAULTS['GANGSTER'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Gangster');
  });

  it('should display Gangster guest name as caption', () => {
    // Requirements: 10.2
    const guest: Guest = { type: 'GANGSTER', name: 'Legs', properties: { ...GUEST_TYPE_DEFAULTS['GANGSTER'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Legs');
  });

  it('should display "Rock Star" in header for ROCK_STAR type', () => {
    // Requirements: 10.3
    const guest: Guest = { type: 'ROCK_STAR', name: 'Alanis', properties: { ...GUEST_TYPE_DEFAULTS['ROCK_STAR'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Rock Star');
  });

  it('should display Rock Star guest name as caption', () => {
    // Requirements: 10.3
    const guest: Guest = { type: 'ROCK_STAR', name: 'Gord', properties: { ...GUEST_TYPE_DEFAULTS['ROCK_STAR'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Gord');
  });

  it('should display "Gambler" in header for GAMBLER type', () => {
    // Requirements: 10.4
    const guest: Guest = { type: 'GAMBLER', name: 'Kenny', properties: { ...GUEST_TYPE_DEFAULTS['GAMBLER'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Gambler');
  });

  it('should display Gambler guest name as caption', () => {
    // Requirements: 10.4
    const guest: Guest = { type: 'GAMBLER', name: 'Ace', properties: { ...GUEST_TYPE_DEFAULTS['GAMBLER'] } };
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Ace');
  });
});
