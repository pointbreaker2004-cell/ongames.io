import { GameType, Player, RoomStatus, BaseRoomConfig, ClientRoomView, ChatMessage } from '../../shared/types.js';
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
  hostToken: string;
  status: RoomStatus;
  createdAt: number;
  lastActiveAt: number;
  players: Player[];
  config: BaseRoomConfig;
  engine: GameEngine | null;
  messages: ChatMessage[];
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
      hostToken: hostToken,
      status: 'lobby',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      players: [hostPlayer],
      config: {},
      engine: null,
      messages: [{
        id: Math.random().toString(36).substring(2, 9),
        senderId: 'system',
        senderName: 'System',
        text: `Room created! Invite friends with code ${code}`,
        timestamp: Date.now(),
        isSystem: true
      }]
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
      // If this player is the original host, restore their host status
      if (existingPlayer.token === room.hostToken || existingPlayer.isHost) {
        existingPlayer.isHost = true;
        room.hostId = socketId;
      }
      return { success: true, room };
    }

    // New player joining
    if (room.status !== 'lobby') {
      return { success: false, error: 'A game is currently in progress in this room.' };
    }

    const isHostPlayer = room.players.length === 0 || playerToken === room.hostToken;
    const newPlayer: Player = {
      id: socketId,
      token: playerToken,
      name: playerName.trim() || `Player ${room.players.length + 1}`,
      isHost: isHostPlayer,
      isConnected: true,
      joinedAt: Date.now()
    };

    if (newPlayer.isHost) {
      room.hostId = socketId;
      room.hostToken = playerToken;
    }

    room.players.push(newPlayer);
    if (!room.messages) room.messages = [];
    room.messages.push({
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'system',
      senderName: 'System',
      text: `${newPlayer.name} joined the room`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { success: true, room };
  }

  handleDisconnect(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        player.isConnected = false;
        room.lastActiveAt = Date.now();
        return room;
      }
    }
    return undefined;
  }

  startGame(code: string, socketId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(p => p.id === socketId);
    const isHost = player && (player.token === room.hostToken || player.isHost);
    if (!isHost) return { success: false, error: 'Only the host can start the game' };

    const engine = this.createEngine(room.gameType);
    engine.init(room.players, room.config);

    room.engine = engine;
    room.status = 'playing';
    room.lastActiveAt = Date.now();

    if (!room.messages) room.messages = [];
    room.messages.push({
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'system',
      senderName: 'System',
      text: `Game started! Good luck have fun! 🎮`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { success: true };
  }

  restartGame(code: string, socketId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(p => p.id === socketId);
    const isHost = player && (player.token === room.hostToken || player.isHost);
    if (!isHost) return { success: false, error: 'Only the host can return to lobby' };

    room.status = 'lobby';
    room.engine = null;
    room.lastActiveAt = Date.now();

    if (!room.messages) room.messages = [];
    room.messages.push({
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'system',
      senderName: 'System',
      text: `Returned to lobby.`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { success: true };
  }

  changeGame(code: string, socketId: string, newGameType: GameType): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(p => p.id === socketId);
    const isHost = player && (player.token === room.hostToken || player.isHost);
    if (!isHost) return { success: false, error: 'Only the host can change the game' };

    room.gameType = newGameType;
    room.status = 'lobby';
    room.engine = null;
    room.lastActiveAt = Date.now();

    if (!room.messages) room.messages = [];
    room.messages.push({
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'system',
      senderName: 'System',
      text: `Game changed to ${newGameType}.`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { success: true };
  }

  kickPlayer(code: string, hostSocketId: string, targetPlayerId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find(p => p.id === hostSocketId);
    const isHost = host && (host.token === room.hostToken || host.isHost);
    if (!isHost) return { success: false, error: 'Only the host can kick players' };

    const target = room.players.find(p => p.id === targetPlayerId);
    room.players = room.players.filter(p => p.id !== targetPlayerId);

    if (target) {
      if (!room.messages) room.messages = [];
      room.messages.push({
        id: Math.random().toString(36).substring(2, 9),
        senderId: 'system',
        senderName: 'System',
        text: `${target.name} was removed from the room`,
        timestamp: Date.now(),
        isSystem: true
      });
    }

    return { success: true };
  }

  addBotPlayer(code: string, hostSocketId: string): { success: boolean; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find(p => p.id === hostSocketId);
    const isHost = host && (host.token === room.hostToken || host.isHost);
    if (!isHost) return { success: false, error: 'Only the host can add bots' };

    const botNames = ['Bot Alex 🤖', 'Bot Charlie 🤖', 'Bot Sam 🤖', 'Bot Riley 🤖', 'Bot Jordan 🤖'];
    const botCount = room.players.filter(p => p.token.startsWith('bot-')).length;
    const name = botNames[botCount % botNames.length] || `Bot ${botCount + 1} 🤖`;
    const botId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const botPlayer: Player = {
      id: botId,
      token: botId,
      name,
      isHost: false,
      isConnected: true,
      joinedAt: Date.now()
    };
    room.players.push(botPlayer);

    if (!room.messages) room.messages = [];
    room.messages.push({
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'system',
      senderName: 'System',
      text: `${name} joined the room`,
      timestamp: Date.now(),
      isSystem: true
    });

    room.lastActiveAt = Date.now();
    return { success: true };
  }

  addChatMessage(code: string, socketId: string, text: string): ChatMessage | null {
    const room = this.getRoom(code);
    if (!room || !text.trim()) return null;

    const player = room.players.find(p => p.id === socketId);
    const senderName = player ? player.name : 'Player';
    const isHost = player ? (player.token === room.hostToken || player.isHost) : false;

    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: socketId,
      senderName,
      text: text.trim().slice(0, 280),
      timestamp: Date.now(),
      isHost
    };

    if (!room.messages) room.messages = [];
    room.messages.push(msg);
    if (room.messages.length > 50) {
      room.messages.shift();
    }
    room.lastActiveAt = Date.now();
    return msg;
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
    const isHost = player ? (player.token === room.hostToken || player.isHost) : false;

    return {
      code: room.code,
      gameType: room.gameType,
      status: room.status,
      hostId: room.hostId,
      players: room.players.map(p => ({
        id: p.id,
        token: p.token,
        name: p.name,
        isHost: p.token === room.hostToken || p.isHost,
        isConnected: p.isConnected
      })),
      config: room.config,
      gameView,
      myPlayerId: socketId,
      isHost: !!isHost,
      messages: room.messages || []
    };
  }
}

export const roomManager = new RoomManager();

