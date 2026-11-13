'use client';

import { useState } from 'react';
import { LoveLetterClientView, LoveLetterCard } from '@shared/types';
import { playClickSound } from '@/lib/sounds';
import { Shield, Heart, Skull, AlertCircle, Crown } from 'lucide-react';

interface LoveLetterViewProps {
  view: LoveLetterClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string }[];
}

const CARD_DESCRIPTIONS: Record<LoveLetterCard, string> = {
  Guard: 'Name a non-Guard card and choose a player. If correct, they are eliminated.',
  Priest: 'Look at another player’s hand card.',
  Baron: 'Secretly compare hands with another player. Lower card is eliminated.',
  Handmaid: 'You cannot be targeted until your next turn.',
  Prince: 'Choose any player to discard their hand and draw a new card.',
  King: 'Trade hands with another player.',
  Countess: 'Must play if you hold King or Prince.',
  Princess: 'If you discard this card, you are immediately eliminated!'
};

const CARD_VALUES: Record<LoveLetterCard, number> = {
  Guard: 1,
  Priest: 2,
  Baron: 3,
  Handmaid: 4,
  Prince: 5,
  King: 6,
  Countess: 7,
  Princess: 8
};

export function LoveLetterView({ view, onAction, myPlayerId, players }: LoveLetterViewProps) {
  const [selectedCard, setSelectedCard] = useState<LoveLetterCard | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [guessCard, setGuessCard] = useState<LoveLetterCard>('Priest');

  const myState = view.players[myPlayerId];
  const isMyTurn = view.currentTurnPlayerId === myPlayerId && !view.roundWinner && !view.gameWinner;

  const handleCardClick = (card: LoveLetterCard) => {
    if (!isMyTurn) return;
    playClickSound();

    if (['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(card)) {
      setSelectedCard(card);
    } else {
      onAction('play_card', { card });
    }
  };

  const handleConfirmTargetAction = () => {
    if (!selectedCard) return;
    playClickSound();
    onAction('play_card', {
      card: selectedCard,
      targetPlayerId: targetId || undefined,
      guessedCard: selectedCard === 'Guard' ? guessCard : undefined
    });
    setSelectedCard(null);
    setTargetId('');
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-150">
      {/* Turn Banner */}
      <div className="p-4 sm:p-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-xl backdrop-blur-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Turn</span>
          <div className="text-xl font-black text-white flex items-center gap-2">
            <span>{players.find(p => p.id === view.currentTurnPlayerId)?.name}</span>
            {isMyTurn && <span className="text-rose-400 text-xs font-black px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">YOUR TURN</span>}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deck Remaining</span>
          <div className="text-xl font-black text-white font-mono">{view.deckCount} cards</div>
        </div>
      </div>

      {/* Opponents Status */}
      <div className="grid grid-cols-2 gap-2.5">
        {players.map(p => {
          const pState = view.players[p.id];
          if (!pState) return null;
          const isMe = p.id === myPlayerId;
          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border text-xs transition-all ${
                pState.isEliminated
                  ? 'bg-slate-950/40 border-white/5 opacity-50'
                  : (p.id === view.currentTurnPlayerId 
                      ? 'border-rose-500/40 bg-rose-500/10 shadow-sm' 
                      : 'bg-slate-900/60 border-white/5')
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="truncate text-white">{p.name} {isMe && <span className="text-sky-400 font-normal">(You)</span>}</span>
                <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <Heart className="h-3 w-3 fill-rose-400" /> {pState.tokens}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                {pState.isProtected && (
                  <span className="inline-flex items-center gap-1 text-sky-400 font-bold">
                    <Shield className="h-3 w-3" /> Protected
                  </span>
                )}
                {pState.isEliminated && (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                    <Skull className="h-3 w-3" /> Knocked Out
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Priest Peek Alert */}
      {view.peekedCard && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs font-bold">
          👁️ Priest Peek: That player secretly holds <span className="text-purple-300 font-black">{view.peekedCard.card}</span>
        </div>
      )}

      {/* Your Hand Cards */}
      <div className="relative overflow-hidden rounded-[32px] bg-slate-900/90 p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Your Hand Cards</span>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMyTurn ? 'Tap a card below to play it' : 'Wait for your turn to play'}
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {myState?.hand.map((card, idx) => (
            <button
              key={idx}
              disabled={!isMyTurn}
              onClick={() => handleCardClick(card)}
              className={`w-40 h-56 rounded-3xl p-4 flex flex-col justify-between text-left transition-all border-2 shadow-2xl ${
                isMyTurn
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-rose-500/50 hover:border-rose-400 hover:scale-105 active:scale-95 cursor-pointer shadow-rose-500/10'
                  : 'bg-slate-900/80 border-white/10 opacity-90 cursor-not-allowed'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  {card}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/30 font-mono">
                  {CARD_VALUES[card]}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                {CARD_DESCRIPTIONS[card]}
              </p>
              <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isMyTurn ? 'Tap to Play' : 'Card'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Round Winner Banner */}
      {view.roundWinner && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-center space-y-3">
          <h4 className="font-black text-emerald-400 text-lg">Round Finished!</h4>
          <p className="text-xs text-emerald-200">
            Winner: <strong className="text-white">{players.find(p => p.id === view.roundWinner)?.name}</strong>
          </p>
          <button
            onClick={() => onAction('next_round')}
            className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-500 shadow active:scale-95 transition-all"
          >
            Start Next Round
          </button>
        </div>
      )}

      {/* Target Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 p-6 shadow-2xl border border-white/10 space-y-4 text-white">
            <h3 className="font-black text-xl text-white">Play {selectedCard}</h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Target Player:</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/[0.07] border border-white/15 text-white text-sm font-semibold focus:outline-none"
              >
                <option value="" className="bg-slate-900">Choose a player</option>
                {players
                  .filter(p => selectedCard === 'Prince' ? true : p.id !== myPlayerId)
                  .map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                  ))}
              </select>
            </div>

            {selectedCard === 'Guard' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Guess their card (non-Guard):</label>
                <select
                  value={guessCard}
                  onChange={e => setGuessCard(e.target.value as LoveLetterCard)}
                  className="w-full p-3 rounded-2xl bg-white/[0.07] border border-white/15 text-white text-sm font-semibold focus:outline-none"
                >
                  {(['Priest', 'Baron', 'Handmaid', 'Prince', 'King', 'Countess', 'Princess'] as LoveLetterCard[]).map(c => (
                    <option key={c} value={c} className="bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedCard(null)}
                className="flex-1 py-3 rounded-2xl bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                disabled={!targetId}
                onClick={handleConfirmTargetAction}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold hover:from-rose-500 hover:to-pink-500 disabled:opacity-40"
              >
                Confirm Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
