import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const notificationService = {
  setup(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  },

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('social-connect', {
        name: 'Social Connect',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleLocalNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch {
      // Notifications not available (e.g. simulator without permission)
    }
  },
};
