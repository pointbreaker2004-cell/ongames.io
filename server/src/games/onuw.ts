import { GameEngine } from './base.js';
import { Player, ONUW_GameState, ONUW_Role, ONUW_Phase } from '../../../shared/types.js';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class OneNightWerewolfEngine implements GameEngine<ONUW_GameState> {
  private state!: ONUW_GameState;
  private players: Player[] = [];

  init(players: Player[], config?: any): ONUW_GameState {
    this.players = players;
    const n = players.length;

    // Deck always needs n + 3 cards
    // Pool of standard roles
    const standardPool: ONUW_Role[] = [
      'werewolf', 'werewolf',
      'seer',
      'robber',
      'troublemaker',
      'villager',
      'villager',
      'insomniac',
      'minion',
      'tanner',
      'drunk'
    ];

    // Pick n + 3 cards
    const deck = shuffle(standardPool).slice(0, n + 3);

    const initialRoles: { [playerId: string]: ONUW_Role } = {};
    const currentRoles: { [playerId: string]: ONUW_Role } = {};
    const nightLogs: { [playerId: string]: string[] } = {};

    players.forEach((p, idx) => {
      initialRoles[p.id] = deck[idx];
      currentRoles[p.id] = deck[idx];
      nightLogs[p.id] = [];
    });

    const centerCards = deck.slice(n, n + 3);

    this.state = {
      initialRoles,
      currentRoles,
      centerCards,
      phase: 'night',
      nightStep: 0,
      nightLogs,
      dayTimerSeconds: config?.timerSeconds || 300, // 5 minutes
      votes: {},
      killedPlayerIds: [],
      winners: []
    };

    // Pre-calculate night visions for automated night phase resolution
    this.processNightAbilities();

    return this.state;
  }

  private processNightAbilities() {
    // 1. Werewolf sight
    const wolves = this.players.filter(p => this.state.initialRoles[p.id] === 'werewolf');
    if (wolves.length === 1) {
      const loneWolf = wolves[0];
      const peekIdx = Math.floor(Math.random() * 3);
      this.state.nightLogs[loneWolf.id].push(
        `You are a lone Werewolf! You peeked at Center Card #${peekIdx + 1} and saw: ${this.state.centerCards[peekIdx].toUpperCase()}`
      );
    } else {
      const wolfNames = wolves.map(w => w.name).join(', ');
      wolves.forEach(w => {
        this.state.nightLogs[w.id].push(`Werewolves this night: ${wolfNames}`);
      });
    }

    // 2. Minion sight
    const minion = this.players.find(p => this.state.initialRoles[p.id] === 'minion');
    if (minion) {
      if (wolves.length > 0) {
        this.state.nightLogs[minion.id].push(`You are the Minion. The Werewolves are: ${wolves.map(w => w.name).join(', ')}`);
      } else {
        this.state.nightLogs[minion.id].push(`You are the Minion. There are no Werewolves in play!`);
      }
    }
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    switch (action.type) {
      case 'seer_action': {
        if (this.state.phase !== 'night') {
          return { success: false, error: 'Night phase is over' };
        }
        if (this.state.initialRoles[playerId] !== 'seer') {
          return { success: false, error: 'Only the Seer can take this action' };
        }
        const targetPlayerId = action.payload?.targetPlayerId;
        const centerIndices = action.payload?.centerIndices as number[];

        if (targetPlayerId) {
          const targetRole = this.state.initialRoles[targetPlayerId];
          const targetPlayer = this.players.find(p => p.id === targetPlayerId);
          this.state.nightLogs[playerId].push(`You saw ${targetPlayer?.name}'s role: ${targetRole.toUpperCase()}`);
          return { success: true };
        } else if (centerIndices && centerIndices.length === 2) {
          const c1 = this.state.centerCards[centerIndices[0]];
          const c2 = this.state.centerCards[centerIndices[1]];
          this.state.nightLogs[playerId].push(
            `You saw Center Cards #${centerIndices[0] + 1} (${c1.toUpperCase()}) and #${centerIndices[1] + 1} (${c2.toUpperCase()})`
          );
          return { success: true };
        }
        return { success: false, error: 'Invalid Seer targets' };
      }

      case 'robber_action': {
        if (this.state.phase !== 'night') return { success: false, error: 'Night phase is over' };
        if (this.state.initialRoles[playerId] !== 'robber') return { success: false, error: 'Only the Robber can rob' };

        const targetPlayerId = action.payload?.targetPlayerId;
        if (!targetPlayerId || targetPlayerId === playerId) {
          return { success: false, error: 'Choose a valid player to rob' };
        }

        const stolenRole = this.state.currentRoles[targetPlayerId];
        this.state.currentRoles[targetPlayerId] = 'robber';
        this.state.currentRoles[playerId] = stolenRole;

        const target = this.players.find(p => p.id === targetPlayerId);
        this.state.nightLogs[playerId].push(`You stole ${target?.name}'s role and are now: ${stolenRole.toUpperCase()}`);
        return { success: true };
      }

      case 'troublemaker_action': {
        if (this.state.phase !== 'night') return { success: false, error: 'Night phase is over' };
        if (this.state.initialRoles[playerId] !== 'troublemaker') return { success: false, error: 'Only Troublemaker can swap' };

        const p1 = action.payload?.player1Id;
        const p2 = action.payload?.player2Id;
        if (!p1 || !p2 || p1 === p2 || p1 === playerId || p2 === playerId) {
          return { success: false, error: 'Choose two other different players to swap' };
        }

        const temp = this.state.currentRoles[p1];
        this.state.currentRoles[p1] = this.state.currentRoles[p2];
        this.state.currentRoles[p2] = temp;

        const target1 = this.players.find(p => p.id === p1);
        const target2 = this.players.find(p => p.id === p2);
        this.state.nightLogs[playerId].push(`You swapped ${target1?.name} and ${target2?.name}`);
        return { success: true };
      }

      case 'finish_night': {
        // Transition to day phase
        this.state.phase = 'day';
        // Process Insomniac at the end of night
        const insomniac = this.players.find(p => this.state.initialRoles[p.id] === 'insomniac');
        if (insomniac) {
          const finalRole = this.state.currentRoles[insomniac.id];
          this.state.nightLogs[insomniac.id].push(`You woke up at the end of the night and saw your role is: ${finalRole.toUpperCase()}`);
        }
        return { success: true };
      }

      case 'start_voting': {
        this.state.phase = 'voting';
        return { success: true };
      }

      case 'cast_vote': {
        if (this.state.phase !== 'voting') {
          return { success: false, error: 'Voting is not open' };
        }
        const targetId = action.payload?.targetPlayerId;
        if (!targetId || targetId === playerId) {
          return { success: false, error: 'Choose a player to vote for (cannot vote for yourself)' };
        }

        this.state.votes[playerId] = targetId;

        // Check if all players have voted
        if (Object.keys(this.state.votes).length >= this.players.length) {
          this.evaluateVotes();
        }
        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  private evaluateVotes() {
    this.state.phase = 'ended';

    // Count votes
    const voteCounts: { [targetId: string]: number } = {};
    Object.values(this.state.votes).forEach(target => {
      voteCounts[target] = (voteCounts[target] || 0) + 1;
    });

    let maxVotes = 0;
    Object.values(voteCounts).forEach(c => {
      if (c > maxVotes) maxVotes = c;
    });

    // Players with max votes die (must have at least 2 votes to die)
    const killed: string[] = [];
    if (maxVotes >= 2) {
      Object.keys(voteCounts).forEach(pid => {
        if (voteCounts[pid] === maxVotes) {
          killed.push(pid);
        }
      });
    }

    this.state.killedPlayerIds = killed;

    // Determine winners
    const winners: string[] = [];
    let message = '';

    const killedTanner = killed.some(pid => this.state.currentRoles[pid] === 'tanner');
    const killedWerewolf = killed.some(pid => this.state.currentRoles[pid] === 'werewolf');
    const activeWerewolves = this.players.filter(p => this.state.currentRoles[p.id] === 'werewolf');

    if (killedTanner) {
      winners.push('tanner');
      message = 'The Tanner was executed and rejoices! Tanner wins!';
    }

    if (killedWerewolf) {
      winners.push('village');
      message += (message ? ' Also, the ' : 'The ') + 'Village executed a Werewolf and wins!';
    } else if (!killedTanner) {
      if (activeWerewolves.length > 0) {
        winners.push('werewolves');
        message = 'No Werewolves were killed! The Werewolves survive and win!';
      } else {
        // No wolves in game
        if (killed.length === 0) {
          winners.push('village');
          message = 'No Werewolves were among you, and nobody died! Peaceful Village victory!';
        } else {
          winners.push('werewolves');
          message = 'No Werewolves existed, but an innocent villager was slain!';
        }
      }
    }

    this.state.winners = winners;
    this.state.winMessage = message;
  }

  getSanitizedView(playerId: string): any {
    const isGameOver = this.state.phase === 'ended';

    return {
      phase: this.state.phase,
      dayTimerSeconds: this.state.dayTimerSeconds,
      myInitialRole: this.state.initialRoles[playerId],
      myLogs: this.state.nightLogs[playerId] || [],
      votes: this.state.phase === 'voting' ? Object.keys(this.state.votes) : this.state.votes,
      hasVoted: !!this.state.votes[playerId],
      killedPlayerIds: this.state.killedPlayerIds,
      winners: this.state.winners,
      winMessage: this.state.winMessage,
      // Only reveal all roles and center cards when the game is over
      allCurrentRoles: isGameOver ? this.state.currentRoles : undefined,
      allInitialRoles: isGameOver ? this.state.initialRoles : undefined,
      centerCards: isGameOver ? this.state.centerCards : undefined
    };
  }

  isGameOver(): boolean {
    return this.state.phase === 'ended';
  }

  getResults(): any {
    return {
      winners: this.state.winners,
      killed: this.state.killedPlayerIds,
      message: this.state.winMessage,
      roles: this.state.currentRoles
    };
  }
}

