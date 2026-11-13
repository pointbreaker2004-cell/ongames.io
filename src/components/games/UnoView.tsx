'use client';

import { useState, useEffect, useRef } from 'react';
import { UnoClientView, UnoCard, UnoColor } from '@shared/types';
import { playClickSound, playSuccessSound, playAlertSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';
import { 
  Trophy, ArrowRight, Ban, Repeat, Plus, Sparkles, 
  Layers, Users, ShieldAlert, Check
} from 'lucide-react';

interface UnoViewProps {
  view: UnoClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string; [key: string]: any }[];
  isHost?: boolean;
}

const COLOR_MAP: Record<UnoColor, { bg: string; text: string; border: string; label: string }> = {
  red: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', label: 'RED' },
  yellow: { bg: 'bg-amber-400', text: 'text-amber-950', border: 'border-amber-500', label: 'YELLOW' },
  green: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', label: 'GREEN' },
  blue: { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-600', label: 'BLUE' },
  wild: { bg: 'bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-500 to-sky-500', text: 'text-white', border: 'border-purple-500', label: 'WILD' }
};

export function UnoView({ view, onAction, myPlayerId, players, isHost }: UnoViewProps) {
  const [wildModalCardId, setWildModalCardId] = useState<string | null>(null);

  // Confetti on win
  const hasCelebrated = useRef(false);
  useEffect(() => {
    if (view.winner && !hasCelebrated.current) {
      hasCelebrated.current = true;
      playSuccessSound();
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
    } else if (!view.winner) {
      hasCelebrated.current = false;
    }
  }, [view.winner]);

  const isCardPlayable = (card: UnoCard) => {
    if (!view.isMyTurn) return false;
    if (card.color === 'wild') return true;
    if (card.color === view.activeColor) return true;
    if (card.value === view.topCard.value) return true;
    return false;
  };

  const handleCardClick = (card: UnoCard) => {
    if (!view.isMyTurn) {
      playAlertSound();
      return;
    }

    if (!isCardPlayable(card)) {
      playAlertSound();
      return;
    }

    if (card.color === 'wild') {
      setWildModalCardId(card.id);
      return;
    }

    playClickSound();
    onAction('play_card', { cardId: card.id });
  };

  const handleChooseWildColor = (color: UnoColor) => {
    if (!wildModalCardId) return;
    playClickSound();
    onAction('play_card', {
      cardId: wildModalCardId,
      chosenColor: color
    });
    setWildModalCardId(null);
  };

  const handleDrawCard = () => {
    if (!view.isMyTurn) return;
    playClickSound();
    onAction('draw_card');
  };

  const handleCallUno = () => {
    playSuccessSound();
    onAction('call_uno');
  };

  const renderCardFace = (card: UnoCard) => {
    const isSpecial = ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.value);
    if (card.value === 'skip') return <Ban className="h-6 w-6 stroke-[2.5]" />;
    if (card.value === 'reverse') return <Repeat className="h-6 w-6 stroke-[2.5]" />;
    if (card.value === 'draw2') return <span className="font-black text-xl">+2</span>;
    if (card.value === 'wild') return <Sparkles className="h-6 w-6" />;
    if (card.value === 'wild4') return <span className="font-black text-xl">+4</span>;
    return <span className="font-black text-3xl font-mono">{card.value}</span>;
  };

  // Winner View
  if (view.winner) {
    const isMeWinner = view.winner === myPlayerId;
    return (
      <div className="max-w-md mx-auto space-y-6 pt-6 text-center animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-4">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <Trophy className="h-10 w-10" />
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isMeWinner ? 'You Won the Game!' : `${view.winnerName || 'Player'} Won!`}
          </h2>
          <p className="text-sm text-slate-500">
            All cards were successfully discarded. What a battle!
          </p>

          <button
            onClick={() => { playClickSound(); window.location.href = '/games'; }}
            className="mt-4 w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md transition-all active:scale-98"
          >
            Back to Games Catalog
          </button>
        </div>
      </div>
    );
  }

  const activeColorInfo = COLOR_MAP[view.activeColor] || COLOR_MAP.red;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Status & Opponents Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Active Color:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${activeColorInfo.bg} ${activeColorInfo.text} shadow-sm`}>
              {activeColorInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {view.isMyTurn ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1.5 animate-pulse">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Your Turn to Play!
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  Waiting for opponent turn...
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Other players hands badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {view.otherPlayers.map(p => (
            <div
              key={p.id}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                view.currentTurnPlayerId === p.id
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <span className="truncate max-w-[90px]">{p.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-white text-[11px] font-black border border-slate-200 shadow-sm">
                {p.cardCount} 🂠
              </span>
              {p.hasSaidUno && (
                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                  UNO!
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center Arena: Discard Pile & Draw Deck */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl flex items-center justify-center gap-6 sm:gap-10 relative overflow-hidden">
        {/* Draw Pile Deck */}
        <div className="flex flex-col items-center">
          <div
            onClick={handleDrawCard}
            className={`h-36 w-24 sm:h-44 sm:w-30 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 shadow-2xl flex flex-col items-center justify-center transition-all ${
              view.isMyTurn
                ? 'cursor-pointer hover:scale-105 hover:border-amber-400 ring-4 ring-amber-400/20'
                : 'cursor-not-allowed opacity-75'
            }`}
          >
            <Layers className="h-8 w-8 text-amber-400 mb-1" />
            <span className="font-black text-white text-xs tracking-wider uppercase">DRAW</span>
            <span className="text-[10px] text-slate-400 mt-1">{view.drawPileCount} left</span>
          </div>
          <span className="text-xs font-bold text-slate-400 mt-2">Draw Deck</span>
        </div>

        {/* Current Top Card */}
        <div className="flex flex-col items-center">
          {(() => {
            const topColor = COLOR_MAP[view.topCard.color] || COLOR_MAP.red;
            return (
              <div
                className={`h-36 w-24 sm:h-44 sm:w-30 rounded-2xl ${topColor.bg} ${topColor.border} border-4 shadow-2xl flex flex-col items-center justify-between p-2.5 sm:p-3 select-none transform rotate-1`}
              >
                <span className={`text-[11px] font-black uppercase tracking-wider self-start ${topColor.text}`}>
                  UNO
                </span>

                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/95 flex items-center justify-center shadow-inner text-slate-900">
                  {renderCardFace(view.topCard)}
                </div>

                <span className={`text-[11px] font-black uppercase tracking-wider self-end ${topColor.text}`}>
                  UNO
                </span>
              </div>
            );
          })()}
          <span className="text-xs font-bold text-slate-400 mt-2">Discard Pile</span>
        </div>

        {/* Shout UNO Button */}
        {view.canCallUno && (
          <button
            onClick={handleCallUno}
            className="absolute right-4 bottom-4 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-rose-600/40 animate-bounce active:scale-95"
          >
            🔥 SHOUT UNO!
          </button>
        )}
      </div>

      {/* Player Hand */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            YOUR HAND ({view.myHand.length} cards)
          </span>
          {view.isMyTurn && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Tap any highlighted card to play
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center pt-2">
          {view.myHand.map((card) => {
            const playable = isCardPlayable(card);
            const color = COLOR_MAP[card.color] || COLOR_MAP.red;

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`h-32 w-20 sm:h-36 sm:w-24 rounded-2xl ${color.bg} ${color.border} border-2 shadow-md flex flex-col items-center justify-between p-2 select-none transition-all ${
                  playable
                    ? 'cursor-pointer hover:-translate-y-3 hover:shadow-xl ring-4 ring-emerald-400/40'
                    : 'opacity-50 cursor-not-allowed grayscale-[30%]'
                }`}
              >
                <span className={`text-[9px] font-black uppercase ${color.text}`}>UNO</span>
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/95 flex items-center justify-center shadow-inner text-slate-900">
                  {renderCardFace(card)}
                </div>
                <span className={`text-[9px] font-black uppercase ${color.text}`}>UNO</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-1.5 text-xs text-slate-600 max-h-32 overflow-y-auto">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
          Recent Action Log
        </span>
        {view.log.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5 truncate">
            <span className="text-slate-400">•</span>
            <span>{entry}</span>
          </div>
        ))}
      </div>

      {/* Wild Color Selection Modal */}
      {wildModalCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <h3 className="text-xl font-black text-slate-900">Choose Wild Color</h3>
            <p className="text-xs text-slate-500">Pick which color other players must follow:</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleChooseWildColor('red')}
                className="py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm shadow-md transition-all active:scale-95"
              >
                RED
              </button>
              <button
                onClick={() => handleChooseWildColor('yellow')}
                className="py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm shadow-md transition-all active:scale-95"
              >
                YELLOW
              </button>
              <button
                onClick={() => handleChooseWildColor('green')}
                className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-all active:scale-95"
              >
                GREEN
              </button>
              <button
                onClick={() => handleChooseWildColor('blue')}
                className="py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md transition-all active:scale-95"
              >
                BLUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

