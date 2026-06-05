import { GamePhase } from './game-phase.enum';

export interface GameState {
  currentTurn: number;      // 1-indexed current turn
  currentPhase: GamePhase;  // Current phase in the turn
  totalTurns: number;       // Total turns configured for game
  isGameComplete: boolean;  // Whether game has ended
  popularity: number;       // Non-negative integer tracking social standing
  money: number;            // Non-negative integer tracking wealth
  baseTroubleLimit: number;              // Permanent trouble limit (default 2)
}
