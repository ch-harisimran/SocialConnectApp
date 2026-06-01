import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  sendMessage,
  setActiveConversationId,
  setActiveMessages,
} from '../../store/slices/messagesSlice';
import { messageService, ChatMessage } from '../../services/messageService';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme } from '../../utils/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Chat'>;
type Route = RouteProp<HomeStackParamList, 'Chat'>;

const MessageBubble: React.FC<{ message: ChatMessage; isOwn: boolean }> = ({ message, isOwn }) => {
  const t = useTheme();

  return (
    <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: t.accent }
            : { backgroundColor: t.card, borderColor: t.border, borderWidth: StyleSheet.hairlineWidth },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isOwn ? '#fff' : t.text }]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, { color: isOwn ? 'rgba(255,255,255,0.75)' : t.subtext }]}>
          {formatTimeAgo(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { conversationId, otherUserName } = route.params;
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const messages = useAppSelector(state => state.messages.activeMessages);
  const isSending = useAppSelector(state => state.messages.isSending);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    dispatch(setActiveConversationId(conversationId));

    const unsubscribe = messageService.subscribeToMessages(conversationId, updated => {
      dispatch(setActiveMessages(updated));
    });

    return () => {
      unsubscribe();
      dispatch(setActiveConversationId(null));
      dispatch(setActiveMessages([]));
    };
  }, [conversationId, dispatch]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');
    await dispatch(sendMessage({ conversationId, text: trimmed }));
  };

  const initials = otherUserName.slice(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
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
        <View style={[styles.headerAvatar, { backgroundColor: t.accent }]}>
          <Text style={styles.headerAvatarText}>{initials}</Text>
        </View>
        <Text style={[styles.headerName, { color: t.text }]} numberOfLines={1}>
          {otherUserName}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={[
          styles.messageListContent,
          messages.length === 0 && styles.messageListEmpty,
          { paddingBottom: 12 },
        ]}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.id} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatText, { color: t.subtext }]}>
              Say hello to {otherUserName}!
            </Text>
          </View>
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: t.header,
            borderTopColor: t.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { backgroundColor: t.inputBg, color: t.text, borderColor: t.border },
          ]}
          placeholder="Type a message…"
          placeholderTextColor={t.placeholder}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: text.trim() ? t.accent : t.border },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          activeOpacity={0.85}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    gap: 10,
  },
  backBtn: { width: 36 },
  backText: { fontSize: 24 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  headerName: { fontSize: 17, fontWeight: '700', flex: 1 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 14, paddingTop: 14 },
  messageListEmpty: { flexGrow: 1 },
  bubbleRow: { marginBottom: 10, maxWidth: '82%' },
  bubbleRowOwn: { alignSelf: 'flex-end' },
  bubbleRowOther: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: 14, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});

export default ChatScreen;
