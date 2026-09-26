'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Search,
  Send,
  Loader2,
  AlertCircle,
  User,
  Clock,
} from 'lucide-react';

interface Conversation {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_from_me: boolean;
}

export default function ChroniclesMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
    
    // If recipient ID is provided, start a new conversation
    if (recipientId) {
      const recipientName = searchParams.get('name') || undefined;
      startNewConversation(recipientId, recipientName);
    }
  }, [recipientId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && selectedConversation.id && !selectedConversation.id.startsWith('new-')) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chronicles/messaging/conversations');
      
      if (!res.ok) throw new Error('Failed to load conversations');
      
      const data = await res.json();
      setConversations(data.conversations || []);
      setError('');
    } catch (err) {
      setError('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async (recipientId: string, recipientName?: string) => {
    try {
      // Try to create or get existing conversation
      const res = await fetch('/api/chronicles/messaging/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: recipientId }),
      });

      if (!res.ok) {
        // If creation fails, fall back to temporary conversation
        if (recipientName) {
          const newConversation: Conversation = {
            id: `new-${recipientId}`,
            recipient_id: recipientId,
            recipient_name: recipientName,
            recipient_avatar: undefined,
            last_message: 'Start a conversation...',
            last_message_time: new Date().toISOString(),
            unread_count: 0,
          };
          
          setSelectedConversation(newConversation);
          setMessages([]);
          return;
        }
        throw new Error('Failed to create conversation');
      }

      const data = await res.json();
      
      // Create conversation object from API response
      const newConversation: Conversation = {
        id: data.conversation.id,
        recipient_id: recipientId,
        recipient_name: recipientName || 'User',
        recipient_avatar: undefined,
        last_message: data.conversation.last_message_preview || 'New conversation',
        last_message_time: data.conversation.last_message_at || new Date().toISOString(),
        unread_count: 0,
      };
      
      setSelectedConversation(newConversation);
      setMessages([]);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      // Fallback to temporary conversation
      if (recipientName) {
        const newConversation: Conversation = {
          id: `new-${recipientId}`,
          recipient_id: recipientId,
          recipient_name: recipientName,
          recipient_avatar: undefined,
          last_message: 'Start a conversation...',
          last_message_time: new Date().toISOString(),
          unread_count: 0,
        };
        
        setSelectedConversation(newConversation);
        setMessages([]);
      }
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chronicles/messaging/messages?conversation_id=${conversationId}`);
      
      if (!res.ok) throw new Error('Failed to load messages');
      
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      
      const res = await fetch('/api/chronicles/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage,
          message_type: 'text'
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await res.json();
      
      const message: Message = {
        id: data.message.id,
        sender_id: data.message.sender_id,
        sender_name: data.message.sender?.pen_name || 'You',
        content: data.message.content,
        created_at: data.message.created_at,
        is_from_me: data.message.is_from_me,
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      // Show error to user
      alert(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Messages</h1>
          </div>
          <p className="text-muted-foreground">Connect and collaborate with fellow creators</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start connecting with creators!</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-purple-50 dark:bg-purple-900/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conv.recipient_avatar ? (
                            <img
                              src={conv.recipient_avatar}
                              alt={conv.recipient_name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            conv.recipient_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate">{conv.recipient_name}</h3>
                            {conv.unread_count > 0 && (
                              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.last_message_time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedConversation.recipient_avatar ? (
                      <img
                        src={selectedConversation.recipient_avatar}
                        alt={selectedConversation.recipient_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      selectedConversation.recipient_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.recipient_name}</h3>
                    <p className="text-sm text-muted-foreground">Active now</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Start the conversation!</p>
                      <p className="text-sm mt-2">Send a message to {selectedConversation.recipient_name}</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                            message.is_from_me
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-800'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="self-end"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 h-[600px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation from the list or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
