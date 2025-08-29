// Advanced Bracket System for Tournament Management
// Supports Single Elimination, Double Elimination, and Swiss System

export interface BracketMatch {
  player1_id: number | null;
  player2_id: number | null;
  round: number;
  match_number: number;
  bracket_type: 'winners' | 'losers' | 'final';
  winner_advances_to?: number; // Next match number
  loser_advances_to?: number; // For double elimination
}

export interface TournamentBracket {
  matches: BracketMatch[];
  total_rounds: number;
  bracket_type: 'single_elimination' | 'double_elimination' | 'swiss';
  seeding_method: 'random' | 'ranked' | 'manual';
}

export interface PlayerSeed {
  player_id: number;
  seed: number;
  username?: string;
  rating?: number;
}

// Single Elimination Bracket Generator
export function generateSingleEliminationBracket(
  participants: number[],
  seeding: PlayerSeed[] = []
): TournamentBracket {
  const matches: BracketMatch[] = [];
  const totalParticipants = participants.length;
  
  // Calculate total rounds needed
  const totalRounds = Math.ceil(Math.log2(totalParticipants));
  const idealParticipants = Math.pow(2, totalRounds);
  
  // Apply seeding if provided
  let seededParticipants = [...participants];
  if (seeding.length > 0) {
    seededParticipants = applySeeding(participants, seeding);
  } else {
    // Random seeding
    seededParticipants = shuffleArray(participants);
  }
  
  // Add byes if needed
  while (seededParticipants.length < idealParticipants) {
    seededParticipants.push(-1); // -1 represents a bye
  }
  
  // Generate first round matches
  for (let i = 0; i < seededParticipants.length; i += 2) {
    const matchNumber = Math.floor(i / 2) + 1;
    matches.push({
      player1_id: seededParticipants[i],
      player2_id: seededParticipants[i + 1],
      round: 1,
      match_number: matchNumber,
      bracket_type: 'winners',
      winner_advances_to: Math.ceil(matchNumber / 2)
    });
  }
  
  // Generate subsequent rounds
  let currentRound = 1;
  let matchesInCurrentRound = matches.length;
  
  while (currentRound < totalRounds) {
    currentRound++;
    const matchesInNextRound = Math.ceil(matchesInCurrentRound / 2);
    
    for (let i = 0; i < matchesInNextRound; i++) {
      const matchNumber = matches.length + 1;
      matches.push({
        player1_id: null, // Will be filled when previous matches complete
        player2_id: null,
        round: currentRound,
        match_number: matchNumber,
        bracket_type: 'winners',
        winner_advances_to: currentRound < totalRounds ? Math.ceil(matchNumber / 2) : undefined
      });
    }
    
    matchesInCurrentRound = matchesInNextRound;
  }
  
  return {
    matches,
    total_rounds: totalRounds,
    bracket_type: 'single_elimination',
    seeding_method: seeding.length > 0 ? 'ranked' : 'random'
  };
}

// Double Elimination Bracket Generator
export function generateDoubleEliminationBracket(
  participants: number[],
  seeding: PlayerSeed[] = []
): TournamentBracket {
  const matches: BracketMatch[] = [];
  const totalParticipants = participants.length;
  
  // Calculate rounds needed
  const totalRounds = Math.ceil(Math.log2(totalParticipants)) * 2 - 1;
  const idealParticipants = Math.pow(2, Math.ceil(Math.log2(totalParticipants)));
  
  // Apply seeding
  let seededParticipants = [...participants];
  if (seeding.length > 0) {
    seededParticipants = applySeeding(participants, seeding);
  } else {
    seededParticipants = shuffleArray(participants);
  }
  
  // Add byes if needed
  while (seededParticipants.length < idealParticipants) {
    seededParticipants.push(-1);
  }
  
  // Generate winners bracket (same as single elimination)
  const winnersBracket = generateSingleEliminationBracket(seededParticipants, seeding);
  
  // Add winners bracket matches
  matches.push(...winnersBracket.matches.map(match => ({
    ...match,
    bracket_type: 'winners' as const
  })));
  
  // Generate losers bracket
  const losersBracketMatches = generateLosersBracket(seededParticipants.length, winnersBracket.matches.length);
  matches.push(...losersBracketMatches);
  
  // Generate final matches
  const finalMatches = generateFinalMatches(winnersBracket.matches.length, losersBracketMatches.length);
  matches.push(...finalMatches);
  
  return {
    matches,
    total_rounds: totalRounds,
    bracket_type: 'double_elimination',
    seeding_method: seeding.length > 0 ? 'ranked' : 'random'
  };
}

// Swiss System Bracket Generator
export function generateSwissBracket(
  participants: number[],
  rounds: number = 5
): TournamentBracket {
  const matches: BracketMatch[] = [];
  const totalParticipants = participants.length;
  
  // Swiss system needs even number of participants
  let adjustedParticipants = [...participants];
  if (totalParticipants % 2 !== 0) {
    adjustedParticipants.push(-1); // Add bye
  }
  
  // Generate first round (random pairing)
  const shuffledParticipants = shuffleArray(adjustedParticipants);
  
  for (let i = 0; i < shuffledParticipants.length; i += 2) {
    matches.push({
      player1_id: shuffledParticipants[i],
      player2_id: shuffledParticipants[i + 1],
      round: 1,
      match_number: Math.floor(i / 2) + 1,
      bracket_type: 'winners'
    });
  }
  
  // Generate placeholder matches for subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    for (let i = 0; i < adjustedParticipants.length; i += 2) {
      matches.push({
        player1_id: null,
        player2_id: null,
        round,
        match_number: matches.length + 1,
        bracket_type: 'winners'
      });
    }
  }
  
  return {
    matches,
    total_rounds: rounds,
    bracket_type: 'swiss',
    seeding_method: 'random'
  };
}

// Helper function to generate losers bracket
function generateLosersBracket(totalParticipants: number, winnersMatches: number): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const losersRounds = Math.ceil(Math.log2(totalParticipants)) - 1;
  
  // First round of losers bracket (losers from first round of winners bracket)
  const firstLosersMatches = Math.ceil(totalParticipants / 4);
  
  for (let i = 0; i < firstLosersMatches; i++) {
    matches.push({
      player1_id: null,
      player2_id: null,
      round: 1,
      match_number: winnersMatches + i + 1,
      bracket_type: 'losers',
      winner_advances_to: winnersMatches + Math.ceil((i + 1) / 2)
    });
  }
  
  // Subsequent losers bracket rounds
  let currentRound = 1;
  let matchesInCurrentRound = firstLosersMatches;
  
  while (currentRound < losersRounds) {
    currentRound++;
    const matchesInNextRound = Math.ceil(matchesInCurrentRound / 2);
    
    for (let i = 0; i < matchesInNextRound; i++) {
      const matchNumber = winnersMatches + matches.length + 1;
      matches.push({
        player1_id: null,
        player2_id: null,
        round: currentRound,
        match_number: matchNumber,
        bracket_type: 'losers',
        winner_advances_to: currentRound < losersRounds ? 
          winnersMatches + matches.length + Math.ceil((i + 1) / 2) : undefined
      });
    }
    
    matchesInCurrentRound = matchesInNextRound;
  }
  
  return matches;
}

// Helper function to generate final matches
function generateFinalMatches(winnersMatches: number, losersMatches: number): BracketMatch[] {
  const matches: BracketMatch[] = [];
  
  // Winners bracket final
  matches.push({
    player1_id: null,
    player2_id: null,
    round: 1,
    match_number: winnersMatches + losersMatches + 1,
    bracket_type: 'final'
  });
  
  // Losers bracket final
  matches.push({
    player1_id: null,
    player2_id: null,
    round: 1,
    match_number: winnersMatches + losersMatches + 2,
    bracket_type: 'final'
  });
  
  // Grand final (if needed)
  matches.push({
    player1_id: null,
    player2_id: null,
    round: 1,
    match_number: winnersMatches + losersMatches + 3,
    bracket_type: 'final'
  });
  
  return matches;
}

// Helper function to apply seeding
function applySeeding(participants: number[], seeding: PlayerSeed[]): number[] {
  const seedMap = new Map(seeding.map(s => [s.player_id, s.seed]));
  
  // Sort participants by seed
  const sortedParticipants = [...participants].sort((a, b) => {
    const seedA = seedMap.get(a) || 999;
    const seedB = seedMap.get(b) || 999;
    return seedA - seedB;
  });
  
  return sortedParticipants;
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Function to get next match for a winner
export function getNextMatch(currentMatchNumber: number, totalMatchesInRound: number): number | null {
  const nextMatchNumber = Math.ceil(currentMatchNumber / 2);
  return nextMatchNumber <= totalMatchesInRound ? nextMatchNumber : null;
}

// Function to validate bracket integrity
export function validateBracket(bracket: TournamentBracket): boolean {
  // Check if all matches have valid round numbers
  const rounds = bracket.matches.map(m => m.round);
  const maxRound = Math.max(...rounds);
  const minRound = Math.min(...rounds);
  
  if (minRound !== 1 || maxRound > bracket.total_rounds) {
    return false;
  }
  
  // Check if match numbers are sequential
  const matchNumbers = bracket.matches.map(m => m.match_number).sort((a, b) => a - b);
  for (let i = 0; i < matchNumbers.length; i++) {
    if (matchNumbers[i] !== i + 1) {
      return false;
    }
  }
  
  return true;
}
