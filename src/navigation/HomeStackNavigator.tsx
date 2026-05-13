import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/main/HomeScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import CommentsScreen from '../screens/main/CommentsScreen';

export type HomeStackParamList = {
  Home: undefined;
  CreatePost: undefined;
  Comments: { postId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{ presentation: 'modal' }}
    />
    <Stack.Screen name="Comments" component={CommentsScreen} />
  </Stack.Navigator>
);

export default HomeStackNavigator;
