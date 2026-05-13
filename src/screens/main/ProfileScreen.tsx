import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const STATS = [
  { label: 'Posts', value: '12' },
  { label: 'Followers', value: '248' },
  { label: 'Following', value: '91' },
];

const MOCK_POSTS = [
  {
    id: '1',
    content: 'My first post on Social Connect! Happy to be here.',
    time: '2 days ago',
    likes: 14,
  },
  {
    id: '2',
    content: 'Working on an exciting new project. Stay tuned!',
    time: '5 days ago',
    likes: 31,
  },
  {
    id: '3',
    content: 'Great weekend hike with friends. Nature recharges everything.',
    time: '1 week ago',
    likes: 22,
  },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.coverBand} />

      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        {user?.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : (
          <Text style={styles.bioEmpty}>No bio yet — tap Edit Profile to add one.</Text>
        )}

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {STATS.map(stat => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>Your Posts</Text>
        {MOCK_POSTS.map(post => (
          <View key={post.id} style={styles.postCard}>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postTime}>{post.time}</Text>
              <Text style={styles.postLikes}>♥ {post.likes}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  coverBand: { height: 110, backgroundColor: '#6366F1' },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 8,
  },
  avatarWrapper: { marginTop: -44 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 10 },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  bio: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  bioEmpty: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontStyle: 'italic',
  },
  editButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  editButtonText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  postsSection: { paddingHorizontal: 12, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 4,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 10 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  postTime: { fontSize: 12, color: '#9CA3AF' },
  postLikes: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
});

export default ProfileScreen;
