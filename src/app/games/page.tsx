'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GAME_CATALOG } from '@shared/gameMetadata';
import { GameType, GameMetadata } from '@shared/types';
import { useSocket } from '@/hooks/useSocket';
import { getSavedName, saveName } from '@/lib/utils';
import { playClickSound } from '@/lib/sounds';
import {
  Users, Clock, ArrowRight, BookOpen, X, Sparkles, 
  Gamepad2, Flame, ShieldAlert, KeyRound, Eye, Moon, Heart, 
  Radio, Sword, Crown, HelpCircle, Layers, Zap, Check, Loader2, AlertCircle
} from 'lucide-react';

interface GameThemeConfig {
  tag: string;
  tagColor: string;
  accentColor: string;
  buttonBg: string;
  bannerGradient: string;
  bannerEmoji: string;
  icon: any;
}

const THEMES: Record<GameType, GameThemeConfig> = {
  'codewords': {
    tag: 'POPULAR',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: 'text-rose-600',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
    bannerGradient: 'from-rose-500 via-rose-600 to-amber-600',
    bannerEmoji: '🕵️‍♂️',
    icon: KeyRound
  },
  'spyfall': {
    tag: 'BLUFFING',
    tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
    accentColor: 'text-sky-600',
    buttonBg: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20',
    bannerGradient: 'from-sky-500 via-blue-600 to-indigo-700',
    bannerEmoji: '🕶️',
    icon: Eye
  },
  'onuw': {
    tag: 'COMMUNITY FAVORITE',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accentColor: 'text-indigo-600',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
    bannerGradient: 'from-indigo-600 via-purple-700 to-slate-900',
    bannerEmoji: '🐺',
    icon: Moon
  },
  'two-truths': {
    tag: 'NEW',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    accentColor: 'text-purple-600',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20',
    bannerGradient: 'from-purple-500 via-indigo-600 to-pink-600',
    bannerEmoji: '🤥',
    icon: HelpCircle
  },
  'uno': {
    tag: 'NEW',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    accentColor: 'text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    bannerGradient: 'from-rose-500 via-amber-500 to-emerald-500',
    bannerEmoji: '🃏',
    icon: Layers
  },
  'chess': {
    tag: 'STRATEGY',
    tagColor: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: 'text-slate-800',
    buttonBg: 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20',
    bannerGradient: 'from-slate-800 via-slate-900 to-black',
    bannerEmoji: '♟️',
    icon: Crown
  },
  'love-letter': {
    tag: 'QUICK PLAY',
    tagColor: 'bg-pink-50 text-pink-700 border-pink-200',
    accentColor: 'text-pink-600',
    buttonBg: 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20',
    bannerGradient: 'from-pink-500 via-rose-600 to-red-600',
    bannerEmoji: '💌',
    icon: Heart
  },
  'secret-sith': {
    tag: 'DEDUCTION',
    tagColor: 'bg-red-50 text-red-700 border-red-200',
    accentColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
    bannerGradient: 'from-red-600 via-rose-800 to-black',
    bannerEmoji: '⚡',
    icon: ShieldAlert
  },
  'avalon': {
    tag: 'CAMPAIGN',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    accentColor: 'text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    bannerGradient: 'from-amber-600 via-orange-600 to-cyan-900',
    bannerEmoji: '⚔️',
    icon: Sword
  },
  'enigma': {
    tag: 'WORD GAME',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: 'text-emerald-600',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
    bannerGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    bannerEmoji: '📻',
    icon: Radio
  }
};

export default function GamesCatalogPage() {
  const router = useRouter();
  const { createRoom, roomState, error: socketError } = useSocket();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeRuleModal, setActiveRuleModal] = useState<GameMetadata | null>(null);
  const [createModalGame, setCreateModalGame] = useState<GameMetadata | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [quickCode, setQuickCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (roomState?.code) {
      router.push(`/room/${roomState.code}`);
    }
  }, [roomState?.code, router]);

  useEffect(() => {
    if (socketError) {
      setIsSubmitting(false);
    }
  }, [socketError]);

  const categoryOptions = [
    { label: 'All Games', count: GAME_CATALOG.length, emoji: '✨' },
    { label: 'Card Game', emoji: '🃏' },
    { label: 'Social Deduction', emoji: '🐺' },
    { label: 'Bluffing', emoji: '🕶️' },
    { label: 'Word Game', emoji: '💬' },
    { label: 'Board Game', emoji: '♟️' }
  ];

  const filteredGames = selectedCategory === 'All'
    ? GAME_CATALOG
    : GAME_CATALOG.filter(g => g.category === selectedCategory);

  const handleOpenCreateModal = (game: GameMetadata) => {
    try { playClickSound(); } catch {}
    const saved = getSavedName();
    setPlayerName(saved || 'Host');
    setIsSubmitting(false);
    setCreateModalGame(game);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModalGame || isSubmitting) return;
    setIsSubmitting(true);
    const name = playerName.trim() || 'Host';
    saveName(name);
    createRoom(createModalGame.id, name);
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim().length === 4) {
      try { playClickSound(); } catch {}
      router.push(`/join?code=${quickCode.toUpperCase().trim()}`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Handcrafted Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 text-white p-7 sm:p-12 shadow-2xl border border-indigo-800/40">
        {/* Subtle atmospheric ambient glows */}
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold tracking-wide mb-5 border border-white/15 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multiplayer Games Without App Installs</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.12] tracking-tight mb-4">
            Your Phone Is <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              Your Game Controller.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-lg font-normal">
            Play party, social deduction, card, and strategy games with friends in the same room or over Discord and Zoom. Zero accounts needed.
          </p>

          {/* Quick Join Arcade Box */}
          <div className="bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-white/15 max-w-md shadow-lg">
            <form onSubmit={handleQuickJoin} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={quickCode}
                onChange={e => setQuickCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ENTER 4-LETTER CODE"
                className="px-4 py-3 rounded-xl bg-white text-slate-900 font-mono font-black placeholder:text-slate-400 placeholder:font-sans placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm uppercase tracking-widest flex-1 shadow-inner text-center sm:text-left"
              />
              <button
                type="submit"
                disabled={quickCode.length !== 4}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <span>Join Game</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Feature Highlights Pills */}
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Instant Play
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Users className="h-3.5 w-3.5 text-sky-400" /> 2–12 Players
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Gamepad2 className="h-3.5 w-3.5 text-emerald-400" /> 100% Free
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 flex-wrap items-center">
        {categoryOptions.map(cat => {
          const isSelected = (cat.label === 'All Games' && selectedCategory === 'All') || selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => {
                playClickSound();
                setSelectedCategory(cat.label === 'All Games' ? 'All' : cat.label);
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-[1.02]'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {cat.count && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Handcrafted Game Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => {
          const theme = THEMES[game.id] || THEMES['codewords'];
          const Icon = theme.icon;

          return (
            <div
              key={game.id}
              className="card-lift group relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all flex flex-col overflow-hidden"
            >
              {/* Illustrated Visual Card Banner */}
              <div className={`h-24 bg-gradient-to-br ${theme.bannerGradient} p-4 sm:p-5 relative overflow-hidden flex items-end justify-between text-white`}>
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                
                {/* Big decorative emoji in background */}
                <span className="absolute -top-2 -right-1 text-5xl opacity-30 select-none transform rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {theme.bannerEmoji}
                </span>

                {/* Category Badge on banner */}
                <span className="relative z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/30 backdrop-blur-md text-white border border-white/20 shadow-sm">
                  {game.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {game.title}
                    </h2>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.tagColor}`}>
                      {theme.tag}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-400 mb-2.5">
                    {game.subtitle}
                  </p>

                  {/* Clean un-cramped Player Count & Duration Row */}
                  <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-600 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 whitespace-nowrap">
                      <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>{game.minPlayers}–{game.maxPlayers || '∞'} players</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>{game.playTimeMinutes}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal line-clamp-3">
                    {game.description}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation();
                      try { playClickSound(); } catch {}
                      setActiveRuleModal(game); 
                    }}
                    className="flex-1 py-3 px-3 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    <span>Rules</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCreateModal(game);
                    }}
                    className={`flex-1 py-3 px-3 rounded-xl ${theme.buttonBg} text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 touch-manipulation cursor-pointer`}
                  >
                    <span>New Game</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Room Modal */}
      {createModalGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => { 
                try { playClickSound(); } catch {}
                setCreateModalGame(null); 
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Host New Room</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{createModalGame.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Requires at least {createModalGame.minPlayers} players to begin.</p>
            </div>

            {socketError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{socketError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={18}
                  autoComplete="name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 text-base transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm active:scale-98 transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50 touch-manipulation cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <span>Create Room &amp; Get 4-Letter Code</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {activeRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { playClickSound(); setActiveRuleModal(null); }}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Official Rules</span>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{activeRuleModal.title}</h3>
            <p className="text-xs text-slate-500 mb-5">{activeRuleModal.subtitle}</p>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">How to Play</h4>
              <ol className="space-y-2.5 text-sm text-slate-700">
                {activeRuleModal.howToPlay.map((rule, idx) => (
                  <li key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => {
                setActiveRuleModal(null);
                handleOpenCreateModal(activeRuleModal);
              }}
              className="mt-5 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-98 transition-all"
            >
              Play {activeRuleModal.title} Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
