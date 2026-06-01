import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';

const USERS_KEY = '@social_connect_users';
const POSTS_KEY = '@social_connect_posts';

export interface SearchUserResult {
  id: string;
  name: string;
  bio: string;
  avatar: string | null;
}

export interface SearchPostResult {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUri: string | null;
  createdAt: string;
}

export interface SearchResults {
  users: SearchUserResult[];
  posts: SearchPostResult[];
}

const sanitizeQuery = (query: string): string =>
  query.trim().replace(/[%_,]/g, ' ').replace(/\s+/g, ' ');

interface ProfileRow {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
}

interface PostRow {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  image_uri: string | null;
  created_at: string;
}

const searchUsersLocal = async (query: string): Promise<SearchUserResult[]> => {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  const users: { id: string; name: string; bio: string; avatar: string | null }[] = raw
    ? JSON.parse(raw)
    : [];
  const lower = query.toLowerCase();

  return users
    .filter(u => u.name.toLowerCase().includes(lower))
    .slice(0, 20)
    .map(u => ({ id: u.id, name: u.name, bio: u.bio, avatar: u.avatar }));
};

const searchPostsLocal = async (query: string): Promise<SearchPostResult[]> => {
  const raw = await AsyncStorage.getItem(POSTS_KEY);
  const posts: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    imageUri: string | null;
    createdAt: string;
  }[] = raw ? JSON.parse(raw) : [];
  const lower = query.toLowerCase();

  return posts
    .filter(
      p =>
        p.content.toLowerCase().includes(lower) || p.authorName.toLowerCase().includes(lower)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map(p => ({
      id: p.id,
      authorId: p.authorId,
      authorName: p.authorName,
      content: p.content,
      imageUri: p.imageUri ?? null,
      createdAt: p.createdAt,
    }));
};

export const searchService = {
  async search(query: string): Promise<SearchResults> {
    const cleaned = sanitizeQuery(query);
    if (cleaned.length < 2) {
      return { users: [], posts: [] };
    }

    const pattern = `%${cleaned}%`;
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const [usersRes, byContentRes, byAuthorRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, bio, avatar')
          .ilike('name', pattern)
          .limit(20),
        supabase
          .from('posts')
          .select('id, author_id, author_name, content, image_uri, created_at')
          .ilike('content', pattern)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('posts')
          .select('id, author_id, author_name, content, image_uri, created_at')
          .ilike('author_name', pattern)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (usersRes.error) throw new Error(usersRes.error.message);
      if (byContentRes.error) throw new Error(byContentRes.error.message);
      if (byAuthorRes.error) throw new Error(byAuthorRes.error.message);

      const postsMap = new Map<string, PostRow>();
      [...(byContentRes.data ?? []), ...(byAuthorRes.data ?? [])].forEach(row => {
        postsMap.set(row.id, row as PostRow);
      });

      const posts = Array.from(postsMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      return {
        users: (usersRes.data ?? []).map((row: ProfileRow) => ({
          id: row.id,
          name: row.name,
          bio: row.bio ?? '',
          avatar: row.avatar,
        })),
        posts: posts.map(row => ({
          id: row.id,
          authorId: row.author_id,
          authorName: row.author_name,
          content: row.content,
          imageUri: row.image_uri,
          createdAt: row.created_at,
        })),
      };
    }

    const [users, posts] = await Promise.all([
      searchUsersLocal(cleaned),
      searchPostsLocal(cleaned),
    ]);

    return { users, posts };
  },
};
