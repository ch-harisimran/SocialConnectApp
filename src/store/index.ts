import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import followsReducer from './slices/followsSlice';
import messagesReducer from './slices/messagesSlice';
import postsReducer from './slices/postsSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    follows: followsReducer,
    messages: messagesReducer,
    posts: postsReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
