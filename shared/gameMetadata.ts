import { GameMetadata } from './types';

export const GAME_CATALOG: GameMetadata[] = [
  {
    id: 'codewords',
    title: 'Codewords',
    subtitle: 'A game of secret agents, clues, and deduction',
    category: 'Word Game',
    minPlayers: 4,
    maxPlayers: null,
    playTimeMinutes: '15-20 min',
    description: "Two rival Spymasters know the secret identities of 25 agents. Their teammates see only the agents' codenames. Teams compete to contact all of their agents first using single-word clues.",
    howToPlay: [
      'Split into two teams: Red and Blue. Each team selects one Spymaster.',
      'A 5x5 grid of 25 words is laid out. Spymasters see a key identifying Red agents, Blue agents, innocent bystanders, and one deadly Assassin.',
      'Spymasters give a one-word clue paired with a number (e.g., "Animal: 2").',
      'Operatives guess words one by one. If they tap the Assassin, their team instantly loses!'
    ],
    inspiration: 'Inspired by Codenames',
    color: 'from-amber-500 to-red-600',
    iconName: 'KeyRound'
  },
  {
    id: 'spyfall',
    title: 'Spyfall',
    subtitle: 'Find the spy before your secret location is exposed',
    category: 'Bluffing',
    minPlayers: 3,
    maxPlayers: 12,
    playTimeMinutes: '8-10 min',
    description: 'All players receive the same secret location and unique roles - except for one player who is secretly the Spy! Ask clever questions to uncover the Spy without revealing where you are.',
    howToPlay: [
      'Everyone is given the same secret location (e.g. "Pirate Ship") and a role, except the Spy who only knows they are the Spy.',
      'A timer counts down from 8 minutes. Players take turns asking each other questions (e.g., "What is the dress code here?").',
      'Non-spies try to prove they know the location without giving it away.',
      'The Spy listens closely to deduce the location, while blending in.',
      'At any time, players can accuse a suspect, or the Spy can reveal themselves and guess the location to win!'
    ],
    inspiration: 'Inspired by Spyfall',
    color: 'from-indigo-600 to-purple-700',
    iconName: 'Eye'
  },
  {
    id: 'onuw',
    title: 'One Night Werewolf',
    subtitle: 'Fast-paced deduction with no player elimination',
    category: 'Social Deduction',
    minPlayers: 3,
    maxPlayers: 10,
    playTimeMinutes: '10 min',
    description: 'Villagers and Werewolves clash in a single night! Everyone closes their eyes, special roles perform their secret nocturnal swaps, and at dawn, the village has 5 minutes to debate and execute one suspect.',
    howToPlay: [
      'Every player gets a secret role (Werewolf, Seer, Robber, Troublemaker, Villager, Tanner, etc.), with 3 cards left in the center.',
      'During the Night phase, roles wake up sequentially to view or swap cards in secret.',
      'At Dawn, the discussion timer begins. Because roles may have switched, you might not even be on the team you started on!',
      'When time expires, everyone votes simultaneously. If a Werewolf dies, the Village wins!'
    ],
    inspiration: 'Inspired by One Night Ultimate Werewolf',
    color: 'from-blue-700 to-slate-900',
    iconName: 'Moon'
  },
  {
    id: 'love-letter',
    title: 'Love Letter',
    subtitle: 'Risk, deduction, and luck to win the royal heart',
    category: 'Card Game',
    minPlayers: 2,
    maxPlayers: 4,
    playTimeMinutes: '10-15 min',
    description: 'Court the Princess of Tempest while keeping your rivals at bay. In this quick-fire card game, you hold one card, draw one, and play one, using courtiers to knock out opponents.',
    howToPlay: [
      'Every player starts with 1 card in hand. The deck has 16 cards numbered 1 to 8.',
      'On your turn, draw 1 card, then choose which of your 2 cards to play face-up to trigger its ability.',
      'Use Guards (1) to guess opponent cards, Priests (2) to peek, Barons (3) to compare hands, or Handmaids (4) for immunity.',
      'If you discard the Princess (8), you are immediately eliminated! The last player standing or highest card wins a token of affection.'
    ],
    inspiration: 'Inspired by Love Letter',
    color: 'from-rose-500 to-pink-600',
    iconName: 'Heart'
  },
  {
    id: 'secret-sith',
    title: 'Secret Sith',
    subtitle: 'Galactic politics, hidden agendas, and betrayal',
    category: 'Social Deduction',
    minPlayers: 5,
    maxPlayers: 10,
    playTimeMinutes: '30-45 min',
    description: 'The Republic Senate is under threat! Loyalists hold the majority, but Separatists hide in plain sight among them. Elect Presidents and Chancellors to enact policies while watching for Emperor Palpatine.',
    howToPlay: [
      'Players are secretly assigned as Loyalists or Separatists. One Separatist is secretly Palpatine.',
      'Each round, the President nominates a Chancellor. The Senate votes Ja or Nein.',
      'If elected, the President draws 3 policy cards, discards 1, and passes 2 to the Chancellor, who enacts 1.',
      'Separatist policies unlock Presidential powers (investigate loyalty, call special elections, execute suspects).',
      'Loyalists win by enacting 5 Loyalist policies or killing Palpatine. Separatists win with 6 policies or electing Palpatine Chancellor after 3 Separatist policies are passed!'
    ],
    inspiration: 'Inspired by Secret Hitler',
    color: 'from-red-600 to-black',
    iconName: 'ShieldAlert'
  },
  {
    id: 'avalon',
    title: 'Avalon',
    subtitle: "The Resistance: Good vs Evil in King Arthur's Realm",
    category: 'Social Deduction',
    minPlayers: 5,
    maxPlayers: 10,
    playTimeMinutes: '25-35 min',
    description: 'Servants of Arthur embark on epic quests for the Holy Grail, while evil minions of Mordred infiltrate their ranks to sabotage missions from the shadows.',
    howToPlay: [
      'Players receive secret allegiance: Loyal Servants of Arthur (Good) or Minions of Mordred (Evil). Merlin knows who is evil.',
      'The Leader proposes a team for the current quest. All players vote to approve or reject the team.',
      'If approved, chosen quest members secretly play Success or Fail cards.',
      '3 Successful quests win for Good - unless the Assassin correctly identifies Merlin at the end!'
    ],
    inspiration: 'Inspired by The Resistance: Avalon',
    color: 'from-amber-600 to-cyan-800',
    iconName: 'Sword'
  },
  {
    id: 'enigma',
    title: 'Enigma',
    subtitle: 'Intercept enemy frequencies and decode encrypted transmissions',
    category: 'Word Game',
    minPlayers: 4,
    maxPlayers: 8,
    playTimeMinutes: '20-30 min',
    description: 'Two rival intelligence teams compete to transmit secret numerical codes using clever word associations without letting the opposing team crack their cipher.',
    howToPlay: [
      'Each team has a secret dashboard with 4 numbered keywords (1: Apple, 2: River, 3: Planet, 4: Castle).',
      'The Encryptor gets a secret 3-digit code (e.g. 3-1-4) and writes 3 clue words to communicate that order.',
      'Both teams attempt to deduce the code. If your team fails, you take a Miscommunication token.',
      'If the opposing team intercepts your frequency twice, they win!'
    ],
    inspiration: 'Inspired by Decrypto',
    color: 'from-emerald-600 to-teal-800',
    iconName: 'Radio'
  },
  {
    id: 'two-truths',
    title: 'Two Truths & One Lie',
    subtitle: 'Share your wildest stories and detect who is bluffing',
    category: 'Bluffing',
    minPlayers: 3,
    maxPlayers: 10,
    playTimeMinutes: '10-15 min',
    description: "Each player submits three statements about themselves - two truths and one cunning lie. Read your friends' cards, vote on the deception, and score points by fooling the room!",
    howToPlay: [
      'Submission: Everyone secretly writes three statements about themselves and picks which one is the lie.',
      "Guessing: Each player's statements are revealed one by one. Read carefully and vote for the statement you believe is false.",
      'Scoring: Earn +100 points for guessing the lie correctly. The author earns +50 points for every player they fool, plus a +100 bonus if everyone is fooled!',
      'Winner: After everyone has had their turn in the hot seat, the player with the highest score takes the crown.'
    ],
    inspiration: 'Classic Party Game',
    color: 'from-purple-600 to-blue-600',
    iconName: 'HelpCircle'
  },
  {
    id: 'uno',
    title: 'UNO Party',
    subtitle: 'The classic fast-paced color and number card matching game',
    category: 'Card Game',
    minPlayers: 2,
    maxPlayers: 8,
    playTimeMinutes: '10-20 min',
    description: 'Race to empty your hand by matching colors, numbers, or action cards. Deploy Skips, Reverses, and Wild Draw Fours, and remember to shout UNO before playing your last card!',
    howToPlay: [
      'Each player starts with 7 cards. Match the top card by color, number, or symbol.',
      'Action cards spice things up: Skip skips the next player, Reverse changes direction, and Draw Two forces the next player to draw 2 and forfeit their turn.',
      'Wild cards allow you to change the active color, while Wild Draw Four forces 4 cards on your opponent!',
      'When you are down to one card, tap the UNO button. The first player to play all their cards wins!'
    ],
    inspiration: 'Classic Card Game',
    color: 'from-red-500 via-amber-500 to-emerald-500',
    iconName: 'Dices'
  },
  {
    id: 'chess',
    title: 'Chess Blitz',
    subtitle: 'The ultimate timeless game of tactics, foresight, and checkmate',
    category: 'Board Game',
    minPlayers: 2,
    maxPlayers: 2,
    playTimeMinutes: '15-30 min',
    description: 'Compete 1v1 in real-time chess with legal move highlights, check indicators, capture tracking, and automatic checkmate detection. Outthink your opponent and capture their King!',
    howToPlay: [
      'One player commands White (moves first) and the other commands Black.',
      'Tap any of your pieces to view highlighted legal moves.',
      'Pawns march forward and capture diagonally; Knights leap in L-shapes; Rooks glide along files and ranks; Bishops control diagonals; and the Queen dominates all directions.',
      "Deliver Checkmate to your opponent's King or force a resignation to claim victory."
    ],
    inspiration: 'Timeless Strategy Board Game',
    color: 'from-slate-800 to-slate-950',
    iconName: 'Crown'
  }
];
