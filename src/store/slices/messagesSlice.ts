import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  messageService,
  Conversation,
  ChatMessage,
} from '../../services/messageService';
import type { RootState } from '../index';

interface MessagesState {
  conversations: Conversation[];
  activeMessages: ChatMessage[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  isSending: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: [],
  activeMessages: [],
  activeConversationId: null,
  isLoadingConversations: false,
  isSending: false,
  error: null,
};

export const loadConversations = createAsyncThunk(
  'messages/loadConversations',
  async (_, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) return [];
    return await messageService.getConversations(auth.user.id);
  }
);

export const startConversation = createAsyncThunk(
  'messages/startConversation',
  async (
    { otherUserId, otherUserName }: { otherUserId: string; otherUserName: string },
    { getState }
  ) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    return await messageService.getOrCreateConversation(
      auth.user.id,
      auth.user.name,
      otherUserId,
      otherUserName
    );
  }
);

export const loadMessages = createAsyncThunk(
  'messages/loadMessages',
  async (conversationId: string) => {
    const messages = await messageService.getMessages(conversationId);
    return { conversationId, messages };
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, text }: { conversationId: string; text: string }, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    return await messageService.sendMessage(conversationId, auth.user.id, text);
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessagesState(state) {
      state.conversations = [];
      state.activeMessages = [];
      state.activeConversationId = null;
      state.error = null;
    },
    setActiveMessages(state, action: { payload: ChatMessage[] }) {
      state.activeMessages = action.payload;
    },
    setActiveConversationId(state, action: { payload: string | null }) {
      state.activeConversationId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadConversations.pending, state => {
        state.isLoadingConversations = true;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.isLoadingConversations = false;
      })
      .addCase(loadConversations.rejected, state => {
        state.isLoadingConversations = false;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        const existing = state.conversations.find(c => c.id === action.payload.id);
        if (!existing) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.activeConversationId = action.payload.conversationId;
        state.activeMessages = action.payload.messages;
      })
      .addCase(sendMessage.pending, state => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const message = action.payload;
        if (state.activeConversationId === message.conversationId) {
          const exists = state.activeMessages.some(m => m.id === message.id);
          if (!exists) {
            state.activeMessages.push(message);
          }
        }
        const convIdx = state.conversations.findIndex(c => c.id === message.conversationId);
        if (convIdx !== -1) {
          state.conversations[convIdx] = {
            ...state.conversations[convIdx],
            lastMessage: message.text,
            lastMessageAt: message.createdAt,
            updatedAt: message.createdAt,
          };
          state.conversations.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.error.message ?? 'Failed to send message.';
      });
  },
});

export const { clearMessagesState, setActiveMessages, setActiveConversationId } =
  messagesSlice.actions;
export default messagesSlice.reducer;
