import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loadConversations } from '../../store/slices/messagesSlice';
import { Conversation } from '../../services/messageService';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme } from '../../utils/theme';
import { FLAT_LIST_PERF_PROPS } from '../../utils/listPerformance';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Conversations'>;

const ConversationRow: React.FC<{
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}> = ({ conversation, currentUserId, onPress }) => {
  const t = useTheme();
  const otherUserId = conversation.participants.find(id => id !== currentUserId) ?? '';
  const otherUserName = conversation.participantNames[otherUserId] ?? 'User';
  const initials = otherUserName.slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, { backgroundColor: t.accent }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, { color: t.text }]} numberOfLines={1}>
            {otherUserName}
          </Text>
          {conversation.lastMessage ? (
            <Text style={[styles.rowTime, { color: t.subtext }]}>
              {formatTimeAgo(conversation.lastMessageAt)}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.rowPreview, { color: t.subtext }]} numberOfLines={1}>
          {conversation.lastMessage || 'Start a conversation'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const conversations = useAppSelector(state => state.messages.conversations);
  const isLoading = useAppSelector(state => state.messages.isLoadingConversations);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadConversations());
    }, [dispatch])
  );

  const handleOpenChat = useCallback(
    (conversation: Conversation) => {
      const otherUserId = conversation.participants.find(id => id !== user?.id) ?? '';
      const otherUserName = conversation.participantNames[otherUserId] ?? 'User';
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUserId,
        otherUserName,
      });
    },
    [navigation, user?.id]
  );

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: t.header,
            borderBottomColor: t.border,
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={[styles.backText, { color: t.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.text }]}>Messages</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.accent} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          {...FLAT_LIST_PERF_PROPS}
          contentContainerStyle={[
            styles.list,
            conversations.length === 0 && styles.listEmpty,
            { paddingBottom: insets.bottom + 24 },
          ]}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              currentUserId={user?.id ?? ''}
              onPress={() => handleOpenChat(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyTitle, { color: t.text }]}>No conversations yet</Text>
              <Text style={[styles.emptySub, { color: t.subtext }]}>
                Visit a user profile and tap Message to start chatting.
              </Text>
            </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36 },
  backText: { fontSize: 24 },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 14, gap: 10 },
  listEmpty: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { fontSize: 16, fontWeight: '700', flex: 1 },
  rowTime: { fontSize: 12 },
  rowPreview: { fontSize: 14, marginTop: 3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});

export default ConversationsScreen;
