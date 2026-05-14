import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { useTheme } from '../../utils/theme';
import { rf } from '../../utils/responsive';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const STATS = [
  { label: 'Posts', value: '12', icon: '📝' },
  { label: 'Followers', value: '248', icon: '👥' },
  { label: 'Following', value: '91', icon: '➕' },
];

const MOCK_POSTS = [
  { id: '1', content: 'My first post on Social Connect! Happy to be here.', time: '2 days ago', likes: 14, comments: 3 },
  { id: '2', content: 'Working on an exciting new project. Stay tuned for updates!', time: '5 days ago', likes: 31, comments: 7 },
  { id: '3', content: 'Great weekend hike with friends. Nature truly recharges everything.', time: '1 week ago', likes: 22, comments: 5 },
];

const HIGHLIGHTS = [
  { id: '1', icon: '✈️', label: 'Travel' },
  { id: '2', icon: '📸', label: 'Photos' },
  { id: '3', icon: '💻', label: 'Tech' },
  { id: '4', icon: '🎵', label: 'Music' },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 14, stiffness: 90, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: t.bg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Cover ── */}
      <View style={[styles.cover, { paddingTop: insets.top }]}>
        {/* Decorative circles */}
        <View style={styles.coverBlobTR} />
        <View style={styles.coverBlobBL} />

        {/* Top row */}
        <View style={styles.coverTopRow}>
          <Text style={styles.coverTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.coverEditBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Text style={styles.coverEditText}>✏️  Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Avatar card ── */}
      <Animated.View
        style={[
          styles.avatarCard,
          { backgroundColor: t.card, shadowColor: t.shadow },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.avatarRow}>
          <View style={styles.avatarOuter}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={[styles.avatarImg, { borderColor: t.card }]} />
            ) : (
              <View style={[styles.avatarCircle, { borderColor: t.card }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {/* Online dot */}
            <View style={[styles.onlineDot, { borderColor: t.card }]} />
          </View>

          <View style={styles.avatarMeta}>
            <Text style={[styles.userName, { color: t.text }]}>{user?.name ?? 'User'}</Text>
            <Text style={[styles.userEmail, { color: t.subtext }]}>{user?.email ?? ''}</Text>
            {user?.bio ? (
              <Text style={[styles.userBio, { color: t.text }]}>{user.bio}</Text>
            ) : (
              <Text style={[styles.userBioEmpty, { color: t.placeholder }]}>
                No bio yet
              </Text>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: t.border }]}>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: t.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: t.subtext }]}>{stat.label}</Text>
              </View>
              {i < STATS.length - 1 && (
                <View style={[styles.statDivider, { backgroundColor: t.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      {/* ── Highlights ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Highlights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsRow}>
          {HIGHLIGHTS.map(h => (
            <TouchableOpacity
              key={h.id}
              style={[styles.highlightChip, { backgroundColor: t.card, borderColor: t.border }]}
              activeOpacity={0.75}
            >
              <View style={[styles.highlightIcon, { backgroundColor: t.accentLight }]}>
                <Text style={styles.highlightEmoji}>{h.icon}</Text>
              </View>
              <Text style={[styles.highlightLabel, { color: t.text }]}>{h.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.highlightChip, styles.highlightAdd, { borderColor: t.accent }]}
            activeOpacity={0.75}
          >
            <View style={[styles.highlightIcon, { backgroundColor: t.accentLight }]}>
              <Text style={[styles.highlightEmoji, { color: t.accent }]}>+</Text>
            </View>
            <Text style={[styles.highlightLabel, { color: t.accent }]}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Posts ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Your Posts</Text>
          <View style={[styles.postCount, { backgroundColor: t.accentLight }]}>
            <Text style={[styles.postCountText, { color: t.accent }]}>{MOCK_POSTS.length}</Text>
          </View>
        </View>

        {MOCK_POSTS.map((post, index) => (
          <Animated.View
            key={post.id}
            style={[
              styles.postCard,
              { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow },
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 8)) }],
              },
            ]}
          >
            {/* Left accent bar */}
            <View style={[styles.postAccent, { backgroundColor: t.accent }]} />
            <View style={styles.postBody}>
              <Text style={[styles.postContent, { color: t.text }]}>{post.content}</Text>
              <View style={[styles.postMeta, { borderTopColor: t.border }]}>
                <Text style={[styles.postTime, { color: t.subtext }]}>🕐  {post.time}</Text>
                <View style={styles.postStats}>
                  <Text style={[styles.postStat, { color: '#EF4444' }]}>♥ {post.likes}</Text>
                  <Text style={[styles.postStat, { color: t.subtext }]}>💬 {post.comments}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={{ height: insets.bottom + 32 }} />
    </ScrollView>
  );
};

const COVER_COLOR = '#6366F1';

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Cover
  cover: {
    backgroundColor: COVER_COLOR,
    paddingHorizontal: 20,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  coverBlobTR: {
    position: 'absolute', width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50, right: -40,
  },
  coverBlobBL: {
    position: 'absolute', width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 10, left: -20,
  },
  coverTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 16, paddingBottom: 8,
  },
  coverTitle: { fontSize: rf(2.8), fontWeight: '900', color: '#fff', letterSpacing: -0.6 },
  coverEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  coverEditText: { color: '#fff', fontSize: rf(1.45), fontWeight: '700' },

  // Avatar card
  avatarCard: {
    marginHorizontal: 16, marginTop: -36,
    borderRadius: 24, padding: 18,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 18 },
  avatarOuter: { position: 'relative' },
  avatarImg: { width: 84, height: 84, borderRadius: 42, borderWidth: 4 },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 4,
    backgroundColor: COVER_COLOR, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '900', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22C55E', borderWidth: 2.5,
  },
  avatarMeta: { flex: 1, paddingTop: 4 },
  userName: { fontSize: rf(2.1), fontWeight: '900', letterSpacing: -0.4, marginBottom: 2 },
  userEmail: { fontSize: rf(1.4), marginBottom: 6 },
  userBio: { fontSize: rf(1.5), lineHeight: 21 },
  userBioEmpty: { fontSize: rf(1.4), fontStyle: 'italic' },

  // Stats
  statsRow: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: rf(2.1), fontWeight: '900' },
  statLabel: { fontSize: rf(1.3) },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 4 },

  // Section
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: rf(1.9), fontWeight: '800', letterSpacing: -0.3 },
  postCount: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 10 },
  postCountText: { fontSize: rf(1.3), fontWeight: '800' },

  // Highlights
  highlightsRow: { marginBottom: 4 },
  highlightChip: {
    alignItems: 'center', borderRadius: 16, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, marginRight: 10, width: 72,
  },
  highlightAdd: { borderStyle: 'dashed' },
  highlightIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  highlightEmoji: { fontSize: 20 },
  highlightLabel: { fontSize: rf(1.25), fontWeight: '600' },

  // Post cards
  postCard: {
    borderRadius: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  postAccent: { width: 4, borderRadius: 0 },
  postBody: { flex: 1, padding: 14 },
  postContent: { fontSize: rf(1.55), lineHeight: 22, marginBottom: 10 },
  postMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  postTime: { fontSize: rf(1.3) },
  postStats: { flexDirection: 'row', gap: 12 },
  postStat: { fontSize: rf(1.3), fontWeight: '600' },
});

export default ProfileScreen;
