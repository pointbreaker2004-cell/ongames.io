'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@shared/types';
import { playClickSound, playTickSound } from '@/lib/sounds';
import { 
  MessageSquare, X, Send, Crown, Sparkles, ChevronDown, 
  Smile, Flame, ThumbsUp, Heart, Eye, PartyPopper, Clock, ShieldAlert 
} from 'lucide-react';

interface ChatDrawerProps {
  messages: ChatMessage[];
  myPlayerId: string;
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_REACTIONS = [
  { label: '👍', text: '👍' },
  { label: '😂', text: '😂' },
  { label: '🔥', text: '🔥' },
  { label: '👀', text: '👀' },
  { label: '❤️', text: '❤️' },
  { label: '🎉', text: '🎉' },
  { label: 'GG!', text: 'GG! 🎮' },
  { label: 'Hurry! ⏰', text: 'Hurry up! ⏰' },
  { label: 'Sus 🕵️', text: 'That looks suspicious! 🕵️' },
];

export function ChatDrawer({ messages, myPlayerId, onSendMessage, isOpen, onToggle }: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesCountRef = useRef(messages.length);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen) {
      const newMessages = messages.length - prevMessagesCountRef.current;
      if (newMessages > 0) {
        setUnreadCount(prev => prev + newMessages);
        playTickSound();
      }
    } else {
      setUnreadCount(0);
      scrollToBottom();
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
    scrollToBottom();
  };

  const handleQuickReaction = (text: string) => {
    onSendMessage(text);
    scrollToBottom();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            playClickSound();
            onToggle();
          }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white shadow-2xl hover:bg-slate-800 active:scale-95 transition-all border border-slate-700/60 backdrop-blur-md group"
          aria-label="Open in-game chat"
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-black tracking-wide pr-0.5">Chat</span>
        </button>
      )}

      {/* Slide-over / Modal Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-end sm:items-end p-0 sm:p-5 pointer-events-none">
          {/* Backdrop on mobile */}
          <div 
            onClick={onToggle}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs sm:hidden pointer-events-auto"
          />

          {/* Chat Window Container */}
          <div className="relative w-full sm:w-96 h-[80vh] sm:h-[540px] max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-indigo-300">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>Room Chat</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time party messages</p>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  onToggle();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Reactions Bar */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/70 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
              {QUICK_REACTIONS.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReaction(qr.text)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs font-bold text-slate-700 whitespace-nowrap active:scale-95 transition-all shadow-xs"
                >
                  {qr.label}
                </button>
              ))}
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <div className="p-3 rounded-full bg-slate-100">
                    <MessageSquare className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">No messages yet</p>
                  <p className="text-[11px] text-slate-400">Say hi to everyone or drop a quick emoji reaction!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className="px-3 py-0.5 rounded-full bg-slate-200/80 text-[10px] font-semibold text-slate-600 shadow-xs max-w-[85%] text-center">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isMe = msg.senderId === myPlayerId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}
                    >
                      <div className="flex items-center gap-1 px-1 text-[10px] font-bold text-slate-500">
                        <span>{isMe ? 'You' : msg.senderName}</span>
                        {msg.isHost && (
                          <span title="Host">
                            <Crown className="h-3 w-3 text-amber-500 fill-amber-500 inline" />
                          </span>
                        )}
                        <span className="text-slate-400 text-[9px] font-normal">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium leading-relaxed break-words shadow-xs ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                maxLength={280}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message room..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

