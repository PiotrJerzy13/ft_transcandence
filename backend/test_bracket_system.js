// Test script for Advanced Bracket System
// Run this after starting the backend server

const API_BASE = 'http://localhost:3000/api';

// Test data
const testTournaments = [
  {
    name: "Single Elimination Test",
    description: "Testing single elimination bracket",
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    maxParticipants: 8,
    bracketType: "single_elimination",
    seedingMethod: "random"
  },
  {
    name: "Double Elimination Test", 
    description: "Testing double elimination bracket",
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 8,
    bracketType: "double_elimination",
    seedingMethod: "ranked"
  },
  {
    name: "Swiss System Test",
    description: "Testing swiss system bracket", 
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 6,
    bracketType: "swiss",
    bracketConfig: { rounds: 3 }
  }
];

async function testBracketSystem() {
  console.log('🧪 Testing Advanced Bracket System...\n');

  try {
    // First, let's check if the server is running
    console.log('1. Checking server status...');
    const healthResponse = await fetch(`${API_BASE}/ping`);
    if (!healthResponse.ok) {
      throw new Error('Server is not running or not accessible');
    }
    console.log('✅ Server is running\n');

    // Note: For this test, we'll skip authentication and focus on bracket generation
    // In a real scenario, you'd need to login first and get a session cookie
    
    console.log('⚠️  Note: This test will create tournaments without authentication');
    console.log('   You may need to manually delete test tournaments later\n');

    // Test tournament creation with different bracket types
    for (const tournament of testTournaments) {
      console.log(`2. Creating ${tournament.bracketType} tournament: ${tournament.name}`);
      
      const createResponse = await fetch(`${API_BASE}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournament)
        // Note: Removed credentials for testing without auth
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.log(`❌ Failed to create tournament: ${error}`);
        console.log(`   Status: ${createResponse.status}`);
        continue;
      }

      const createResult = await createResponse.json();
      console.log(`✅ Tournament created with ID: ${createResult.tournament.id}`);
      console.log(`   Bracket Type: ${createResult.tournament.bracketType}`);
      console.log(`   Seeding Method: ${createResult.tournament.seedingMethod}`);
      console.log(`   Total Rounds: ${createResult.tournament.totalRounds}\n`);

      // Test starting the tournament
      console.log(`3. Starting tournament ${createResult.tournament.id}...`);
      const startResponse = await fetch(`${API_BASE}/tournaments/${createResult.tournament.id}/start`, {
        method: 'POST'
        // Note: Removed credentials for testing without auth
      });

      if (!startResponse.ok) {
        const error = await startResponse.text();
        console.log(`❌ Failed to start tournament: ${error}`);
        console.log(`   Status: ${startResponse.status}\n`);
        continue;
      }

      const startResult = await startResponse.json();
      console.log(`✅ Tournament started successfully!`);
      console.log(`   Matches Generated: ${startResult.matchesGenerated}`);
      console.log(`   Participants: ${startResult.participants}`);
      console.log(`   Bracket Type: ${startResult.bracketType}`);
      console.log(`   Total Rounds: ${startResult.totalRounds}\n`);

      // Test getting tournament details
      console.log(`4. Fetching tournament details...`);
      const detailsResponse = await fetch(`${API_BASE}/tournaments/${createResult.tournament.id}`);

      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        console.log(`✅ Tournament details retrieved`);
        console.log(`   Status: ${details.status}`);
        console.log(`   Participants: ${details.participantCount}`);
        console.log(`   Matches: ${details.matches?.length || 0}`);
        
        // Show some match details
        if (details.matches && details.matches.length > 0) {
          console.log(`   First few matches:`);
          details.matches.slice(0, 3).forEach((match, index) => {
            console.log(`     Match ${index + 1}: ${match.player1} vs ${match.player2} (${match.status})`);
          });
        }
        console.log('');
      } else {
        console.log(`❌ Failed to get tournament details\n`);
      }
    }

    // Test listing all tournaments
    console.log('5. Testing tournament listing...');
    const listResponse = await fetch(`${API_BASE}/tournaments`);

    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log(`✅ Found ${listResult.tournaments.length} tournaments`);
      listResult.tournaments.forEach(t => {
        console.log(`   - ${t.name} (${t.bracket_type}, ${t.participants} participants)`);
      });
    } else {
      console.log('❌ Failed to list tournaments');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBracketSystem();
