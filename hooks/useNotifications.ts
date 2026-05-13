import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_STORAGE_KEY = '@ghands:push_token';
type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let notificationHandlerConfigured = false;

function getNotificationsModule(): NotificationsModule | null {
  if (Constants.appOwnership === 'expo') {
    return null;
  }

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    // Remote push notifications are not available in Expo Go on Android SDK 53+.
    // Load lazily so Expo Go can still run the rest of the app.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    notificationsModule = null;
  }

  return notificationsModule;
}

function configureNotificationHandler(Notifications: NotificationsModule) {
  if (notificationHandlerConfigured) return;
  notificationHandlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const Notifications = getNotificationsModule();

    if (!Notifications) {
      return () => {
        isMounted = false;
      };
    }

    configureNotificationHandler(Notifications);

    const initializeNotifications = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        const token = await registerForPushNotificationsAsync(Notifications);

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

async function registerForPushNotificationsAsync(Notifications: NotificationsModule): Promise<string | null> {
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
      lightColor: '#4F6739',
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
