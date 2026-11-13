import { GameEngine } from './base.js';
import { Player, UnoCard, UnoColor, UnoValue, UnoGameState, UnoClientView } from '../../../shared/types.js';

const COLORS: UnoColor[] = ['red', 'yellow', 'green', 'blue'];
const VALUES: UnoValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];

export class UnoEngine implements GameEngine<UnoGameState> {
  private state!: UnoGameState;
  private playersMap: Map<string, Player> = new Map();

  private buildDeck(): UnoCard[] {
    const deck: UnoCard[] = [];
    let idCounter = 1;

    for (const color of COLORS) {
      // One 0 per color
      deck.push({ id: `c_${idCounter++}`, color, value: '0' });

      // Two of each 1-9, skip, reverse, draw2
      for (const val of VALUES) {
        if (val === '0') continue;
        deck.push({ id: `c_${idCounter++}`, color, value: val });
        deck.push({ id: `c_${idCounter++}`, color, value: val });
      }
    }

    // 4 Wild, 4 Wild Draw Four
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `c_${idCounter++}`, color: 'wild', value: 'wild' });
      deck.push({ id: `c_${idCounter++}`, color: 'wild', value: 'wild4' });
    }

    // Shuffle deck
    return deck.sort(() => Math.random() - 0.5);
  }

  init(players: Player[], config?: any): UnoGameState {
    this.playersMap.clear();
    players.forEach(p => this.playersMap.set(p.id, p));

    const playerIds = players.map(p => p.id);
    let deck = this.buildDeck();

    // Deal 7 cards to each player
    const hands: { [id: string]: UnoCard[] } = {};
    for (const id of playerIds) {
      hands[id] = deck.splice(0, 7);
    }

    // First card on discard pile (must not be wild for simple fair start)
    let firstCardIndex = deck.findIndex(c => c.color !== 'wild' && c.value !== 'skip' && c.value !== 'reverse' && c.value !== 'draw2');
    if (firstCardIndex === -1) firstCardIndex = 0;
    const [firstCard] = deck.splice(firstCardIndex, 1);

    this.state = {
      players: playerIds,
      deck,
      discardPile: [firstCard],
      currentTurnIndex: 0,
      direction: 1,
      hands,
      activeColor: firstCard.color,
      drawStack: 0,
      saidUno: {},
      winner: null,
      log: [`Game started. First card is ${firstCard.color.toUpperCase()} ${firstCard.value}.`]
    };

    return this.state;
  }

  private recycleDiscardPile() {
    if (this.state.deck.length > 3) return;
    const top = this.state.discardPile.pop()!;
    const recycled = this.state.discardPile.sort(() => Math.random() - 0.5);
    this.state.deck.push(...recycled);
    this.state.discardPile = [top];
  }

  private advanceTurn(stepCount = 1) {
    const total = this.state.players.length;
    let nextIndex = (this.state.currentTurnIndex + (this.state.direction * stepCount)) % total;
    if (nextIndex < 0) nextIndex += total;
    this.state.currentTurnIndex = nextIndex;
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (this.state.winner) {
      return { success: false, error: 'Game is already over' };
    }

    const currentTurnPlayerId = this.state.players[this.state.currentTurnIndex];

    switch (action.type) {
      case 'play_card': {
        if (playerId !== currentTurnPlayerId) {
          return { success: false, error: "It is not your turn" };
        }

        const cardId = action.payload?.cardId;
        const chosenColor: UnoColor = action.payload?.chosenColor;

        const hand = this.state.hands[playerId] || [];
        const cardIndex = hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
          return { success: false, error: 'Card not found in your hand' };
        }

        const card = hand[cardIndex];
        const topCard = this.state.discardPile[this.state.discardPile.length - 1];

        // Validation: color matches activeColor, OR value matches topCard.value, OR wild
        const isMatch = (card.color === 'wild') ||
                        (card.color === this.state.activeColor) ||
                        (card.value === topCard.value);

        if (!isMatch) {
          return { success: false, error: `Card must match active color (${this.state.activeColor}) or value (${topCard.value})` };
        }

        if (card.color === 'wild' && (!chosenColor || chosenColor === 'wild' || !COLORS.includes(chosenColor))) {
          return { success: false, error: 'You must select a target color (Red, Yellow, Green, or Blue)' };
        }

        // Remove card from player hand and place on discard pile
        hand.splice(cardIndex, 1);
        this.state.discardPile.push(card);

        const playerName = this.playersMap.get(playerId)?.name || 'Player';
        this.state.activeColor = card.color === 'wild' ? chosenColor : card.color;

        // Check for WIN
        if (hand.length === 0) {
          this.state.winner = playerId;
          this.state.log.unshift(`🎉 ${playerName} has played all their cards and WON the game!`);
          return { success: true };
        }

        // Reset saidUno if hand is more than 1
        if (hand.length > 1) {
          this.state.saidUno[playerId] = false;
        }

        // Action card effects
        if (card.value === 'skip') {
          this.advanceTurn(2);
          this.state.log.unshift(`${playerName} played a SKIP! Next player's turn was skipped.`);
        } else if (card.value === 'reverse') {
          if (this.state.players.length === 2) {
            this.advanceTurn(2); // 2-player reverse acts as skip
            this.state.log.unshift(`${playerName} played REVERSE! Next player's turn was skipped.`);
          } else {
            this.state.direction = (this.state.direction * -1) as (1 | -1);
            this.advanceTurn(1);
            this.state.log.unshift(`${playerName} played REVERSE! Turn direction flipped.`);
          }
        } else if (card.value === 'draw2') {
          const nextIndex = (this.state.currentTurnIndex + this.state.direction + this.state.players.length) % this.state.players.length;
          const nextPlayerId = this.state.players[nextIndex];
          this.recycleDiscardPile();
          const drawn = this.state.deck.splice(0, 2);
          this.state.hands[nextPlayerId].push(...drawn);
          this.advanceTurn(2);
          const nextName = this.playersMap.get(nextPlayerId)?.name || 'Next player';
          this.state.log.unshift(`${playerName} played DRAW 2! ${nextName} drew 2 cards and was skipped.`);
        } else if (card.value === 'wild4') {
          const nextIndex = (this.state.currentTurnIndex + this.state.direction + this.state.players.length) % this.state.players.length;
          const nextPlayerId = this.state.players[nextIndex];
          this.recycleDiscardPile();
          const drawn = this.state.deck.splice(0, 4);
          this.state.hands[nextPlayerId].push(...drawn);
          this.advanceTurn(2);
          const nextName = this.playersMap.get(nextPlayerId)?.name || 'Next player';
          this.state.log.unshift(`${playerName} played WILD DRAW 4! Color is ${this.state.activeColor.toUpperCase()}. ${nextName} drew 4 cards and was skipped.`);
        } else if (card.value === 'wild') {
          this.advanceTurn(1);
          this.state.log.unshift(`${playerName} played WILD! Color changed to ${this.state.activeColor.toUpperCase()}.`);
        } else {
          this.advanceTurn(1);
          this.state.log.unshift(`${playerName} played ${card.color.toUpperCase()} ${card.value}.`);
        }

        return { success: true };
      }

      case 'draw_card': {
        if (playerId !== currentTurnPlayerId) {
          return { success: false, error: "It is not your turn" };
        }

        this.recycleDiscardPile();
        if (this.state.deck.length === 0) {
          return { success: false, error: 'No cards left in deck' };
        }

        const [drawnCard] = this.state.deck.splice(0, 1);
        this.state.hands[playerId].push(drawnCard);

        const playerName = this.playersMap.get(playerId)?.name || 'Player';
        this.state.log.unshift(`${playerName} drew a card.`);

        // In party rules: after drawing 1 card, pass turn to next player
        this.advanceTurn(1);
        return { success: true };
      }

      case 'call_uno': {
        const hand = this.state.hands[playerId] || [];
        if (hand.length <= 2) {
          this.state.saidUno[playerId] = true;
          const playerName = this.playersMap.get(playerId)?.name || 'Player';
          this.state.log.unshift(`🔥 ${playerName} shouts: "UNO!"`);
          return { success: true };
        }
        return { success: false, error: 'You can only call UNO when you have 1 or 2 cards!' };
      }

      default:
        return { success: false, error: `Unknown action: ${action.type}` };
    }
  }

  getSanitizedView(playerId: string): UnoClientView {
    const myHand = this.state.hands[playerId] || [];
    const topCard = this.state.discardPile[this.state.discardPile.length - 1];
    const currentTurnPlayerId = this.state.players[this.state.currentTurnIndex];
    const winnerName = this.state.winner ? this.playersMap.get(this.state.winner)?.name : undefined;

    const otherPlayers = this.state.players
      .filter(id => id !== playerId)
      .map(id => ({
        id,
        name: this.playersMap.get(id)?.name || 'Player',
        cardCount: (this.state.hands[id] || []).length,
        hasSaidUno: !!this.state.saidUno[id]
      }));

    return {
      myHand,
      topCard,
      activeColor: this.state.activeColor,
      currentTurnPlayerId,
      direction: this.state.direction,
      otherPlayers,
      drawPileCount: this.state.deck.length,
      winner: this.state.winner,
      winnerName,
      log: this.state.log.slice(0, 12),
      isMyTurn: currentTurnPlayerId === playerId,
      canCallUno: myHand.length <= 2 && !this.state.saidUno[playerId]
    };
  }

  isGameOver(): boolean {
    return !!this.state.winner;
  }

  getResults(): any {
    return {
      winner: this.state.winner,
      winnerName: this.state.winner ? this.playersMap.get(this.state.winner)?.name : undefined
    };
  }
}

