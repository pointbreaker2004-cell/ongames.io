'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, HelpCircle, X, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';
import { toggleMute, getMuteState, playClickSound } from '@/lib/sounds';

export function Navbar() {
  const [muted, setMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setMuted(getMuteState());
  }, []);

  const handleMuteToggle = () => {
    const newState = toggleMute();
    setMuted(newState);
    if (!newState) playClickSound();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <Link
            href="/games"
            onClick={() => playClickSound()}
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all">
              <Gamepad2 className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  OnGames<span className="text-indigo-600">.io</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  PARTY
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 -mt-0.5 tracking-wide">
                Free Phone Controller Games
              </span>
            </div>
          </Link>

          {/* Right Action Controls */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/join"
              onClick={() => playClickSound()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow active:scale-95 transition-all"
            >
              <span>Join a Game</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            </Link>

            <button
              onClick={() => { playClickSound(); setShowHelp(true); }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="How to Play"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            <button
              onClick={handleMuteToggle}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? (
                <VolumeX className="h-5 w-5 text-rose-500" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* How it works modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
            <button
              onClick={() => { playClickSound(); setShowHelp(false); }}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>How It Works</span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Grab Your Friends &amp; Phones
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              No apps to download, no accounts to register, no boards to pack. Everyone uses their own phone browser as their private game screen.
            </p>

            <div className="space-y-3.5 text-sm">
              <div className="flex gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-black text-white text-xs shadow-sm">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block font-bold mb-0.5">Host picks a game</strong>
                  <p className="text-xs text-slate-500 leading-relaxed">Choose any game below and click "New Game" to generate your private 4-letter room code.</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 font-black text-white text-xs shadow-sm">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block font-bold mb-0.5">Friends join with 4-letter code</strong>
                  <p className="text-xs text-slate-500 leading-relaxed">Share your room link or QR code. Friends type the 4-letter code on their phone at <code>/join</code>.</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 font-black text-white text-xs shadow-sm">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block font-bold mb-0.5">Phones become controllers</strong>
                  <p className="text-xs text-slate-500 leading-relaxed">Secret roles, private hands, and voting appear securely on everyone's phone in real time!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { playClickSound(); setShowHelp(false); }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-500/25 active:scale-98 transition-all"
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
