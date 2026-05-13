import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@social_connect_settings';

interface SettingsState {
  notificationsEnabled: boolean;
}

const initialState: SettingsState = {
  notificationsEnabled: true,
};

export const loadSettings = createAsyncThunk('settings/load', async () => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? (JSON.parse(raw) as SettingsState) : initialState;
});

export const setNotificationsEnabled = createAsyncThunk(
  'settings/setNotificationsEnabled',
  async (enabled: boolean) => {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const current: SettingsState = raw ? JSON.parse(raw) : initialState;
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...current, notificationsEnabled: enabled })
    );
    return enabled;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.notificationsEnabled = action.payload.notificationsEnabled ?? true;
      })
      .addCase(setNotificationsEnabled.fulfilled, (state, action) => {
        state.notificationsEnabled = action.payload;
      });
  },
});

export default settingsSlice.reducer;
