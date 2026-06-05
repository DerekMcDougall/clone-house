import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
<main class="landing-page">
  <h1>Welcome to the Game</h1>
  
  <nav class="navigation">
    <a 
      routerLink="/game" 
      class="new-game-link"
      aria-label="Start a new game">
      New Game
    </a>
  </nav>
</main>
  `,
  styles: [`
.landing-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.landing-page h1 {
  margin: 0 0 3rem 0;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.new-game-link {
  display: block;
  padding: 1rem 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: #667eea;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.new-game-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: #f8f9fa;
}

.new-game-link:focus {
  outline: 3px solid #ffd700;
  outline-offset: 2px;
}

.new-game-link:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .landing-page h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
  
  .new-game-link {
    font-size: 1.1rem;
    padding: 0.875rem 1.5rem;
  }
}
  `]
})
export class LandingPageComponent {}
