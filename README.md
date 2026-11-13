# OnGames.io — Real-Time Party & Board Games Platform

A modern, mobile-first web platform inspired by **[netgames.io](https://netgames.io/games/)** built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Socket.IO**.

Play popular social deduction, party, and card games with friends using phones as private screens and controllers—no app downloads or accounts needed.

---

## 🎮 Included Games & Mechanics

1. **Codewords** *(Inspired by Codenames)*
   - 2 teams (Red vs. Blue) with Spymaster and Operative roles.
   - 5x5 dynamic word grid with 9 starting words, 8 second team words, 7 neutrals, and 1 deadly Assassin.
   - Spymaster view toggle with color key; Operatives tap to guess; Clue input system; Confetti victory animations.

2. **Spyfall** *(Inspired by Spyfall)*
   - 24 recognizable locations with distinct role assignments.
   - Secret location and role card with "Tap to Reveal" privacy toggle.
   - Synchronized 8-minute countdown timer with tick sound effects.
   - Interactive location directory with tap-to-cross-out mechanics.
   - Accuse suspect modal with team voting and Spy location guessing.

3. **One Night Werewolf** *(Inspired by One Night Ultimate Werewolf)*
   - Automated night phase supporting Werewolf, Seer, Robber, Troublemaker, Villager, Tanner, and Insomniac.
   - Night intel logs and card swaps.
   - Day discussion phase followed by simultaneous blind voting.
   - Execution resolution and full end-of-game role reveals.

4. **Love Letter** *(Inspired by Love Letter)*
   - Complete 16-card deck simulation (Guard, Priest, Baron, Handmaid, Prince, King, Countess, Princess).
   - Draw-and-play turn mechanics with target selection and Guard card guessing.
   - Handmaid protection shields, discard piles, and Tokens of Affection tracker.

5. **Secret Sith** *(Inspired by Secret Hitler)*
   - Loyalist vs. Separatist policy boards (5 Loyalist / 6 Separatist to win).
   - Presidential nomination of Chancellor and Ja/Nein voting.
   - Legislative session: President discards 1 of 3 policies, Chancellor enacts 1 of 2.
   - Executive powers: Party loyalty investigations and Presidential execution.
   - Palpatine victory check upon election after 3 Separatist policies.

---

## 🚀 Key Architectural Features

- **No Passwords or Accounts**: Persistent device UUIDs via `localStorage` maintain reconnection tokens and remember player display names.
- **4-Letter Room Codes**: Auto-generated friendly codes (e.g. `ABCD`) with direct URL sharing and instant QR code scanning.
- **Server-Authoritative Anti-Cheat**: The server only transmits sanitized views to each socket connection. Secret roles, hidden cards, and Spymaster keys cannot be snooped via browser DevTools.
- **Unified Single-Port Next.js Server**: Next.js App Router and Socket.IO run concurrently on the exact same HTTP server port, eliminating CORS issues.
- **Synthesized Web Audio**: Built-in sound effects (timer ticks, role reveals, turn alerts, victory fanfares) synthesized on the fly via the Web Audio API with zero external audio asset latency.

---

## 🛠️ Getting Started

### Development Mode
```bash
npm run dev
```
Starts the custom Next.js server with live reloading and Socket.IO active at `http://localhost:3000`.

### Production Build & Run
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```text
├── server.ts                    # Unified Next.js + Socket.IO server
├── server/
│   └── src/
│       ├── roomManager.ts       # Room lifecycle, TTL garbage collection, code generator
│       ├── socketHandler.ts     # Real-time event dispatching & sanitized state broadcasting
│       └── games/               # Server-authoritative game engines
│           ├── base.ts          # GameEngine interface
│           ├── codewords.ts     # Codewords engine
│           ├── spyfall.ts       # Spyfall engine
│           ├── onuw.ts          # One Night Werewolf engine
│           ├── loveLetter.ts    # Love Letter engine
│           └── secretSith.ts    # Secret Sith engine
├── shared/
│   ├── types.ts                 # Shared TypeScript interfaces & client view types
│   └── gameMetadata.ts          # Catalog descriptions, player limits, and rules
└── src/
    ├── app/
    │   ├── layout.tsx           # Mobile-first viewport, Navbar & global styling
    │   ├── page.tsx             # Home route redirecting to /games
    │   ├── games/page.tsx       # Games catalog with filters & room creation
    │   ├── join/page.tsx        # Fast 4-letter room code entry & recent rooms
    │   └── room/[code]/page.tsx # Room controller (LobbyView or active GameView)
    ├── components/
    │   ├── Navbar.tsx           # Brand header, sound mute toggle, and rules modal
    │   ├── LobbyView.tsx        # 4-letter code, share link, QR code, player list, start button
    │   ├── QRCodeModal.tsx      # Instant scannable QR code generator
    │   └── games/               # Mobile-optimized gameplay components
    ├── hooks/
    │   └── useSocket.ts         # Socket.IO connection hook with auto-reconnection
    └── lib/
        ├── utils.ts             # Device UUID token & recent room storage
        └── sounds.ts            # Web Audio API sound synthesizer
```

