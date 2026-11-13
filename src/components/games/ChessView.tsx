'use client';

import { useState, useEffect, useRef } from 'react';
import { ChessClientView } from '@shared/types';
import { playClickSound, playSuccessSound, playAlertSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';
import { Chess, Square } from 'chess.js';
import { 
  Trophy, Flag, ShieldAlert, ArrowRight, RotateCcw, 
  Crown, User, Swords, AlertCircle
} from 'lucide-react';

interface ChessViewProps {
  view: ChessClientView;
  onAction: (type: string, payload?: any) => void;
  myPlayerId: string;
  players: { id: string; name: string; [key: string]: any }[];
  isHost?: boolean;
}

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

export function ChessView({ view, onAction, myPlayerId, players, isHost }: ChessViewProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [showResignModal, setShowResignModal] = useState(false);

  // Client-side chess instance to compute legal move highlights
  const [chessInstance, setChessInstance] = useState<Chess>(() => new Chess(view.fen));

  useEffect(() => {
    try {
      setChessInstance(new Chess(view.fen));
    } catch (e) {}
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [view.fen]);

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

  // Board coordinates (from white's perspective or black's perspective)
  const isBlackPerspective = view.myColor === 'b';
  const ranks = isBlackPerspective ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = isBlackPerspective ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const handleSquareClick = (square: Square) => {
    if (!view.isMyTurn || view.winner) return;

    // If already selected a piece and clicking a valid destination
    if (selectedSquare) {
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const isTargetLegal = legalMoves.includes(square);
      if (isTargetLegal) {
        playClickSound();
        onAction('move', { from: selectedSquare, to: square, promotion: 'q' });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // Try selecting piece on clicked square
    const piece = chessInstance.get(square);
    if (piece && piece.color === view.myColor) {
      playClickSound();
      setSelectedSquare(square);
      const moves = chessInstance.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleResign = () => {
    playAlertSound();
    onAction('resign');
    setShowResignModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Game Header: Players & Turn Indicator */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
        {/* White Player */}
        <div className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
          view.turn === 'w' ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-transparent'
        }`}>
          <div className="h-9 w-9 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-black text-xl shadow-sm">
            ♔
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
              {view.whitePlayer.name} {view.myColor === 'w' && '(You)'}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">White</span>
          </div>
        </div>

        {/* Center Versus / Check badge */}
        <div className="text-center">
          {view.isCheckmate ? (
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase animate-pulse">
              CHECKMATE
            </span>
          ) : view.isCheck ? (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs uppercase animate-bounce">
              CHECK!
            </span>
          ) : (
            <span className="text-xs font-extrabold uppercase text-slate-400">
              {view.turn === 'w' ? "White's Move" : "Black's Move"}
            </span>
          )}
        </div>

        {/* Black Player */}
        <div className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
          view.turn === 'b' ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-transparent'
        }`}>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
              {view.blackPlayer.name} {view.myColor === 'b' && '(You)'}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Black</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-sm">
            ♚
          </div>
        </div>
      </div>

      {/* Main 8x8 Chessboard */}
      <div className="bg-white p-3 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md">
        <div className="aspect-square max-w-[500px] mx-auto grid grid-cols-8 grid-rows-8 border-4 border-slate-800 rounded-xl overflow-hidden shadow-inner select-none">
          {ranks.map((rank) =>
            files.map((file) => {
              const square = `${file}${rank}` as Square;
              const piece = chessInstance.get(square);
              const isDarkSquare = (file.charCodeAt(0) + rank) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isTargetLegal = legalMoves.includes(square);

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center text-3xl sm:text-4xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-300'
                      : isDarkSquare
                      ? 'bg-[#b58863] text-slate-900'
                      : 'bg-[#f0d9b5] text-slate-900'
                  }`}
                >
                  {/* Piece Symbol */}
                  {piece && (
                    <span
                      className={`select-none transform transition-transform hover:scale-110 drop-shadow-sm ${
                        piece.color === 'w' ? 'text-white' : 'text-slate-950'
                      }`}
                      style={{
                        WebkitTextStroke: piece.color === 'w' ? '1px #334155' : '1px #0f172a'
                      }}
                    >
                      {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}

                  {/* Move Target Marker */}
                  {isTargetLegal && (
                    <div className="absolute h-3.5 w-3.5 rounded-full bg-emerald-600/70 shadow-sm pointer-events-none" />
                  )}

                  {/* Coordinate labels on corner squares */}
                  {file === (isBlackPerspective ? 'h' : 'a') && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-40 pointer-events-none">
                      {rank}
                    </span>
                  )}
                  {rank === (isBlackPerspective ? 8 : 1) && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 pointer-events-none">
                      {file}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Captured Pieces & History Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Captured:</span>
          <div className="flex items-center gap-1 text-sm font-serif">
            {view.capturedPieces.w.map((p, i) => (
              <span key={i} className="text-slate-900">{PIECE_SYMBOLS[p] || p}</span>
            ))}
            {view.capturedPieces.b.map((p, i) => (
              <span key={i} className="text-slate-400">{PIECE_SYMBOLS[p.toUpperCase()] || p}</span>
            ))}
          </div>
        </div>

        {view.myColor !== 'spectator' && !view.winner && (
          <button
            onClick={() => setShowResignModal(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Resign Match</span>
          </button>
        )}
      </div>

      {/* Winner Banner if match ended */}
      {view.winner && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-3 animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Trophy className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {view.winner === 'draw' ? 'Match Drawn' : `${view.winReason || 'Victory!'}`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {view.history.length} moves played in total.
          </p>
          <button
            onClick={() => { playClickSound(); window.location.href = '/games'; }}
            className="mt-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
          >
            Return to Games Catalog
          </button>
        </div>
      )}

      {/* Resign Confirmation Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="h-12 w-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Flag className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Resign from Game?</h3>
            <p className="text-xs text-slate-500">
              Forfeiting will immediately award victory to your opponent. Are you sure?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResign}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm"
              >
                Yes, Resign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

