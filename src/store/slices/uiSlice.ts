import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastPayload {
  message: string;
  icon?: string;
  type?: 'success' | 'like' | 'comment' | 'info';
}

interface UIState {
  toast: (ToastPayload & { id: string }) | null;
}

const initialState: UIState = {
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<ToastPayload>) {
      state.toast = { ...action.payload, id: Date.now().toString() };
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
