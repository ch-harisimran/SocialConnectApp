import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { Post } from '../services/mockPosts';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchPosts,
  refreshPosts as refreshPostsThunk,
  createPost as createPostThunk,
  updatePost as updatePostThunk,
  toggleLike as toggleLikeThunk,
  addComment as addCommentThunk,
  deleteComment as deleteCommentThunk,
  deletePost as deletePostThunk,
  resetPosts,
} from '../store/slices/postsSlice';

interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  refreshPosts: () => Promise<void>;
  createPost: (content: string, imageUri: string | null) => Promise<void>;
  updatePost: (postId: string, content: string, imageUri: string | null) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(state => state.auth.user?.id);
  const posts = useAppSelector(state => state.posts.posts);
  const isLoading = useAppSelector(state => state.posts.isLoading);
  const isRefreshing = useAppSelector(state => state.posts.isRefreshing);

  useEffect(() => {
    if (userId) {
      dispatch(fetchPosts());
    } else {
      dispatch(resetPosts());
    }
  }, [userId, dispatch]);

  const refreshPosts = useCallback(async () => {
    await dispatch(refreshPostsThunk());
  }, [dispatch]);

  const createPost = useCallback(
    async (content: string, imageUri: string | null) => {
      const result = await dispatch(createPostThunk({ content, imageUri }));
      if (createPostThunk.rejected.match(result)) {
        throw new Error(result.error.message ?? 'Failed to create post.');
      }
    },
    [dispatch]
  );

  const updatePost = useCallback(
    async (postId: string, content: string, imageUri: string | null) => {
      const result = await dispatch(updatePostThunk({ postId, content, imageUri }));
      if (updatePostThunk.rejected.match(result)) {
        throw new Error(result.error.message ?? 'Failed to update post.');
      }
    },
    [dispatch]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const result = await dispatch(toggleLikeThunk(postId));
      if (toggleLikeThunk.rejected.match(result)) {
        throw new Error(result.error.message ?? 'Failed to update like.');
      }
    },
    [dispatch]
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      const result = await dispatch(addCommentThunk({ postId, text }));
      if (addCommentThunk.rejected.match(result)) {
        throw new Error(result.error.message ?? 'Failed to add comment.');
      }
    },
    [dispatch]
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      const result = await dispatch(deleteCommentThunk({ postId, commentId }));
      if (deleteCommentThunk.rejected.match(result)) {
        throw new Error(result.error.message ?? 'Failed to delete comment.');
      }
    },
    [dispatch]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const result = await dispatch(deletePostThunk(postId));
      if (deletePostThunk.rejected.match(result)) {
        throw new Error(result.error.message ?? 'Failed to delete post.');
      }
    },
    [dispatch]
  );

  const contextValue = useMemo(
    () => ({
      posts,
      isLoading,
      isRefreshing,
      refreshPosts,
      createPost,
      updatePost,
      toggleLike,
      addComment,
      deleteComment,
      deletePost,
    }),
    [
      posts,
      isLoading,
      isRefreshing,
      refreshPosts,
      createPost,
      updatePost,
      toggleLike,
      addComment,
      deleteComment,
      deletePost,
    ]
  );

  return <PostsContext.Provider value={contextValue}>{children}</PostsContext.Provider>;
};

export const usePosts = (): PostsContextType => {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
};
