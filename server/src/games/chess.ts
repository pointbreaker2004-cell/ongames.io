import { GameEngine } from './base.js';
import { Player, ChessGameState, ChessClientView, ChessPieceColor } from '../../../shared/types.js';
import { Chess } from 'chess.js';

export class ChessEngine implements GameEngine<ChessGameState> {
  private chess!: Chess;
  private state!: ChessGameState;
  private playersMap: Map<string, Player> = new Map();

  init(players: Player[], config?: any): ChessGameState {
    this.playersMap.clear();
    players.forEach(p => this.playersMap.set(p.id, p));

    this.chess = new Chess();

    const whitePlayerId = players[0]?.id || 'white';
    const blackPlayerId = players[1]?.id || 'black';
    const spectatorIds = players.slice(2).map(p => p.id);

    this.state = {
      whitePlayerId,
      blackPlayerId,
      spectatorIds,
      fen: this.chess.fen(),
      history: [],
      turn: 'w',
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      winner: null,
      capturedPieces: {
        w: [],
        b: []
      }
    };

    return this.state;
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (this.state.winner) {
      return { success: false, error: 'Game is already over' };
    }

    switch (action.type) {
      case 'move': {
        const from = action.payload?.from;
        const to = action.payload?.to;
        const promotion = action.payload?.promotion || 'q';

        if (!from || !to) {
          return { success: false, error: 'Must specify from and to squares' };
        }

        // Validate player turn
        const currentTurnColor: ChessPieceColor = this.chess.turn();
        const expectedPlayerId = currentTurnColor === 'w' ? this.state.whitePlayerId : this.state.blackPlayerId;

        if (playerId !== expectedPlayerId) {
          return { success: false, error: "It is not your turn" };
        }

        try {
          const moveResult = this.chess.move({ from, to, promotion });
          if (!moveResult) {
            return { success: false, error: 'Illegal chess move' };
          }

          // Track captured pieces
          if (moveResult.captured) {
            if (currentTurnColor === 'w') {
              this.state.capturedPieces.w.push(moveResult.captured);
            } else {
              this.state.capturedPieces.b.push(moveResult.captured);
            }
          }

          this.state.fen = this.chess.fen();
          this.state.history = this.chess.history();
          this.state.turn = this.chess.turn();
          this.state.isCheck = this.chess.inCheck();
          this.state.isCheckmate = this.chess.isCheckmate();
          this.state.isDraw = this.chess.isDraw();

          if (this.state.isCheckmate) {
            this.state.winner = currentTurnColor;
            const winnerName = this.playersMap.get(expectedPlayerId)?.name || (currentTurnColor === 'w' ? 'White' : 'Black');
            this.state.winReason = `Checkmate! ${winnerName} wins the match.`;
          } else if (this.state.isDraw) {
            this.state.winner = 'draw';
            this.state.winReason = 'Game ended in a draw (stalemate, threefold repetition, or insufficient material).';
          }

          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || 'Illegal chess move' };
        }
      }

      case 'resign': {
        if (playerId === this.state.whitePlayerId) {
          this.state.winner = 'b';
          const blackName = this.playersMap.get(this.state.blackPlayerId)?.name || 'Black';
          this.state.winReason = `White resigned. ${blackName} wins!`;
          return { success: true };
        } else if (playerId === this.state.blackPlayerId) {
          this.state.winner = 'w';
          const whiteName = this.playersMap.get(this.state.whitePlayerId)?.name || 'White';
          this.state.winReason = `Black resigned. ${whiteName} wins!`;
          return { success: true };
        }
        return { success: false, error: 'Only active players can resign' };
      }

      default:
        return { success: false, error: `Unknown action: ${action.type}` };
    }
  }

  getSanitizedView(playerId: string): ChessClientView {
    let myColor: ChessPieceColor | 'spectator' = 'spectator';
    if (playerId === this.state.whitePlayerId) myColor = 'w';
    else if (playerId === this.state.blackPlayerId) myColor = 'b';

    const currentTurnColor = this.state.turn;
    const isMyTurn = myColor === currentTurnColor;

    const whitePlayer = {
      id: this.state.whitePlayerId,
      name: this.playersMap.get(this.state.whitePlayerId)?.name || 'White'
    };

    const blackPlayer = {
      id: this.state.blackPlayerId,
      name: this.playersMap.get(this.state.blackPlayerId)?.name || 'Black'
    };

    return {
      fen: this.state.fen,
      turn: this.state.turn,
      myColor,
      whitePlayer,
      blackPlayer,
      isCheck: this.state.isCheck,
      isCheckmate: this.state.isCheckmate,
      isDraw: this.state.isDraw,
      winner: this.state.winner,
      winReason: this.state.winReason,
      history: this.state.history,
      capturedPieces: this.state.capturedPieces,
      isMyTurn
    };
  }

  isGameOver(): boolean {
    return !!this.state.winner;
  }

  getResults(): any {
    return {
      winner: this.state.winner,
      reason: this.state.winReason,
      history: this.state.history
    };
  }
}

