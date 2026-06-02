import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { notificationService } from '../services/notificationService';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';
import { refreshPosts } from '../store/slices/postsSlice';
import type { Post, Comment } from '../services/mockPosts';

type RawComment = {
  id: string;
  authorId?: string;
  author_id?: string;
  authorName?: string;
  author_name?: string;
  authorAvatar?: string | null;
  author_avatar?: string | null;
  text: string;
  createdAt?: string;
  created_at?: string;
};

const mapComments = (raw: RawComment[]): Comment[] =>
  raw.map(c => ({
    id: c.id,
    authorId: c.authorId ?? c.author_id ?? '',
    authorName: c.authorName ?? c.author_name ?? 'Someone',
    authorAvatar: c.authorAvatar ?? c.author_avatar ?? null,
    text: c.text,
    createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
  }));

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const notificationsEnabled = useAppSelector(state => state.settings.notificationsEnabled);
  const posts = useAppSelector(state => state.posts.posts);
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const seededRef = useRef(false);

  useEffect(() => {
    if (!user || !notificationsEnabled) return;

    const setup = async () => {
      await notificationService.registerPushToken(user.id);
      await notificationService.deliverPendingForUser(user.id);
    };

    setup();
  }, [user, notificationsEnabled]);

  useEffect(() => {
    if (!user || !notificationsEnabled || posts.length === 0 || seededRef.current) return;
    notificationService.seedActivitySnapshot(user.id, posts);
    seededRef.current = true;
  }, [user, notificationsEnabled, posts.length]);

  useEffect(() => {
    if (!user || !notificationsEnabled) {
      seededRef.current = false;
      notificationService.clearActivitySnapshot();
    }
  }, [user, notificationsEnabled]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured() || !user || !notificationsEnabled) return;

    const channel = supabase
      .channel(`post-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `author_id=eq.${user.id}`,
        },
        payload => {
          const row = payload.new as {
            id: string;
            author_id: string;
            likes: string[];
            comments: RawComment[];
          };

          const currentPosts = postsRef.current;
          const previous = currentPosts.find(p => p.id === row.id);
          if (!previous) {
            dispatch(refreshPosts());
            return;
          }

          const updatedPost: Post = {
            ...previous,
            likes: row.likes ?? [],
            comments: mapComments(row.comments ?? []),
          };

          notificationService.processAuthorActivity(user.id, currentPosts, [
            ...currentPosts.filter(p => p.id !== row.id),
            updatedPost,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, notificationsEnabled, dispatch]);

  return null;
};

export default NotificationManager;
