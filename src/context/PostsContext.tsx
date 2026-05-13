import React, { createContext, useContext, useEffect } from 'react';
import { Post } from '../services/mockPosts';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchPosts,
  refreshPosts as refreshPostsThunk,
  createPost as createPostThunk,
  toggleLike as toggleLikeThunk,
  addComment as addCommentThunk,
  deleteComment as deleteCommentThunk,
  deletePost as deletePostThunk,
} from '../store/slices/postsSlice';

interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  refreshPosts: () => Promise<void>;
  createPost: (content: string, imageUri: string | null) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(state => state.posts.posts);
  const isLoading = useAppSelector(state => state.posts.isLoading);
  const isRefreshing = useAppSelector(state => state.posts.isRefreshing);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  const refreshPosts = async () => {
    await dispatch(refreshPostsThunk());
  };

  const createPost = async (content: string, imageUri: string | null) => {
    const result = await dispatch(createPostThunk({ content, imageUri }));
    if (createPostThunk.rejected.match(result)) {
      throw new Error(result.error.message ?? 'Failed to create post.');
    }
  };

  const toggleLike = async (postId: string) => {
    await dispatch(toggleLikeThunk(postId));
  };

  const addComment = async (postId: string, text: string) => {
    const result = await dispatch(addCommentThunk({ postId, text }));
    if (addCommentThunk.rejected.match(result)) {
      throw new Error(result.error.message ?? 'Failed to add comment.');
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    await dispatch(deleteCommentThunk({ postId, commentId }));
  };

  const deletePost = async (postId: string) => {
    await dispatch(deletePostThunk(postId));
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        isLoading,
        isRefreshing,
        refreshPosts,
        createPost,
        toggleLike,
        addComment,
        deleteComment,
        deletePost,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = (): PostsContextType => {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
};
