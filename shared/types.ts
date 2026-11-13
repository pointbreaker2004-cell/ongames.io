export type GameType = 
  | 'codewords' 
  | 'spyfall' 
  | 'onuw' 
  | 'love-letter' 
  | 'secret-sith'
  | 'avalon'
  | 'enigma'
  | 'two-truths'
  | 'uno'
  | 'chess';

export interface GameMetadata {
  id: GameType;
  title: string;
  subtitle: string;
  category: 'Social Deduction' | 'Word Game' | 'Card Game' | 'Bluffing' | 'Party' | 'Board Game';
  minPlayers: number;
  maxPlayers: number | null; // null means no hard maximum
  playTimeMinutes: string;
  description: string;
  howToPlay: string[];
  inspiration: string;
  color: string;
  iconName: string;
}

export interface Player {
  id: string; // Socket ID
  token: string; // Persistent UUID
  name: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: number;
}

export type RoomStatus = 'lobby' | 'playing' | 'game_over';

export interface BaseRoomConfig {
  timerSeconds?: number;
  [key: string]: any;
}

export interface ClientRoomView {
  code: string;
  gameType: GameType;
  status: RoomStatus;
  hostId: string;
  players: {
    id: string;
    token: string;
    name: string;
    isHost: boolean;
    isConnected: boolean;
  }[];
  config: BaseRoomConfig;
  gameView: any; // Game-specific sanitized view for the requesting player
  myPlayerId: string;
  isHost: boolean;
}

// ---------------- GAME-SPECIFIC TYPES ---------------- //

// 1. Codewords Types
export type CodewordTeam = 'red' | 'blue';
export type CodewordCardType = 'red' | 'blue' | 'neutral' | 'assassin';

export interface CodewordCard {
  word: string;
  type: CodewordCardType | 'unknown';
  revealed: boolean;
  revealedBy?: CodewordTeam;
}

export interface CodewordsGameState {
  cards: CodewordCard[];
  currentTurn: CodewordTeam;
  startingTeam: CodewordTeam;
  redScore: number;
  redTotal: number;
  blueScore: number;
  blueTotal: number;
  spymasters: { [playerId: string]: boolean };
  playerTeams: { [playerId: string]: CodewordTeam };
  currentClue: { word: string; count: number } | null;
  guessesRemaining: number;
  winner: CodewordTeam | null;
  winReason?: string;
  timerSeconds: number;
}

export interface CodewordsClientView extends CodewordsGameState {
  myTeam: CodewordTeam;
  isSpymaster: boolean;
}

// 2. Spyfall Types
export interface SpyfallPlayerRole {
  playerId: string;
  isSpy: boolean;
  role: string;
}

export interface SpyfallGameState {
  location: string;
  category: string;
  locationsList: string[];
  playerRoles: { [playerId: string]: SpyfallPlayerRole };
  timerSeconds: number;
  startedAt: number;
  roundDurationSeconds: number;
  accusedPlayerId: string | null;
  accusedByPlayerId: string | null;
  votes: { [playerId: string]: boolean };
  winner: 'spy' | 'players' | null;
  winReason?: string;
}

export interface SpyfallClientView {
  location: string;
  category: string;
  locationsList: string[];
  myRole: string;
  isSpy: boolean;
  timerSeconds: number;
  startedAt: number;
  roundDurationSeconds: number;
  accusedPlayerId: string | null;
  accusedByPlayerId: string | null;
  votes: { [playerId: string]: boolean };
  winner: 'spy' | 'players' | null;
  winReason?: string;
  playerRoles?: { [playerId: string]: SpyfallPlayerRole };
}

// 3. One Night Ultimate Werewolf Types
export type ONUW_Role = 
  | 'werewolf' 
  | 'minion' 
  | 'seer' 
  | 'robber' 
  | 'troublemaker' 
  | 'insomniac' 
  | 'drunk' 
  | 'tanner' 
  | 'villager';

export type ONUW_Phase = 
  | 'night' 
  | 'day' 
  | 'voting' 
  | 'ended';

export interface ONUW_GameState {
  initialRoles: { [playerId: string]: ONUW_Role };
  currentRoles: { [playerId: string]: ONUW_Role };
  centerCards: ONUW_Role[];
  phase: ONUW_Phase;
  nightStep: number;
  nightLogs: { [playerId: string]: string[] };
  dayTimerSeconds: number;
  votes: { [voterId: string]: string };
  killedPlayerIds: string[];
  winners: string[];
  winMessage?: string;
}

export interface ONUW_ClientView {
  phase: ONUW_Phase;
  dayTimerSeconds: number;
  myInitialRole: ONUW_Role;
  myLogs: string[];
  votes: string[] | { [voterId: string]: string };
  hasVoted: boolean;
  killedPlayerIds: string[];
  winners: string[];
  winMessage?: string;
  allCurrentRoles?: { [playerId: string]: ONUW_Role };
  allInitialRoles?: { [playerId: string]: ONUW_Role };
  centerCards?: ONUW_Role[];
}

// 4. Love Letter Types
export type LoveLetterCard = 
  | 'Guard'        // 1 (x5)
  | 'Priest'       // 2 (x2)
  | 'Baron'        // 3 (x2)
  | 'Handmaid'     // 4 (x2)
  | 'Prince'       // 5 (x2)
  | 'King'         // 6 (x1)
  | 'Countess'     // 7 (x1)
  | 'Princess';    // 8 (x1)

export interface LoveLetterPlayerState {
  hand: LoveLetterCard[];
  discard: LoveLetterCard[];
  isProtected: boolean;
  isEliminated: boolean;
  tokens: number;
}

export interface LoveLetterGameState {
  deck: LoveLetterCard[];
  removedCard: LoveLetterCard;
  turnOrder: string[];
  currentTurnIndex: number;
  players: { [playerId: string]: LoveLetterPlayerState };
  log: string[];
  roundWinner: string | null;
  gameWinner: string | null;
  peekedCard: { targetPlayerId: string; card: LoveLetterCard } | null;
}

export interface LoveLetterClientView {
  deckCount: number;
  currentTurnPlayerId: string;
  players: {
    [playerId: string]: {
      discard: LoveLetterCard[];
      isProtected: boolean;
      isEliminated: boolean;
      tokens: number;
      handCount: number;
      hand: LoveLetterCard[];
    };
  };
  log: string[];
  roundWinner: string | null;
  gameWinner: string | null;
  peekedCard: { targetPlayerId: string; card: LoveLetterCard } | null;
}

// 5. Secret Sith Types
export type SithFaction = 'Loyalist' | 'Separatist';
export type SithRole = 'Loyalist' | 'Separatist' | 'Palpatine';
export type SithPolicy = 'Loyalist' | 'Separatist';

export type SithPhase = 
  | 'nomination' 
  | 'election' 
  | 'legislative_president' 
  | 'legislative_chancellor' 
  | 'executive_action' 
  | 'game_over';

export interface SecretSithGameState {
  playerRoles: { [playerId: string]: SithRole };
  presidentIndex: number;
  presidentCandidateId: string;
  chancellorCandidateId: string | null;
  previousPresidentId: string | null;
  previousChancellorId: string | null;
  phase: SithPhase;
  votes: { [playerId: string]: boolean | null };
  electionTracker: number;
  loyalistPolicies: number;
  separatistPolicies: number;
  policyDeck: SithPolicy[];
  policyDiscard: SithPolicy[];
  drawnPolicies: SithPolicy[];
  executiveAction: 'investigate' | 'special_election' | 'execution' | 'policy_peek' | null;
  investigatedPlayers: { [playerId: string]: SithFaction };
  executedPlayers: string[];
  winner: SithFaction | null;
  winReason?: string;
}

export interface SecretSithClientView {
  phase: SithPhase;
  myRole: SithRole;
  knownSeparatists?: string[];
  knownPalpatine?: string | null;
  presidentCandidateId: string;
  chancellorCandidateId: string | null;
  previousPresidentId: string | null;
  previousChancellorId: string | null;
  loyalistPolicies: number;
  separatistPolicies: number;
  electionTracker: number;
  votes: string[] | { [playerId: string]: boolean | null };
  drawnPolicies: SithPolicy[];
  executiveAction: 'investigate' | 'special_election' | 'execution' | 'policy_peek' | null;
  investigatedPlayers: { [playerId: string]: SithFaction };
  executedPlayers: string[];
  winner: SithFaction | null;
  winReason?: string;
  allRoles?: { [playerId: string]: SithRole };
}

// 6. Two Truths & One Lie Types
export type TwoTruthsPhase = 'submission' | 'guessing' | 'reveal' | 'results';

export interface TwoTruthsPlayerSubmission {
  playerId: string;
  statements: string[];
  lieIndex: number; // 0, 1, or 2 (stored privately on server)
  submitted: boolean;
}

export interface TwoTruthsRoundData {
  authorId: string;
  shuffledStatements: string[];
  originalIndices: number[]; // maps shuffled index to original index
  shuffledLieIndex: number;
}

export interface TwoTruthsReaction {
  id: string;
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface TwoTruthsGameState {
  phase: TwoTruthsPhase;
  players: string[];
  authorOrder: string[];
  currentAuthorIndex: number;
  submissions: { [playerId: string]: TwoTruthsPlayerSubmission };
  currentRound: TwoTruthsRoundData | null;
  votes: { [voterId: string]: number }; // voterId -> shuffled statement index
  scores: { [playerId: string]: number };
  stats: {
    [playerId: string]: {
      correctGuesses: number;
      incorrectGuesses: number;
      fooledOthers: number;
      fooledEveryoneRounds: number;
    };
  };
  roundTimerSeconds: number;
  roundStartedAt: number;
  anonymousMode: boolean;
  recentReactions: TwoTruthsReaction[];
  roundResults?: {
    authorId: string;
    shuffledLieIndex: number;
    votes: { [voterId: string]: number };
    correctVoters: string[];
    incorrectVoters: string[];
    authorPointsEarned: number;
    fooledEveryone: boolean;
  };
}

export interface TwoTruthsClientView {
  phase: TwoTruthsPhase;
  mySubmission?: {
    statements: string[];
    lieIndex: number;
    submitted: boolean;
  };
  hasSubmitted: boolean;
  submissionCount: number;
  totalPlayersCount: number;
  submittedPlayerIds: string[];
  currentAuthorId: string | null;
  currentAuthorName: string | null;
  statements: string[];
  shuffledLieIndex?: number; // Only exposed during reveal or results
  myVote: number | null;
  votedPlayerIds: string[];
  roundTimerSeconds: number;
  roundStartedAt: number;
  anonymousMode: boolean;
  roundResults?: {
    authorId: string;
    authorName: string;
    shuffledLieIndex: number;
    votes: { [voterId: string]: number };
    correctVoters: string[];
    incorrectVoters: string[];
    authorPointsEarned: number;
    fooledEveryone: boolean;
  };
  scores: { [playerId: string]: number };
  leaderboard: {
    playerId: string;
    name: string;
    score: number;
    correctGuesses: number;
    fooledOthers: number;
  }[];
  recentReactions: TwoTruthsReaction[];
  roundProgress: {
    current: number;
    total: number;
  };
  isAuthor: boolean;
}

// 7. UNO Types
export type UnoColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type UnoValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
}

export interface UnoGameState {
  players: string[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentTurnIndex: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  hands: { [playerId: string]: UnoCard[] };
  activeColor: UnoColor; // Current color (e.g. after Wild is played)
  drawStack: number; // accumulated draw count if stacking or 0
  saidUno: { [playerId: string]: boolean };
  winner: string | null;
  log: string[];
}

export interface UnoClientView {
  myHand: UnoCard[];
  topCard: UnoCard;
  activeColor: UnoColor;
  currentTurnPlayerId: string;
  direction: 1 | -1;
  otherPlayers: {
    id: string;
    name: string;
    cardCount: number;
    hasSaidUno: boolean;
  }[];
  drawPileCount: number;
  winner: string | null;
  winnerName?: string;
  log: string[];
  isMyTurn: boolean;
  canCallUno: boolean;
}

// 8. Chess Types
export type ChessPieceColor = 'w' | 'b';

export interface ChessGameState {
  whitePlayerId: string;
  blackPlayerId: string;
  spectatorIds: string[];
  fen: string;
  history: string[]; // PGN moves e.g. "e4", "e5"
  turn: ChessPieceColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  winner: ChessPieceColor | 'draw' | null;
  winReason?: string;
  capturedPieces: {
    w: string[]; // captured by white (black pieces)
    b: string[]; // captured by black (white pieces)
  };
}

export interface ChessClientView {
  fen: string;
  turn: ChessPieceColor;
  myColor: ChessPieceColor | 'spectator';
  whitePlayer: { id: string; name: string };
  blackPlayer: { id: string; name: string };
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  winner: ChessPieceColor | 'draw' | null;
  winReason?: string;
  history: string[];
  capturedPieces: {
    w: string[];
    b: string[];
  };
  isMyTurn: boolean;
}

// Socket Events
export interface ServerToClientEvents {
  'room:state': (view: ClientRoomView) => void;
  'room:error': (message: string) => void;
  'notification': (msg: { type: 'info' | 'success' | 'warning' | 'error'; text: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { gameType: GameType; playerName: string; playerToken: string }) => void;
  'room:join': (data: { code: string; playerName: string; playerToken: string }) => void;
  'room:leave': () => void;
  'room:reconnect': (data: { code: string; playerToken: string }) => void;
  'room:update_config': (config: Partial<BaseRoomConfig>) => void;
  'room:start_game': () => void;
  'room:restart_game': () => void;
  'room:change_game': (data: { gameType: GameType }) => void;
  'room:kick_player': (targetPlayerId: string) => void;
  'game:action': (action: { type: string; payload?: any }) => void;
}
