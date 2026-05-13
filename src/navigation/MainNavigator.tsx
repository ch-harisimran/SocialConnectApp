import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import SettingsScreen from '../screens/main/SettingsScreen';

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Profile: '👤',
  Settings: '⚙️',
};

const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{TAB_ICONS[name]}</Text>
  </View>
);

const MainNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      tabBarActiveTintColor: '#6366F1',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        borderTopColor: '#E5E7EB',
        elevation: 8,
        shadowOpacity: 0.08,
        shadowRadius: 6,
        height: 60,
        paddingBottom: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export default MainNavigator;
