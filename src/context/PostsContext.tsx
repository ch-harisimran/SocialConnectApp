import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { mockPostsService, Post } from '../services/mockPosts';
import { useAuth } from './AuthContext';

interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  refreshPosts: () => Promise<void>;
  createPost: (content: string, imageUri: string | null) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    mockPostsService.fetchPosts().then(fetched => {
      if (mountedRef.current) {
        setPosts(fetched);
        setIsLoading(false);
      }
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshPosts = async () => {
    setIsRefreshing(true);
    const fetched = await mockPostsService.fetchPosts();
    setPosts(fetched);
    setIsRefreshing(false);
  };

  const createPost = async (content: string, imageUri: string | null) => {
    if (!user) throw new Error('Not authenticated.');
    const newPost = await mockPostsService.createPost({
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content,
      imageUri,
    });
    setPosts(prev => [newPost, ...prev]);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const updated = await mockPostsService.toggleLike(postId, user.id);
    setPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await mockPostsService.deletePost(postId, user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <PostsContext.Provider
      value={{ posts, isLoading, isRefreshing, refreshPosts, createPost, toggleLike, deletePost }}
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
