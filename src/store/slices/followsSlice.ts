import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { followService } from '../../services/followService';
import type { RootState } from '../index';

interface ProfileFollowState {
  isFollowing: boolean;
  followers: number;
  following: number;
}

interface FollowsState {
  followingIds: string[];
  profileStates: Record<string, ProfileFollowState>;
  isLoadingFollowing: boolean;
  isProfileLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
}

const initialState: FollowsState = {
  followingIds: [],
  profileStates: {},
  isLoadingFollowing: false,
  isProfileLoading: false,
  isActionLoading: false,
  error: null,
};

export const loadFollowingIds = createAsyncThunk(
  'follows/loadFollowingIds',
  async (_, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) return [];
    return await followService.getFollowingIds(auth.user.id);
  }
);

export const loadProfileFollowState = createAsyncThunk(
  'follows/loadProfileFollowState',
  async (targetUserId: string, { getState }) => {
    const { auth } = getState() as RootState;
    const stats = await followService.getFollowStats(targetUserId);

    if (!auth.user || auth.user.id === targetUserId) {
      return { targetUserId, isFollowing: false, ...stats };
    }

    const isFollowing = await followService.isFollowing(auth.user.id, targetUserId);
    return { targetUserId, isFollowing, ...stats };
  }
);

export const followUser = createAsyncThunk(
  'follows/followUser',
  async (targetUserId: string, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    await followService.followUser(auth.user.id, targetUserId);
    return targetUserId;
  }
);

export const unfollowUser = createAsyncThunk(
  'follows/unfollowUser',
  async (targetUserId: string, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    await followService.unfollowUser(auth.user.id, targetUserId);
    return targetUserId;
  }
);

const followsSlice = createSlice({
  name: 'follows',
  initialState,
  reducers: {
    clearFollowsState(state) {
      state.followingIds = [];
      state.profileStates = {};
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadFollowingIds.pending, state => {
        state.isLoadingFollowing = true;
      })
      .addCase(loadFollowingIds.fulfilled, (state, action) => {
        state.followingIds = action.payload;
        state.isLoadingFollowing = false;
      })
      .addCase(loadFollowingIds.rejected, state => {
        state.isLoadingFollowing = false;
      })
      .addCase(loadProfileFollowState.pending, state => {
        state.isProfileLoading = true;
      })
      .addCase(loadProfileFollowState.fulfilled, (state, action) => {
        const { targetUserId, isFollowing, followers, following } = action.payload;
        state.profileStates[targetUserId] = { isFollowing, followers, following };
        state.isProfileLoading = false;
      })
      .addCase(loadProfileFollowState.rejected, (state, action) => {
        state.isProfileLoading = false;
        state.error = action.error.message ?? 'Failed to load follow state.';
      })
      .addCase(followUser.pending, state => {
        state.isActionLoading = true;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        const targetUserId = action.payload;
        state.isActionLoading = false;
        if (!state.followingIds.includes(targetUserId)) {
          state.followingIds.push(targetUserId);
        }
        const profile = state.profileStates[targetUserId];
        if (profile) {
          profile.isFollowing = true;
          profile.followers += 1;
        }
      })
      .addCase(followUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.error.message ?? 'Failed to follow user.';
      })
      .addCase(unfollowUser.pending, state => {
        state.isActionLoading = true;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const targetUserId = action.payload;
        state.isActionLoading = false;
        state.followingIds = state.followingIds.filter(id => id !== targetUserId);
        const profile = state.profileStates[targetUserId];
        if (profile) {
          profile.isFollowing = false;
          profile.followers = Math.max(0, profile.followers - 1);
        }
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.error.message ?? 'Failed to unfollow user.';
      });
  },
});

export const { clearFollowsState } = followsSlice.actions;
export default followsSlice.reducer;
