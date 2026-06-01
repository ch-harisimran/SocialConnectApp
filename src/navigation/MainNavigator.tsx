import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const TAB_CONFIG: Record<
  keyof MainTabParamList,
  { icon: string; label: string }
> = {
  Home: { icon: '🏠', label: 'Home' },
  Profile: { icon: '👤', label: 'Profile' },
  Settings: { icon: '⚙️', label: 'Settings' },
};

const TabIcon: React.FC<{
  routeName: keyof MainTabParamList;
  focused: boolean;
  accent: string;
  inactive: string;
}> = ({ routeName, focused, accent, inactive }) => {
  const { icon, label } = TAB_CONFIG[routeName];

  return (
    <View style={tabStyles.iconWrap}>
      <View style={[tabStyles.iconCircle, focused && { backgroundColor: `${accent}18` }]}>
        <Text style={[tabStyles.icon, { opacity: focused ? 1 : 0.55 }]}>{icon}</Text>
      </View>
      <Text
        style={[
          tabStyles.label,
          { color: focused ? accent : inactive, fontWeight: focused ? '800' : '600' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const MainNavigator: React.FC = () => {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            routeName={route.name as keyof MainTabParamList}
            focused={focused}
            accent={t.accent}
            inactive={t.placeholder}
          />
        ),
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.placeholder,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 16,
          shadowColor: t.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarAccessibilityLabel: 'Home tab' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarAccessibilityLabel: 'Profile tab' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarAccessibilityLabel: 'Settings tab' }}
      />
    </Tab.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  iconCircle: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: { fontSize: 20 },
  label: { fontSize: 11, letterSpacing: 0.2 },
});

export default MainNavigator;
