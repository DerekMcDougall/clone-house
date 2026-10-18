import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Guest, GUEST_TYPE_DEFAULTS } from '../models/guest.model';
import { GuestCardComponent } from './guest-card.component';
import { registerTestGuestType, testGuest } from '../../testing/guests';
import { resetGuestTypesForTesting } from '../models/guest-type-registry';

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
    const guest: Guest = testGuest('OLD_FRIEND', 'Brian');
    component.guest = guest;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const guest: Guest = testGuest('OLD_FRIEND', 'Brian');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.guest-card')).toBeTruthy();
    expect(compiled.querySelector('.card-header')).toBeTruthy();
    expect(compiled.querySelector('.card-image')).toBeTruthy();
    expect(compiled.querySelector('.card-caption')).toBeTruthy();
  });

  it('should display guest name in caption', () => {
    const guest: Guest = testGuest('OLD_FRIEND', 'Emily');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Emily');
  });

  it('should display "Old Friend" in header for OLD_FRIEND type', () => {
    const guest: Guest = testGuest('OLD_FRIEND', 'Colin');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Old Friend');
  });

  it('should display "Wild Buddy" in header for WILD_BUDDY type', () => {
    const guest: Guest = testGuest('WILD_BUDDY', 'Anthony');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Wild Buddy');
  });

  it('should display "Rich Pal" in header for RICH_PAL type', () => {
    const guest: Guest = testGuest('RICH_PAL', 'Khalil');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Rich Pal');
  });

  it('should display "Monkey" in header for MONKEY type', () => {
    // Requirements: 8.1
    const guest: Guest = testGuest('MONKEY', 'George');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Monkey');
  });

  it('should display Monkey guest name as caption', () => {
    // Requirements: 8.2
    const guest: Guest = testGuest('MONKEY', 'Darwin');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Darwin');
  });

  it('should display person placeholder icon', () => {
    const guest: Guest = testGuest('OLD_FRIEND', 'Anthony');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('.card-image svg');
    expect(svg).toBeTruthy();
  });

  it('should display "Auctioneer" in header for AUCTIONEER type', () => {
    // Requirements: 10.1
    const guest: Guest = testGuest('AUCTIONEER', 'Christie');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Auctioneer');
  });

  it('should display Auctioneer guest name as caption', () => {
    // Requirements: 10.1
    const guest: Guest = testGuest('AUCTIONEER', 'Sotheby');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Sotheby');
  });

  it('should display "Gangster" in header for GANGSTER type', () => {
    // Requirements: 10.2
    const guest: Guest = testGuest('GANGSTER', 'Tony');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Gangster');
  });

  it('should display Gangster guest name as caption', () => {
    // Requirements: 10.2
    const guest: Guest = testGuest('GANGSTER', 'Legs');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Legs');
  });

  it('should display "Rock Star" in header for ROCK_STAR type', () => {
    // Requirements: 10.3
    const guest: Guest = testGuest('ROCK_STAR', 'Alanis');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Rock Star');
  });

  it('should display Rock Star guest name as caption', () => {
    // Requirements: 10.3
    const guest: Guest = testGuest('ROCK_STAR', 'Gord');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Gord');
  });

  it('should display "Gambler" in header for GAMBLER type', () => {
    // Requirements: 10.4
    const guest: Guest = testGuest('GAMBLER', 'Kenny');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.card-header');
    expect(header?.textContent).toBe('Gambler');
  });

  it('should display Gambler guest name as caption', () => {
    // Requirements: 10.4
    const guest: Guest = testGuest('GAMBLER', 'Ace');
    component.guest = guest;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const caption = compiled.querySelector('.card-caption');
    expect(caption?.textContent).toBe('Ace');
  });
});

describe('GuestCardComponent - Star Guests', () => {
  const cases: [Guest['type'], string, string][] = [
    ['ALIEN', 'Alien', 'ET'],
    ['LEPRECHAUN', 'Leprechaun', 'Lucky'],
    ['DRAGON', 'Dragon', 'Smaug'],
    ['DINOSAUR', 'Dinosaur', 'Rex'],
    ['MERMAID', 'Mermaid', 'Ariel'],
    ['UNICORN', 'Unicorn', 'Sparkles'],
    ['SUPERHERO', 'Superhero', 'Spider-man']
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestCardComponent]
    }).compileComponents();
  });

  for (const [type, label, name] of cases) {
    it(`should render the ${label} header and the guest name`, () => {
      const fixture = TestBed.createComponent(GuestCardComponent);
      fixture.componentInstance.guest = testGuest(type, name);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.card-header')?.textContent).toBe(label);
      expect(compiled.querySelector('.card-caption')?.textContent).toBe(name);
    });
  }
});

describe('GuestCardComponent - Guest Details', () => {
  let fixture: ComponentFixture<GuestCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestCardComponent);
  });

  it('shows the current popularity of a Climber that has entered 3 times', () => {
    const guest: Guest = testGuest('CLIMBER', 'Skye', { popularityValue: 3 });
    fixture.componentRef.setInput('guest', guest);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.guest-card app-guest-details')).toBeTruthy();
    expect(compiled.querySelector('.guest-popularity .guest-value')?.textContent?.trim()).toBe('3');
    expect(compiled.querySelector('.guest-icons')?.textContent?.trim()).toBe('➕');
  });

  it('shows a Werewolf\'s trouble only while it has trouble, right of its moon', () => {
    // werewolf-guest Requirements 4.1, 4.2
    const icons = (troubleValue: number) => {
      fixture.componentRef.setInput('guest', testGuest('WEREWOLF', 'Remus', { troubleValue }));
      fixture.detectChanges();
      return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.guest-icons [role="img"]'))
        .map(i => i.textContent?.trim());
    };
    expect(icons(1)).toEqual(['🌙', '❌']);
    expect(icons(0)).toEqual(['🌙']);
  });

  it('updates when its guest changes', () => {
    const guest: Guest = testGuest('CLIMBER', 'Skye');
    fixture.componentRef.setInput('guest', guest);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.guest-popularity')).toBeNull();

    fixture.componentRef.setInput('guest', { ...guest, properties: { ...guest.properties, popularityValue: 1 } });
    fixture.detectChanges();
    expect(compiled.querySelector('.guest-popularity .guest-value')?.textContent?.trim()).toBe('1');
  });
});

describe('GuestCardComponent - Runtime Guest Types', () => {
  afterEach(() => resetGuestTypesForTesting());

  it('shows the label of a guest type registered at runtime', () => {
    // guest-type-registry Requirements 4.2, 5.1
    const type = registerTestGuestType({ id: 'TEST_PARTY_PLANNER', label: 'Party Planner' });
    const fixture = TestBed.createComponent(GuestCardComponent);
    fixture.componentInstance.guest = testGuest(type, 'Pat');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-header')?.textContent?.trim()).toBe('Party Planner');
  });

  it('falls back to the type id for an unregistered type', () => {
    // guest-type-registry Requirement 4.3
    const fixture = TestBed.createComponent(GuestCardComponent);
    fixture.componentInstance.guest = { ...testGuest('OLD_FRIEND', 'Pat'), type: 'UNKNOWN_TYPE' };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-header')?.textContent?.trim()).toBe('UNKNOWN_TYPE');
  });
});
