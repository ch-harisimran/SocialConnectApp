import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { InteractionManager } from 'react-native';
import { mockPostsService, Post } from '../../services/mockPosts';
import { notificationService } from '../../services/notificationService';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import { showToast } from './uiSlice';
import type { RootState } from '../index';

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastSyncedAt: number | null;
  hasNewActivity: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  isLoading: true,
  isRefreshing: false,
  lastSyncedAt: null,
  hasNewActivity: false,
  error: null,
};

const deferSupabaseSync = (posts: Post[]): void => {
  InteractionManager.runAfterInteractions(() => {
    supabaseSyncService.syncAllPosts(posts);
    supabaseSyncService.syncAllProfiles();
  });
};

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async (_, { getState }) => {
  const posts = await mockPostsService.fetchPosts();
  deferSupabaseSync(posts);

  const { auth } = getState() as RootState;
  if (auth.user) {
    await notificationService.seedActivitySnapshot(auth.user.id, posts);
  }

  return posts;
});

export const refreshPosts = createAsyncThunk('posts/refreshPosts', async (_, { getState }) => {
  const state = getState() as RootState;
  const previousPosts = state.posts.posts;
  const posts = await mockPostsService.fetchPosts();

  InteractionManager.runAfterInteractions(() => {
    supabaseSyncService.syncAllPosts(posts);
  });

  const { auth, settings } = state;
  if (auth.user && settings.notificationsEnabled) {
    await notificationService.processAuthorActivity(auth.user.id, previousPosts, posts);
  }

  return posts;
});

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (payload: { content: string; imageUri: string | null }, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    return await mockPostsService.createPost({
      authorId: auth.user.id,
      authorName: auth.user.name,
      authorAvatar: auth.user.avatar,
      content: payload.content,
      imageUri: payload.imageUri,
    });
  }
);

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { auth, posts, settings } = state;
    if (!auth.user) throw new Error('Not authenticated.');

    const post = posts.posts.find(p => p.id === postId);
    const updated = await mockPostsService.toggleLike(postId, auth.user.id);

    const isLiking = updated.likes.includes(auth.user.id);
    if (isLiking && post) {
      dispatch(showToast({ icon: '❤️', message: `You liked ${post.authorName}'s post!`, type: 'like' }));
      if (settings.notificationsEnabled) {
        await notificationService.notifyPostLiked({
          post,
          likerId: auth.user.id,
          likerName: auth.user.name,
          currentUserId: auth.user.id,
        });
      }
    }

    return updated;
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, text }: { postId: string; text: string }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { auth, posts, settings } = state;
    if (!auth.user) throw new Error('Not authenticated.');

    const post = posts.posts.find(p => p.id === postId);
    const updated = await mockPostsService.addComment(
      postId,
      { id: auth.user.id, name: auth.user.name, avatar: auth.user.avatar },
      text
    );

    if (post) {
      const preview = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      dispatch(showToast({ icon: '💬', message: `Comment posted: "${preview}"`, type: 'comment' }));
      if (settings.notificationsEnabled) {
        await notificationService.notifyPostCommented({
          post,
          commenterId: auth.user.id,
          commenterName: auth.user.name,
          commentText: text,
          currentUserId: auth.user.id,
        });
      }
    }

    return updated;
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ postId, commentId }: { postId: string; commentId: string }, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    return await mockPostsService.deleteComment(postId, commentId, auth.user.id);
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId: string, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    await mockPostsService.deletePost(postId, auth.user.id);
    dispatch(showToast({ icon: '🗑️', message: 'Post deleted.', type: 'comment' }));
    return postId;
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async (
    payload: { postId: string; content: string; imageUri: string | null },
    { getState, dispatch }
  ) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    const updated = await mockPostsService.updatePost(payload.postId, auth.user.id, {
      content: payload.content,
      imageUri: payload.imageUri,
    });
    dispatch(showToast({ icon: '✏️', message: 'Post updated.', type: 'comment' }));
    return updated;
  }
);

function detectNewActivity(current: Post[], incoming: Post[]): boolean {
  for (const next of incoming) {
    const prev = current.find(p => p.id === next.id);
    if (!prev) return true;
    if (next.likes.length !== prev.likes.length) return true;
    if (next.comments.length !== prev.comments.length) return true;
  }
  return false;
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearNewActivity(state) {
      state.hasNewActivity = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.isLoading = false;
        state.error = null;
        state.lastSyncedAt = Date.now();
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to load posts.';
      })
      .addCase(refreshPosts.pending, state => {
        state.isRefreshing = true;
      })
      .addCase(refreshPosts.fulfilled, (state, action) => {
        const activity = detectNewActivity(state.posts, action.payload);
        state.posts = action.payload;
        state.isRefreshing = false;
        state.lastSyncedAt = Date.now();
        if (activity) state.hasNewActivity = true;
      })
      .addCase(refreshPosts.rejected, state => {
        state.isRefreshing = false;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const idx = state.posts.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.posts[idx] = action.payload;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const idx = state.posts.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.posts[idx] = action.payload;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const idx = state.posts.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.posts[idx] = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p.id !== action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const idx = state.posts.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.posts[idx] = action.payload;
      });
  },
});

export const { clearNewActivity } = postsSlice.actions;
export default postsSlice.reducer;
