import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { mockAuth } from '../../services/mockAuth';
import { Post } from '../../services/mockPosts';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'UserProfile'>;
type Route = RouteProp<HomeStackParamList, 'UserProfile'>;

interface PublicProfile {
  id: string;
  name: string;
  bio: string;
  avatar: string | null;
}

const PostTile: React.FC<{ post: Post; onPress: () => void }> = ({ post, onPress }) => (
  <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.postContent} numberOfLines={3}>
      {post.content}
    </Text>
    {post.imageUri ? (
      <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
    ) : null}
    <View style={styles.postMeta}>
      <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
      <View style={styles.postStats}>
        <Text style={styles.postStat}>♥ {post.likes.length}</Text>
        <Text style={styles.postStat}>💬 {post.comments.length}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { userId, userName } = route.params;

  const { posts } = usePosts();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.id === userId;
  const userPosts = posts.filter(p => p.authorId === userId);

  useEffect(() => {
    mockAuth.getPublicProfile(userId).then(data => {
      if (data) {
        setProfile(data);
      } else {
        // Fall back to data embedded in posts if user registered on another device
        const anyPost = posts.find(p => p.authorId === userId);
        if (anyPost) {
          setProfile({
            id: userId,
            name: anyPost.authorName,
            bio: '',
            avatar: anyPost.authorAvatar,
          });
        }
      }
      setIsLoading(false);
    });
  }, [userId, posts]);

  const initials = (profile?.name ?? userName).slice(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <FlatList
      data={userPosts}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          {/* Top bar */}
          <View style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBack}>
              <Text style={styles.navBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle} numberOfLines={1}>
              {profile?.name ?? userName}
            </Text>
            <View style={styles.navBack} />
          </View>

          {/* Cover + avatar */}
          <View style={styles.coverBand} />
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>

            <View style={styles.nameRow}>
              <View style={styles.nameBlock}>
                <Text style={styles.name}>{profile?.name ?? userName}</Text>
                {profile?.bio ? (
                  <Text style={styles.bio}>{profile.bio}</Text>
                ) : (
                  <Text style={styles.bioEmpty}>No bio yet.</Text>
                )}
              </View>

              {!isOwnProfile && (
                <TouchableOpacity
                  style={[styles.followBtn, isFollowing && styles.followingBtn]}
                  onPress={() => setIsFollowing(prev => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{isFollowing ? 1 : 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>
            {userPosts.length === 0 ? 'No posts yet' : `Posts · ${userPosts.length}`}
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <PostTile
          post={item}
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted yet."}
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  listContent: { paddingBottom: 32, backgroundColor: '#F3F4F6' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navBack: { width: 36 },
  navBackText: { fontSize: 22, color: '#6366F1' },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  coverBand: { height: 100, backgroundColor: '#6366F1' },
  profileSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 8,
  },
  avatarWrapper: { marginTop: -40, marginBottom: 10 },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarInitials: { fontSize: 26, fontWeight: '800', color: '#fff' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  nameBlock: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bio: { fontSize: 14, color: '#374151', lineHeight: 20 },
  bioEmpty: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    marginTop: 2,
  },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#6366F1' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  followingBtnText: { color: '#6366F1' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 8 },
  postImage: { width: '100%', height: 160, borderRadius: 8, marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postTime: { fontSize: 12, color: '#9CA3AF' },
  postStats: { flexDirection: 'row', gap: 12 },
  postStat: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
});

export default UserProfileScreen;
