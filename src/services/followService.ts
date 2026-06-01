import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';

const FOLLOWS_KEY = '@social_connect_follows';

export interface FollowRecord {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface FollowStats {
  followers: number;
  following: number;
}

const followDocId = (followerId: string, followingId: string): string =>
  `${followerId}_${followingId}`;

const getLocalFollows = async (): Promise<FollowRecord[]> => {
  const raw = await AsyncStorage.getItem(FOLLOWS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalFollows = async (follows: FollowRecord[]): Promise<void> => {
  await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
};

export const followService = {
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }

    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('id', followDocId(followerId, followingId))
        .maybeSingle();

      if (existing) return;

      const { error } = await supabase.from('follows').insert({
        id: followDocId(followerId, followingId),
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) throw new Error(error.message);
      return;
    }

    const follows = await getLocalFollows();
    const exists = follows.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
    if (exists) return;

    await saveLocalFollows([
      ...follows,
      { followerId, followingId, createdAt: new Date().toISOString() },
    ]);
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followDocId(followerId, followingId));

      if (error) throw new Error(error.message);
      return;
    }

    const follows = await getLocalFollows();
    await saveLocalFollows(
      follows.filter(f => !(f.followerId === followerId && f.followingId === followingId))
    );
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('id', followDocId(followerId, followingId))
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data !== null;
    }

    const follows = await getLocalFollows();
    return follows.some(f => f.followerId === followerId && f.followingId === followingId);
  },

  async getFollowingIds(followerId: string): Promise<string[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', followerId);

      if (error) throw new Error(error.message);
      return (data ?? []).map(row => row.following_id as string);
    }

    const follows = await getLocalFollows();
    return follows.filter(f => f.followerId === followerId).map(f => f.followingId);
  },

  async getFollowStats(userId: string): Promise<FollowStats> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);

      if (followersRes.error) throw new Error(followersRes.error.message);
      if (followingRes.error) throw new Error(followingRes.error.message);

      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    }

    const follows = await getLocalFollows();
    return {
      followers: follows.filter(f => f.followingId === userId).length,
      following: follows.filter(f => f.followerId === userId).length,
    };
  },
};