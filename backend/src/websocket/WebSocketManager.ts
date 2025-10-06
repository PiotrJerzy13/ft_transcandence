import { FastifyInstance } from 'fastify';
import { GameStateManager } from '../game/GameStateManager.js';
import { GameState, PlayerAction, GameEvent } from '../types/game.js';

// Define WebSocket interface for compatibility
interface WebSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

interface Player {
  id: number;
  username: string;
  ws: WebSocket;
  gameType?: string;
  gameSessionId?: string;
  currentChannel?: string;
  isTyping?: boolean;
  lastSeen?: Date;
}

interface GameRoom {
  id: string;
  gameType: string;
  players: Player[];
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
}

export class WebSocketManager {
  private players: Map<number, Player> = new Map();
  private gameRooms: Map<string, GameRoom> = new Map();
  private gameStateManager: GameStateManager;
  private chatMessages: any[] = [];
  private globalChannel = 'global';

  constructor(_fastify: FastifyInstance) {
    // Fastify instance available for future use if needed
    this.gameStateManager = new GameStateManager();
  }

  // Add a new player connection
  addPlayer(userId: number, username: string, ws: WebSocket): void {
    console.log(`🔌 Adding player ${username} (ID: ${userId}) to WebSocket manager`);
    console.log(`🔌 Current player count before: ${this.players.size}`);
    
    const player: Player = {
      id: userId,
      username,
      ws,
      currentChannel: this.globalChannel,
      isTyping: false,
      lastSeen: new Date()
    };

    this.players.set(userId, player);
    console.log(`🔌 Player ${username} (ID: ${userId}) added to WebSocket manager`);
    console.log(`🔌 Current player count after: ${this.players.size}`);
    console.log(`🔌 All players:`, Array.from(this.players.keys()));
    
    // Send connection confirmation
    this.sendToPlayer(userId, {
      type: 'connection_established',
      message: 'WebSocket connection established',
      userId,
      username
    });

    // Notify other players about new user
    this.broadcastUserJoined(userId, username);
  }

  // Remove a player connection
  removePlayer(userId: number): void {
    const player = this.players.get(userId);
    if (player) {
      // Notify other players about user leaving
      this.broadcastUserLeft(userId, player.username);
      
      // Leave any active game rooms
      if (player.gameSessionId) {
        this.leaveGameRoom(userId, player.gameSessionId);
      }
      
      // Close WebSocket connection
      if (player.ws.readyState === 1) { // WebSocket.OPEN = 1
        player.ws.close();
      }
      
      this.players.delete(userId);
      console.log(`🔌 Player ${player.username} (ID: ${userId}) disconnected from WebSocket`);
    }
  }

  // Create a new game room
  createGameRoom(sessionId: string, gameType: string, player1Id: number, player2Id: number): GameRoom {
    const player1 = this.players.get(player1Id);
    const player2 = this.players.get(player2Id);

    if (!player1 || !player2) {
      throw new Error('One or both players not found in WebSocket connections');
    }

    const gameRoom: GameRoom = {
      id: sessionId,
      gameType,
      players: [player1, player2],
      status: 'waiting',
      createdAt: new Date()
    };

    // Update player game session info
    player1.gameSessionId = sessionId;
    player2.gameSessionId = sessionId;

    this.gameRooms.set(sessionId, gameRoom);
    console.log(`🎮 Created game room ${sessionId} for ${gameType} with players ${player1.username} and ${player2.username}`);

    // Create game state for the new room
    try {
      this.gameStateManager.createGame(
        sessionId,
        gameType,
        [player1Id, player2Id],
        [player1.username, player2.username]
      );
      console.log(`🎮 Created game state for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error creating game state for session ${sessionId}:`, error);
    }

    // Notify both players about the match
    this.notifyMatchFound(sessionId, gameType, player1Id, player2Id);

    return gameRoom;
  }

  // Notify players that a match has been found
  private notifyMatchFound(sessionId: string, gameType: string, player1Id: number, player2Id: number): void {
    const matchNotification = {
      type: 'match_found',
      sessionId,
      gameType,
      message: 'Match found! Starting game...'
    };

    this.sendToPlayer(player1Id, matchNotification);
    this.sendToPlayer(player2Id, matchNotification);
  }



  // Leave a game room
  leaveGameRoom(userId: number, sessionId: string): void {
    const gameRoom = this.gameRooms.get(sessionId);
    if (gameRoom) {
      // Remove player from room
      gameRoom.players = gameRoom.players.filter(p => p.id !== userId);
      
      // Update player's game session info
      const player = this.players.get(userId);
      if (player) {
        player.gameSessionId = undefined;
      }

      // If room is empty, remove it
      if (gameRoom.players.length === 0) {
        this.gameRooms.delete(sessionId);
        // Clean up game state when room is removed
        this.cleanupGame(sessionId);
        console.log(`🎮 Game room ${sessionId} removed (no players left)`);
      } else {
        // Notify remaining players
        this.broadcastToRoom(sessionId, {
          type: 'player_left',
          sessionId,
          userId,
          message: 'A player has left the game'
        });
      }
    }
  }

  // Send message to a specific player
  sendToPlayer(userId: number, message: any): void {
    const player = this.players.get(userId);
    if (player && player.ws.readyState === 1) { // WebSocket.OPEN = 1
      try {
        player.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to player ${userId}:`, error);
      }
    }
  }

  // Broadcast message to all players in a game room
  broadcastToRoom(sessionId: string, message: any): void {
    const gameRoom = this.gameRooms.get(sessionId);
    if (gameRoom) {
      gameRoom.players.forEach(player => {
        this.sendToPlayer(player.id, message);
      });
    }
  }

  // Broadcast message to all connected players
  broadcastToAll(message: any): void {
    this.players.forEach(player => {
      this.sendToPlayer(player.id, message);
    });
  }

  // Get player information
  getPlayer(userId: number): Player | undefined {
    return this.players.get(userId);
  }

  // Get game room information
  getGameRoom(sessionId: string): GameRoom | undefined {
    return this.gameRooms.get(sessionId);
  }

  // Get all connected players
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // Get all active game rooms
  getAllGameRooms(): GameRoom[] {
    return Array.from(this.gameRooms.values());
  }

  // Check if a player is connected
  isPlayerConnected(userId: number): boolean {
    return this.players.has(userId);
  }

  // Get player count
  getPlayerCount(): number {
    return this.players.size;
  }

  // Get active game room count
  getGameRoomCount(): number {
    return this.gameRooms.size;
  }

  // Phase 2: Game State Management Methods

  // Get game state for a session
  getGameState(sessionId: string): GameState | undefined {
    return this.gameStateManager.getGameState(sessionId);
  }

  // Handle player action and update game state
  handlePlayerAction(sessionId: string, action: PlayerAction): boolean {
    try {
      const success = this.gameStateManager.updateGameState(sessionId, action);
      if (success) {
        console.log(`🎮 Player action processed for session ${sessionId}:`, action.type);
        
        // Broadcast updated game state to all players in the room
        this.broadcastGameState(sessionId);
      }
      return success;
    } catch (error) {
      console.error(`❌ Error handling player action for session ${sessionId}:`, error);
      return false;
    }
  }

  // Broadcast game state to all players in a room
  broadcastGameState(sessionId: string): void {
    const gameState = this.gameStateManager.getGameState(sessionId);
    if (!gameState) {
      console.warn(`⚠️ No game state found for session ${sessionId}`);
      return;
    }

    const gameRoom = this.gameRooms.get(sessionId);
    if (!gameRoom) {
      console.warn(`⚠️ No game room found for session ${sessionId}`);
      return;
    }

    const gameStateMessage = {
      type: 'game_state_update',
      sessionId,
      gameState,
      timestamp: Date.now()
    };

    // Send to all players in the room
    gameRoom.players.forEach(player => {
      this.sendToPlayer(player.id, gameStateMessage);
    });

    console.log(`📡 Broadcasted game state for session ${sessionId} to ${gameRoom.players.length} players`);
  }

  // Start game for a session
  startGame(sessionId: string): void {
    try {
      // Check if all players are ready
      if (!this.gameStateManager.areAllPlayersReady(sessionId)) {
        console.warn(`⚠️ Cannot start game ${sessionId}: not all players are ready`);
        return;
      }

      // Start the game loop
      this.gameStateManager.startGameLoop(sessionId);
      
      // Update room status
      const gameRoom = this.gameRooms.get(sessionId);
      if (gameRoom) {
        gameRoom.status = 'active';
      }

      console.log(`🎮 Game started for session ${sessionId}`);
      
      // Broadcast game start event
      this.broadcastGameEvent(sessionId, {
        type: 'game_start',
        sessionId,
        timestamp: Date.now(),
        data: {}
      });
    } catch (error) {
      console.error(`❌ Error starting game for session ${sessionId}:`, error);
    }
  }

  // Broadcast game event to all players in a room
  broadcastGameEvent(sessionId: string, event: GameEvent): void {
    const gameRoom = this.gameRooms.get(sessionId);
    if (!gameRoom) return;

    const gameEventMessage = {
      type: 'game_event',
      event,
      timestamp: Date.now()
    };

    gameRoom.players.forEach(player => {
      this.sendToPlayer(player.id, gameEventMessage);
    });

    console.log(`📡 Broadcasted game event ${event.type} for session ${sessionId}`);
  }

  // Get all active games
  getAllGames(): GameState[] {
    return this.gameStateManager.getAllGames();
  }

  // Clean up game when room is removed
  cleanupGame(sessionId: string): void {
    try {
      this.gameStateManager.removeGame(sessionId);
      console.log(`🗑️ Cleaned up game state for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up game state for session ${sessionId}:`, error);
    }
  }

  // Chat System Methods

  // Handle incoming chat messages
  handleChatMessage(userId: number, messageData: any): void {
    const player = this.players.get(userId);
    if (!player) return;

    const chatMessage = {
      id: `msg_${Date.now()}_${userId}`,
      userId: player.id,
      username: player.username,
      message: messageData.message,
      timestamp: new Date().toISOString(),
      type: messageData.type || 'message',
      channel: messageData.channel || this.globalChannel
    };

    // Store message
    this.chatMessages.push(chatMessage);
    
    // Keep only last 100 messages
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }

    // Broadcast to all connected players
    this.broadcastToAll({
      type: 'chat_message',
      data: chatMessage
    });

    console.log(`💬 Chat message from ${player.username}: ${messageData.message}`);
  }

  // Handle typing indicators
  handleTypingStart(userId: number, channel: string = this.globalChannel): void {
    const player = this.players.get(userId);
    if (!player) return;

    player.isTyping = true;
    
    // Broadcast typing indicator to all players except sender
    this.broadcastToAll({
      type: 'typing_start',
      username: player.username,
      channel
    });
  }

  handleTypingStop(userId: number, channel: string = this.globalChannel): void {
    const player = this.players.get(userId);
    if (!player) return;

    player.isTyping = false;
    
    // Broadcast typing stop to all players except sender
    this.broadcastToAll({
      type: 'typing_stop',
      username: player.username,
      channel
    });
  }

  // Handle game invites
  handleGameInvite(fromUserId: number, targetUserId: number, gameType: string): void {
    const fromPlayer = this.players.get(fromUserId);
    const targetPlayer = this.players.get(targetUserId);
    
    if (!fromPlayer || !targetPlayer) return;

    const inviteMessage = {
      id: `invite_${Date.now()}_${fromUserId}`,
      userId: fromPlayer.id,
      username: fromPlayer.username,
      message: `${fromPlayer.username} vous invite à jouer à ${gameType}`,
      timestamp: new Date().toISOString(),
      type: 'game_invite',
      channel: this.globalChannel,
      gameInvite: {
        gameType,
        sessionId: `invite_${Date.now()}`
      }
    };

    // Send invite to target player
    this.sendToPlayer(targetUserId, {
      type: 'chat_message',
      data: inviteMessage
    });

    // Send confirmation to sender
    this.sendToPlayer(fromUserId, {
      type: 'system_message',
      message: `Invitation envoyée à ${targetPlayer.username}`
    });

    console.log(`🎮 Game invite from ${fromPlayer.username} to ${targetPlayer.username} for ${gameType}`);
  }

  // Broadcast user joined
  private broadcastUserJoined(userId: number, username: string): void {
    this.broadcastToAll({
      type: 'user_joined',
      user: {
        id: userId,
        username,
        status: 'online',
        lastSeen: new Date().toISOString()
      }
    });
  }

  // Broadcast user left
  private broadcastUserLeft(userId: number, username: string): void {
    this.broadcastToAll({
      type: 'user_left',
      userId,
      username
    });
  }

  // Get online users list
  getOnlineUsers(): any[] {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      username: player.username,
      status: player.gameSessionId ? 'in_game' : 'online',
      lastSeen: player.lastSeen?.toISOString()
    }));
  }

  // Get recent chat messages
  getRecentMessages(limit: number = 50): any[] {
    return this.chatMessages.slice(-limit);
  }
}

// Global instance
let wsManager: WebSocketManager | null = null;

export function initializeWebSocketManager(fastify: FastifyInstance): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(fastify);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    throw new Error('WebSocket manager not initialized. Call initializeWebSocketManager first.');
  }
  return wsManager;
}
