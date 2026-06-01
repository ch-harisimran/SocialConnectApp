import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '../config/firebase';

const CONVERSATIONS_KEY = '@social_connect_conversations';
const MESSAGES_KEY = '@social_connect_messages';
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

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

const conversationIdFor = (userIdA: string, userIdB: string): string =>
  [userIdA, userIdB].sort().join('_');

const toIsoString = (value: unknown): string => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
};

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
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const ref = doc(db, CONVERSATIONS_COLLECTION, id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        return {
          id,
          participants: data.participants as string[],
          participantNames: data.participantNames as Record<string, string>,
          lastMessage: (data.lastMessage as string) ?? '',
          lastMessageAt: toIsoString(data.lastMessageAt),
          updatedAt: toIsoString(data.updatedAt),
        };
      }

      const now = serverTimestamp();
      const conversation = {
        participants: [currentUserId, otherUserId],
        participantNames: {
          [currentUserId]: currentUserName,
          [otherUserId]: otherUserName,
        },
        lastMessage: '',
        lastMessageAt: now,
        updatedAt: now,
      };

      await setDoc(ref, conversation);

      return {
        id,
        participants: conversation.participants,
        participantNames: conversation.participantNames,
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const conversations = await getLocalConversations();
    const existing = conversations.find(c => c.id === id);
    if (existing) return existing;

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
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const q = query(
        collection(db, CONVERSATIONS_COLLECTION),
        where('participants', 'array-contains', userId)
      );
      const snap = await getDocs(q);
      const conversations = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          participants: data.participants as string[],
          participantNames: data.participantNames as Record<string, string>,
          lastMessage: (data.lastMessage as string) ?? '',
          lastMessageAt: toIsoString(data.lastMessageAt),
          updatedAt: toIsoString(data.updatedAt),
        };
      });

      return conversations.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    const conversations = await getLocalConversations();
    return conversations
      .filter(c => c.participants.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const q = query(
        collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          conversationId,
          senderId: data.senderId as string,
          text: data.text as string,
          createdAt: toIsoString(data.createdAt),
        };
      });
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

    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const messagesRef = collection(
        db,
        CONVERSATIONS_COLLECTION,
        conversationId,
        MESSAGES_SUBCOLLECTION
      );
      const docRef = await addDoc(messagesRef, {
        senderId,
        text: trimmed,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, CONVERSATIONS_COLLECTION, conversationId),
        {
          lastMessage: trimmed,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        id: docRef.id,
        conversationId,
        senderId,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
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
  ): Unsubscribe | (() => void) {
    const db = getFirebaseDb();

    if (db && isFirebaseConfigured()) {
      const q = query(
        collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(q, snap => {
        const messages = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            conversationId,
            senderId: data.senderId as string,
            text: data.text as string,
            createdAt: toIsoString(data.createdAt),
          };
        });
        onUpdate(messages);
      });
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
