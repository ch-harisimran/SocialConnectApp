import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/native';
import HomeStackNavigator from './HomeStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import SettingsScreen from '../screens/main/SettingsScreen';
import { useTheme } from '../utils/theme';
import type { ProfileStackParamList } from './ProfileStackNavigator';
import type { HomeStackParamList } from './HomeStackNavigator';

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Profile: '👤',
  Settings: '⚙️',
};

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({
  name,
  focused,
  color,
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[name]}</Text>
    {focused && (
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
          marginTop: 2,
        }}
      />
    )}
  </View>
);

const MainNavigator: React.FC = () => {
  const t = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.placeholder,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.border,
          borderTopWidth: 0.5,
          elevation: 12,
          shadowColor: t.shadow,
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
