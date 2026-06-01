import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
  };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

const MessagesStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      animationDuration: 220,
    }}
  >
    <Stack.Screen
      name="Conversations"
      getComponent={() => require('../screens/main/ConversationsScreen').default}
    />
    <Stack.Screen
      name="Chat"
      getComponent={() => require('../screens/main/ChatScreen').default}
    />
  </Stack.Navigator>
);

export default MessagesStackNavigator;
