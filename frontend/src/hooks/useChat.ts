import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatChannel, ChatUser } from '../types';
import { usePlayerData } from '../context/PlayerDataContext';

interface UseChatOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface ChatState {
  isConnected: boolean;
  messages: ChatMessage[];
  channels: ChatChannel[];
  onlineUsers: ChatUser[];
  currentChannel: string | null;
  error: string | null;
  isTyping: boolean;
  typingUsers: string[];
}

export const useChat = (options: UseChatOptions = {}) => {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const { playerData } = usePlayerData();

  const [state, setState] = useState<ChatState>({
    isConnected: false,
    messages: [],
    channels: [],
    onlineUsers: [],
    currentChannel: null,
    error: null,
    isTyping: false,
    typingUsers: []
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdCounter = useRef(0);

  // Generate unique message ID
  const generateMessageId = () => `msg_${Date.now()}_${++messageIdCounter.current}`;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't connect if user is not authenticated
    if (!playerData?.user) {
      console.log('User not authenticated, skipping WebSocket connection');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:3000/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 Chat WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null
        }));
        reconnectAttemptsRef.current = 0;
        
        // Send user authentication info
        if (playerData?.user) {
          wsRef.current?.send(JSON.stringify({
            type: 'authenticate',
            data: {
              userId: playerData.user.id,
              username: playerData.user.username
            }
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 Chat WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false
        }));

        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('🔌 Chat WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'Connection error'
        }));
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect'
      }));
    }
  }, [reconnectInterval, maxReconnectAttempts, playerData]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      messages: [],
      channels: [],
      onlineUsers: []
    }));
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: string, channel: string = 'global') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const chatMessage: ChatMessage = {
      id: generateMessageId(),
      userId: 0, // Will be set by server
      username: '', // Will be set by server
      message,
      timestamp: new Date().toISOString(),
      type: 'message',
      channel
    };

    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      data: chatMessage
    }));

    // Add to local messages immediately for better UX
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, chatMessage]
    }));
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((channel: string = 'global') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'typing_start',
      channel
    }));

    setState(prev => ({
      ...prev,
      isTyping: true
    }));

    // Clear typing indicator after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'typing_stop',
        channel
      }));
      
      setState(prev => ({
        ...prev,
        isTyping: false
      }));
    }, 3000);
  }, []);

  // Send game invite
  const sendGameInvite = useCallback((targetUserId: number, gameType: 'pong' | 'arkanoid') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'game_invite',
      data: {
        targetUserId,
        gameType,
        sessionId: `invite_${Date.now()}`
      }
    }));
  }, []);

  // Join channel
  const joinChannel = useCallback((channelId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'join_channel',
      channelId
    }));

    setState(prev => ({
      ...prev,
      currentChannel: channelId
    }));
  }, []);

  // Leave channel
  const leaveChannel = useCallback((channelId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'leave_channel',
      channelId
    }));

    setState(prev => ({
      ...prev,
      currentChannel: prev.currentChannel === channelId ? null : prev.currentChannel
    }));
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'chat_message':
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, data.data]
        }));
        break;

      case 'user_joined':
        setState(prev => ({
          ...prev,
          onlineUsers: [...prev.onlineUsers, data.user]
        }));
        break;

      case 'user_left':
        setState(prev => ({
          ...prev,
          onlineUsers: prev.onlineUsers.filter(user => user.id !== data.userId)
        }));
        break;

      case 'typing_start':
        setState(prev => ({
          ...prev,
          typingUsers: [...prev.typingUsers.filter(user => user !== data.username), data.username]
        }));
        break;

      case 'typing_stop':
        setState(prev => ({
          ...prev,
          typingUsers: prev.typingUsers.filter(user => user !== data.username)
        }));
        break;

      case 'game_invite':
        // Handle game invite notification
        console.log('Game invite received:', data);
        break;

      case 'system_message':
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: generateMessageId(),
            userId: 0,
            username: 'System',
            message: data.message,
            timestamp: new Date().toISOString(),
            type: 'system'
          }]
        }));
        break;

      case 'connection_established':
        console.log('🔌 WebSocket connection established');
        break;

      case 'initial_chat_state':
        console.log('📊 Initial chat state received:', data);
        setState(prev => ({
          ...prev,
          messages: data.messages || [],
          onlineUsers: data.onlineUsers || []
        }));
        break;

      case 'error':
        console.error('🚨 WebSocket error from server:', data.message);
        setState(prev => ({
          ...prev,
          error: data.message || 'Server error'
        }));
        break;

      default:
        console.log('Unhandled WebSocket message type:', data.type);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendGameInvite,
    joinChannel,
    leaveChannel
  };
};
