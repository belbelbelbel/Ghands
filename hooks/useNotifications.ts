import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PUSH_TOKEN_STORAGE_KEY = '@ghands:push_token';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        const token = await registerForPushNotificationsAsync();

        if (token && isMounted) {
          setExpoPushToken(token);

          if (token !== storedToken) {
            await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
            try {
              await registerPushToken(token);
            } catch {
              // Token stored locally; backend registration can retry on next launch
            }
          }
        }
      } catch {
        // Push setup is best-effort
      }
    };

    initializeNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      setNotification(response.notification);
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const projectId = '82fb8167-b26b-4fcf-84c2-fb858f717a03';
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6A9B00',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  return token;
}

async function registerPushToken(token: string): Promise<void> {
  await notificationService.registerDevice({
    pushToken: token,
    platform: Platform.OS,
    deviceId: Device.modelName || 'unknown',
  });
}
