'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, PlusCircle } from 'lucide-react';
import {
  useConversationControllerListConversations,
  useConversationControllerGetMessages,
} from '@/generated/api/conversations/conversations';
import { cn } from '@/lib/utils';

// The API returns void in the generated types, but we cast to the actual shape
interface Participant {
  id: string;
  name: string;
  email?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount?: number;
}

interface ConversationsResponse {
  data: Conversation[];
}

interface MessagesResponse {
  data: Message[];
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getOtherParticipant(conv: Conversation, myId?: string): Participant {
  if (!conv.participants || conv.participants.length === 0) {
    return { id: '', name: 'Unknown' };
  }
  if (!myId) return conv.participants[0];
  return conv.participants.find((p) => p.id !== myId) ?? conv.participants[0];
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageThread({ conversationId }: { conversationId: string }) {
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: rawMessages, isLoading } = useConversationControllerGetMessages(
    conversationId,
    { limit: 50 },
    { query: { refetchInterval: 5000 } },
  );

  const messagesData = rawMessages as unknown as MessagesResponse | undefined;
  const messages = messagesData?.data
    ? [...messagesData.data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: integrate send message mutation when API is ready
    setMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-40" />
            <p className="text-sm">Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Heuristic: no current user context, render all as "received" for now
            const isOwn = false;
            return (
              <div
                key={msg.id}
                className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
              >
                {!isOwn && (
                  <Avatar className="h-7 w-7 shrink-0 mt-1">
                    <AvatarFallback className="text-xs">
                      {(msg.senderName ?? 'U').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                    isOwn
                      ? 'gradient-fill text-white rounded-br-sm'
                      : 'glass rounded-bl-sm',
                  )}
                >
                  {!isOwn && msg.senderName && (
                    <p className="text-xs font-medium text-muted-foreground mb-1">{msg.senderName}</p>
                  )}
                  <p>{msg.content}</p>
                  <p className={cn('text-xs mt-1', isOwn ? 'text-white/70 text-right' : 'text-muted-foreground')}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
      <div className="glass border-t border-white/10 p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ketik pesan..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rawConversations, isLoading } = useConversationControllerListConversations();
  const convData = rawConversations as unknown as ConversationsResponse | undefined;
  const conversations: Conversation[] = convData?.data ?? [];

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-8rem)] glass rounded-xl overflow-hidden">
      {/* Left: Conversation list */}
      <div className="w-80 shrink-0 flex flex-col border-r border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-semibold text-base">Pesan</h2>
          <Button size="sm" variant="outline" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span className="text-xs">Baru</span>
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2 text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-40" />
              <p className="text-sm">Belum ada percakapan</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = selectedId === conv.id;
                const hasUnread = (conv.unreadCount ?? 0) > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                      isActive ? 'bg-primary/10' : 'hover:bg-white/5',
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {other.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {hasUnread && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background shadow-[0_0_6px_var(--color-primary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn('text-sm truncate', hasUnread ? 'font-semibold' : 'font-medium')}>
                          {other.name}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className={cn('text-xs truncate', hasUnread ? 'text-foreground' : 'text-muted-foreground')}>
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Message thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {getOtherParticipant(selectedConversation).name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {getOtherParticipant(selectedConversation).name}
                </p>
              </div>
            </div>
            <MessageThread conversationId={selectedConversation.id} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-30" />
            <div>
              <p className="font-medium">Pilih percakapan</p>
              <p className="text-sm">Pilih percakapan dari daftar di sebelah kiri</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
