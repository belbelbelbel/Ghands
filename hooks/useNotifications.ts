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
        // Check if we already have a token stored
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        
        // Get new token (will be same if already registered)
        const token = await registerForPushNotificationsAsync();
        
        if (token && isMounted) {
          setExpoPushToken(token);
          
          // Only register with backend if token changed or not stored
          if (token !== storedToken) {
            await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
            
            // Register token with backend
            try {
              await registerPushToken(token);
              if (__DEV__) {
                console.log('✅ Push token registered with backend successfully');
              }
            } catch (error) {
              // Log error but don't block app initialization
              if (__DEV__) {
                console.error('❌ Failed to register push token with backend:', error);
              }
              // Token is still stored locally, will retry on next app start
            }
          } else if (__DEV__) {
            console.log('ℹ️ Push token already registered, skipping backend registration');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error initializing push notifications:', error);
        }
      }
    };

    initializeNotifications();

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
      if (__DEV__) {
        console.log('Notification received (foreground):', notification);
      }
    });

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (__DEV__) {
        console.log('Notification tapped:', data);
      }
      // Navigation is handled in _layout.tsx via the notification state
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

  // Check if running on a physical device
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn('Push notifications only work on physical devices');
    }
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) {
      console.warn('Failed to get push token for push notification!');
    }
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = '82fb8167-b26b-4fcf-84c2-fb858f717a03'; // From app.config.js
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (__DEV__) {
      console.log('Expo push token:', token);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting Expo push token:', error);
    }
  }

  // Configure Android channel for notifications
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6A9B00', // GHands green color
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  return token;
}

async function registerPushToken(token: string): Promise<void> {
  try {
    await notificationService.registerDevice({
      pushToken: token,
      platform: Platform.OS,
      deviceId: Device.modelName || 'unknown',
    });
    if (__DEV__) {
      console.log('Push token registered with backend');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error registering push token:', error);
    }
    throw error;
  }
}

