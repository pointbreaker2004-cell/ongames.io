import { Server, Socket } from 'socket.io';
import { roomManager, Room } from './roomManager.js';
import { GameType } from '../../shared/types.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;

    // Helper to broadcast personalized sanitized view to each player in the room
    const broadcastRoomUpdate = (code: string) => {
      const room = roomManager.getRoom(code);
      if (!room) return;

      room.players.forEach(p => {
        if (p.isConnected && p.id) {
          const sanitizedView = roomManager.getSanitizedView(room, p.id);
          io.to(p.id).emit('room:state', sanitizedView);
        }
      });
    };

    // 1. Create Room
    socket.on('room:create', (data: { gameType: GameType; playerName: string; playerToken: string }) => {
      try {
        const room = roomManager.createRoom(data.gameType, data.playerName, data.playerToken, socket.id);
        currentRoomCode = room.code;
        socket.join(room.code);
        broadcastRoomUpdate(room.code);
      } catch (err: any) {
        socket.emit('room:error', err?.message || 'Failed to create room');
      }
    });

    // 2. Join Room
    socket.on('room:join', (data: { code: string; playerName: string; playerToken: string }) => {
      try {
        const result = roomManager.joinRoom(data.code, data.playerName, data.playerToken, socket.id);
        if (!result.success || !result.room) {
          socket.emit('room:error', result.error || 'Failed to join room');
          return;
        }

        currentRoomCode = result.room.code;
        socket.join(result.room.code);
        broadcastRoomUpdate(result.room.code);
      } catch (err: any) {
        socket.emit('room:error', err?.message || 'Error joining room');
      }
    });

    // 3. Reconnect
    socket.on('room:reconnect', (data: { code: string; playerToken: string }) => {
      try {
        const result = roomManager.joinRoom(data.code, '', data.playerToken, socket.id);
        if (result.success && result.room) {
          currentRoomCode = result.room.code;
          socket.join(result.room.code);
          broadcastRoomUpdate(result.room.code);
        } else {
          socket.emit('room:error', result.error || 'Could not reconnect to room');
        }
      } catch (err: any) {
        socket.emit('room:error', err?.message || 'Error reconnecting');
      }
    });

    // 4. Start Game
    socket.on('room:start_game', () => {
      if (!currentRoomCode) return;
      const result = roomManager.startGame(currentRoomCode, socket.id);
      if (result.success) {
        broadcastRoomUpdate(currentRoomCode);
      } else {
        socket.emit('room:error', result.error || 'Could not start game');
      }
    });

    // 5. Restart Game (return to lobby with same players)
    socket.on('room:restart_game', () => {
      if (!currentRoomCode) return;
      const result = roomManager.restartGame(currentRoomCode, socket.id);
      if (result.success) {
        broadcastRoomUpdate(currentRoomCode);
      } else {
        socket.emit('room:error', result.error || 'Could not restart game');
      }
    });

    // 6. Change Game
    socket.on('room:change_game', (data: { gameType: GameType }) => {
      if (!currentRoomCode) return;
      const result = roomManager.changeGame(currentRoomCode, socket.id, data.gameType);
      if (result.success) {
        broadcastRoomUpdate(currentRoomCode);
      } else {
        socket.emit('room:error', result.error || 'Could not change game');
      }
    });

    // 7. Kick Player
    socket.on('room:kick_player', (targetPlayerId: string) => {
      if (!currentRoomCode) return;
      const result = roomManager.kickPlayer(currentRoomCode, socket.id, targetPlayerId);
      if (result.success) {
        io.to(targetPlayerId).emit('room:error', 'You were removed from the room by the host.');
        broadcastRoomUpdate(currentRoomCode);
      } else {
        socket.emit('room:error', result.error || 'Could not kick player');
      }
    });

    // 8. In-Game Action
    socket.on('game:action', (action: { type: string; payload?: any }) => {
      if (!currentRoomCode) return;
      const result = roomManager.handleGameAction(currentRoomCode, socket.id, action);
      if (result.success) {
        broadcastRoomUpdate(currentRoomCode);
      } else {
        socket.emit('room:error', result.error || 'Action failed');
      }
    });

    // 9. Leave Room
    socket.on('room:leave', () => {
      if (currentRoomCode) {
        socket.leave(currentRoomCode);
        const room = roomManager.handleDisconnect(socket.id);
        if (room) {
          broadcastRoomUpdate(room.code);
        }
        currentRoomCode = null;
      }
    });

    // 10. Disconnect
    socket.on('disconnect', () => {
      const room = roomManager.handleDisconnect(socket.id);
      if (room) {
        broadcastRoomUpdate(room.code);
      }
    });
  });
}

