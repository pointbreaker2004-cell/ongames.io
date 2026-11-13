'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { getSavedName, saveName, getRecentRooms, RecentRoom } from '@/lib/utils';
import { playClickSound, playAlertSound } from '@/lib/sounds';
import { ArrowRight, History, Sparkles, AlertCircle, Gamepad2 } from 'lucide-react';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinRoom, roomState, error, clearError } = useSocket();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    setName(getSavedName() || '');
    setRecentRooms(getRecentRooms());
    const queryCode = searchParams.get('code');
    if (queryCode) {
      setCode(queryCode.toUpperCase().trim());
    }
  }, [searchParams]);

  if (roomState?.code) {
    router.push(`/room/${roomState.code}`);
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    if (cleanCode.length !== 4) {
      playAlertSound();
      return;
    }
    if (!cleanName) {
      playAlertSound();
      return;
    }

    saveName(cleanName);
    joinRoom(cleanCode, cleanName);
  };

  const handleSelectRecent = (room: RecentRoom) => {
    playClickSound();
    setCode(room.code);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-6 sm:pt-10 animate-in fade-in duration-200">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 shadow-sm">
          <Gamepad2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Quick Connect</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Join a Game</h1>
        <p className="text-sm text-slate-500">Enter the 4-letter room code from your host.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold animate-in shake duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleJoin} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            4-Letter Room Code
          </label>
          <input
            type="text"
            required
            maxLength={4}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            className="w-full text-center text-4xl font-black tracking-[0.3em] uppercase py-3.5 px-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-mono shadow-inner"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Your Display Name
          </label>
          <input
            type="text"
            required
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maverick"
            className="w-full text-center text-base font-bold py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={code.trim().length !== 4 || !name.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm tracking-wide shadow-md shadow-indigo-600/25 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>Connect &amp; Enter Lobby</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Recent Rooms */}
      {recentRooms.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <History className="h-3.5 w-3.5" />
            <span>Recent Rooms</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentRooms.map((room) => (
              <button
                key={room.code}
                onClick={() => handleSelectRecent(room)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs tracking-wider transition-all"
              >
                {room.code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 font-bold text-slate-400">Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
}
