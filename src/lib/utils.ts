import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Persistent Player Token (Device UUID)
export function getPlayerToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    let token = localStorage.getItem('ongames_player_token');
    if (!token) {
      token = uuidv4();
      localStorage.setItem('ongames_player_token', token);
    }
    return token;
  } catch {
    if (typeof window !== 'undefined' && (window as any).__ongames_token) {
      return (window as any).__ongames_token;
    }
    const fallback = 'token-' + Math.random().toString(36).substring(2, 10);
    if (typeof window !== 'undefined') {
      (window as any).__ongames_token = fallback;
    }
    return fallback;
  }
}

export function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('ongames_player_name') || '';
  } catch {
    return '';
  }
}

export function saveName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (name.trim()) {
      localStorage.setItem('ongames_player_name', name.trim());
    }
  } catch {}
}

// Recent Rooms Memory
export interface RecentRoom {
  code: string;
  gameType: string;
  joinedAt: number;
}

export function getRecentRooms(): RecentRoom[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('ongames_recent_rooms');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentRoom(code: string, gameType: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getRecentRooms().filter(r => r.code !== code);
    list.unshift({ code, gameType, joinedAt: Date.now() });
    localStorage.setItem('ongames_recent_rooms', JSON.stringify(list.slice(0, 5)));
  } catch (e) {
    console.error(e);
  }
}

