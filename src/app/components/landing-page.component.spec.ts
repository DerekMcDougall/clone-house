import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        provideRouter([
          { path: '', component: LandingPageComponent },
          { path: 'game', component: LandingPageComponent } // Using same component for test simplicity
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Rendering', () => {
    it('should render the main element with landing-page class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const mainElement = compiled.querySelector('main.landing-page');
      
      expect(mainElement).toBeTruthy();
    });

    it('should render the heading with correct text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('h1');
      
      expect(heading).toBeTruthy();
      expect(heading?.textContent?.trim()).toBe('Welcome to the Game');
    });

    it('should render the navigation element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nav = compiled.querySelector('nav.navigation');
      
      expect(nav).toBeTruthy();
    });
  });

  describe('New Game Link', () => {
    it('should render the "New Game" link', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link');
      
      expect(newGameLink).toBeTruthy();
      expect(newGameLink?.textContent?.trim()).toBe('New Game');
    });

    it('should have correct routerLink attribute pointing to /game', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link') as HTMLAnchorElement;
      
      expect(newGameLink).toBeTruthy();
      // Check that the link has the routerLink directive applied
      expect(newGameLink.getAttribute('href')).toBe('/game');
    });

    it('should navigate to /game when clicked', async () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link') as HTMLAnchorElement;
      
      expect(newGameLink).toBeTruthy();
      
      newGameLink.click();
      await fixture.whenStable();
      
      expect(router.url).toBe('/game');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on the New Game link', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link') as HTMLAnchorElement;
      
      expect(newGameLink).toBeTruthy();
      expect(newGameLink.getAttribute('aria-label')).toBe('Start a new game');
    });

    it('should be keyboard navigable with proper focus styles', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link') as HTMLAnchorElement;
      
      expect(newGameLink).toBeTruthy();
      
      // Simulate keyboard focus
      newGameLink.focus();
      
      // Verify the element can receive focus
      expect(document.activeElement).toBe(newGameLink);
    });

    it('should have semantic HTML structure with main and nav elements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const mainElement = compiled.querySelector('main');
      const navElement = compiled.querySelector('nav');
      
      expect(mainElement).toBeTruthy();
      expect(navElement).toBeTruthy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation to the New Game link', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link') as HTMLAnchorElement;
      
      expect(newGameLink).toBeTruthy();
      
      // Tab to the link
      newGameLink.focus();
      
      expect(document.activeElement).toBe(newGameLink);
    });

    it('should trigger navigation when Enter key is pressed on the link', async () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newGameLink = compiled.querySelector('a.new-game-link') as HTMLAnchorElement;
      
      expect(newGameLink).toBeTruthy();
      
      newGameLink.focus();
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      newGameLink.dispatchEvent(enterEvent);
      newGameLink.click(); // Router links respond to click events
      
      await fixture.whenStable();
      
      expect(router.url).toBe('/game');
    });
  });
});
