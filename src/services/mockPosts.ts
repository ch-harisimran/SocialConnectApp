import AsyncStorage from '@react-native-async-storage/async-storage';

const POSTS_KEY = '@social_connect_posts';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  imageUri: string | null;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

const getPosts = async (): Promise<Post[]> => {
  const raw = await AsyncStorage.getItem(POSTS_KEY);
  if (!raw) return [];
  const parsed: Post[] = JSON.parse(raw);
  // Back-fill comments array for posts created before this field existed
  return parsed.map(p => ({ ...p, comments: p.comments ?? [] }));
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
      comments: [],
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

  async addComment(
    postId: string,
    author: { id: string; name: string; avatar: string | null },
    text: string
  ): Promise<Post> {
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error('Post not found.');

    const newComment: Comment = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      text,
      createdAt: new Date().toISOString(),
    };
    posts[index] = { ...posts[index], comments: [...posts[index].comments, newComment] };
    await savePosts(posts);
    return posts[index];
  },

  async deleteComment(postId: string, commentId: string, userId: string): Promise<Post> {
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error('Post not found.');

    const comment = posts[index].comments.find(c => c.id === commentId);
    if (!comment) throw new Error('Comment not found.');
    if (comment.authorId !== userId) throw new Error('You can only delete your own comments.');

    posts[index] = {
      ...posts[index],
      comments: posts[index].comments.filter(c => c.id !== commentId),
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

  async updatePost(
    postId: string,
    userId: string,
    updates: { content: string; imageUri: string | null }
  ): Promise<Post> {
    const trimmed = updates.content.trim();
    if (!trimmed) throw new Error('Post content cannot be empty.');

    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error('Post not found.');
    if (posts[index].authorId !== userId) throw new Error('You can only edit your own posts.');

    posts[index] = {
      ...posts[index],
      content: trimmed,
      imageUri: updates.imageUri,
    };
    await savePosts(posts);
    return posts[index];
  },
};
