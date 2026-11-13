import { Player } from '../../../shared/types.js';

export interface GameEngine<State = any, Action = any> {
  init(players: Player[], config?: any): State;
  handleAction(playerId: string, action: Action): { success: boolean; error?: string };
  getSanitizedView(playerId: string): any;
  isGameOver(): boolean;
  getResults(): any;
}

