import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@social_connect_settings';

interface SettingsState {
  notificationsEnabled: boolean;
  isDarkMode: boolean;
}

const initialState: SettingsState = {
  notificationsEnabled: true,
  isDarkMode: false,
};

export const loadSettings = createAsyncThunk('settings/load', async () => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? (JSON.parse(raw) as SettingsState) : initialState;
});

export const setNotificationsEnabled = createAsyncThunk(
  'settings/setNotificationsEnabled',
  async (enabled: boolean, { getState }) => {
    const state = (getState() as { settings: SettingsState }).settings;
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...state, notificationsEnabled: enabled })
    );
    return enabled;
  }
);

export const setDarkMode = createAsyncThunk(
  'settings/setDarkMode',
  async (enabled: boolean, { getState }) => {
    const state = (getState() as { settings: SettingsState }).settings;
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...state, isDarkMode: enabled })
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
        state.isDarkMode = action.payload.isDarkMode ?? false;
      })
      .addCase(setNotificationsEnabled.fulfilled, (state, action) => {
        state.notificationsEnabled = action.payload;
      })
      .addCase(setDarkMode.fulfilled, (state, action) => {
        state.isDarkMode = action.payload;
      });
  },
});

export default settingsSlice.reducer;
