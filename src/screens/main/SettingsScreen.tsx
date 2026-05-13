import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setNotificationsEnabled } from '../../store/slices/settingsSlice';
import { notificationService } from '../../services/notificationService';

interface SettingRowProps {
  label: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  onPress,
  rightElement,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.6 : 1}
  >
    <View style={styles.rowLeft}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
    </View>
    {rightElement ?? (onPress ? <Text style={styles.chevron}>›</Text> : null)}
  </TouchableOpacity>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const notificationsEnabled = useAppSelector(state => state.settings.notificationsEnabled);
  const [darkMode, setDarkMode] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive alerts.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    dispatch(setNotificationsEnabled(enabled));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.slice(0, 2).toUpperCase() ?? 'U'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <SectionHeader title="Notifications" />
      <View style={styles.section}>
        <SettingRow
          label="Push Notifications"
          description="Receive alerts for likes and comments on your posts"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={notificationsEnabled ? '#6366F1' : '#9CA3AF'}
            />
          }
        />
      </View>

      <SectionHeader title="Appearance" />
      <View style={styles.section}>
        <SettingRow
          label="Dark Mode"
          description="Switch to a darker color scheme"
          rightElement={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={darkMode ? '#6366F1' : '#9CA3AF'}
            />
          }
        />
      </View>

      <SectionHeader title="Privacy & Security" />
      <View style={styles.section}>
        <SettingRow
          label="Private Account"
          description="Only approved followers can see your posts"
          rightElement={
            <Switch
              value={privateAccount}
              onValueChange={setPrivateAccount}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={privateAccount ? '#6366F1' : '#9CA3AF'}
            />
          }
        />
        <SettingRow
          label="Change Password"
          onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')}
        />
        <SettingRow
          label="Blocked Users"
          onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')}
        />
      </View>

      <SectionHeader title="About" />
      <View style={styles.section}>
        <SettingRow label="Version" rightElement={<Text style={styles.versionText}>1.0.0</Text>} />
        <SettingRow
          label="Terms of Service"
          onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')}
        />
        <SettingRow
          label="Privacy Policy"
          onPress={() => Alert.alert('Coming soon', 'This feature is not yet available.')}
        />
      </View>

      <View style={styles.section}>
        <SettingRow label="Sign Out" onPress={handleLogout} danger />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#111827' },
  rowDescription: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  chevron: { fontSize: 20, color: '#D1D5DB', marginLeft: 8 },
  dangerText: { color: '#EF4444', fontWeight: '600' },
  versionText: { fontSize: 14, color: '#9CA3AF' },
});

export default SettingsScreen;
