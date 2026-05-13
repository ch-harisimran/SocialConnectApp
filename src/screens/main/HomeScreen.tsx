import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const MOCK_POSTS = [
  {
    id: '1',
    author: 'Alice Johnson',
    avatar: 'AJ',
    time: '2m ago',
    content: 'Just launched my new project! Really excited to share it with everyone here 🚀',
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    author: 'Bob Martinez',
    avatar: 'BM',
    time: '15m ago',
    content:
      'Beautiful morning for a run. Sometimes the best ideas come when you step away from the screen.',
    likes: 41,
    comments: 8,
  },
  {
    id: '3',
    author: 'Carol White',
    avatar: 'CW',
    time: '1h ago',
    content:
      'Reading "Atomic Habits" for the third time. Always find something new in it. Highly recommend!',
    likes: 18,
    comments: 3,
  },
  {
    id: '4',
    author: 'David Kim',
    avatar: 'DK',
    time: '3h ago',
    content: 'Just hit 1000 followers — thank you all! This community is truly amazing.',
    likes: 132,
    comments: 27,
  },
];

const PostCard: React.FC<(typeof MOCK_POSTS)[0]> = ({
  author,
  avatar,
  time,
  content,
  likes,
  comments,
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{avatar}</Text>
      </View>
      <View style={styles.authorInfo}>
        <Text style={styles.authorName}>{author}</Text>
        <Text style={styles.postTime}>{time}</Text>
      </View>
    </View>
    <Text style={styles.postContent}>{content}</Text>
    <View style={styles.cardFooter}>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>♥ {likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>💬 {comments}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>↗ Share</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Connect</Text>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.composerBar} activeOpacity={0.7}>
        <View style={styles.composerAvatar}>
          <Text style={styles.composerAvatarText}>
            {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
          </Text>
        </View>
        <Text style={styles.composerPlaceholder}>{"What's on your mind?"}</Text>
      </TouchableOpacity>

      <FlatList
        data={MOCK_POSTS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard {...item} />}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#6366F1' },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  composerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  composerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composerPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  feed: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  postTime: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    gap: 16,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
});

export default HomeScreen;
