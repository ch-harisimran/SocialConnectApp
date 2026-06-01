import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';

const CONVERSATIONS_KEY = '@social_connect_conversations';
const MESSAGES_KEY = '@social_connect_messages';

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ConversationRow {
  id: string;
  participants: string[];
  participant_names: Record<string, string>;
  last_message: string | null;
  last_message_at: string | null;
  updated_at: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

const conversationIdFor = (userIdA: string, userIdB: string): string =>
  [userIdA, userIdB].sort().join('_');

const toIsoString = (value: string | null | undefined): string =>
  value ? new Date(value).toISOString() : new Date().toISOString();

const mapConversationRow = (row: ConversationRow): Conversation => ({
  id: row.id,
  participants: row.participants,
  participantNames: row.participant_names ?? {},
  lastMessage: row.last_message ?? '',
  lastMessageAt: toIsoString(row.last_message_at),
  updatedAt: toIsoString(row.updated_at),
});

const mapMessageRow = (row: MessageRow): ChatMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  text: row.text,
  createdAt: toIsoString(row.created_at),
});

const getLocalConversations = async (): Promise<Conversation[]> => {
  const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalConversations = async (conversations: Conversation[]): Promise<void> => {
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};

const getLocalMessages = async (): Promise<ChatMessage[]> => {
  const raw = await AsyncStorage.getItem(MESSAGES_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalMessages = async (messages: ChatMessage[]): Promise<void> => {
  await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

export const messageService = {
  conversationIdFor,

  async getOrCreateConversation(
    currentUserId: string,
    currentUserName: string,
    otherUserId: string,
    otherUserName: string
  ): Promise<Conversation> {
    if (currentUserId === otherUserId) {
      throw new Error('You cannot message yourself.');
    }

    const id = conversationIdFor(currentUserId, otherUserId);
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (existing) return mapConversationRow(existing as ConversationRow);

      const now = new Date().toISOString();
      const payload = {
        id,
        participants: [currentUserId, otherUserId],
        participant_names: {
          [currentUserId]: currentUserName,
          [otherUserId]: otherUserName,
        },
        last_message: '',
        last_message_at: now,
        updated_at: now,
      };

      const { data: created, error: insertError } = await supabase
        .from('conversations')
        .insert(payload)
        .select('*')
        .single();

      if (insertError) throw new Error(insertError.message);
      return mapConversationRow(created as ConversationRow);
    }

    const conversations = await getLocalConversations();
    const existingLocal = conversations.find(c => c.id === id);
    if (existingLocal) return existingLocal;

    const now = new Date().toISOString();
    const newConversation: Conversation = {
      id,
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [otherUserId]: otherUserName,
      },
      lastMessage: '',
      lastMessageAt: now,
      updatedAt: now,
    };

    await saveLocalConversations([newConversation, ...conversations]);
    return newConversation;
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('updated_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []).map(row => mapConversationRow(row as ConversationRow));
    }

    const conversations = await getLocalConversations();
    return conversations
      .filter(c => c.participants.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map(row => mapMessageRow(row as MessageRow));
    }

    const messages = await getLocalMessages();
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<ChatMessage> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Message cannot be empty.');

    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const now = new Date().toISOString();

      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          text: trimmed,
        })
        .select('*')
        .single();

      if (insertError) throw new Error(insertError.message);

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: trimmed,
          last_message_at: now,
          updated_at: now,
        })
        .eq('id', conversationId);

      if (updateError) throw new Error(updateError.message);

      return mapMessageRow(inserted as MessageRow);
    }

    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      senderId,
      text: trimmed,
      createdAt: now,
    };

    const messages = await getLocalMessages();
    await saveLocalMessages([...messages, message]);

    const conversations = await getLocalConversations();
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx !== -1) {
      conversations[idx] = {
        ...conversations[idx],
        lastMessage: trimmed,
        lastMessageAt: now,
        updatedAt: now,
      };
      await saveLocalConversations(conversations);
    }

    return message;
  },

  subscribeToMessages(
    conversationId: string,
    onUpdate: (messages: ChatMessage[]) => void
  ): () => void {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            messageService.getMessages(conversationId).then(onUpdate).catch(() => {});
          }
        )
        .subscribe();

      messageService.getMessages(conversationId).then(onUpdate).catch(() => {});

      return () => {
        supabase.removeChannel(channel);
      };
    }

    let active = true;
    const poll = async () => {
      if (!active) return;
      const messages = await messageService.getMessages(conversationId);
      onUpdate(messages);
    };

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  },
};
