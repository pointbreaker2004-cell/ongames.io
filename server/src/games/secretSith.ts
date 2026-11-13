import { GameEngine } from './base.js';
import { Player, SecretSithGameState, SithFaction, SithRole, SithPolicy } from '../../../shared/types.js';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class SecretSithEngine implements GameEngine<SecretSithGameState> {
  private state!: SecretSithGameState;
  private players: Player[] = [];

  init(players: Player[]): SecretSithGameState {
    this.players = players;
    const n = players.length;

    // Determine role counts:
    // 5 players: 3 Loyalists, 1 Separatist, 1 Palpatine
    // 6 players: 4 Loyalists, 1 Separatist, 1 Palpatine
    // 7 players: 4 Loyalists, 2 Separatists, 1 Palpatine
    // 8 players: 5 Loyalists, 2 Separatists, 1 Palpatine
    // 9 players: 5 Loyalists, 3 Separatists, 1 Palpatine
    // 10 players: 6 Loyalists, 3 Separatists, 1 Palpatine
    let separatistCount = 1;
    if (n >= 7 && n <= 8) separatistCount = 2;
    if (n >= 9) separatistCount = 3;
    const loyalistCount = n - separatistCount - 1;

    const rolesPool: SithRole[] = [
      ...Array(loyalistCount).fill('Loyalist'),
      ...Array(separatistCount).fill('Separatist'),
      'Palpatine'
    ];
    const shuffledRoles = shuffle(rolesPool);

    const playerRoles: { [playerId: string]: SithRole } = {};
    players.forEach((p, idx) => {
      playerRoles[p.id] = shuffledRoles[idx];
    });

    // 17 policy cards: 6 Loyalist, 11 Separatist
    const policyDeck: SithPolicy[] = shuffle([
      ...Array(6).fill('Loyalist'),
      ...Array(11).fill('Separatist')
    ]);

    this.state = {
      playerRoles,
      presidentIndex: 0,
      presidentCandidateId: players[0].id,
      chancellorCandidateId: null,
      previousPresidentId: null,
      previousChancellorId: null,
      phase: 'nomination',
      votes: {},
      electionTracker: 0,
      loyalistPolicies: 0,
      separatistPolicies: 0,
      policyDeck,
      policyDiscard: [],
      drawnPolicies: [],
      executiveAction: null,
      investigatedPlayers: {},
      executedPlayers: [],
      winner: null
    };

    return this.state;
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (this.state.winner) {
      return { success: false, error: 'Game is already over' };
    }

    if (this.state.executedPlayers.includes(playerId)) {
      return { success: false, error: 'Dead players cannot take actions' };
    }

    switch (action.type) {
      case 'nominate_chancellor': {
        if (playerId !== this.state.presidentCandidateId) {
          return { success: false, error: 'Only the President candidate can nominate a Chancellor' };
        }
        if (this.state.phase !== 'nomination') {
          return { success: false, error: 'Not in nomination phase' };
        }

        const nomineeId = action.payload?.chancellorId;
        if (!nomineeId || nomineeId === playerId) {
          return { success: false, error: 'You cannot nominate yourself' };
        }
        if (this.state.executedPlayers.includes(nomineeId)) {
          return { success: false, error: 'Cannot nominate an executed player' };
        }
        // Term limits: Cannot nominate previous Chancellor (or previous President if > 5 players)
        if (nomineeId === this.state.previousChancellorId) {
          return { success: false, error: 'Term limited: Player was the previous Chancellor' };
        }
        const aliveCount = this.players.length - this.state.executedPlayers.length;
        if (aliveCount > 5 && nomineeId === this.state.previousPresidentId) {
          return { success: false, error: 'Term limited: Player was the previous President' };
        }

        this.state.chancellorCandidateId = nomineeId;
        this.state.phase = 'election';
        this.state.votes = {};
        return { success: true };
      }

      case 'cast_vote': {
        if (this.state.phase !== 'election') {
          return { success: false, error: 'Election is not open' };
        }
        const vote = !!action.payload?.vote; // true = Ja, false = Nein
        this.state.votes[playerId] = vote;

        const alivePlayers = this.players.filter(p => !this.state.executedPlayers.includes(p.id));
        if (Object.keys(this.state.votes).length >= alivePlayers.length) {
          this.tallyElection();
        }
        return { success: true };
      }

      case 'president_discard': {
        if (playerId !== this.state.presidentCandidateId) {
          return { success: false, error: 'Only the President can discard' };
        }
        if (this.state.phase !== 'legislative_president') {
          return { success: false, error: 'Not in President legislative phase' };
        }

        const discardIndex = action.payload?.index as number;
        if (discardIndex === undefined || discardIndex < 0 || discardIndex >= this.state.drawnPolicies.length) {
          return { success: false, error: 'Invalid policy selection' };
        }

        const discarded = this.state.drawnPolicies.splice(discardIndex, 1)[0];
        this.state.policyDiscard.push(discarded);
        this.state.phase = 'legislative_chancellor';
        return { success: true };
      }

      case 'chancellor_enact': {
        if (playerId !== this.state.chancellorCandidateId) {
          return { success: false, error: 'Only the Chancellor can enact' };
        }
        if (this.state.phase !== 'legislative_chancellor') {
          return { success: false, error: 'Not in Chancellor legislative phase' };
        }

        const enactIndex = action.payload?.index as number;
        if (enactIndex === undefined || enactIndex < 0 || enactIndex >= this.state.drawnPolicies.length) {
          return { success: false, error: 'Invalid policy selection' };
        }

        const enacted = this.state.drawnPolicies.splice(enactIndex, 1)[0];
        const discarded = this.state.drawnPolicies.pop()!;
        this.state.policyDiscard.push(discarded);

        this.enactPolicy(enacted);
        return { success: true };
      }

      case 'execute_player': {
        if (playerId !== this.state.presidentCandidateId) {
          return { success: false, error: 'Only the President can execute' };
        }
        if (this.state.executiveAction !== 'execution') {
          return { success: false, error: 'Executive action is not execution' };
        }

        const targetId = action.payload?.targetPlayerId;
        if (!targetId || targetId === playerId || this.state.executedPlayers.includes(targetId)) {
          return { success: false, error: 'Select an active player to execute' };
        }

        this.state.executedPlayers.push(targetId);

        // Check if executed player is Palpatine
        if (this.state.playerRoles[targetId] === 'Palpatine') {
          this.state.winner = 'Loyalist';
          this.state.winReason = 'Emperor Palpatine was executed by the Senate! Loyalists win!';
          return { success: true };
        }

        this.state.executiveAction = null;
        this.advancePresident();
        return { success: true };
      }

      case 'investigate_player': {
        if (playerId !== this.state.presidentCandidateId) {
          return { success: false, error: 'Only the President can investigate' };
        }
        const targetId = action.payload?.targetPlayerId;
        if (!targetId || targetId === playerId) {
          return { success: false, error: 'Select a valid player to investigate' };
        }

        const targetRole = this.state.playerRoles[targetId];
        const faction: SithFaction = targetRole === 'Loyalist' ? 'Loyalist' : 'Separatist';
        this.state.investigatedPlayers[targetId] = faction;
        this.state.executiveAction = null;
        this.advancePresident();
        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  private tallyElection() {
    const alivePlayers = this.players.filter(p => !this.state.executedPlayers.includes(p.id));
    const jaCount = Object.values(this.state.votes).filter(v => v === true).length;
    const passed = jaCount > alivePlayers.length / 2;

    if (passed) {
      // Check Palpatine victory condition: Palpatine elected Chancellor after 3 Separatist policies
      if (this.state.separatistPolicies >= 3 && this.state.playerRoles[this.state.chancellorCandidateId!] === 'Palpatine') {
        this.state.winner = 'Separatist';
        this.state.winReason = 'Palpatine was elected Supreme Chancellor after 3 Separatist policies! Separatists win!';
        this.state.phase = 'game_over';
        return;
      }

      // Election succeeded: Reset tracker & start legislative session
      this.state.electionTracker = 0;
      this.drawThreePolicies();
      this.state.phase = 'legislative_president';
    } else {
      // Election failed
      this.state.electionTracker++;
      if (this.state.electionTracker >= 3) {
        // Enact top policy immediately due to chaos
        this.state.electionTracker = 0;
        const topPolicy = this.drawOnePolicy();
        this.state.previousPresidentId = null;
        this.state.previousChancellorId = null;
        this.enactPolicy(topPolicy, true); // true = forced chaos enact (no presidential power)
      } else {
        this.advancePresident();
      }
    }
  }

  private drawThreePolicies() {
    this.ensureDeckHas(3);
    this.state.drawnPolicies = [
      this.state.policyDeck.pop()!,
      this.state.policyDeck.pop()!,
      this.state.policyDeck.pop()!
    ];
  }

  private drawOnePolicy(): SithPolicy {
    this.ensureDeckHas(1);
    return this.state.policyDeck.pop()!;
  }

  private ensureDeckHas(n: number) {
    if (this.state.policyDeck.length < n) {
      const reshuffled = shuffle([...this.state.policyDeck, ...this.state.policyDiscard]);
      this.state.policyDeck = reshuffled;
      this.state.policyDiscard = [];
    }
  }

  private enactPolicy(policy: SithPolicy, isChaos: boolean = false) {
    if (policy === 'Loyalist') {
      this.state.loyalistPolicies++;
      if (this.state.loyalistPolicies >= 5) {
        this.state.winner = 'Loyalist';
        this.state.winReason = '5 Loyalist policies enacted! The Republic is saved!';
        this.state.phase = 'game_over';
        return;
      }
    } else {
      this.state.separatistPolicies++;
      if (this.state.separatistPolicies >= 6) {
        this.state.winner = 'Separatist';
        this.state.winReason = '6 Separatist policies enacted! The Empire is forged!';
        this.state.phase = 'game_over';
        return;
      }

      // Trigger executive powers if not chaos
      if (!isChaos) {
        if (this.state.separatistPolicies === 2) {
          this.state.executiveAction = 'investigate';
          this.state.phase = 'executive_action';
          return;
        } else if (this.state.separatistPolicies >= 4) {
          this.state.executiveAction = 'execution';
          this.state.phase = 'executive_action';
          return;
        }
      }
    }

    // Normal round end
    this.state.previousPresidentId = this.state.presidentCandidateId;
    this.state.previousChancellorId = this.state.chancellorCandidateId;
    this.advancePresident();
  }

  private advancePresident() {
    let nextIdx = (this.state.presidentIndex + 1) % this.players.length;
    while (this.state.executedPlayers.includes(this.players[nextIdx].id)) {
      nextIdx = (nextIdx + 1) % this.players.length;
    }
    this.state.presidentIndex = nextIdx;
    this.state.presidentCandidateId = this.players[nextIdx].id;
    this.state.chancellorCandidateId = null;
    this.state.phase = 'nomination';
    this.state.votes = {};
    this.state.executiveAction = null;
  }

  getSanitizedView(playerId: string): any {
    const isGameOver = !!this.state.winner;
    const myRole = this.state.playerRoles[playerId];
    const n = this.players.length;

    // Determine what Separatist info to reveal
    const knownSeparatists: string[] = [];
    let knownPalpatine: string | null = null;

    if (myRole === 'Separatist') {
      this.players.forEach(p => {
        if (this.state.playerRoles[p.id] === 'Separatist') knownSeparatists.push(p.id);
        if (this.state.playerRoles[p.id] === 'Palpatine') knownPalpatine = p.id;
      });
    } else if (myRole === 'Palpatine' && n <= 6) {
      // In 5-6 players, Palpatine knows the other Separatist
      this.players.forEach(p => {
        if (this.state.playerRoles[p.id] === 'Separatist') knownSeparatists.push(p.id);
      });
    }

    return {
      phase: this.state.phase,
      myRole,
      knownSeparatists: isGameOver ? undefined : knownSeparatists,
      knownPalpatine: isGameOver ? undefined : knownPalpatine,
      presidentCandidateId: this.state.presidentCandidateId,
      chancellorCandidateId: this.state.chancellorCandidateId,
      previousPresidentId: this.state.previousPresidentId,
      previousChancellorId: this.state.previousChancellorId,
      loyalistPolicies: this.state.loyalistPolicies,
      separatistPolicies: this.state.separatistPolicies,
      electionTracker: this.state.electionTracker,
      votes: this.state.phase === 'election' ? Object.keys(this.state.votes) : this.state.votes,
      drawnPolicies: (
        (this.state.phase === 'legislative_president' && playerId === this.state.presidentCandidateId) ||
        (this.state.phase === 'legislative_chancellor' && playerId === this.state.chancellorCandidateId)
      ) ? this.state.drawnPolicies : [],
      executiveAction: this.state.executiveAction,
      investigatedPlayers: playerId === this.state.presidentCandidateId ? this.state.investigatedPlayers : {},
      executedPlayers: this.state.executedPlayers,
      winner: this.state.winner,
      winReason: this.state.winReason,
      // Full reveal at game over
      allRoles: isGameOver ? this.state.playerRoles : undefined
    };
  }

  isGameOver(): boolean {
    return !!this.state.winner;
  }

  getResults(): any {
    return {
      winner: this.state.winner,
      reason: this.state.winReason,
      roles: this.state.playerRoles
    };
  }
}

