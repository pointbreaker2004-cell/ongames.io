'use client';

import { useState } from 'react';
import { ClientRoomView, GameType } from '@shared/types';
import { GAME_CATALOG } from '@shared/gameMetadata';
import { QRCodeModal } from '@/components/QRCodeModal';
import { playClickSound } from '@/lib/sounds';
import { 
  Users, Crown, QrCode, Copy, Check, Play, Settings2, Trash2, 
  Sparkles, Share2, Bot, Plus, Zap
} from 'lucide-react';

interface LobbyViewProps {
  room: ClientRoomView;
  onStartGame: () => void;
  onChangeGame: (newGame: GameType) => void;
  onKickPlayer: (targetId: string) => void;
  onAddBot?: () => void;
}

const AVATAR_EMOJIS = ['🦊', '🐺', '🦁', '🐼', '🦅', '🦉', '🦄', '🐲', '🐯', '🐸', '🐨', '🦖'];

export function LobbyView({ room, onStartGame, onChangeGame, onKickPlayer, onAddBot }: LobbyViewProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);

  const gameInfo = GAME_CATALOG.find(g => g.id === room.gameType) || GAME_CATALOG[0];
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${room.code}` : '';

  const minPlayers = gameInfo.minPlayers;
  const currentCount = room.players.filter(p => p.isConnected).length;
  const canStart = currentCount >= minPlayers;

  const handleCopyLink = () => {
    playClickSound();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    playClickSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my game of ${gameInfo.title} on OnGames!`,
          text: `Use code ${room.code} or click the link to play:`,
          url: shareUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Room Code Showcase Box */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-sm text-center">
        <div className="relative z-10 flex flex-col items-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ROOM CODE</span>
          </div>

          <div className="text-6xl sm:text-7xl font-black tracking-[0.25em] text-slate-900 select-all font-mono py-1">
            {room.code}
          </div>
          <p className="text-xs text-slate-500 font-medium">Share this 4-letter code or invite link with friends</p>
        </div>

        {/* Share buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 relative z-10">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-sky-600" />}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={() => { playClickSound(); setShowQR(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <QrCode className="h-4 w-4 text-purple-600" />
            Show QR Code
          </button>

          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs sm:text-sm font-bold border border-sky-200 transition-all active:scale-95 shadow-sm"
          >
            <Share2 className="h-4 w-4 text-sky-600" />
            Share Room
          </button>
        </div>
      </div>

      {/* Selected Game Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200/60 mb-1.5 inline-block">
            {gameInfo.category}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{gameInfo.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{gameInfo.subtitle}</p>
          <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mt-2">
            <span>Min {gameInfo.minPlayers} players</span>
            <span>•</span>
            <span>{gameInfo.playTimeMinutes}</span>
          </div>
        </div>

        {room.isHost && (
          <button
            onClick={() => { playClickSound(); setShowGamePicker(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all"
          >
            <Settings2 className="h-4 w-4 text-slate-500" />
            Change Game
          </button>
        )}
      </div>

      {/* Players Roster */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Users className="h-4 w-4 text-sky-600" />
            <span>PLAYERS IN LOBBY ({currentCount})</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {canStart ? 'Ready to launch!' : `Need ${minPlayers - currentCount} more`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {room.players.map((p, idx) => {
            const isMe = p.id === room.myPlayerId;
            const avatar = AVATAR_EMOJIS[idx % AVATAR_EMOJIS.length];

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'border-sky-300 bg-sky-50/60 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl select-none">{avatar}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate text-sm font-bold text-slate-900">
                        {p.name}
                      </span>
                      {isMe && <span className="text-[11px] text-sky-600 font-bold">(You)</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span className={`h-1.5 w-1.5 rounded-full ${p.isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{p.isConnected ? 'Connected' : 'Reconnecting...'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {p.isHost && (
                    <span title="Host" className="p-1">
                      <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                    </span>
                  )}

                  {room.isHost && !p.isHost && (
                    <button
                      onClick={() => { playClickSound(); onKickPlayer(p.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Player"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Game Action */}
      <div className="pt-2">
        {room.isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-lg shadow-md active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="h-5 w-5 fill-white" />
            <span>{canStart ? 'Start Game Now' : `Need at least ${minPlayers} players to start`}</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center text-sm font-semibold text-slate-500 flex items-center justify-center gap-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
            Waiting for the host to start the game...
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <QRCodeModal
          url={shareUrl}
          code={room.code}
          onClose={() => { playClickSound(); setShowQR(false); }}
        />
      )}

      {/* Change Game Modal (Host only) */}
      {showGamePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Switch Room Game</h3>
            <p className="text-xs text-slate-500 mb-4">Choose another game to play with this lobby:</p>

            <div className="space-y-2.5">
              {GAME_CATALOG.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    playClickSound();
                    onChangeGame(g.id);
                    setShowGamePicker(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    g.id === room.gameType
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900">{g.title}</div>
                    <div className="text-xs text-slate-500">{g.subtitle}</div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {g.minPlayers}+ players
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { playClickSound(); setShowGamePicker(false); }}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
