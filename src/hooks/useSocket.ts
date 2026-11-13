'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientRoomView, GameType } from '@shared/types';
import { getPlayerToken, saveName, addRecentRoom } from '@/lib/utils';
import { playClickSound, playAlertSound } from '@/lib/sounds';

export function useSocket(roomCode?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<ClientRoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = io(typeof window !== 'undefined' ? window.location.origin : '', {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setError(null);

      // If reconnecting with a room code in URL, auto-reconnect
      if (roomCode) {
        const token = getPlayerToken();
        s.emit('room:reconnect', { code: roomCode, playerToken: token });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('room:state', (state: ClientRoomView) => {
      setRoomState(state);
      setError(null);
      addRecentRoom(state.code, state.gameType);
    });

    s.on('room:error', (msg: string) => {
      setError(msg);
      playAlertSound();
    });

    return () => {
      s.disconnect();
    };
  }, [roomCode]);

  const createRoom = useCallback((gameType: GameType, playerName: string) => {
    if (!socketRef.current) return;
    saveName(playerName);
    const token = getPlayerToken();
    playClickSound();
    socketRef.current.emit('room:create', { gameType, playerName, playerToken: token });
  }, []);

  const joinRoom = useCallback((code: string, playerName: string) => {
    if (!socketRef.current) return;
    saveName(playerName);
    const token = getPlayerToken();
    playClickSound();
    socketRef.current.emit('room:join', { code, playerName, playerToken: token });
  }, []);

  const startGame = useCallback(() => {
    if (!socketRef.current) return;
    playClickSound();
    socketRef.current.emit('room:start_game');
  }, []);

  const restartGame = useCallback(() => {
    if (!socketRef.current) return;
    playClickSound();
    socketRef.current.emit('room:restart_game');
  }, []);

  const changeGame = useCallback((gameType: GameType) => {
    if (!socketRef.current) return;
    playClickSound();
    socketRef.current.emit('room:change_game', { gameType });
  }, []);

  const kickPlayer = useCallback((targetPlayerId: string) => {
    if (!socketRef.current) return;
    playClickSound();
    socketRef.current.emit('room:kick_player', targetPlayerId);
  }, []);

  const sendAction = useCallback((type: string, payload?: any) => {
    if (!socketRef.current) return;
    playClickSound();
    socketRef.current.emit('game:action', { type, payload });
  }, []);

  return {
    socket,
    isConnected,
    roomState,
    error,
    createRoom,
    joinRoom,
    startGame,
    restartGame,
    changeGame,
    kickPlayer,
    sendAction,
    clearError: () => setError(null)
  };
}
