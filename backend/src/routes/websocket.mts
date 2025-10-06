import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { initializeWebSocketManager } from '../websocket/WebSocketManager.js';

export default async function websocketRoutes(fastify: FastifyInstance) {
  console.log('🔌 WEBSOCKET ROUTES REGISTERED');

  // Initialize WebSocket manager
  const wsManager = initializeWebSocketManager(fastify);

  // Handle incoming WebSocket messages
  function handleWebSocketMessage(userId: number, data: any, socket: any) {
    const { type, data: messageData } = data;

    switch (type) {
      case 'ping':
        // Respond to ping with pong
        socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'ready':
        // Player is ready to start game
        handlePlayerReady(userId, messageData);
        break;

      case 'game_action':
        // Handle game actions (paddle movement, etc.)
        handleGameAction(userId, messageData);
        break;

      case 'chat_message':
        // Handle chat messages
        wsManager.handleChatMessage(userId, messageData);
        break;

      case 'typing_start':
        // Handle typing start
        wsManager.handleTypingStart(userId, messageData?.channel);
        break;

      case 'typing_stop':
        // Handle typing stop
        wsManager.handleTypingStop(userId, messageData?.channel);
        break;

      case 'game_invite':
        // Handle game invites
        const { targetUserId, gameType } = messageData;
        wsManager.handleGameInvite(userId, targetUserId, gameType);
        break;

      case 'join_channel':
        // Handle channel joining
        const player = wsManager.getPlayer(userId);
        if (player) {
          player.currentChannel = messageData?.channelId || 'global';
        }
        break;

      case 'authenticate':
        // Handle authentication (user is already authenticated via middleware)
        console.log(`🔐 WebSocket authentication for user ${userId}`);
        socket.send(JSON.stringify({
          type: 'connection_established',
          message: 'Authentication successful'
        }));
        break;

      default:
        console.log(`Unknown WebSocket message type: ${type} from user ${userId}`);
        socket.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`
        }));
    }
  }

  // Handle player ready status
  function handlePlayerReady(_userId: number, payload: any) {
    const { sessionId } = payload;

    if (sessionId) {
      const gameRoom = wsManager.getGameRoom(sessionId);
      if (gameRoom) {
        // Check if all players are ready
        const allReady = gameRoom.players.every(player => 
          player.ws.readyState === 1 // WebSocket.OPEN
        );

        if (allReady) {
          // Start the game
          wsManager.startGame(sessionId);
        }
      }
    }
  }

  // Handle game actions
  function handleGameAction(userId: number, payload: any) {
    const { sessionId, action, data } = payload;

    if (sessionId) {
      const gameRoom = wsManager.getGameRoom(sessionId);
      if (gameRoom && gameRoom.status === 'active') {
        // Broadcast game action to other players in the room
        const gameActionMessage = {
          type: 'game_action',
          sessionId,
          userId,
          action,
          data,
          timestamp: Date.now()
        };

        wsManager.broadcastToRoom(sessionId, gameActionMessage);
      }
    }
  }


  // WebSocket connection endpoint
  fastify.get('/ws', {
    websocket: true,
    preHandler: authenticate
  }, (connection: any, req) => {
    const userId = req.user?.id;
    const username = req.user?.username;

    if (!userId || !username) {
      connection.socket.close(1008, 'Authentication required');
      return;
    }

    console.log(`🔌 WebSocket connection request from user ${username} (ID: ${userId})`);
    console.log(`🔌 About to add player to WebSocket manager...`);

    // Add player to WebSocket manager
    try {
      wsManager.addPlayer(userId, username, connection.socket);
      console.log(`🔌 Player added to WebSocket manager successfully`);
    } catch (error) {
      console.error(`❌ Error adding player to WebSocket manager:`, error);
    }

    // Handle incoming messages
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleWebSocketMessage(userId, data, connection.socket);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        connection.socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle connection close
    connection.socket.on('close', () => {
      console.log(`🔌 WebSocket connection closed for user ${username} (ID: ${userId})`);
      wsManager.removePlayer(userId);
    });

    // Handle connection errors
    connection.socket.on('error', (error) => {
      console.error(`WebSocket error for user ${username} (ID: ${userId}):`, error);
      wsManager.removePlayer(userId);
    });
  });

  // Health check endpoint for WebSocket connections
  fastify.get('/ws/health', {
    preHandler: authenticate
  }, async (request, reply) => {
    console.log('🔍 WebSocket health check requested');
    console.log('🔍 Request headers:', request.headers);
    console.log('🔍 User object:', request.user);
    
    const userId = request.user?.id;
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return reply.status(401).send({ error: 'Authentication required' });
    }

    console.log('✅ User authenticated, ID:', userId);

    const isConnected = wsManager.isPlayerConnected(userId);
    const playerCount = wsManager.getPlayerCount();
    const gameRoomCount = wsManager.getGameRoomCount();

    console.log('📊 WebSocket stats - Connected:', isConnected, 'Players:', playerCount, 'Rooms:', gameRoomCount);

    return reply.send({
      success: true,
      isConnected,
      playerCount,
      gameRoomCount,
      timestamp: new Date().toISOString()
    });
  });

  // Get WebSocket statistics (admin endpoint)
  fastify.get('/ws/stats', {
    preHandler: authenticate
  }, async (request, reply) => {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    // TODO: Add admin role check here
    const players = wsManager.getAllPlayers();
    const gameRooms = wsManager.getAllGameRooms();

    return reply.send({
      success: true,
      stats: {
        totalPlayers: players.length,
        totalGameRooms: gameRooms.length,
        players: players.map(p => ({
          id: p.id,
          username: p.username,
          gameType: p.gameType,
          gameSessionId: p.gameSessionId
        })),
        gameRooms: gameRooms.map(room => ({
          id: room.id,
          gameType: room.gameType,
          status: room.status,
          playerCount: room.players.length,
          createdAt: room.createdAt
        }))
      },
      timestamp: new Date().toISOString()
    });
  });
}
