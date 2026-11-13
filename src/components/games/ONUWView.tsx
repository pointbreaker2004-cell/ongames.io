'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ONUW_ClientView, ONUW_Role } from '@shared/types';
import { playClickSound, playSuccessSound, playAlertSound, playTickSound } from '@/lib/sounds';
import { Moon, Sun, Vote, Eye, EyeOff, ShieldCheck, Skull, Trophy } from 'lucide-react';

interface ONUWViewProps {
  view: ONUW_ClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string }[];
  isHost: boolean;
}

export function ONUWView({ view, onAction, myPlayerId, players, isHost }: ONUWViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [swapP1, setSwapP1] = useState<string>('');
  const [swapP2, setSwapP2] = useState<string>('');

  useEffect(() => {
    if (view.phase === 'ended') {
      playSuccessSound();
      confetti({ particleCount: 110, spread: 75 });
    }
  }, [view.phase]);

  const handleCastVote = (targetId: string) => {
    playClickSound();
    onAction('cast_vote', { targetPlayerId: targetId });
  };

  const isNight = view.phase === 'night';
  const isDay = view.phase === 'day';
  const isVoting = view.phase === 'voting';
  const isEnded = view.phase === 'ended';

  const roleName = view.myInitialRole?.toUpperCase() || 'VILLAGER';

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-150">
      {/* Phase Banner */}
      <div className={`p-5 rounded-3xl border text-center shadow-xl backdrop-blur-xl ${
        isNight 
          ? 'bg-slate-900/90 border-indigo-500/30 text-white' 
          : (isDay ? 'bg-amber-950/40 border-amber-500/30 text-amber-100' : 'bg-slate-900/80 border-white/10 text-white')
      }`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          {isNight && <Moon className="h-5 w-5 text-indigo-400 animate-pulse" />}
          {isDay && <Sun className="h-5 w-5 text-amber-400 animate-spin" />}
          {isVoting && <Vote className="h-5 w-5 text-sky-400 animate-bounce" />}
          {isEnded && <Trophy className="h-5 w-5 text-emerald-400" />}

          <span className="text-xs font-black uppercase tracking-widest">
            {isNight && 'Night Phase — Secret Nocturnal Powers'}
            {isDay && 'Day Phase — Village Debate'}
            {isVoting && 'Voting Phase — Choose Who Dies'}
            {isEnded && 'Execution & Final Outcome'}
          </span>
        </div>

        {isNight && (
          <p className="text-xs text-slate-400">Perform your role’s nocturnal action or wait for the village dawn.</p>
        )}
        {isDay && (
          <p className="text-xs text-amber-200/80">Debate, bluff, and deduce who the Werewolves are before time expires!</p>
        )}
      </div>

      {/* Secret Role Card */}
      <div className="bg-slate-900/90 rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Your Starting Role
        </span>

        {revealed ? (
          <div className="py-4 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">{roleName}</div>
            {view.myLogs.length > 0 && (
              <div className="mt-3 p-4 bg-white/[0.04] border border-white/10 rounded-2xl text-left space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block">Night Intel:</span>
                {view.myLogs.map((log: string, i: number) => (
                  <p key={i} className="text-xs text-slate-200 font-medium">{log}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-sm font-bold text-slate-400">
            Tap below to inspect your hidden role
          </div>
        )}

        <button
          onClick={() => { playClickSound(); setRevealed(!revealed); }}
          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] text-white text-xs font-bold transition-all border border-white/10 active:scale-95"
        >
          {revealed ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-sky-400" />}
          {revealed ? 'Hide Role' : 'Reveal Role'}
        </button>
      </div>

      {/* Night Action Controls */}
      {isNight && (
        <div className="bg-slate-900/80 rounded-3xl p-5 border border-white/10 shadow-xl backdrop-blur-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Role Night Action
          </span>

          {view.myInitialRole === 'seer' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">Peek at 1 player's secret role:</p>
              <div className="grid grid-cols-2 gap-2">
                {players.filter(p => p.id !== myPlayerId).map(p => (
                  <button
                    key={p.id}
                    onClick={() => onAction('seer_action', { targetPlayerId: p.id })}
                    className="p-3 rounded-xl border border-white/10 hover:border-sky-400 hover:bg-sky-500/10 text-xs font-bold text-white text-left transition-all"
                  >
                    View {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view.myInitialRole === 'robber' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">Rob and swap roles with a player:</p>
              <div className="grid grid-cols-2 gap-2">
                {players.filter(p => p.id !== myPlayerId).map(p => (
                  <button
                    key={p.id}
                    onClick={() => onAction('robber_action', { targetPlayerId: p.id })}
                    className="p-3 rounded-xl border border-white/10 hover:border-sky-400 hover:bg-sky-500/10 text-xs font-bold text-white text-left transition-all"
                  >
                    Rob {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view.myInitialRole === 'troublemaker' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">Swap 2 other players' roles:</p>
              <div className="flex gap-2">
                <select
                  value={swapP1}
                  onChange={e => setSwapP1(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-800 border border-white/10 text-white rounded-xl text-xs font-semibold"
                >
                  <option value="">Select Player 1</option>
                  {players.filter(p => p.id !== myPlayerId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={swapP2}
                  onChange={e => setSwapP2(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-800 border border-white/10 text-white rounded-xl text-xs font-semibold"
                >
                  <option value="">Select Player 2</option>
                  {players.filter(p => p.id !== myPlayerId && p.id !== swapP1).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button
                disabled={!swapP1 || !swapP2}
                onClick={() => onAction('troublemaker_action', { player1Id: swapP1, player2Id: swapP2 })}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:opacity-40 transition-all shadow"
              >
                Swap Selected Players
              </button>
            </div>
          )}

          {/* Host Night to Day Transition */}
          {isHost && (
            <button
              onClick={() => onAction('finish_night')}
              className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-orange-500 shadow-lg active:scale-98 transition-all"
            >
              Wake Village (Start Dawn)
            </button>
          )}
        </div>
      )}

      {/* Day Phase & Voting */}
      {isDay && isHost && (
        <button
          onClick={() => onAction('start_voting')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Vote className="h-4 w-4" /> Call for Votes
        </button>
      )}

      {isVoting && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Cast Your Vote (Simultaneous)
          </span>

          {view.hasVoted ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold text-center">
              ✓ Vote submitted! Waiting for the remaining villagers to vote...
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">Select who you vote to execute:</p>
              <div className="grid grid-cols-2 gap-2">
                {players.filter(p => p.id !== myPlayerId).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleCastVote(p.id)}
                    className="p-3.5 rounded-2xl border border-white/10 hover:border-rose-500 hover:bg-rose-500/10 text-left font-bold text-xs text-white transition-all active:scale-95"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Reveal */}
      {isEnded && (
        <div className="bg-slate-900 text-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white/10 space-y-5 text-center">
          <Trophy className="h-10 w-10 text-amber-400 mx-auto" />
          <h3 className="text-2xl sm:text-3xl font-black">{view.winMessage}</h3>

          <div className="border-t border-white/10 pt-4 text-left space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Final Roles Reveal:
            </span>
            {players.map(p => (
              <div key={p.id} className="flex justify-between items-center text-xs py-2 border-b border-white/5 font-medium">
                <span className="text-slate-200">{p.name}</span>
                <span className="font-bold text-amber-400 uppercase">
                  {view.allCurrentRoles?.[p.id] || 'Villager'}
                  {view.killedPlayerIds.includes(p.id) && ' (Dead)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
