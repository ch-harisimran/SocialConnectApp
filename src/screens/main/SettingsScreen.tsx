import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setNotificationsEnabled, setDarkMode } from '../../store/slices/settingsSlice';
import { loadProfileFollowState } from '../../store/slices/followsSlice';
import { notificationService } from '../../services/notificationService';
import { useTheme } from '../../utils/theme';
import { rf } from '../../utils/responsive';
import type { MainTabParamList } from '../../navigation/MainNavigator';

type Nav = BottomTabNavigationProp<MainTabParamList, 'Settings'>;

// ─── Types ───────────────────────────────────────────────────────────────────
interface RowProps {
  icon: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}

// ─── SettingRow ───────────────────────────────────────────────────────────────
const SettingRow: React.FC<RowProps & { borderColor: string; textColor: string; subtextColor: string }> = ({
  icon, iconBg, label, sublabel, right, onPress, danger, isLast, borderColor, textColor, subtextColor,
}) => (
  <TouchableOpacity
    style={[rowStyles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.55 : 1}
  >
    <View style={[rowStyles.iconBox, { backgroundColor: iconBg }]}>
      <Text style={rowStyles.iconEmoji}>{icon}</Text>
    </View>
    <View style={rowStyles.labelWrap}>
      <Text style={[rowStyles.label, { color: danger ? '#EF4444' : textColor }]}>{label}</Text>
      {sublabel ? <Text style={[rowStyles.sublabel, { color: subtextColor }]}>{sublabel}</Text> : null}
    </View>
    {right ?? (onPress ? <Text style={[rowStyles.chevron, { color: borderColor }]}>›</Text> : null)}
  </TouchableOpacity>
);
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 18 },
  labelWrap: { flex: 1 },
  label: { fontSize: rf(1.65), fontWeight: '500' },
  sublabel: { fontSize: rf(1.3), marginTop: 1 },
  chevron: { fontSize: 22 },
});

// ─── SectionCard ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; children: React.ReactNode; bgColor: string; borderColor: string; titleColor: string }> = ({
  title, children, bgColor, borderColor, titleColor,
}) => (
  <View style={sectionStyles.wrap}>
    <Text style={[sectionStyles.title, { color: titleColor }]}>{title}</Text>
    <View style={[sectionStyles.card, { backgroundColor: bgColor, borderColor }]}>
      {children}
    </View>
  </View>
);
const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: { fontSize: rf(1.2), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, paddingHorizontal: 20, paddingBottom: 8 },
  card: { marginHorizontal: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});

// ─── SettingsScreen ───────────────────────────────────────────────────────────
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { posts } = usePosts();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const notificationsEnabled = useAppSelector(s => s.settings.notificationsEnabled);
  const isDarkMode = useAppSelector(s => s.settings.isDarkMode);
  const followingIds = useAppSelector(s => s.follows.followingIds);
  const profileState = useAppSelector(s =>
    user?.id ? s.follows.profileStates[user.id] : undefined
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(loadProfileFollowState(user.id));
    }
  }, [dispatch, user?.id]);

  const postCount = posts.filter(p => p.authorId === user?.id).length;
  const followerCount = profileState?.followers ?? 0;
  const followingCount = followingIds.length;

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Enable notifications in your device settings.', [{ text: 'OK' }]);
        return;
      }
      if (user?.id) {
        await notificationService.registerPushToken(user.id);
      }
    }
    dispatch(setNotificationsEnabled(enabled));
  };

  const rowProps = { borderColor: t.border, textColor: t.text, subtextColor: t.subtext };

  const switchFor = (value: boolean, onChange: (v: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: t.border, true: '#A5B4FC' }}
      thumbColor={value ? t.accent : t.placeholder}
    />
  );

  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: t.bg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: insets.top }} />

      {/* ── Page title ── */}
      <View style={[styles.pageHeader, { borderBottomColor: t.border }]}>
        <Text style={[styles.pageTitle, { color: t.text }]}>Settings</Text>
      </View>

      {/* ── Profile hero card ── */}
      <View style={[styles.profileHero, { backgroundColor: t.accent }]}>
        <View style={styles.profileHeroBlob1} />
        <View style={styles.profileHeroBlob2} />

        <View style={styles.profileHeroContent}>
          <View style={[styles.profileAvatar, { borderColor: 'rgba(255,255,255,0.6)' }]}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
          <View style={styles.profileHeroMeta}>
            <Text style={styles.profileHeroName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.profileHeroEmail}>{user?.email ?? ''}</Text>
            <View style={styles.profileHeroBadge}>
              <View style={styles.heroDot} />
              <Text style={styles.profileHeroBadgeText}>Active now</Text>
            </View>
          </View>
        </View>

        {/* Mini stats */}
        <View style={styles.heroStats}>
          {[
            { label: 'Posts', value: String(postCount) },
            { label: 'Followers', value: String(followerCount) },
            { label: 'Following', value: String(followingCount) },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.heroStatDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.body}>

        {/* ── Account ── */}
        <SectionCard title="Account" bgColor={t.card} borderColor={t.border} titleColor={t.subtext}>
          <SettingRow {...rowProps} icon="💬" iconBg="#EDE9FE" label="Messages"
            sublabel="View your conversations"
            onPress={() => navigation.navigate('Home', { screen: 'Conversations' })} />
          <SettingRow {...rowProps} icon="✏️" iconBg="#EEF2FF" label="Edit Profile"
            sublabel="Name, bio and photo"
            onPress={() => navigation.navigate('Profile', { screen: 'EditProfile' })} />
          <SettingRow {...rowProps} icon="🔒" iconBg="#F0FDF4" label="Change Password"
            onPress={() => Alert.alert('Coming soon', 'Change password is not yet available.')} />
          <SettingRow {...rowProps} icon="📧" iconBg="#FFF7ED" label="Email Address"
            sublabel={user?.email ?? ''} isLast />
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard title="Notifications" bgColor={t.card} borderColor={t.border} titleColor={t.subtext}>
          <SettingRow {...rowProps} icon="🔔" iconBg="#FEF3C7" label="Push Notifications"
            sublabel="Likes, comments and activity"
            right={switchFor(notificationsEnabled, handleToggleNotifications)} />
          <SettingRow {...rowProps} icon="💬" iconBg="#EDE9FE" label="Comment Alerts"
            sublabel="When someone replies to you"
            right={switchFor(notificationsEnabled, handleToggleNotifications)} isLast />
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionCard title="Appearance" bgColor={t.card} borderColor={t.border} titleColor={t.subtext}>
          <SettingRow {...rowProps} icon="🌙" iconBg={isDarkMode ? '#1E1B4B' : '#EEF2FF'} label="Dark Mode"
            sublabel={isDarkMode ? 'On — dark theme active' : 'Off — using light theme'}
            right={switchFor(isDarkMode, v => { dispatch(setDarkMode(v)); })} isLast />
        </SectionCard>

        {/* ── Privacy ── */}
        <SectionCard title="Privacy & Security" bgColor={t.card} borderColor={t.border} titleColor={t.subtext}>
          <SettingRow {...rowProps} icon="🛡️" iconBg="#F0FDF4" label="Privacy Policy"
            onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')} />
          <SettingRow {...rowProps} icon="🚫" iconBg="#FFF1F2" label="Blocked Users"
            onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')} isLast />
        </SectionCard>

        {/* ── About ── */}
        <SectionCard title="About" bgColor={t.card} borderColor={t.border} titleColor={t.subtext}>
          <SettingRow {...rowProps} icon="ℹ️" iconBg="#EFF6FF" label="App Version"
            right={<Text style={[styles.versionChip, { color: t.subtext, backgroundColor: t.inputBg }]}>1.0.0</Text>} />
          <SettingRow {...rowProps} icon="📄" iconBg="#F0FDF4" label="Terms of Service"
            onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')} isLast />
        </SectionCard>

        {/* ── Sign out ── */}
        <View style={[styles.signOutCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
          <SettingRow
            borderColor="#FECDD3" textColor={t.text} subtextColor={t.subtext}
            icon="🚪" iconBg="#FFE4E6" label="Sign Out"
            sublabel="You'll need to sign in again"
            onPress={handleLogout} danger isLast
          />
        </View>

        <View style={{ height: insets.bottom + 80 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageHeader: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: { fontSize: rf(3), fontWeight: '900', letterSpacing: -0.7 },

  // Profile hero
  profileHero: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 24,
    borderRadius: 24, padding: 20, overflow: 'hidden',
  },
  profileHeroBlob1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.09)', top: -50, right: -30,
  },
  profileHeroBlob2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: 20,
  },
  profileHeroContent: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  profileAvatar: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  profileHeroMeta: { flex: 1 },
  profileHeroName: { fontSize: rf(2.1), fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  profileHeroEmail: { fontSize: rf(1.35), color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  profileHeroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4ADE80' },
  profileHeroBadgeText: { fontSize: rf(1.3), color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12,
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: rf(2.0), fontWeight: '900', color: '#fff' },
  heroStatLabel: { fontSize: rf(1.25), color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },

  body: { gap: 20 },
  signOutCard: { marginHorizontal: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  versionChip: {
    fontSize: rf(1.35), fontWeight: '600', paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 8,
  },
});

export default SettingsScreen;
