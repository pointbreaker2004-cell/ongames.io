'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpyfallClientView } from '@shared/types';
import { playClickSound, playTickSound, playSuccessSound, playAlertSound } from '@/lib/sounds';
import { Eye, EyeOff, Clock, ShieldAlert, Check, X, Search, MapPin } from 'lucide-react';

interface SpyfallViewProps {
  view: SpyfallClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string }[];
}

export function SpyfallView({ view, onAction, myPlayerId, players }: SpyfallViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [crossedOut, setCrossedOut] = useState<{ [loc: string]: boolean }>({});
  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [showSpyGuessModal, setShowSpyGuessModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(view.roundDurationSeconds);

  // Sync Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - view.startedAt) / 1000);
      const remaining = Math.max(0, view.roundDurationSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 30 && remaining > 0) {
        playTickSound();
      }

      if (remaining === 0 && !view.winner) {
        onAction('time_expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [view.startedAt, view.roundDurationSeconds, view.winner]);

  useEffect(() => {
    if (view.winner) {
      playSuccessSound();
      confetti({ particleCount: 90, spread: 60 });
    }
  }, [view.winner]);

  const toggleCrossOut = (loc: string) => {
    playClickSound();
    setCrossedOut(prev => ({ ...prev, [loc]: !prev[loc] }));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const accusedPlayer = players.find(p => p.id === view.accusedPlayerId);
  const accuserPlayer = players.find(p => p.id === view.accusedByPlayerId);

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-150">
      {/* Timer & Controls Banner */}
      <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10">
            <Clock className={`h-6 w-6 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-sky-400'}`} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Time Left</div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${timeLeft < 60 ? 'text-rose-400' : 'text-white'}`}>
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {view.isSpy && !view.winner && (
            <button
              onClick={() => { playClickSound(); setShowSpyGuessModal(true); }}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Guess Location
            </button>
          )}

          {!view.accusedPlayerId && !view.winner && (
            <button
              onClick={() => { playClickSound(); setShowAccuseModal(true); }}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="h-4 w-4" /> Accuse Spy
            </button>
          )}
        </div>
      </div>

      {/* Secret Role Card (Tap to reveal / hide) */}
      <div className="relative overflow-hidden rounded-[32px] bg-slate-900/90 p-6 sm:p-8 text-white text-center shadow-2xl border border-white/10 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-sky-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>CONFIDENTIAL INTEL</span>
          </div>

          {revealed ? (
            <div className="space-y-2 animate-in zoom-in-95 duration-150">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {view.location}
              </div>
              <div className="text-sm font-semibold text-slate-300">
                Your Role: <span className="text-amber-400 font-bold">{view.myRole}</span>
              </div>
              <p className="text-xs text-slate-400 pt-1">
                {view.isSpy ? '🕵️ You are the Spy! Blend in and deduce where you are.' : '🛡️ Find the spy without giving away the secret location!'}
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-1">
              <div className="text-lg font-bold text-slate-200">Tap below to reveal your secret role</div>
              <p className="text-xs text-slate-400">Keep your phone screen shielded from others</p>
            </div>
          )}

          <button
            onClick={() => { playClickSound(); setRevealed(!revealed); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] text-white text-xs font-bold transition-all border border-white/10 active:scale-95"
          >
            {revealed ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-sky-400" />}
            {revealed ? 'Hide Role' : 'Reveal My Role'}
          </button>
        </div>
      </div>

      {/* Accusation Banner */}
      {view.accusedPlayerId && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 shadow-xl space-y-4 text-center">
          <div>
            <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">Accusation Vote</span>
            <div className="font-extrabold text-white text-base mt-1">
              {accuserPlayer?.name} accused <span className="text-amber-300 font-black">{accusedPlayer?.name}</span> of being the Spy!
            </div>
          </div>

          {/* Voting Buttons */}
          {myPlayerId !== view.accusedPlayerId && view.votes[myPlayerId] === undefined && (
            <div className="flex gap-2">
              <button
                onClick={() => { playClickSound(); onAction('vote_accusation', { vote: true }); }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-500 flex items-center justify-center gap-1.5 shadow"
              >
                <Check className="h-4 w-4" /> Yes, Spy!
              </button>
              <button
                onClick={() => { playClickSound(); onAction('vote_accusation', { vote: false }); }}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-black text-xs hover:bg-rose-500 flex items-center justify-center gap-1.5 shadow"
              >
                <X className="h-4 w-4" /> No, Innocent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Locations Reference List (Tap to strike through) */}
      <div className="bg-slate-900/80 rounded-3xl p-5 border border-white/10 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Possible Locations (Tap to eliminate)</span>
          <span className="text-slate-500 font-mono">24 TOTAL</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {view.locationsList.map((loc) => {
            const isOut = !!crossedOut[loc];
            return (
              <button
                key={loc}
                onClick={() => toggleCrossOut(loc)}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                  isOut
                    ? 'line-through text-slate-600 bg-white/[0.01] border-transparent opacity-40'
                    : 'text-slate-200 bg-white/[0.04] border-white/5 hover:border-sky-400/50 hover:bg-white/[0.08]'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accuse Modal */}
      {showAccuseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 p-6 shadow-2xl border border-white/10 text-white">
            <h3 className="text-xl font-black text-white mb-1">Accuse Suspect</h3>
            <p className="text-xs text-slate-400 mb-4">Choose who you believe is the secret Spy:</p>

            <div className="space-y-2">
              {players.filter(p => p.id !== myPlayerId).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    playClickSound();
                    onAction('accuse_player', { targetPlayerId: p.id });
                    setShowAccuseModal(false);
                  }}
                  className="w-full p-3.5 rounded-2xl border border-white/10 hover:border-rose-400 hover:bg-rose-500/10 text-left font-bold text-sm text-white transition-all"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAccuseModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Spy Guess Location Modal */}
      {showSpyGuessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 p-6 shadow-2xl border border-white/10 max-h-[85vh] overflow-y-auto text-white">
            <h3 className="text-xl font-black text-white mb-1">Guess Secret Location</h3>
            <p className="text-xs text-slate-400 mb-4">If correct, the Spy wins immediately! If wrong, the players win.</p>

            <div className="grid grid-cols-2 gap-2">
              {view.locationsList.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    playClickSound();
                    onAction('spy_guess_location', { location: loc });
                    setShowSpyGuessModal(false);
                  }}
                  className="p-3 rounded-2xl border border-white/10 hover:border-amber-400 hover:bg-amber-500/10 text-left font-bold text-xs text-white transition-all"
                >
                  {loc}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSpyGuessModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Game Over Reason */}
      {view.winReason && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-white/10 text-white text-center font-bold text-sm shadow-2xl">
          {view.winReason}
        </div>
      )}
    </div>
  );
}
