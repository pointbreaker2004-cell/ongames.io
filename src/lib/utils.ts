import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Persistent Player Token (Device UUID)
export function getPlayerToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('ongames_player_token');
  if (!token) {
    token = uuidv4();
    localStorage.setItem('ongames_player_token', token);
  }
  return token;
}

export function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('ongames_player_name') || '';
}

export function saveName(name: string): void {
  if (typeof window === 'undefined') return;
  if (name.trim()) {
    localStorage.setItem('ongames_player_name', name.trim());
  }
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

