'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SecretSithClientView, SithPolicy } from '@shared/types';
import { playClickSound, playSuccessSound, playAlertSound } from '@/lib/sounds';
import { Shield, Skull, Eye, EyeOff, Check, X, Crown, Vote, Trophy, ShieldAlert } from 'lucide-react';

interface SecretSithViewProps {
  view: SecretSithClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string }[];
}

export function SecretSithView({ view, onAction, myPlayerId, players }: SecretSithViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [nominatedChancellorId, setNominatedChancellorId] = useState('');

  useEffect(() => {
    if (view.winner) {
      playSuccessSound();
      confetti({ particleCount: 110, spread: 75 });
    }
  }, [view.winner]);

  const isPresident = view.presidentCandidateId === myPlayerId;
  const isChancellor = view.chancellorCandidateId === myPlayerId;
  const isAlive = !view.executedPlayers.includes(myPlayerId);

  const presidentPlayer = players.find(p => p.id === view.presidentCandidateId);
  const chancellorPlayer = players.find(p => p.id === view.chancellorCandidateId);

  const handleNominate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominatedChancellorId) return;
    playClickSound();
    onAction('nominate_chancellor', { chancellorId: nominatedChancellorId });
  };

  const handleVote = (vote: boolean) => {
    playClickSound();
    onAction('cast_vote', { vote });
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto animate-in fade-in duration-150">
      {/* Policy Tracks */}
      <div className="space-y-3">
        {/* Loyalist Track (Blue) */}
        <div className="p-5 bg-slate-900/90 rounded-3xl border border-sky-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase text-sky-400 tracking-wider">
              Loyalist Policies
            </span>
            <span className="text-xs font-bold text-sky-300 font-mono">
              {view.loyalistPolicies} / 5 to Win
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <div
                key={num}
                className={`h-16 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm border-2 transition-all ${
                  num <= view.loyalistPolicies
                    ? 'bg-gradient-to-br from-sky-500 to-indigo-600 border-sky-300 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-white/[0.03] border-white/10 text-slate-600'
                }`}
              >
                {num <= view.loyalistPolicies ? 'LOYAL' : num}
              </div>
            ))}
          </div>
        </div>

        {/* Separatist Track (Red) */}
        <div className="p-5 bg-slate-900/90 rounded-3xl border border-rose-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase text-rose-400 tracking-wider">
              Separatist Policies
            </span>
            <span className="text-xs font-bold text-rose-300 font-mono">
              {view.separatistPolicies} / 6 to Win
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <div
                key={num}
                className={`h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xs border-2 transition-all ${
                  num <= view.separatistPolicies
                    ? 'bg-gradient-to-br from-rose-600 to-red-700 border-rose-400 text-white shadow-lg shadow-rose-600/25'
                    : 'bg-white/[0.03] border-white/10 text-slate-600'
                }`}
              >
                <span>{num <= view.separatistPolicies ? 'SITH' : num}</span>
                {num === 2 && <span className="text-[8px] font-normal text-rose-400">Peek</span>}
                {num >= 4 && <span className="text-[8px] font-normal text-rose-400">Kill</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secret Role Card */}
      <div className="bg-slate-900/90 rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Your Secret Allegiance
        </span>

        {revealed ? (
          <div className="py-4 space-y-2 animate-in zoom-in-95 duration-150">
            <div className={`text-4xl font-black tracking-tight ${
              view.myRole === 'Loyalist' ? 'text-sky-400' : 'text-rose-500'
            }`}>
              {view.myRole}
            </div>
            {view.knownSeparatists && view.knownSeparatists.length > 0 && (
              <p className="text-xs text-rose-300 font-medium">
                Fellow Separatists: {view.knownSeparatists.map(id => players.find(p => p.id === id)?.name).join(', ')}
              </p>
            )}
            {view.knownPalpatine && (
              <p className="text-xs text-amber-400 font-black">
                Palpatine is: {players.find(p => p.id === view.knownPalpatine)?.name}
              </p>
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

      {/* Nomination Phase */}
      {view.phase === 'nomination' && (
        <div className="p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current President: <span className="text-white font-black">{presidentPlayer?.name}</span>
          </div>

          {isPresident ? (
            <form onSubmit={handleNominate} className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nominate Chancellor:
              </label>
              <select
                value={nominatedChancellorId}
                onChange={e => setNominatedChancellorId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/[0.07] border border-white/15 text-white text-sm font-semibold focus:outline-none"
              >
                <option value="" className="bg-slate-900">Select candidate</option>
                {players
                  .filter(p => p.id !== myPlayerId && !view.executedPlayers.includes(p.id))
                  .map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={!nominatedChancellorId}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 transition-all shadow-md active:scale-98"
              >
                Nominate Chancellor
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-400">
              Waiting for President {presidentPlayer?.name} to nominate a Chancellor...
            </p>
          )}
        </div>
      )}

      {/* Election Phase */}
      {view.phase === 'election' && (
        <div className="p-6 bg-slate-900/90 rounded-3xl border border-white/10 shadow-xl text-center space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Senate Election</span>
            <h4 className="text-lg font-black text-white mt-1">
              Vote on President {presidentPlayer?.name} & Chancellor {chancellorPlayer?.name}
            </h4>
          </div>

          {isAlive && (Array.isArray(view.votes) ? !view.votes.includes(myPlayerId) : (view.votes as any)[myPlayerId] === undefined) ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleVote(true)}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Check className="h-5 w-5" /> JA! (Yes)
              </button>
              <button
                onClick={() => handleVote(false)}
                className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black text-sm hover:bg-rose-500 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <X className="h-5 w-5" /> NEIN! (No)
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-400 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
              ✓ Vote submitted! Waiting for other senators...
            </div>
          )}
        </div>
      )}

      {/* Legislative Session: President Discard */}
      {view.phase === 'legislative_president' && (
        <div className="p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            President Legislative Session
          </span>
          {isPresident ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                Choose 1 policy to discard (the remaining 2 pass to Chancellor):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {view.drawnPolicies.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound();
                      onAction('president_discard', { index: idx });
                    }}
                    className={`h-28 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg ${
                      p === 'Loyalist' 
                        ? 'bg-sky-950/60 border-sky-400 text-sky-300 hover:bg-sky-900/60' 
                        : 'bg-rose-950/60 border-rose-400 text-rose-300 hover:bg-rose-900/60'
                    }`}
                  >
                    <span className="text-sm font-black">{p}</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-1">Tap to Discard</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              President is currently inspecting 3 policy cards...
            </p>
          )}
        </div>
      )}

      {/* Legislative Session: Chancellor Enact */}
      {view.phase === 'legislative_chancellor' && (
        <div className="p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Chancellor Legislative Session
          </span>
          {isChancellor ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                Choose 1 policy to enact into law:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {view.drawnPolicies.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound();
                      onAction('chancellor_enact', { index: idx });
                    }}
                    className={`h-28 rounded-2xl border-2 font-black text-sm flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl ${
                      p === 'Loyalist' 
                        ? 'bg-sky-950/60 border-sky-400 text-sky-300 hover:bg-sky-900/60' 
                        : 'bg-rose-950/60 border-rose-400 text-rose-300 hover:bg-rose-900/60'
                    }`}
                  >
                    <span className="text-base font-black">{p}</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-1">Tap to Enact</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Chancellor is choosing which policy to enact into law...
            </p>
          )}
        </div>
      )}

      {/* Executive Action */}
      {view.phase === 'executive_action' && (
        <div className="p-5 bg-slate-900/90 rounded-3xl border border-white/10 shadow-xl space-y-3">
          <span className="text-xs font-black uppercase text-rose-400 tracking-wider block">
            Presidential Executive Power
          </span>
          {isPresident ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                {view.executiveAction === 'execution'
                  ? 'Select an active senator to execute:'
                  : 'Select an active senator to investigate their party membership:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {players
                  .filter(p => p.id !== myPlayerId && !view.executedPlayers.includes(p.id))
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        playClickSound();
                        onAction(
                          view.executiveAction === 'execution' ? 'execute_player' : 'investigate_player',
                          { targetPlayerId: p.id }
                        );
                      }}
                      className="p-3.5 border border-white/10 rounded-2xl text-xs font-bold text-white hover:bg-white/10 text-left transition-all active:scale-95"
                    >
                      {p.name}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              The President is exercising their executive powers...
            </p>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {view.winner && (
        <div className="p-6 sm:p-8 bg-slate-900/90 text-white rounded-[32px] text-center space-y-3 shadow-2xl border border-white/10">
          <Trophy className="h-10 w-10 text-amber-400 mx-auto" />
          <h3 className="text-3xl font-black">{view.winner.toUpperCase()}S WIN!</h3>
          <p className="text-xs text-slate-400">{view.winReason}</p>
        </div>
      )}
    </div>
  );
}
