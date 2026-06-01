import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  searchService,
  SearchPostResult,
  SearchUserResult,
} from '../../services/searchService';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme } from '../../utils/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Search'>;
type Filter = 'all' | 'users' | 'posts';

type ListItem =
  | { type: 'section'; title: string; key: string }
  | { type: 'user'; data: SearchUserResult; key: string }
  | { type: 'post'; data: SearchPostResult; key: string };

const UserRow: React.FC<{
  user: SearchUserResult;
  onPress: () => void;
}> = ({ user, onPress }) => {
  const t = useTheme();
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {user.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: t.accent }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: t.text }]}>{user.name}</Text>
        <Text style={[styles.rowSub, { color: t.subtext }]} numberOfLines={1}>
          {user.bio || 'No bio yet'}
        </Text>
      </View>
      <Text style={[styles.rowChevron, { color: t.placeholder }]}>›</Text>
    </TouchableOpacity>
  );
};

const PostRow: React.FC<{
  post: SearchPostResult;
  onPress: () => void;
}> = ({ post, onPress }) => {
  const t = useTheme();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.postIcon, { backgroundColor: t.accentLight }]}>
        <Text style={styles.postIconText}>📝</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: t.text }]} numberOfLines={1}>
          {post.authorName}
        </Text>
        <Text style={[styles.rowSub, { color: t.text }]} numberOfLines={2}>
          {post.content || '(Image post)'}
        </Text>
        <Text style={[styles.rowMeta, { color: t.subtext }]}>
          {formatTimeAgo(post.createdAt)}
        </Text>
      </View>
      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.postThumb} />
      ) : null}
    </TouchableOpacity>
  );
};

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [results, setResults] = useState<{ users: SearchUserResult[]; posts: SearchPostResult[] }>({
    users: [],
    posts: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ users: [], posts: [] });
      setError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await searchService.search(trimmed);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed.');
        setResults({ users: [], posts: [] });
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    const showUsers = filter === 'all' || filter === 'users';
    const showPosts = filter === 'all' || filter === 'posts';

    if (showUsers && results.users.length > 0) {
      if (filter === 'all') items.push({ type: 'section', title: 'Users', key: 'section-users' });
      results.users.forEach(u =>
        items.push({ type: 'user', data: u, key: `user-${u.id}` })
      );
    }

    if (showPosts && results.posts.length > 0) {
      if (filter === 'all') items.push({ type: 'section', title: 'Posts', key: 'section-posts' });
      results.posts.forEach(p =>
        items.push({ type: 'post', data: p, key: `post-${p.id}` })
      );
    }

    return items;
  }, [filter, results]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'section') {
        return (
          <Text style={[styles.sectionTitle, { color: t.subtext }]}>{item.title}</Text>
        );
      }
      if (item.type === 'user') {
        return (
          <UserRow
            user={item.data}
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: item.data.id,
                userName: item.data.name,
              })
            }
          />
        );
      }
      return (
        <PostRow
          post={item.data}
          onPress={() => navigation.navigate('Comments', { postId: item.data.id })}
        />
      );
    },
    [navigation, t.subtext]
  );

  const emptyMessage = useMemo(() => {
    if (query.trim().length < 2) return 'Type at least 2 characters to search.';
    if (isSearching) return null;
    if (error) return error;
    return 'No users or posts found.';
  }, [query, isSearching, error]);

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: t.header,
            borderBottomColor: t.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={[styles.backText, { color: t.accent }]}>←</Text>
        </TouchableOpacity>
        <View style={[styles.searchBox, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: t.text }]}
            placeholder="Search users or posts…"
            placeholderTextColor={t.placeholder}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Text style={[styles.clearBtn, { color: t.subtext }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.filters, { borderBottomColor: t.border }]}>
        {(['all', 'users', 'posts'] as Filter[]).map(option => {
          const active = filter === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: t.accent }
                  : { backgroundColor: t.inputBg, borderColor: t.border, borderWidth: StyleSheet.hairlineWidth },
              ]}
              onPress={() => setFilter(option)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? '#fff' : t.subtext },
                ]}
              >
                {option === 'all' ? 'All' : option === 'users' ? 'Users' : 'Posts'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isSearching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.accent} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            listData.length === 0 && styles.listEmpty,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            emptyMessage ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: t.subtext }]}>{emptyMessage}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { width: 32 },
  backText: { fontSize: 24 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  clearBtn: { fontSize: 16, fontWeight: '700' },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  listEmpty: { flexGrow: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  postIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postIconText: { fontSize: 22 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  rowSub: { fontSize: 14, lineHeight: 20 },
  rowMeta: { fontSize: 12, marginTop: 4 },
  rowChevron: { fontSize: 22 },
  postThumb: { width: 44, height: 44, borderRadius: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});

export default SearchScreen;
