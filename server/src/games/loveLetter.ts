import { GameEngine } from './base.js';
import { Player, LoveLetterGameState, LoveLetterCard, LoveLetterPlayerState } from '../../../shared/types.js';

const DECK_COMPOSITION: LoveLetterCard[] = [
  'Guard', 'Guard', 'Guard', 'Guard', 'Guard',
  'Priest', 'Priest',
  'Baron', 'Baron',
  'Handmaid', 'Handmaid',
  'Prince', 'Prince',
  'King',
  'Countess',
  'Princess'
];

export const CARD_VALUES: Record<LoveLetterCard, number> = {
  'Guard': 1,
  'Priest': 2,
  'Baron': 3,
  'Handmaid': 4,
  'Prince': 5,
  'King': 6,
  'Countess': 7,
  'Princess': 8
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class LoveLetterEngine implements GameEngine<LoveLetterGameState> {
  private state!: LoveLetterGameState;
  private players: Player[] = [];

  init(players: Player[]): LoveLetterGameState {
    this.players = players;
    return this.startNewRound(true);
  }

  private startNewRound(resetTokens: boolean = false): LoveLetterGameState {
    const deck = shuffle(DECK_COMPOSITION);
    // Remove one card face-down
    const removedCard = deck.pop()!;

    const playerStates: { [playerId: string]: LoveLetterPlayerState } = {};
    const existingTokens = this.state?.players;

    this.players.forEach(p => {
      playerStates[p.id] = {
        hand: [deck.pop()!],
        discard: [],
        isProtected: false,
        isEliminated: false,
        tokens: resetTokens ? 0 : (existingTokens?.[p.id]?.tokens || 0)
      };
    });

    const turnOrder = this.players.map(p => p.id);
    const activePlayerId = turnOrder[0];
    // Active player draws their second card
    if (deck.length > 0) {
      playerStates[activePlayerId].hand.push(deck.pop()!);
    }

    this.state = {
      deck,
      removedCard,
      turnOrder,
      currentTurnIndex: 0,
      players: playerStates,
      log: ['A new round of Love Letter has begun!'],
      roundWinner: null,
      gameWinner: this.state?.gameWinner || null,
      peekedCard: null
    };

    return this.state;
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (this.state.gameWinner) {
      return { success: false, error: 'Game is already over' };
    }

    if (action.type === 'next_round') {
      if (this.state.roundWinner) {
        this.startNewRound(false);
        return { success: true };
      }
      return { success: false, error: 'Round is still in progress' };
    }

    const currentTurnPlayerId = this.state.turnOrder[this.state.currentTurnIndex];
    if (playerId !== currentTurnPlayerId) {
      return { success: false, error: 'It is not your turn' };
    }

    const player = this.state.players[playerId];
    if (player.isEliminated) {
      return { success: false, error: 'You are eliminated' };
    }

    switch (action.type) {
      case 'play_card': {
        const cardToPlay: LoveLetterCard = action.payload?.card;
        const targetPlayerId: string | undefined = action.payload?.targetPlayerId;
        const guessedCard: LoveLetterCard | undefined = action.payload?.guessedCard;

        if (!player.hand.includes(cardToPlay)) {
          return { success: false, error: 'You do not hold that card' };
        }

        // Countess rule: If you hold Countess and either King or Prince, you MUST play Countess
        const hasCountess = player.hand.includes('Countess');
        const hasKingOrPrince = player.hand.includes('King') || player.hand.includes('Prince');
        if (hasCountess && hasKingOrPrince && cardToPlay !== 'Countess') {
          return { success: false, error: 'You must play the Countess when holding King or Prince!' };
        }

        // Remove card from hand and add to discard
        const cardIndex = player.hand.indexOf(cardToPlay);
        player.hand.splice(cardIndex, 1);
        player.discard.push(cardToPlay);
        player.isProtected = false; // Playing a card clears your own Handmaid

        const playerName = this.players.find(p => p.id === playerId)?.name || 'Player';
        this.state.peekedCard = null;

        // Resolve card effects
        this.resolveCardEffect(playerId, playerName, cardToPlay, targetPlayerId, guessedCard);

        // Check if round should end
        if (this.checkRoundEnd()) {
          return { success: true };
        }

        // Advance turn to next non-eliminated player
        this.advanceTurn();
        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  private resolveCardEffect(
    playerId: string,
    playerName: string,
    card: LoveLetterCard,
    targetId?: string,
    guessedCard?: LoveLetterCard
  ) {
    const target = targetId ? this.state.players[targetId] : undefined;
    const targetName = this.players.find(p => p.id === targetId)?.name || 'Target';

    switch (card) {
      case 'Guard': {
        if (!targetId || !target || target.isProtected || target.isEliminated || targetId === playerId) {
          this.state.log.push(`${playerName} played Guard with no valid target.`);
          return;
        }
        if (!guessedCard || guessedCard === 'Guard') {
          this.state.log.push(`${playerName} played Guard, but made an invalid guess.`);
          return;
        }

        if (target.hand[0] === guessedCard) {
          target.isEliminated = true;
          this.state.log.push(`🎯 ${playerName} correctly guessed ${targetName} holds ${guessedCard}! ${targetName} is eliminated!`);
        } else {
          this.state.log.push(`${playerName} guessed ${targetName} holds ${guessedCard}, but was incorrect.`);
        }
        break;
      }

      case 'Priest': {
        if (!targetId || !target || target.isProtected || target.isEliminated || targetId === playerId) {
          this.state.log.push(`${playerName} played Priest with no target.`);
          return;
        }
        this.state.peekedCard = { targetPlayerId: targetId, card: target.hand[0] };
        this.state.log.push(`👁️ ${playerName} secretly viewed ${targetName}'s card.`);
        break;
      }

      case 'Baron': {
        if (!targetId || !target || target.isProtected || target.isEliminated || targetId === playerId) {
          this.state.log.push(`${playerName} played Baron with no target.`);
          return;
        }
        const myVal = CARD_VALUES[this.state.players[playerId].hand[0]];
        const targetVal = CARD_VALUES[target.hand[0]];

        if (myVal > targetVal) {
          target.isEliminated = true;
          this.state.log.push(`⚔️ ${playerName} compared hands with ${targetName}. ${targetName} has a lower card and is eliminated!`);
        } else if (targetVal > myVal) {
          this.state.players[playerId].isEliminated = true;
          this.state.log.push(`⚔️ ${playerName} challenged ${targetName} with Baron, but had a lower card and was eliminated!`);
        } else {
          this.state.log.push(`⚔️ ${playerName} and ${targetName} tied hand values in Baron duel. Both survive!`);
        }
        break;
      }

      case 'Handmaid': {
        this.state.players[playerId].isProtected = true;
        this.state.log.push(`🛡️ ${playerName} played Handmaid and is protected until their next turn.`);
        break;
      }

      case 'Prince': {
        const effectiveTargetId = targetId || playerId;
        const princeTarget = this.state.players[effectiveTargetId];
        const pTargetName = this.players.find(p => p.id === effectiveTargetId)?.name || 'Player';

        if (princeTarget && !princeTarget.isProtected && !princeTarget.isEliminated) {
          const discarded = princeTarget.hand.pop()!;
          princeTarget.discard.push(discarded);
          this.state.log.push(`👑 ${playerName} forced ${pTargetName} to discard their card (${discarded}).`);

          if (discarded === 'Princess') {
            princeTarget.isEliminated = true;
            this.state.log.push(`💥 ${pTargetName} discarded Princess and is eliminated!`);
          } else {
            // Draw new card from deck, or removed card if deck empty
            const nextCard = this.state.deck.length > 0 ? this.state.deck.pop()! : this.state.removedCard;
            princeTarget.hand.push(nextCard);
          }
        }
        break;
      }

      case 'King': {
        if (!targetId || !target || target.isProtected || target.isEliminated || targetId === playerId) {
          this.state.log.push(`${playerName} played King with no target.`);
          return;
        }
        const myHand = this.state.players[playerId].hand;
        const targetHand = target.hand;
        const temp = myHand[0];
        myHand[0] = targetHand[0];
        targetHand[0] = temp;
        this.state.log.push(`🔄 ${playerName} traded hands with ${targetName}!`);
        break;
      }

      case 'Countess': {
        this.state.log.push(`💃 ${playerName} played Countess.`);
        break;
      }

      case 'Princess': {
        this.state.players[playerId].isEliminated = true;
        this.state.log.push(`💥 ${playerName} discarded Princess and is immediately eliminated!`);
        break;
      }
    }
  }

  private advanceTurn() {
    let nextIndex = (this.state.currentTurnIndex + 1) % this.state.turnOrder.length;
    // Find next non-eliminated player
    while (this.state.players[this.state.turnOrder[nextIndex]].isEliminated) {
      nextIndex = (nextIndex + 1) % this.state.turnOrder.length;
    }

    this.state.currentTurnIndex = nextIndex;
    const nextPlayerId = this.state.turnOrder[nextIndex];

    // Clear protection
    this.state.players[nextPlayerId].isProtected = false;

    // Draw card for next player
    if (this.state.deck.length > 0) {
      this.state.players[nextPlayerId].hand.push(this.state.deck.pop()!);
    }
  }

  private checkRoundEnd(): boolean {
    const activePlayers = this.players.filter(p => !this.state.players[p.id].isEliminated);

    // Case 1: Only 1 player left standing
    if (activePlayers.length === 1) {
      this.awardRoundWinner(activePlayers[0].id, 'Last player standing!');
      return true;
    }

    // Case 2: Deck is empty
    if (this.state.deck.length === 0) {
      // Player with highest card value wins
      let highestVal = -1;
      let winnerId: string | null = null;

      activePlayers.forEach(p => {
        const card = this.state.players[p.id].hand[0];
        const val = CARD_VALUES[card] || 0;
        if (val > highestVal) {
          highestVal = val;
          winnerId = p.id;
        }
      });

      if (winnerId) {
        this.awardRoundWinner(winnerId, 'Highest card when deck ran out!');
      }
      return true;
    }

    return false;
  }

  private awardRoundWinner(playerId: string, reason: string) {
    this.state.roundWinner = playerId;
    this.state.players[playerId].tokens++;
    const name = this.players.find(p => p.id === playerId)?.name || 'Player';
    this.state.log.push(`🏆 ${name} wins the round! (${reason})`);

    // Target tokens: 2 players = 7, 3 players = 5, 4 players = 4
    const targetTokens = this.players.length === 2 ? 7 : (this.players.length === 3 ? 5 : 4);
    if (this.state.players[playerId].tokens >= targetTokens) {
      this.state.gameWinner = playerId;
      this.state.log.push(`🎉🎉 ${name} has earned ${targetTokens} tokens and won the entire game!`);
    }
  }

  getSanitizedView(playerId: string): any {
    const sanitizedPlayers: { [pid: string]: any } = {};

    Object.keys(this.state.players).forEach(pid => {
      const p = this.state.players[pid];
      sanitizedPlayers[pid] = {
        discard: p.discard,
        isProtected: p.isProtected,
        isEliminated: p.isEliminated,
        tokens: p.tokens,
        handCount: p.hand.length,
        // Only show hand if it's the player themselves or round is over
        hand: (pid === playerId || this.state.roundWinner) ? p.hand : []
      };
    });

    return {
      deckCount: this.state.deck.length,
      currentTurnPlayerId: this.state.turnOrder[this.state.currentTurnIndex],
      players: sanitizedPlayers,
      log: this.state.log.slice(-10),
      roundWinner: this.state.roundWinner,
      gameWinner: this.state.gameWinner,
      peekedCard: this.state.peekedCard?.targetPlayerId ? (
        playerId === this.state.turnOrder[this.state.currentTurnIndex] ? this.state.peekedCard : null
      ) : null
    };
  }

  isGameOver(): boolean {
    return !!this.state.gameWinner;
  }

  getResults(): any {
    return {
      winner: this.state.gameWinner,
      players: this.state.players
    };
  }
}

