import AsyncStorage from '@react-native-async-storage/async-storage';

const POSTS_KEY = '@social_connect_posts';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  imageUri: string | null;
  createdAt: string;
  likes: string[];
}

const getPosts = async (): Promise<Post[]> => {
  const raw = await AsyncStorage.getItem(POSTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const savePosts = async (posts: Post[]): Promise<void> => {
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const mockPostsService = {
  async fetchPosts(): Promise<Post[]> {
    const posts = await getPosts();
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createPost(data: {
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    imageUri: string | null;
  }): Promise<Post> {
    const posts = await getPosts();
    const newPost: Post = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...data,
      createdAt: new Date().toISOString(),
      likes: [],
    };
    await savePosts([newPost, ...posts]);
    return newPost;
  },

  async toggleLike(postId: string, userId: string): Promise<Post> {
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error('Post not found.');

    const post = posts[index];
    const alreadyLiked = post.likes.includes(userId);
    posts[index] = {
      ...post,
      likes: alreadyLiked ? post.likes.filter(id => id !== userId) : [...post.likes, userId],
    };
    await savePosts(posts);
    return posts[index];
  },

  async deletePost(postId: string, userId: string): Promise<void> {
    const posts = await getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    if (post.authorId !== userId) throw new Error('You can only delete your own posts.');
    await savePosts(posts.filter(p => p.id !== postId));
  },
};
