'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CodewordsClientView, CodewordTeam } from '@shared/types';
import { playClickSound, playSuccessSound, playAlertSound } from '@/lib/sounds';
import { Eye, EyeOff, Send, SkipForward, Trophy, Skull, Flame } from 'lucide-react';

interface CodewordsViewProps {
  view: CodewordsClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
}

export function CodewordsView({ view, onAction, myPlayerId }: CodewordsViewProps) {
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState('1');

  useEffect(() => {
    if (view.winner) {
      playSuccessSound();
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 }
      });
    }
  }, [view.winner]);

  const handleGiveClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueWord.trim()) return;
    playClickSound();
    onAction('give_clue', { word: clueWord.trim(), count: parseInt(clueCount, 10) });
    setClueWord('');
  };

  const handleCardClick = (idx: number) => {
    if (view.isSpymaster) return;
    if (view.currentTurn !== view.myTeam) return;
    if (!view.currentClue) return;
    if (view.cards[idx].revealed) return;

    playClickSound();
    onAction('guess_card', { index: idx });
  };

  const getCardStyle = (card: any) => {
    if (card.revealed) {
      if (card.type === 'red') return 'bg-gradient-to-br from-red-600 to-rose-700 text-white border-red-500 shadow-lg shadow-red-900/40 font-black';
      if (card.type === 'blue') return 'bg-gradient-to-br from-blue-600 to-sky-700 text-white border-blue-500 shadow-lg shadow-blue-900/40 font-black';
      if (card.type === 'neutral') return 'bg-slate-800/80 text-slate-500 border-slate-700/60 opacity-60';
      if (card.type === 'assassin') return 'bg-black text-rose-500 border-2 border-rose-600 shadow-2xl font-black ring-2 ring-rose-500/50';
    }

    if (view.isSpymaster) {
      // Spymaster glowing cards
      if (card.type === 'red') return 'bg-red-950/70 text-red-200 border-2 border-red-500/80 shadow-md shadow-red-950/50 font-black';
      if (card.type === 'blue') return 'bg-blue-950/70 text-blue-200 border-2 border-blue-500/80 shadow-md shadow-blue-950/50 font-black';
      if (card.type === 'neutral') return 'bg-slate-900/70 text-slate-400 border border-slate-700/60';
      if (card.type === 'assassin') return 'bg-black text-rose-400 border-2 border-rose-500 font-black shadow-lg shadow-rose-950/80 ring-1 ring-rose-500';
    }

    return 'bg-slate-900/90 text-slate-100 border border-white/10 hover:border-sky-400 hover:bg-slate-800/90 active:scale-95 shadow-md font-bold';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-in fade-in duration-150">
      {/* Score & Turn Banner */}
      <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl backdrop-blur-xl">
        {/* Red Team Score */}
        <div className={`flex flex-col items-center px-4 sm:px-6 py-2 rounded-2xl border-2 transition-all ${
          view.currentTurn === 'red' 
            ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20' 
            : 'border-transparent bg-white/[0.02]'
        }`}>
          <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">Red Team</span>
          <span className="text-2xl sm:text-3xl font-black text-red-400 font-mono">
            {view.redScore} <span className="text-sm font-normal text-slate-500">/ {view.redTotal}</span>
          </span>
        </div>

        {/* Turn Status */}
        <div className="text-center px-2">
          {view.winner ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm sm:text-base animate-bounce">
              <Trophy className="h-5 w-5" />
              <span>{view.winner.toUpperCase()} TEAM WINS!</span>
            </div>
          ) : (
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                view.currentTurn === 'red' 
                  ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {view.currentTurn} TEAM TURN
              </span>
              <div className="text-xs text-slate-300 font-medium mt-1.5">
                {view.currentClue 
                  ? `Clue: "${view.currentClue.word}" (${view.currentClue.count})`
                  : 'Waiting for Spymaster clue...'}
              </div>
            </div>
          )}
        </div>

        {/* Blue Team Score */}
        <div className={`flex flex-col items-center px-4 sm:px-6 py-2 rounded-2xl border-2 transition-all ${
          view.currentTurn === 'blue' 
            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
            : 'border-transparent bg-white/[0.02]'
        }`}>
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Blue Team</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
            {view.blueScore} <span className="text-sm font-normal text-slate-500">/ {view.blueTotal}</span>
          </span>
        </div>
      </div>

      {/* Role and Team Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-2xl text-xs font-bold text-slate-300">
        <div>
          You are: <span className={`uppercase font-black ${view.myTeam === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
            {view.myTeam}
          </span> ({view.isSpymaster ? 'Spymaster' : 'Operative'})
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onAction('switch_team')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Switch Team
          </button>
          <button
            onClick={() => onAction('toggle_spymaster')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 text-sky-400"
          >
            {view.isSpymaster ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {view.isSpymaster ? 'Be Operative' : 'Be Spymaster'}
          </button>
        </div>
      </div>

      {/* 5x5 Card Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
        {view.cards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => handleCardClick(idx)}
            disabled={card.revealed || view.isSpymaster || view.currentTurn !== view.myTeam || !view.currentClue}
            className={`h-16 sm:h-20 p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${getCardStyle(card)}`}
          >
            <span className="text-[11px] sm:text-xs tracking-tight break-all font-mono leading-none uppercase">
              {card.word}
            </span>
          </button>
        ))}
      </div>

      {/* Spymaster Clue Input or Operative Pass */}
      {!view.winner && (
        <div className="pt-2">
          {view.isSpymaster && view.currentTurn === view.myTeam && !view.currentClue && (
            <form onSubmit={handleGiveClue} className="p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Spymaster Clue Dispatch
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={clueWord}
                  onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                  placeholder="ONE WORD CLUE"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm font-bold uppercase tracking-wider text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <select
                  value={clueCount}
                  onChange={(e) => setClueCount(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm font-bold text-white focus:outline-none"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs hover:from-sky-400 hover:to-indigo-500 flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </form>
          )}

          {!view.isSpymaster && view.currentTurn === view.myTeam && view.currentClue && (
            <button
              onClick={() => onAction('pass_turn')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 text-white font-bold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <SkipForward className="h-4 w-4" /> End Team Turn ({view.guessesRemaining} guess remaining)
            </button>
          )}
        </div>
      )}

      {/* Game Over Reason */}
      {view.winReason && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-white text-center font-bold text-sm shadow-xl">
          {view.winReason}
        </div>
      )}
    </div>
  );
}
