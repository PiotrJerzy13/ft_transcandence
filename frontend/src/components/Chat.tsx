import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { usePlayerData } from '../context/PlayerDataContext';
import { 
  Send, 
  Users, 
  MessageCircle, 
  Gamepad2, 
  Trophy,
  MoreVertical,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { ChatMessage, ChatUser } from '../types';

interface ChatProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Chat({ className = '', isOpen = true, onToggle }: ChatProps) {
  const [message, setMessage] = useState('');
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { playerData } = usePlayerData();

  const {
    isConnected,
    messages,
    onlineUsers,
    currentChannel,
    error,
    isTyping,
    typingUsers,
    sendMessage,
    sendTyping,
    sendGameInvite,
    joinChannel
  } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Join global channel on connect
  useEffect(() => {
    if (isConnected && !currentChannel) {
      joinChannel('global');
    }
  }, [isConnected, currentChannel, joinChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    sendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      sendTyping();
    }
  };

  const handleGameInvite = (userId: number, gameType: 'pong' | 'arkanoid') => {
    sendGameInvite(userId, gameType);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeColor = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system':
        return 'text-yellow-400';
      case 'game_invite':
        return 'text-green-400';
      case 'achievement':
        return 'text-purple-400';
      default:
        return 'text-white';
    }
  };

  const getStatusColor = (status: ChatUser['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'in_game':
        return 'bg-blue-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Don't show chat if user is not authenticated
  if (!playerData?.user) {
    return null;
  }

  const handleToggle = () => {
    setIsChatOpen(!isChatOpen);
    if (onToggle) onToggle();
  };

  if (!isChatOpen) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {!isConnected && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500 animate-pulse"></span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-96 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-xl z-50 ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="text-lg font-bold text-white">Chat Global</h3>
          <span className="text-sm text-gray-400">({onlineUsers.length} en ligne)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
            className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors"
            title="Utilisateurs en ligne"
          >
            <Users className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors"
            title={isMuted ? 'Activer le son' : 'Désactiver le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
          </button>
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors"
            title="Fermer le chat"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex h-96">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {error && (
              <div className="text-red-400 text-sm text-center py-2">
                Erreur de connexion: {error}
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun message pour le moment</p>
                <p className="text-sm">Soyez le premier à dire bonjour !</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-purple-400">
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                    {msg.type !== 'message' && (
                      <span className="text-xs px-2 py-1 bg-purple-600/30 rounded-full">
                        {msg.type === 'system' ? 'Système' : 
                         msg.type === 'game_invite' ? 'Invitation' : 
                         msg.type === 'achievement' ? 'Réalisation' : ''}
                      </span>
                    )}
                  </div>
                  <div className={`${getMessageTypeColor(msg.type)} text-sm`}>
                    {msg.message}
                  </div>
                  {msg.gameInvite && (
                    <div className="mt-2 p-2 bg-green-900/30 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm">
                        🎮 Invitation à jouer à {msg.gameInvite.gameType === 'pong' ? 'Pong' : 'Arkanoid'}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-gray-400 italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'est en train d\'écrire' : 'sont en train d\'écrire'}...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-purple-500/20">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Tapez votre message..." : "Connexion en cours..."}
                disabled={!isConnected}
                className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!message.trim() || !isConnected}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Online Users Sidebar */}
        {showOnlineUsers && (
          <div className="w-64 border-l border-purple-500/20 bg-black/50">
            <div className="p-4 border-b border-purple-500/20">
              <h4 className="text-sm font-semibold text-white">Utilisateurs en ligne</h4>
            </div>
            <div className="p-4 space-y-2">
              {onlineUsers.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun utilisateur en ligne</p>
              ) : (
                onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-purple-600/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                      <span className="text-sm text-white">{user.username}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleGameInvite(user.id, 'pong')}
                        className="p-1 hover:bg-blue-600/30 rounded transition-colors"
                        title="Inviter à Pong"
                      >
                        <Gamepad2 className="w-3 h-3 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleGameInvite(user.id, 'arkanoid')}
                        className="p-1 hover:bg-green-600/30 rounded transition-colors"
                        title="Inviter à Arkanoid"
                      >
                        <Trophy className="w-3 h-3 text-green-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
