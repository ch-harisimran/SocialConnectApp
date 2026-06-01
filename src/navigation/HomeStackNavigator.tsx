import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type HomeStackParamList = {
  Home: undefined;
  CreatePost: { postId?: string } | undefined;
  Comments: { postId: string };
  UserProfile: { userId: string; userName: string };
  Conversations: undefined;
  Chat: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
  };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      animationDuration: 220,
    }}
  >
    <Stack.Screen
      name="Home"
      getComponent={() => require('../screens/main/HomeScreen').default}
    />
    <Stack.Screen
      name="CreatePost"
      getComponent={() => require('../screens/main/CreatePostScreen').default}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
    <Stack.Screen
      name="Comments"
      getComponent={() => require('../screens/main/CommentsScreen').default}
    />
    <Stack.Screen
      name="UserProfile"
      getComponent={() => require('../screens/main/UserProfileScreen').default}
    />
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

export default HomeStackNavigator;
