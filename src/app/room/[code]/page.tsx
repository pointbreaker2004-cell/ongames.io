'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { getSavedName, saveName } from '@/lib/utils';
import { playClickSound } from '@/lib/sounds';
import { LobbyView } from '@/components/LobbyView';
import { CodewordsView } from '@/components/games/CodewordsView';
import { SpyfallView } from '@/components/games/SpyfallView';
import { ONUWView } from '@/components/games/ONUWView';
import { LoveLetterView } from '@/components/games/LoveLetterView';
import { SecretSithView } from '@/components/games/SecretSithView';
import { TwoTruthsView } from '@/components/games/TwoTruthsView';
import { UnoView } from '@/components/games/UnoView';
import { ChessView } from '@/components/games/ChessView';
import { RotateCcw, AlertCircle, ArrowLeft, Users, Gamepad2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ChatDrawer } from '@/components/ChatDrawer';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string || '').toUpperCase().trim();

  const {
    roomState,
    error,
    isConnected,
    joinRoom,
    startGame,
    restartGame,
    changeGame,
    kickPlayer,
    sendAction,
    sendChatMessage,
    addBotPlayer
  } = useSocket(roomCode);

  const [promptName, setPromptName] = useState(false);
  const [enteredName, setEnteredName] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const saved = getSavedName();
    if (!saved) {
      setPromptName(true);
    }
  }, []);

  useEffect(() => {
    if (roomState) {
      setPromptName(false);
    }
  }, [roomState]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredName.trim()) return;
    saveName(enteredName.trim());
    setPromptName(false);
    joinRoom(roomCode, enteredName.trim());
  };

  if (promptName) {
    return (
      <div className="max-w-md mx-auto pt-10 text-center space-y-4 animate-in fade-in duration-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700">
          <Gamepad2 className="h-3.5 w-3.5" />
          <span>Quick Setup</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enter Your Name</h2>
        <p className="text-xs text-slate-500">You are connecting to room <span className="font-mono font-bold text-sky-600">{roomCode}</span></p>

        <form onSubmit={handleNameSubmit} className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
          <input
            type="text"
            required
            autoFocus
            maxLength={18}
            value={enteredName}
            onChange={(e) => setEnteredName(e.target.value)}
            placeholder="Your display name"
            className="w-full text-center text-lg font-bold p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all"
          />
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 shadow-md active:scale-98 transition-all"
          >
            Enter Room
          </button>
        </form>
      </div>
    );
  }

  if (error && !roomState) {
    return (
      <div className="max-w-md mx-auto pt-10 text-center space-y-4 animate-in fade-in duration-200">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <span>{error}</span>
        </div>
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Games Catalog
        </Link>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="max-w-md mx-auto pt-24 text-center space-y-4 animate-in fade-in duration-200">
        <div className="h-10 w-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto shadow-md" />
        <p className="text-sm font-bold text-slate-500 tracking-wide">Connecting to Room <span className="font-mono text-slate-900 font-extrabold">{roomCode}</span>...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lobby View */}
      {roomState.status === 'lobby' && (
        <LobbyView
          room={roomState}
          onStartGame={startGame}
          onChangeGame={changeGame}
          onKickPlayer={kickPlayer}
          onAddBot={addBotPlayer}
        />
      )}

      {/* Active Game View */}
      {roomState.status !== 'lobby' && (
        <div className="space-y-4">
          {/* Top Bar for In-Game Screen */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-3 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-xl text-slate-800 font-bold tracking-wider">
                ROOM: {roomState.code}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Users className="h-3.5 w-3.5 text-sky-600" />
                {roomState.players.filter(p => p.isConnected).length} online
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try { playClickSound(); } catch {}
                  setIsChatOpen(prev => !prev);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors touch-manipulation cursor-pointer"
                title="Open Chat"
              >
                <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                <span>Chat</span>
                {roomState.messages && roomState.messages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black">
                    {roomState.messages.length}
                  </span>
                )}
              </button>

              {roomState.isHost && (
                <button
                  type="button"
                  onClick={() => { 
                    try { playClickSound(); } catch {}
                    restartGame(); 
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors touch-manipulation cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-sky-600" />
                  <span>Return to Lobby</span>
                </button>
              )}
            </div>
          </div>

          {/* Render Game View based on GameType */}
          {roomState.gameType === 'codewords' && roomState.gameView && (
            <CodewordsView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
            />
          )}

          {roomState.gameType === 'spyfall' && roomState.gameView && (
            <SpyfallView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
            />
          )}

          {roomState.gameType === 'onuw' && roomState.gameView && (
            <ONUWView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
              isHost={roomState.isHost}
            />
          )}

          {roomState.gameType === 'love-letter' && roomState.gameView && (
            <LoveLetterView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
            />
          )}

          {roomState.gameType === 'secret-sith' && roomState.gameView && (
            <SecretSithView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
            />
          )}

          {roomState.gameType === 'two-truths' && roomState.gameView && (
            <TwoTruthsView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
              isHost={roomState.isHost}
            />
          )}

          {roomState.gameType === 'uno' && roomState.gameView && (
            <UnoView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
              isHost={roomState.isHost}
            />
          )}

          {roomState.gameType === 'chess' && roomState.gameView && (
            <ChessView
              view={roomState.gameView}
              onAction={sendAction}
              myPlayerId={roomState.myPlayerId}
              players={roomState.players}
              isHost={roomState.isHost}
            />
          )}
        </div>
      )}

      {/* Real-time In-Game Chat Drawer */}
      <ChatDrawer
        messages={roomState.messages || []}
        myPlayerId={roomState.myPlayerId}
        onSendMessage={sendChatMessage}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(prev => !prev)}
      />
    </div>
  );
}
