import { GameEngine } from './base.js';
import { 
  Player, 
  TwoTruthsGameState, 
  TwoTruthsClientView, 
  TwoTruthsPhase,
  TwoTruthsRoundData 
} from '../../../shared/types.js';

export class TwoTruthsEngine implements GameEngine<TwoTruthsGameState> {
  private state!: TwoTruthsGameState;
  private playersMap: Map<string, Player> = new Map();

  init(players: Player[], config?: any): TwoTruthsGameState {
    this.playersMap.clear();
    players.forEach(p => this.playersMap.set(p.id, p));

    const playerIds = players.map(p => p.id);
    const submissions: { [id: string]: any } = {};
    const scores: { [id: string]: number } = {};
    const stats: { [id: string]: any } = {};

    playerIds.forEach(id => {
      submissions[id] = {
        playerId: id,
        statements: ['', '', ''],
        lieIndex: 0,
        submitted: false
      };
      scores[id] = 0;
      stats[id] = {
        correctGuesses: 0,
        incorrectGuesses: 0,
        fooledOthers: 0,
        fooledEveryoneRounds: 0
      };
    });

    // Shuffle author order
    const authorOrder = [...playerIds].sort(() => Math.random() - 0.5);

    this.state = {
      phase: 'submission',
      players: playerIds,
      authorOrder,
      currentAuthorIndex: 0,
      submissions,
      currentRound: null,
      votes: {},
      scores,
      stats,
      roundTimerSeconds: 90,
      roundStartedAt: Date.now(),
      anonymousMode: !!config?.anonymousMode,
      recentReactions: []
    };

    return this.state;
  }

  private startGuessingRound(authorIndex: number) {
    if (authorIndex >= this.state.authorOrder.length) {
      this.state.phase = 'results';
      this.state.currentRound = null;
      return;
    }

    this.state.currentAuthorIndex = authorIndex;
    const authorId = this.state.authorOrder[authorIndex];
    const sub = this.state.submissions[authorId];

    // If author didn't submit, skip to next author
    if (!sub || !sub.submitted) {
      this.startGuessingRound(authorIndex + 1);
      return;
    }

    // Shuffle statements order
    const indices = [0, 1, 2];
    indices.sort(() => Math.random() - 0.5);

    const shuffledStatements = indices.map(idx => sub.statements[idx]);
    const shuffledLieIndex = indices.indexOf(sub.lieIndex);

    const roundData: TwoTruthsRoundData = {
      authorId,
      shuffledStatements,
      originalIndices: indices,
      shuffledLieIndex
    };

    this.state.phase = 'guessing';
    this.state.currentRound = roundData;
    this.state.votes = {};
    this.state.roundResults = undefined;
    this.state.roundTimerSeconds = 30;
    this.state.roundStartedAt = Date.now();
  }

  private triggerReveal() {
    if (!this.state.currentRound) return;

    const round = this.state.currentRound;
    const authorId = round.authorId;
    const lieIndex = round.shuffledLieIndex;

    const correctVoters: string[] = [];
    const incorrectVoters: string[] = [];

    // Tally votes from non-author players
    const eligibleVoters = this.state.players.filter(id => id !== authorId);
    let authorPointsEarned = 0;

    for (const voterId of eligibleVoters) {
      const vote = this.state.votes[voterId];
      if (vote !== undefined) {
        if (vote === lieIndex) {
          // Correct guess: +100 points
          correctVoters.push(voterId);
          this.state.scores[voterId] = (this.state.scores[voterId] || 0) + 100;
          this.state.stats[voterId].correctGuesses += 1;
        } else {
          // Fooled: Author gets +50 points
          incorrectVoters.push(voterId);
          this.state.stats[voterId].incorrectGuesses += 1;
          authorPointsEarned += 50;
          this.state.stats[authorId].fooledOthers += 1;
        }
      }
    }

    // Bonus for fooling everyone (if at least one player voted and no one guessed correctly)
    const totalVotes = correctVoters.length + incorrectVoters.length;
    const fooledEveryone = totalVotes > 0 && correctVoters.length === 0;
    if (fooledEveryone) {
      authorPointsEarned += 100;
      this.state.stats[authorId].fooledEveryoneRounds += 1;
    }

    this.state.scores[authorId] = (this.state.scores[authorId] || 0) + authorPointsEarned;

    this.state.roundResults = {
      authorId,
      shuffledLieIndex: lieIndex,
      votes: { ...this.state.votes },
      correctVoters,
      incorrectVoters,
      authorPointsEarned,
      fooledEveryone
    };

    this.state.phase = 'reveal';
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (!action || !action.type) {
      return { success: false, error: 'Invalid action format' };
    }

    switch (action.type) {
      case 'submit_statements': {
        if (this.state.phase !== 'submission') {
          return { success: false, error: 'Submissions are currently closed' };
        }

        const statements: string[] = action.payload?.statements;
        const lieIndex: number = action.payload?.lieIndex;

        if (!Array.isArray(statements) || statements.length !== 3) {
          return { success: false, error: 'You must provide exactly 3 statements' };
        }

        const trimmed = statements.map(s => (s || '').trim());
        for (let i = 0; i < 3; i++) {
          if (!trimmed[i] || trimmed[i].length > 150) {
            return { success: false, error: `Statement ${i + 1} must be between 1 and 150 characters` };
          }
        }

        if (lieIndex < 0 || lieIndex > 2) {
          return { success: false, error: 'You must designate which statement is the lie' };
        }

        this.state.submissions[playerId] = {
          playerId,
          statements: trimmed,
          lieIndex,
          submitted: true
        };

        // Check if all players have submitted
        const allSubmitted = this.state.players.every(id => this.state.submissions[id]?.submitted);
        if (allSubmitted) {
          this.startGuessingRound(0);
        }

        return { success: true };
      }

      case 'vote_statement': {
        if (this.state.phase !== 'guessing') {
          return { success: false, error: 'Voting is not currently active' };
        }

        if (!this.state.currentRound) {
          return { success: false, error: 'No active round to vote on' };
        }

        if (playerId === this.state.currentRound.authorId) {
          return { success: false, error: 'You cannot vote on your own statements' };
        }

        const statementIndex = Number(action.payload?.statementIndex);
        if (statementIndex < 0 || statementIndex > 2) {
          return { success: false, error: 'Select statement 1, 2, or 3' };
        }

        this.state.votes[playerId] = statementIndex;

        // Check if all eligible players (everyone except author) have voted
        const eligibleVoters = this.state.players.filter(id => id !== this.state.currentRound!.authorId);
        const allVoted = eligibleVoters.every(id => this.state.votes[id] !== undefined);

        if (allVoted) {
          this.triggerReveal();
        }

        return { success: true };
      }

      case 'next_round': {
        if (this.state.phase !== 'reveal') {
          return { success: false, error: 'Can only advance to the next round from reveal phase' };
        }

        this.startGuessingRound(this.state.currentAuthorIndex + 1);
        return { success: true };
      }

      case 'react': {
        const emoji = (action.payload?.emoji || '').trim();
        const ALLOWED_EMOJIS = ['😂', '😱', '🔥', '🤔', '🎉', '👏', '👀', '🤥', '💯'];
        if (!ALLOWED_EMOJIS.includes(emoji)) {
          return { success: false, error: 'Invalid emoji reaction' };
        }

        const reaction = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          playerId,
          emoji,
          timestamp: Date.now()
        };

        this.state.recentReactions.push(reaction);
        if (this.state.recentReactions.length > 25) {
          this.state.recentReactions.shift();
        }

        return { success: true };
      }

      case 'time_expired': {
        if (this.state.phase === 'submission') {
          // If at least one player submitted, proceed
          const submittedCount = this.state.players.filter(id => this.state.submissions[id]?.submitted).length;
          if (submittedCount > 0) {
            this.startGuessingRound(0);
          } else {
            this.state.phase = 'results';
          }
          return { success: true };
        }

        if (this.state.phase === 'guessing') {
          this.triggerReveal();
          return { success: true };
        }

        return { success: true };
      }

      default:
        return { success: false, error: `Unknown action: ${action.type}` };
    }
  }

  getSanitizedView(playerId: string): TwoTruthsClientView {
    const isGameOver = this.state.phase === 'results';
    const isReveal = this.state.phase === 'reveal';
    const mySub = this.state.submissions[playerId];

    const currentAuthorId = this.state.currentRound?.authorId || null;
    const authorPlayer = currentAuthorId ? this.playersMap.get(currentAuthorId) : null;
    const isAuthor = currentAuthorId === playerId;

    const authorDisplayName = this.state.anonymousMode && this.state.phase === 'guessing'
      ? 'Secret Player'
      : (authorPlayer?.name || 'Mystery Author');

    const submittedPlayerIds = Object.keys(this.state.submissions).filter(
      id => this.state.submissions[id]?.submitted
    );

    const votedPlayerIds = Object.keys(this.state.votes);

    // Build leaderboard sorted by score descending
    const leaderboard = this.state.players.map(id => {
      const p = this.playersMap.get(id);
      return {
        playerId: id,
        name: p?.name || 'Player',
        score: this.state.scores[id] || 0,
        correctGuesses: this.state.stats[id]?.correctGuesses || 0,
        fooledOthers: this.state.stats[id]?.fooledOthers || 0
      };
    }).sort((a, b) => b.score - a.score);

    // Statements to display for guessing
    const displayStatements = this.state.currentRound?.shuffledStatements || [];

    // Round results with author name resolved
    let formattedRoundResults = undefined;
    if (this.state.roundResults) {
      formattedRoundResults = {
        ...this.state.roundResults,
        authorName: authorPlayer?.name || 'Author'
      };
    }

    return {
      phase: this.state.phase,
      mySubmission: mySub ? {
        statements: mySub.statements,
        lieIndex: mySub.lieIndex,
        submitted: mySub.submitted
      } : undefined,
      hasSubmitted: !!mySub?.submitted,
      submissionCount: submittedPlayerIds.length,
      totalPlayersCount: this.state.players.length,
      submittedPlayerIds,
      currentAuthorId,
      currentAuthorName: authorDisplayName,
      statements: displayStatements,
      // Only expose the actual lie index when in reveal or results! Never during guessing!
      shuffledLieIndex: (isReveal || isGameOver) ? this.state.currentRound?.shuffledLieIndex : undefined,
      myVote: this.state.votes[playerId] !== undefined ? this.state.votes[playerId] : null,
      votedPlayerIds,
      roundTimerSeconds: this.state.roundTimerSeconds,
      roundStartedAt: this.state.roundStartedAt,
      anonymousMode: this.state.anonymousMode,
      roundResults: formattedRoundResults,
      scores: this.state.scores,
      leaderboard,
      recentReactions: this.state.recentReactions,
      roundProgress: {
        current: this.state.currentAuthorIndex + 1,
        total: this.state.authorOrder.length
      },
      isAuthor
    };
  }

  isGameOver(): boolean {
    return this.state.phase === 'results';
  }

  getResults(): any {
    return {
      scores: this.state.scores,
      stats: this.state.stats
    };
  }
}

