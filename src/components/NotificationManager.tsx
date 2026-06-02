import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { notificationService } from '../services/notificationService';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';
import { refreshPosts } from '../store/slices/postsSlice';
import type { Post } from '../services/mockPosts';

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const notificationsEnabled = useAppSelector(state => state.settings.notificationsEnabled);
  const posts = useAppSelector(state => state.posts.posts);
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
  }, [user, notificationsEnabled, posts]);

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
            comments: { id: string; authorId: string; authorName: string; text: string }[];
          };

          const mappedPost: Post = {
            id: row.id,
            authorId: row.author_id,
            authorName: user.name,
            authorAvatar: user.avatar,
            content: '',
            imageUri: null,
            createdAt: new Date().toISOString(),
            likes: row.likes ?? [],
            comments: (row.comments ?? []).map(c => ({
              id: c.id,
              authorId: c.authorId,
              authorName: c.authorName,
              authorAvatar: null,
              text: c.text,
              createdAt: new Date().toISOString(),
            })),
          };

          const previous = posts.find(p => p.id === row.id);
          if (!previous) {
            dispatch(refreshPosts());
            return;
          }

          notificationService.processAuthorActivity(user.id, posts, [
            ...posts.filter(p => p.id !== row.id),
            { ...previous, likes: mappedPost.likes, comments: mappedPost.comments },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, notificationsEnabled, posts, dispatch]);

  return null;
};

export default NotificationManager;
