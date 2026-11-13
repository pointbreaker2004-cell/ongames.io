'use client';

import { useState, useEffect, useRef } from 'react';
import { TwoTruthsClientView, Player } from '@shared/types';
import { playClickSound, playSuccessSound, playAlertSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';
import {
  HelpCircle, CheckCircle2, Clock, Users, ArrowRight,
  Sparkles, Trophy, Flame, AlertCircle, Send, Crown,
  Smile, Award, Eye, ShieldCheck, Check
} from 'lucide-react';

interface TwoTruthsViewProps {
  view: TwoTruthsClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string; [key: string]: any }[];
  isHost?: boolean;
}

const REACTION_EMOJIS = ['😂', '😱', '🔥', '🤔', '🎉', '👏', '👀', '🤥', '💯'];

export function TwoTruthsView({ view, onAction, myPlayerId, players, isHost }: TwoTruthsViewProps) {
  // Submission phase state
  const [statements, setStatements] = useState<string[]>(['', '', '']);
  const [lieIndex, setLieIndex] = useState<number>(0);
  const [charCounts, setCharCounts] = useState<number[]>([0, 0, 0]);

  // Voting selection
  const [selectedVote, setSelectedVote] = useState<number | null>(view.myVote);

  // Sync selected vote if updated externally
  useEffect(() => {
    setSelectedVote(view.myVote);
  }, [view.myVote]);

  // If user previously submitted, restore statements
  useEffect(() => {
    if (view.mySubmission?.statements) {
      setStatements(view.mySubmission.statements);
      setLieIndex(view.mySubmission.lieIndex);
    }
  }, [view.mySubmission]);

  // Trigger celebration on results or reveal bonus
  const hasCelebrated = useRef(false);
  useEffect(() => {
    if (view.phase === 'results' && !hasCelebrated.current) {
      hasCelebrated.current = true;
      playSuccessSound();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } else if (view.phase !== 'results') {
      hasCelebrated.current = false;
    }
  }, [view.phase]);

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState<number>(view.roundTimerSeconds);
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - view.roundStartedAt) / 1000);
      const remaining = Math.max(0, view.roundTimerSeconds - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0 && isHost && (view.phase === 'submission' || view.phase === 'guessing')) {
        onAction('time_expired');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [view.roundStartedAt, view.roundTimerSeconds, view.phase, isHost, onAction]);

  const handleStatementChange = (index: number, val: string) => {
    if (val.length <= 150) {
      const next = [...statements];
      next[index] = val;
      setStatements(next);

      const nextCounts = [...charCounts];
      nextCounts[index] = val.length;
      setCharCounts(nextCounts);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statements.some(s => !s.trim())) {
      playAlertSound();
      return;
    }
    playClickSound();
    onAction('submit_statements', {
      statements: statements.map(s => s.trim()),
      lieIndex
    });
  };

  const handleVote = (idx: number) => {
    if (view.isAuthor || view.phase !== 'guessing') return;
    playClickSound();
    setSelectedVote(idx);
    onAction('vote_statement', { statementIndex: idx });
  };

  const handleNextRound = () => {
    playClickSound();
    onAction('next_round');
  };

  const handleSendReaction = (emoji: string) => {
    playClickSound();
    onAction('react', { emoji });
  };

  // Helper to resolve player name from ID
  const getPlayerName = (id: string) => {
    const p = players.find(player => player.id === id);
    return p?.name || 'Player';
  };

  // ==========================================
  // PHASE 1: STATEMENT SUBMISSION
  // ==========================================
  if (view.phase === 'submission') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>Secret Setup</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-full font-mono font-bold text-sm">
              <Clock className="h-4 w-4 text-purple-300" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Submit Two Truths &amp; One Lie
          </h2>
          <p className="text-sm text-purple-100/80 leading-relaxed max-w-lg">
            Write three believable statements about yourself. Mark exactly one of them as your secret Lie. Fool other players to earn points!
          </p>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-medium text-purple-200">
            <span>Submissions: {view.submissionCount} / {view.totalPlayersCount} ready</span>
            {view.hasSubmitted && (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Locked in
              </span>
            )}
          </div>
        </div>

        {/* Input Form or Locked Waiting View */}
        {!view.hasSubmitted ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-5">
            <div className="space-y-4">
              {[0, 1, 2].map((idx) => {
                const isLie = lieIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isLie
                        ? 'border-rose-400 bg-rose-50/50 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Statement #{idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => { playClickSound(); setLieIndex(idx); }}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                          isLie
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {isLie ? (
                          <>
                            <Flame className="h-3 w-3" />
                            <span>This is the LIE</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Truth</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      required
                      maxLength={150}
                      value={statements[idx]}
                      onChange={(e) => handleStatementChange(idx, e.target.value)}
                      placeholder={
                        idx === 0
                          ? "e.g., I have skydived over the Swiss Alps..."
                          : idx === 1
                          ? "e.g., I once accidentally ate a habanero pepper..."
                          : "e.g., I know how to play the bagpipes..."
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 resize-none transition-all placeholder:text-slate-400"
                    />

                    <div className="flex justify-end mt-1 text-[11px] font-semibold text-slate-400">
                      {charCounts[idx]} / 150
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={statements.some(s => !s.trim())}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-sm tracking-wide shadow-md active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Lock In My Statements</span>
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-md text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Statements Submitted!</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Your statements are locked. Waiting for other players to finish writing...
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Player Status
              </span>
              <div className="space-y-1.5">
                {players.map(p => {
                  const done = view.submittedPlayerIds.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{p.name} {p.id === myPlayerId && '(You)'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {done ? 'Ready' : 'Writing...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // PHASE 2: GUESSING ROUND
  // ==========================================
  if (view.phase === 'guessing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Round Progress Header */}
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 text-white rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
              Round {view.roundProgress.current} of {view.roundProgress.total}
            </span>
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full font-mono font-bold text-xs text-purple-300">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Spot the Lie: <span className="text-purple-300">{view.currentAuthorName}</span>
          </h2>
          <p className="text-xs sm:text-sm text-purple-100/80 mt-1">
            {view.isAuthor
              ? 'You are in the hot seat! Sit back and see if your friends get fooled.'
              : 'Read the three statements below and vote for the one you believe is FALSE!'}
          </p>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-400 h-full transition-all duration-300"
              style={{ width: `${(view.votedPlayerIds.length / Math.max(1, view.totalPlayersCount - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Statements Cards */}
        <div className="space-y-3.5">
          {view.statements.map((statement, idx) => {
            const isSelected = selectedVote === idx;
            const letters = ['A', 'B', 'C'];

            return (
              <div
                key={idx}
                onClick={() => handleVote(idx)}
                className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all ${
                  view.isAuthor
                    ? 'border-slate-200 bg-white cursor-default'
                    : isSelected
                    ? 'border-purple-600 bg-purple-50/70 shadow-md scale-[1.01] cursor-pointer'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50 cursor-pointer shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {letters[idx]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-base sm:text-lg font-bold leading-snug">
                      "{statement}"
                    </p>
                  </div>

                  {!view.isAuthor && (
                    <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isSelected ? 'Your Vote' : 'Vote as Lie'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting Status Roster */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span>Votes: {view.votedPlayerIds.length} / {Math.max(1, view.totalPlayersCount - 1)}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {players.filter(p => p.id !== view.currentAuthorId).map(p => {
              const hasVoted = view.votedPlayerIds.includes(p.id);
              return (
                <span
                  key={p.id}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hasVoted ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'
                  }`}
                  title={hasVoted ? `${p.name} has voted` : `${p.name} thinking...`}
                >
                  {p.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 3: REVEAL SCREEN
  // ==========================================
  if (view.phase === 'reveal' && view.roundResults) {
    const res = view.roundResults;
    const authorName = res.authorName;
    const isMeAuthor = res.authorId === myPlayerId;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Reveal Header Card */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-extrabold uppercase tracking-wider text-purple-300 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Round Results</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            The Truth Revealed!
          </h2>
          <p className="text-sm text-purple-200/80 max-w-md mx-auto">
            Author: <span className="font-bold text-white">{authorName}</span>
          </p>

          {/* Scoring badge summary */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {res.fooledEveryone && (
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>FOOLED EVERYONE BONUS! (+100 pts)</span>
              </span>
            )}

            {isMeAuthor && (
              <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
                You earned +{res.authorPointsEarned} pts from bluffs!
              </span>
            )}
          </div>
        </div>

        {/* Revealed Statements */}
        <div className="space-y-3.5">
          {view.statements.map((statement, idx) => {
            const isLie = idx === res.shuffledLieIndex;
            const votesForThis = Object.entries(res.votes)
              .filter(([_, v]) => v === idx)
              .map(([pid]) => getPlayerName(pid));

            return (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-2xl border-2 transition-all ${
                  isLie
                    ? 'border-rose-500 bg-rose-50/80 shadow-md ring-2 ring-rose-200'
                    : 'border-emerald-300 bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      isLie ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {isLie ? 'THE LIE' : 'TRUTH'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ({votesForThis.length} {votesForThis.length === 1 ? 'vote' : 'votes'})
                    </span>
                  </div>

                  {isLie && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                      +100 pts if guessed
                    </span>
                  )}
                </div>

                <p className="text-slate-900 font-bold text-base sm:text-lg mb-3">
                  "{statement}"
                </p>

                {/* Who voted for this */}
                {votesForThis.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-semibold">Guessed by:</span>
                    {votesForThis.map((name, nIdx) => (
                      <span
                        key={nIdx}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          isLie
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium">
                    No one voted for this statement
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Emoji Reactions Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Smile className="h-3.5 w-3.5" /> React in Real-Time
            </span>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="text-2xl p-2 rounded-xl hover:bg-slate-100 active:scale-125 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Floating Recent Reactions stream */}
          {view.recentReactions.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
              {view.recentReactions.slice(-8).map(r => (
                <span
                  key={r.id}
                  className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 animate-in zoom-in-50 duration-150 flex items-center gap-1"
                >
                  <span>{getPlayerName(r.playerId)}:</span>
                  <span className="text-base">{r.emoji}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Next Round Button */}
        <div className="pt-2">
          <button
            onClick={handleNextRound}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm tracking-wide shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>
              {view.roundProgress.current >= view.roundProgress.total
                ? 'View Final Results & Leaderboard'
                : 'Next Player Round →'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 4: FINAL LEADERBOARD & RESULTS
  // ==========================================
  const sortedLeaderboard = view.leaderboard || [];
  const winner = sortedLeaderboard[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Winner Hero Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white rounded-3xl p-8 shadow-2xl border border-white/10 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider mb-4">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Game Over</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
          {winner ? `${winner.name} Wins!` : 'Game Complete!'}
        </h2>
        <p className="text-sm text-purple-200/80 max-w-sm mx-auto">
          Scored {winner?.score || 0} points through sharp deduction and clever bluffing!
        </p>

        {/* Winner podium avatars */}
        <div className="mt-8 flex items-end justify-center gap-3">
          {sortedLeaderboard.slice(0, 3).map((p, idx) => {
            const heights = ['h-28', 'h-20', 'h-16'];
            const medals = ['🥇', '🥈', '🥉'];
            const bgGradients = [
              'bg-gradient-to-t from-amber-500/30 to-amber-400/10 border-amber-400/40',
              'bg-gradient-to-t from-slate-400/30 to-slate-300/10 border-slate-300/30',
              'bg-gradient-to-t from-amber-700/30 to-amber-600/10 border-amber-600/30'
            ];

            return (
              <div key={p.playerId} className="flex flex-col items-center flex-1 max-w-[120px]">
                <span className="text-2xl mb-1">{medals[idx]}</span>
                <span className="text-xs font-bold text-white truncate w-full text-center mb-1">
                  {p.name}
                </span>
                <div className={`w-full ${heights[idx]} rounded-2xl border ${bgGradients[idx]} flex flex-col items-center justify-center p-2 shadow-inner`}>
                  <span className="text-lg font-black text-white">{p.score}</span>
                  <span className="text-[10px] text-purple-200 uppercase font-bold">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span>FINAL STANDINGS</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {sortedLeaderboard.length} Players
          </span>
        </div>

        <div className="space-y-2.5">
          {sortedLeaderboard.map((player, rank) => {
            const isMe = player.playerId === myPlayerId;
            return (
              <div
                key={player.playerId}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'border-purple-300 bg-purple-50/60 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
                    {rank + 1}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-900">
                      {player.name} {isMe && '(You)'}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mt-0.5">
                      <span>✓ {player.correctGuesses} lies caught</span>
                      <span>•</span>
                      <span>🎭 Fooled {player.fooledOthers} times</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900">{player.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Play Again button */}
      <div className="pt-2">
        <button
          onClick={() => { playClickSound(); window.location.href = '/games'; }}
          className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm tracking-wide shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Return to Games Catalog</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
