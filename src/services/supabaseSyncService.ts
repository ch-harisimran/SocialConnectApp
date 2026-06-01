import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';
import { Post } from './mockPosts';
import { AuthUser } from './mockAuth';

const USERS_KEY = '@social_connect_users';

export const supabaseSyncService = {
  async upsertProfile(user: AuthUser): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      },
      { onConflict: 'id' }
    );

    if (error) console.warn('Profile sync failed:', error.message);
  },

  async upsertPost(post: Post): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    const { error } = await supabase.from('posts').upsert(
      {
        id: post.id,
        author_id: post.authorId,
        author_name: post.authorName,
        author_avatar: post.authorAvatar,
        content: post.content,
        image_uri: post.imageUri,
        created_at: post.createdAt,
        likes: post.likes,
        comments: post.comments,
      },
      { onConflict: 'id' }
    );

    if (error) console.warn('Post sync failed:', error.message);
  },

  async deletePost(postId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) console.warn('Post delete sync failed:', error.message);
  },

  async syncAllPosts(posts: Post[]): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured() || posts.length === 0) return;

    const rows = posts.map(post => ({
      id: post.id,
      author_id: post.authorId,
      author_name: post.authorName,
      author_avatar: post.authorAvatar,
      content: post.content,
      image_uri: post.imageUri,
      created_at: post.createdAt,
      likes: post.likes,
      comments: post.comments,
    }));

    const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'id' });
    if (error) console.warn('Bulk post sync failed:', error.message);
  },

  async syncAllProfiles(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) return;

    const users: { id: string; name: string; email: string; bio: string; avatar: string | null }[] =
      JSON.parse(raw);

    if (users.length === 0) return;

    const rows = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      bio: u.bio,
      avatar: u.avatar,
    }));

    const { error } = await supabase.from('profiles').upsert(rows, { onConflict: 'id' });
    if (error) console.warn('Bulk profile sync failed:', error.message);
  },
};
