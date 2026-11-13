import { GameEngine } from './base.js';
import { Player, SpyfallGameState, SpyfallPlayerRole } from '../../../shared/types.js';

interface LocationData {
  name: string;
  category: string;
  roles: string[];
}

const LOCATIONS: LocationData[] = [
  {
    name: 'Airplane',
    category: 'Transportation',
    roles: ['First Class Passenger', 'Flight Attendant', 'Pilot', 'Co-Pilot', 'Air Marshal', 'Economy Passenger', 'Mechanic', 'Baggage Handler']
  },
  {
    name: 'Bank',
    category: 'Commercial',
    roles: ['Armored Car Driver', 'Bank Manager', 'Teller', 'Security Guard', 'Robber', 'Customer', 'Loan Officer', 'Janitor']
  },
  {
    name: 'Beach',
    category: 'Recreation',
    roles: ['Lifeguard', 'Surfer', 'Kite Flyer', 'Ice Cream Vendor', 'Sunbather', 'Photographer', 'Beachcomber', 'Volleyball Player']
  },
  {
    name: 'Broadway Theater',
    category: 'Entertainment',
    roles: ['Lead Actor', 'Director', 'Costume Designer', 'Stagehand', 'Ticket Usher', 'Audience Member', 'Prompter', 'Lighting Tech']
  },
  {
    name: 'Casino',
    category: 'Commercial',
    roles: ['Bartender', 'Security Officer', 'Bouncer', 'Pit Boss', 'Hustler', 'Dealer', 'Gambler', 'High Roller']
  },
  {
    name: 'Circus Tent',
    category: 'Entertainment',
    roles: ['Acrobat', 'Animal Trainer', 'Clown', 'Juggler', 'Ringmaster', 'Fire Breather', 'Spectator', 'Cotton Candy Vendor']
  },
  {
    name: 'Cruise Ship',
    category: 'Transportation',
    roles: ['Cook', 'Captain', 'Bartender', 'Musician', 'Waiter', 'Rich Tourist', 'Housekeeper', 'Lifeboat Specialist']
  },
  {
    name: 'Hospital',
    category: 'Public Services',
    roles: ['Surgeon', 'Anesthesiologist', 'Nurse', 'Patient', 'Intern', 'Pathologist', 'Orderly', 'Paramedic']
  },
  {
    name: 'Hotel',
    category: 'Hospitality',
    roles: ['Doorman', 'Housekeeper', 'Hotel Manager', 'Bartender', 'Bellhop', 'Chef', 'Guest', 'Concierge']
  },
  {
    name: 'Military Base',
    category: 'Military',
    roles: ['Officer', 'Medic', 'Sniper', 'Colonel', 'Tank Driver', 'Private', 'Deserter', 'Drill Sergeant']
  },
  {
    name: 'Movie Studio',
    category: 'Entertainment',
    roles: ['Stuntman', 'Sound Engineer', 'Cameraman', 'Director', 'Costume Artist', 'Actor', 'Producer', 'Boom Operator']
  },
  {
    name: 'Ocean Liner',
    category: 'Transportation',
    roles: ['Deckhand', 'Steward', 'Navigator', 'Passenger', 'Chef', 'Captain', 'Radio Operator', 'Engineer']
  },
  {
    name: 'Passenger Train',
    category: 'Transportation',
    roles: ['Mechanic', 'Conductor', 'Ticket Inspector', 'Passenger', 'Restaurant Chef', 'Engine Driver', 'Baggage Porter', 'Hobo']
  },
  {
    name: 'Pirate Ship',
    category: 'Historical',
    roles: ['Cook', 'Sailor', 'Slave', 'Cannoneer', 'Bound Prisoner', 'Cabin Boy', 'First Mate', 'Captain']
  },
  {
    name: 'Polar Station',
    category: 'Science',
    roles: ['Meteorologist', 'Biologist', 'Geologist', 'Radio Operator', 'Chef', 'Expedition Leader', 'Medic', 'Husky Trainer']
  },
  {
    name: 'Police Station',
    category: 'Public Services',
    roles: ['Detective', 'Lawyer', 'Journalist', 'Criminalist', 'Patrol Officer', 'Desk Sergeant', 'Suspect', 'Archivist']
  },
  {
    name: 'Restaurant',
    category: 'Hospitality',
    roles: ['Musician', 'Customer', 'Bouncer', 'Hostess', 'Head Chef', 'Food Critic', 'Waiter', 'Dishwasher']
  },
  {
    name: 'School',
    category: 'Education',
    roles: ['Gym Teacher', 'Principal', 'Security Guard', 'Custodian', 'Student', 'Math Teacher', 'Cafeteria Cook', 'Librarian']
  },
  {
    name: 'Service Station',
    category: 'Commercial',
    roles: ['Car Wash Attendant', 'Shop Cashier', 'Customer', 'Mechanic', 'Tow Truck Driver', 'Manager', 'Tire Specialist', 'Oil Changer']
  },
  {
    name: 'Space Station',
    category: 'Science',
    roles: ['Astronaut', 'Commander', 'Scientist', 'Doctor', 'Space Tourist', 'Alien Researcher', 'Payload Specialist', 'Robotics Engineer']
  },
  {
    name: 'Submarine',
    category: 'Military',
    roles: ['Cook', 'Commander', 'Sonar Technician', 'Navigator', 'Sailor', 'Radio Operator', 'Torpedo Specialist', 'Engineer']
  },
  {
    name: 'Supermarket',
    category: 'Commercial',
    roles: ['Cashier', 'Customer', 'Butcher', 'Janitor', 'Security Guard', 'Produce Stocker', 'Store Manager', 'Mystery Shopper']
  },
  {
    name: 'University',
    category: 'Education',
    roles: ['Professor', 'Dean', 'Undergraduate', 'Postgrad Researcher', 'Security Officer', 'Fraternity Bro', 'Librarian', 'Campus Tour Guide']
  },
  {
    name: 'Amusement Park',
    category: 'Entertainment',
    roles: ['Ride Operator', 'Mascot', 'Cotton Candy Seller', 'Tourist', 'Security Guard', 'Roller Coaster Mechanic', 'Ticket Seller', 'Prize Vendor']
  }
];

export class SpyfallEngine implements GameEngine<SpyfallGameState> {
  private state!: SpyfallGameState;

  init(players: Player[], config?: any): SpyfallGameState {
    const selectedLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const spyIndex = Math.floor(Math.random() * players.length);
    const spyPlayer = players[spyIndex];

    const availableRoles = [...selectedLocation.roles];
    // Shuffle available roles
    for (let i = availableRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
    }

    const playerRoles: { [playerId: string]: SpyfallPlayerRole } = {};
    let roleIdx = 0;

    players.forEach((p, idx) => {
      if (idx === spyIndex) {
        playerRoles[p.id] = {
          playerId: p.id,
          isSpy: true,
          role: 'Spy'
        };
      } else {
        const role = availableRoles[roleIdx % availableRoles.length];
        roleIdx++;
        playerRoles[p.id] = {
          playerId: p.id,
          isSpy: false,
          role
        };
      }
    });

    const duration = config?.roundDurationSeconds || 480; // default 8 minutes

    this.state = {
      location: selectedLocation.name,
      category: selectedLocation.category,
      locationsList: LOCATIONS.map(l => l.name),
      playerRoles,
      timerSeconds: duration,
      startedAt: Date.now(),
      roundDurationSeconds: duration,
      accusedPlayerId: null,
      accusedByPlayerId: null,
      votes: {},
      winner: null
    };

    return this.state;
  }

  handleAction(playerId: string, action: any): { success: boolean; error?: string } {
    if (this.state.winner) {
      return { success: false, error: 'Game is already over' };
    }

    switch (action.type) {
      case 'accuse_player': {
        const targetId = action.payload?.targetPlayerId;
        if (!targetId || targetId === playerId) {
          return { success: false, error: 'Select a valid player to accuse' };
        }
        if (this.state.accusedPlayerId) {
          return { success: false, error: 'An accusation is already pending vote' };
        }

        this.state.accusedPlayerId = targetId;
        this.state.accusedByPlayerId = playerId;
        this.state.votes = { [playerId]: true }; // Accuser votes yes automatically
        return { success: true };
      }

      case 'vote_accusation': {
        if (!this.state.accusedPlayerId) {
          return { success: false, error: 'No accusation to vote on' };
        }
        const vote = !!action.payload?.vote;
        this.state.votes[playerId] = vote;

        // Check if all players (except the accused) have voted
        const voterCount = Object.keys(this.state.playerRoles).length - 1;
        const currentVoteCount = Object.keys(this.state.votes).length;

        if (currentVoteCount >= voterCount) {
          const yesVotes = Object.values(this.state.votes).filter(v => v === true).length;
          // Unanimous yes is required in standard Spyfall
          if (yesVotes === voterCount) {
            const isTargetSpy = this.state.playerRoles[this.state.accusedPlayerId]?.isSpy;
            if (isTargetSpy) {
              this.state.winner = 'players';
              this.state.winReason = 'The players successfully unmasked the Spy!';
            } else {
              this.state.winner = 'spy';
              this.state.winReason = 'An innocent person was wrongfully convicted! The Spy wins!';
            }
          } else {
            // Vote failed, clear accusation
            this.state.accusedPlayerId = null;
            this.state.accusedByPlayerId = null;
            this.state.votes = {};
          }
        }
        return { success: true };
      }

      case 'cancel_accusation': {
        if (this.state.accusedByPlayerId === playerId) {
          this.state.accusedPlayerId = null;
          this.state.accusedByPlayerId = null;
          this.state.votes = {};
          return { success: true };
        }
        return { success: false, error: 'Only the accuser can withdraw the accusation' };
      }

      case 'spy_guess_location': {
        const isSpy = this.state.playerRoles[playerId]?.isSpy;
        if (!isSpy) {
          return { success: false, error: 'Only the Spy can attempt a location guess' };
        }

        const guessedLocation = (action.payload?.location || '').trim();
        if (guessedLocation.toLowerCase() === this.state.location.toLowerCase()) {
          this.state.winner = 'spy';
          this.state.winReason = `The Spy revealed themselves and correctly guessed the location: ${this.state.location}!`;
        } else {
          this.state.winner = 'players';
          this.state.winReason = `The Spy guessed wrong (${guessedLocation})! The location was ${this.state.location}.`;
        }
        return { success: true };
      }

      case 'time_expired': {
        this.state.winner = 'spy';
        this.state.winReason = 'Time ran out before the players could identify the Spy! The Spy wins!';
        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  getSanitizedView(playerId: string): any {
    const isGameOver = !!this.state.winner;
    const roleInfo = this.state.playerRoles[playerId];

    // If you are the spy, location is hidden unless game is over
    const displayLocation = (roleInfo?.isSpy && !isGameOver) ? '??? (You are the Spy!)' : this.state.location;
    const myRole = roleInfo?.role || 'Unknown';

    return {
      location: displayLocation,
      category: (roleInfo?.isSpy && !isGameOver) ? 'Unknown' : this.state.category,
      locationsList: this.state.locationsList,
      myRole,
      isSpy: roleInfo?.isSpy || false,
      timerSeconds: this.state.timerSeconds,
      startedAt: this.state.startedAt,
      roundDurationSeconds: this.state.roundDurationSeconds,
      accusedPlayerId: this.state.accusedPlayerId,
      accusedByPlayerId: this.state.accusedByPlayerId,
      votes: this.state.votes,
      winner: this.state.winner,
      winReason: this.state.winReason,
      // If game is over, reveal all roles
      playerRoles: isGameOver ? this.state.playerRoles : undefined
    };
  }

  isGameOver(): boolean {
    return !!this.state.winner;
  }

  getResults(): any {
    return {
      winner: this.state.winner,
      reason: this.state.winReason,
      location: this.state.location,
      playerRoles: this.state.playerRoles
    };
  }
}

