import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockPostsService, Post } from '../../services/mockPosts';
import { notificationService } from '../../services/notificationService';
import { RootState } from '../index';

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
}

const initialState: PostsState = {
  posts: [],
  isLoading: true,
  isRefreshing: false,
};

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  return await mockPostsService.fetchPosts();
});

export const refreshPosts = createAsyncThunk('posts/refreshPosts', async () => {
  return await mockPostsService.fetchPosts();
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
  async (postId: string, { getState }) => {
    const state = getState() as RootState;
    const { auth, posts, settings } = state;
    if (!auth.user) throw new Error('Not authenticated.');

    const post = posts.posts.find(p => p.id === postId);
    const updated = await mockPostsService.toggleLike(postId, auth.user.id);

    const isLiking = updated.likes.includes(auth.user.id);
    if (settings.notificationsEnabled && post && post.authorId !== auth.user.id && isLiking) {
      notificationService.scheduleLocalNotification(
        '❤️ New Like',
        `${auth.user.name} liked ${post.authorName}'s post`
      );
    }

    return updated;
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, text }: { postId: string; text: string }, { getState }) => {
    const state = getState() as RootState;
    const { auth, posts, settings } = state;
    if (!auth.user) throw new Error('Not authenticated.');

    const post = posts.posts.find(p => p.id === postId);
    const updated = await mockPostsService.addComment(
      postId,
      { id: auth.user.id, name: auth.user.name, avatar: auth.user.avatar },
      text
    );

    if (settings.notificationsEnabled && post && post.authorId !== auth.user.id) {
      const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
      notificationService.scheduleLocalNotification(
        '💬 New Comment',
        `${auth.user.name} commented on ${post.authorName}'s post: "${preview}"`
      );
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
  async (postId: string, { getState }) => {
    const { auth } = getState() as RootState;
    if (!auth.user) throw new Error('Not authenticated.');
    await mockPostsService.deletePost(postId, auth.user.id);
    return postId;
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.isLoading = false;
      })
      .addCase(refreshPosts.pending, state => {
        state.isRefreshing = true;
      })
      .addCase(refreshPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.isRefreshing = false;
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
      });
  },
});

export default postsSlice.reducer;
