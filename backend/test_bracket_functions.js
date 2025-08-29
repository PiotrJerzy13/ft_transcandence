// Unit tests for bracket system functions
// This tests the bracket generation logic without needing a database

// Import the bracket system functions (we'll test them directly)
const { 
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket, 
  generateSwissBracket,
  validateBracket
} = require('./src/utils/bracketSystem.js');

function testBracketFunctions() {
  console.log('🧪 Testing Bracket System Functions...\n');

  // Test 1: Single Elimination with 8 participants
  console.log('1. Testing Single Elimination (8 participants)...');
  const participants8 = [1, 2, 3, 4, 5, 6, 7, 8];
  const singleBracket = generateSingleEliminationBracket(participants8);
  
  console.log(`   Total Rounds: ${singleBracket.total_rounds}`);
  console.log(`   Total Matches: ${singleBracket.matches.length}`);
  console.log(`   Bracket Type: ${singleBracket.bracket_type}`);
  console.log(`   Seeding Method: ${singleBracket.seeding_method}`);
  
  // Check first round matches
  const firstRoundMatches = singleBracket.matches.filter(m => m.round === 1);
  console.log(`   First Round Matches: ${firstRoundMatches.length}`);
  
  // Check if bracket is valid
  console.log(`   Bracket Valid: ${validateBracket(singleBracket) ? '✅' : '❌'}\n`);

  // Test 2: Single Elimination with odd number (should add bye)
  console.log('2. Testing Single Elimination (7 participants, should add bye)...');
  const participants7 = [1, 2, 3, 4, 5, 6, 7];
  const singleBracketOdd = generateSingleEliminationBracket(participants7);
  
  console.log(`   Total Rounds: ${singleBracketOdd.total_rounds}`);
  console.log(`   Total Matches: ${singleBracketOdd.matches.length}`);
  
  // Check for bye matches
  const byeMatches = singleBracketOdd.matches.filter(m => 
    m.player1_id === -1 || m.player2_id === -1
  );
  console.log(`   Bye Matches: ${byeMatches.length}`);
  console.log(`   Bracket Valid: ${validateBracket(singleBracketOdd) ? '✅' : '❌'}\n`);

  // Test 3: Double Elimination
  console.log('3. Testing Double Elimination (8 participants)...');
  const doubleBracket = generateDoubleEliminationBracket(participants8);
  
  console.log(`   Total Rounds: ${doubleBracket.total_rounds}`);
  console.log(`   Total Matches: ${doubleBracket.matches.length}`);
  
  // Check bracket types
  const winnersMatches = doubleBracket.matches.filter(m => m.bracket_type === 'winners');
  const losersMatches = doubleBracket.matches.filter(m => m.bracket_type === 'losers');
  const finalMatches = doubleBracket.matches.filter(m => m.bracket_type === 'final');
  
  console.log(`   Winners Bracket Matches: ${winnersMatches.length}`);
  console.log(`   Losers Bracket Matches: ${losersMatches.length}`);
  console.log(`   Final Matches: ${finalMatches.length}`);
  console.log(`   Bracket Valid: ${validateBracket(doubleBracket) ? '✅' : '❌'}\n`);

  // Test 4: Swiss System
  console.log('4. Testing Swiss System (6 participants, 3 rounds)...');
  const participants6 = [1, 2, 3, 4, 5, 6];
  const swissBracket = generateSwissBracket(participants6, 3);
  
  console.log(`   Total Rounds: ${swissBracket.total_rounds}`);
  console.log(`   Total Matches: ${swissBracket.matches.length}`);
  
  // Check matches per round
  for (let round = 1; round <= 3; round++) {
    const roundMatches = swissBracket.matches.filter(m => m.round === round);
    console.log(`   Round ${round} Matches: ${roundMatches.length}`);
  }
  console.log(`   Bracket Valid: ${validateBracket(swissBracket) ? '✅' : '❌'}\n`);

  // Test 5: Seeding
  console.log('5. Testing Ranked Seeding...');
  const seeding = [
    { player_id: 1, seed: 1, rating: 1500 },
    { player_id: 2, seed: 2, rating: 1400 },
    { player_id: 3, seed: 3, rating: 1300 },
    { player_id: 4, seed: 4, rating: 1200 }
  ];
  const seededBracket = generateSingleEliminationBracket(participants8, seeding);
  
  console.log(`   Seeding Method: ${seededBracket.seeding_method}`);
  console.log(`   Bracket Valid: ${validateBracket(seededBracket) ? '✅' : '❌'}\n`);

  console.log('🎉 All bracket function tests completed!');
}

// Run the tests
testBracketFunctions();
