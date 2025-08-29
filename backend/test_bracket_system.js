// Test script for Advanced Bracket System
import { 
  generateSingleEliminationBracket, 
  generateDoubleEliminationBracket, 
  generateSwissBracket,
  validateBracket 
} from './src/utils/bracketSystem.js';

console.log('🏆 Testing Tournament Bracket System\n');

// Test data
const participants = [1, 2, 3, 4, 5, 6, 7, 8];
const seededParticipants = [
  { player_id: 1, seed: 1, username: 'Player1', rating: 1500 },
  { player_id: 2, seed: 2, username: 'Player2', rating: 1400 },
  { player_id: 3, seed: 3, username: 'Player3', rating: 1300 },
  { player_id: 4, seed: 4, username: 'Player4', rating: 1200 },
  { player_id: 5, seed: 5, username: 'Player5', rating: 1100 },
  { player_id: 6, seed: 6, username: 'Player6', rating: 1000 },
  { player_id: 7, seed: 7, username: 'Player7', rating: 900 },
  { player_id: 8, seed: 8, username: 'Player8', rating: 800 }
];

// Test Single Elimination
console.log('📋 Testing Single Elimination Bracket:');
try {
  const singleBracket = generateSingleEliminationBracket(participants, seededParticipants);
  console.log(`✅ Generated ${singleBracket.matches.length} matches`);
  console.log(`✅ Total rounds: ${singleBracket.total_rounds}`);
  console.log(`✅ Bracket type: ${singleBracket.bracket_type}`);
  console.log(`✅ Seeding method: ${singleBracket.seeding_method}`);
  console.log(`✅ Valid bracket: ${validateBracket(singleBracket)}`);
  
  // Show first round matches
  const firstRound = singleBracket.matches.filter(m => m.round === 1);
  console.log('\nFirst Round Matches:');
  firstRound.forEach(match => {
    console.log(`  Match ${match.match_number}: Player${match.player1_id} vs Player${match.player2_id}`);
  });
} catch (error) {
  console.error('❌ Single Elimination test failed:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test Double Elimination
console.log('📋 Testing Double Elimination Bracket:');
try {
  const doubleBracket = generateDoubleEliminationBracket(participants, seededParticipants);
  console.log(`✅ Generated ${doubleBracket.matches.length} matches`);
  console.log(`✅ Total rounds: ${doubleBracket.total_rounds}`);
  console.log(`✅ Bracket type: ${doubleBracket.bracket_type}`);
  console.log(`✅ Seeding method: ${doubleBracket.seeding_method}`);
  console.log(`✅ Valid bracket: ${validateBracket(doubleBracket)}`);
  
  // Show bracket types
  const winnersMatches = doubleBracket.matches.filter(m => m.bracket_type === 'winners');
  const losersMatches = doubleBracket.matches.filter(m => m.bracket_type === 'losers');
  const finalMatches = doubleBracket.matches.filter(m => m.bracket_type === 'final');
  
  console.log(`\nBracket Breakdown:`);
  console.log(`  Winners bracket: ${winnersMatches.length} matches`);
  console.log(`  Losers bracket: ${losersMatches.length} matches`);
  console.log(`  Final matches: ${finalMatches.length} matches`);
} catch (error) {
  console.error('❌ Double Elimination test failed:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test Swiss System
console.log('📋 Testing Swiss System Bracket:');
try {
  const swissBracket = generateSwissBracket(participants, 5);
  console.log(`✅ Generated ${swissBracket.matches.length} matches`);
  console.log(`✅ Total rounds: ${swissBracket.total_rounds}`);
  console.log(`✅ Bracket type: ${swissBracket.bracket_type}`);
  console.log(`✅ Seeding method: ${swissBracket.seeding_method}`);
  console.log(`✅ Valid bracket: ${validateBracket(swissBracket)}`);
  
  // Show rounds
  const rounds = {};
  swissBracket.matches.forEach(match => {
    if (!rounds[match.round]) rounds[match.round] = 0;
    rounds[match.round]++;
  });
  
  console.log('\nRounds Breakdown:');
  Object.entries(rounds).forEach(([round, count]) => {
    console.log(`  Round ${round}: ${count} matches`);
  });
} catch (error) {
  console.error('❌ Swiss System test failed:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test with different participant counts
console.log('📋 Testing with different participant counts:');
const testCounts = [2, 4, 8, 16, 32];

testCounts.forEach(count => {
  const testParticipants = Array.from({ length: count }, (_, i) => i + 1);
  
  try {
    const bracket = generateSingleEliminationBracket(testParticipants);
    const isValid = validateBracket(bracket);
    console.log(`✅ ${count} participants: ${bracket.matches.length} matches, ${bracket.total_rounds} rounds, valid: ${isValid}`);
  } catch (error) {
    console.log(`❌ ${count} participants: Failed - ${error.message}`);
  }
});

console.log('\n🎉 Bracket system testing completed!');
