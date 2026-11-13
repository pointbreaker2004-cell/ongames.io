import { GameType, Player, RoomStatus, BaseRoomConfig, ClientRoomView } from '../../shared/types.js';
import { GameEngine } from './games/base.js';
import { CodewordsEngine } from './games/codewords.js';
import { SpyfallEngine } from './games/spyfall.js';
import { OneNightWerewolfEngine } from './games/onuw.js';
import { LoveLetterEngine } from './games/loveLetter.js';
import { SecretSithEngine } from './games/secretSith.js';
import { TwoTruthsEngine } from './games/twoTruths.js';
import { UnoEngine } from './games/uno.js';
import { ChessEngine } from './games/chess.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded confusing chars like I, O

export interface Room {
  code: string;
  gameType: GameType;
  hostId: string;
  status: RoomStatus;
  createdAt: number;
  lastActiveAt: number;
  players: Player[];
  config: BaseRoomConfig;
  engine: GameEngine | null;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    // Periodic garbage collection: delete rooms inactive for > 4 hours
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.lastActiveAt > 4 * 60 * 60 * 1000) {
          this.rooms.delete(code);
        }
      }
    }, 15 * 60 * 1000);
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    // If collision, generate again
    if (this.rooms.has(code)) {
      return this.generateCode();
    }
    return code;
  }

  private createEngine(gameType: GameType): GameEngine {
    switch (gameType) {
      case 'codewords':
        return new CodewordsEngine();
      case 'spyfall':
        return new SpyfallEngine();
      case 'onuw':
        return new OneNightWerewolfEngine();
      case 'love-letter':
        return new LoveLetterEngine();
      case 'secret-sith':
        return new SecretSithEngine();
      case 'two-truths':
        return new TwoTruthsEngine();
      case 'uno':
        return new UnoEngine();
      case 'chess':
        return new ChessEngine();
      default:
        return new CodewordsEngine();
    }
  }

  createRoom(gameType: GameType, hostName: string, hostToken: string, socketId: string): Room {
    const code = this.generateCode();
    const hostPlayer: Player = {
      id: socketId,
      token: hostToken,
      name: hostName.trim() || 'Host',
      isHost: true,
      isConnected: true,
      joinedAt: Date.now()
    };

    const room: Room = {
      code,
      gameType,
      hostId: socketId,
      status: 'lobby',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      players: [hostPlayer],
      config: {},
      engine: null
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  joinRoom(code: string, playerName: string, playerToken: string, socketId: string): { success: boolean; room?: Room; error?: string } {
    const cleanCode = code.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);
    if (!room) {
      return { success: false, error: 'Room not found. Check the 4-letter code and try again.' };
    }

    room.lastActiveAt = Date.now();

    // Check if player is reconnecting with the same token
    const existingPlayer = room.players.find(p => p.token === playerToken);
    if (existingPlayer) {
      existingPlayer.id = socketId;
      existingPlayer.isConnected = true;
      if (playerName.trim()) {
        existingPlayer.name = playerName.trim();
      }
      return { success: true, room };
    }

    // New player joining
    if (room.status !== 'lobby') {
      return { success: false, error: 'A game is currently in progress in this room.' };
    }

    const newPlayer: Player = {
      id: socketId,
      token: playerToken,
      name: playerName.trim() || `Player ${room.players.length + 1}`,
      isHost: room.players.length === 0,
      isConnected: true,
      joinedAt: Date.now()
    };

    if (newPlayer.isHost) {
      room.hostId = socketId;
    }

    room.players.push(newPlayer);
    return { success: true, room };
  }

  handleDisconnect(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        player.isConnected = false;
        room.lastActiveAt = Date.now();

        // If host disconnected, reassign host to the next connected player if in lobby
        if (player.isHost && room.status === 'lobby') {
          const nextActive = room.players.find(p => p.isConnected && p.id !== socketId);
          if (nextActive) {
            player.isHost = false;
            nextActive.isHost = true;
            room.hostId = nextActive.id;
          }
        }
        return room;
      }
    }
    return undefined;
  }

  startGame(code: string, socketId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(p => p.id === socketId);
    if (!player?.isHost) return { success: false, error: 'Only the host can start the game' };

    const engine = this.createEngine(room.gameType);
    engine.init(room.players, room.config);

    room.engine = engine;
    room.status = 'playing';
    room.lastActiveAt = Date.now();
    return { success: true };
  }

  restartGame(code: string, socketId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    room.status = 'lobby';
    room.engine = null;
    room.lastActiveAt = Date.now();
    return { success: true };
  }

  changeGame(code: string, socketId: string, newGameType: GameType): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(p => p.id === socketId);
    if (!player?.isHost) return { success: false, error: 'Only the host can change the game' };

    room.gameType = newGameType;
    room.status = 'lobby';
    room.engine = null;
    room.lastActiveAt = Date.now();
    return { success: true };
  }

  kickPlayer(code: string, hostSocketId: string, targetPlayerId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find(p => p.id === hostSocketId);
    if (!host?.isHost) return { success: false, error: 'Only the host can kick players' };

    room.players = room.players.filter(p => p.id !== targetPlayerId);
    return { success: true };
  }

  handleGameAction(code: string, socketId: string, action: any): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (!room.engine) return { success: false, error: 'No active game engine' };

    room.lastActiveAt = Date.now();
    const result = room.engine.handleAction(socketId, action);
    if (room.engine.isGameOver()) {
      room.status = 'game_over';
    }
    return result;
  }

  getSanitizedView(room: Room, socketId: string): ClientRoomView {
    const player = room.players.find(p => p.id === socketId);
    const gameView = room.engine ? room.engine.getSanitizedView(socketId) : null;

    return {
      code: room.code,
      gameType: room.gameType,
      status: room.status,
      hostId: room.hostId,
      players: room.players.map(p => ({
        id: p.id,
        token: p.token,
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected
      })),
      config: room.config,
      gameView,
      myPlayerId: socketId,
      isHost: !!player?.isHost
    };
  }
}

export const roomManager = new RoomManager();

