import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockAuth, AuthUser } from '../../services/mockAuth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

export const loadSession = createAsyncThunk('auth/loadSession', async () => {
  return await mockAuth.getSession();
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    return await mockAuth.login(email, password);
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ name, email, password }: { name: string; email: string; password: string }) => {
    return await mockAuth.signUp(name, email, password);
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await mockAuth.logout();
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({
    userId,
    updates,
  }: {
    userId: string;
    updates: { name: string; bio: string; avatar: string | null };
  }) => {
    return await mockAuth.updateProfile(userId, updates);
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(loadSession.rejected, state => {
        state.isLoading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.error.message ?? 'Login failed.';
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.error = action.error.message ?? 'Sign up failed.';
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
