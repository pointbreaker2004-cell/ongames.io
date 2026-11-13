import { GameEngine } from './base.js';
import { Player, CodewordsGameState, CodewordTeam, CodewordCard, CodewordCardType } from '../../../shared/types.js';

const WORD_BANK = [
  'AFRICA', 'AGENT', 'AIR', 'ALIEN', 'ALPS', 'AMAZON', 'AMBULANCE', 'AMERICA', 'ANGEL', 'ANTARCTICA',
  'APPLE', 'ARM', 'ATLANTIS', 'AUSTRALIA', 'AZTEC', 'BACK', 'BALL', 'BAND', 'BANK', 'BAR',
  'BARK', 'BAT', 'BATTERY', 'BEACH', 'BEAR', 'BEAT', 'BED', 'BEIJING', 'BELL', 'BELT',
  'BERLIN', 'BERMUDA', 'BERRY', 'BILL', 'BLOCK', 'BOARD', 'BOLT', 'BOMB', 'BOND', 'BOOM',
  'BOOT', 'BOTTLE', 'BOW', 'BOX', 'BRIDGE', 'BRUSH', 'BUCK', 'BUFFALO', 'BUG', 'BUGLE',
  'BUTTON', 'CALF', 'CANADA', 'CAP', 'CAPITAL', 'CAR', 'CARD', 'CARROT', 'CASINO', 'CAST',
  'CAT', 'CELL', 'CENTAUR', 'CENTER', 'CHAIR', 'CHANGE', 'CHARGE', 'CHECK', 'CHEST', 'CHICK',
  'CHINA', 'CHOCOLATE', 'CHURCH', 'CIRCLE', 'CLIFF', 'CLOAK', 'CLUB', 'CODE', 'COLD', 'COMIC',
  'COMPOUND', 'CONCERT', 'CONDUCTOR', 'CONTRACT', 'COOK', 'COPPER', 'COTTON', 'COURT', 'COVER', 'CRANE',
  'CRASH', 'CRICKET', 'CROSS', 'CROWN', 'CYCLE', 'CZECH', 'DANCE', 'DATE', 'DAY', 'DEATH',
  'DECK', 'DEGREE', 'DIAMOND', 'DICE', 'DINOSAUR', 'DISEASE', 'DOCTOR', 'DOG', 'DRAFT', 'DRAGON',
  'DRESS', 'DRILL', 'DROP', 'DUCK', 'DWARF', 'EAGLE', 'EGYPT', 'EMBASSY', 'ENGINE', 'ENGLAND',
  'EUROPE', 'EYE', 'FACE', 'FAIR', 'FALL', 'FAN', 'FENCE', 'FIELD', 'FIGHTER', 'FIGURE',
  'FILE', 'FILM', 'FIRE', 'FISH', 'FLUTE', 'FLY', 'FOOT', 'FORCE', 'FOREST', 'FORK'
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class CodewordsEngine implements GameEngine<CodewordsGameState> {
  private state!: CodewordsGameState;

  init(players: Player[], config?: any): CodewordsGameState {
    const shuffledWords = shuffle(WORD_BANK).slice(0, 25);
    const startingTeam: CodewordTeam = Math.random() < 0.5 ? 'red' : 'blue';
    const secondTeam: CodewordTeam = startingTeam === 'red' ? 'blue' : 'red';

    // 25 card types: 9 starting team, 8 second team, 7 neutrals, 1 assassin
    const types: CodewordCardType[] = [
      ...Array(9).fill(startingTeam),
      ...Array(8).fill(secondTeam),
      ...Array(7).fill('neutral'),
      'assassin'
    ];
    const shuffledTypes = shuffle(types);

    const cards: CodewordCard[] = shuffledWords.map((word, idx) => ({
      word,
      type: shuffledTypes[idx],
      revealed: false
    }));

    // Distribute players equally into red and blue teams
    const playerTeams: { [playerId: string]: CodewordTeam } = {};
    const spymasters: { [playerId: string]: boolean } = {};

    players.forEach((p, idx) => {
      const team: CodewordTeam = idx % 2 === 0 ? 'red' : 'blue';
      playerTeams[p.id] = team;
      spymasters[p.id] = false;
    });

    // Make the first red player and first blue player spymasters by default
    const redFirst = players.find(p => playerTeams[p.id] === 'red');
    const blueFirst = players.find(p => playerTeams[p.id] === 'blue');
    if (redFirst) spymasters[redFirst.id] = true;
    if (blueFirst) spymasters[blueFirst.id] = true;

    this.state = {
      cards,
      currentTurn: startingTeam,
      startingTeam,
      redScore: 0,
      redTotal: startingTeam === 'red' ? 9 : 8,
      blueScore: 0,
      blueTotal: startingTeam === 'blue' ? 9 : 8,
      spymasters,
      playerTeams,
      currentClue: null,
      guessesRemaining: 0,
      winner: null,
      timerSeconds: config?.timerSeconds || 120
    };

    return this.state;
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (this.state.winner) {
      return { success: false, error: 'Game is already over' };
    }

    const playerTeam = this.state.playerTeams[playerId];
    const isSpymaster = !!this.state.spymasters[playerId];

    switch (action.type) {
      case 'toggle_spymaster': {
        this.state.spymasters[playerId] = !this.state.spymasters[playerId];
        return { success: true };
      }

      case 'switch_team': {
        const newTeam: CodewordTeam = action.payload?.team || (playerTeam === 'red' ? 'blue' : 'red');
        this.state.playerTeams[playerId] = newTeam;
        return { success: true };
      }

      case 'give_clue': {
        if (!isSpymaster) {
          return { success: false, error: 'Only a Spymaster can give a clue' };
        }
        if (playerTeam !== this.state.currentTurn) {
          return { success: false, error: 'It is not your team\'s turn' };
        }
        if (this.state.currentClue) {
          return { success: false, error: 'A clue has already been given for this turn' };
        }

        const word = (action.payload?.word || '').trim().toUpperCase();
        const count = parseInt(action.payload?.count, 10);
        if (!word || isNaN(count) || count < 0) {
          return { success: false, error: 'Invalid clue or word count' };
        }

        this.state.currentClue = { word, count };
        // In codenames, operatives get count + 1 guesses
        this.state.guessesRemaining = count === 0 ? 99 : count + 1;
        return { success: true };
      }

      case 'guess_card': {
        if (isSpymaster) {
          return { success: false, error: 'Spymasters cannot guess cards' };
        }
        if (playerTeam !== this.state.currentTurn) {
          return { success: false, error: 'It is not your team\'s turn' };
        }
        if (!this.state.currentClue) {
          return { success: false, error: 'Wait for the Spymaster to give a clue first' };
        }

        const cardIndex = action.payload?.index;
        if (typeof cardIndex !== 'number' || cardIndex < 0 || cardIndex >= 25) {
          return { success: false, error: 'Invalid card index' };
        }

        const card = this.state.cards[cardIndex];
        if (card.revealed) {
          return { success: false, error: 'Card has already been revealed' };
        }

        card.revealed = true;
        card.revealedBy = playerTeam;
        this.state.guessesRemaining--;

        // Check card type
        if (card.type === 'assassin') {
          // Instant loss for guessing team
          this.state.winner = playerTeam === 'red' ? 'blue' : 'red';
          this.state.winReason = `${playerTeam.toUpperCase()} team contacted the Assassin!`;
          return { success: true };
        }

        if (card.type === 'red') {
          this.state.redScore++;
          if (this.state.redScore >= this.state.redTotal) {
            this.state.winner = 'red';
            this.state.winReason = 'Red team found all their agents!';
            return { success: true };
          }
        } else if (card.type === 'blue') {
          this.state.blueScore++;
          if (this.state.blueScore >= this.state.blueTotal) {
            this.state.winner = 'blue';
            this.state.winReason = 'Blue team found all their agents!';
            return { success: true };
          }
        }

        // Check if turn ends
        const guessedOwnAgent = card.type === playerTeam;
        if (!guessedOwnAgent || this.state.guessesRemaining <= 0) {
          this.passTurn();
        }

        return { success: true };
      }

      case 'pass_turn': {
        if (isSpymaster) {
          return { success: false, error: 'Spymasters cannot pass turn' };
        }
        if (playerTeam !== this.state.currentTurn) {
          return { success: false, error: 'It is not your team\'s turn' };
        }
        this.passTurn();
        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  private passTurn() {
    this.state.currentTurn = this.state.currentTurn === 'red' ? 'blue' : 'red';
    this.state.currentClue = null;
    this.state.guessesRemaining = 0;
  }

  getSanitizedView(playerId: string): any {
    const isSpymaster = !!this.state.spymasters[playerId];
    const isGameOver = !!this.state.winner;

    // Mask card types for non-spymasters unless revealed or game over
    const sanitizedCards = this.state.cards.map((card) => ({
      word: card.word,
      type: isSpymaster || isGameOver || card.revealed ? card.type : 'unknown',
      revealed: card.revealed,
      revealedBy: card.revealedBy
    }));

    return {
      ...this.state,
      cards: sanitizedCards,
      myTeam: this.state.playerTeams[playerId] || 'red',
      isSpymaster
    };
  }

  isGameOver(): boolean {
    return !!this.state.winner;
  }

  getResults(): any {
    return {
      winner: this.state.winner,
      reason: this.state.winReason,
      redScore: this.state.redScore,
      blueScore: this.state.blueScore
    };
  }
}

