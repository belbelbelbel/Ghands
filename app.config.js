export default {
  expo: {
    name: 'GHands',
    slug: 'GHands',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'ghands',
    userInterfaceStyle: 'automatic',
    backgroundColor: '#6A9B00', 
    newArchEnabled: true,
    extra: {
      eas: {
        projectId: "82fb8167-b26b-4fcf-84c2-fb858f717a03"
      }
    },
    ios: {
      icon: './assets/images/icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.bendee.GHands',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAJNN3NAbytlRW498oZHDcsc-lA1fPKDp0',
      },
      infoPlist: {
        NSCameraUsageDescription: 'This app needs access to camera to take profile photos.',
        NSPhotoLibraryUsageDescription: 'This app needs access to photo library to select profile photos.',
        NSAllowsArbitraryLoads: true,
      },
      usesAppleSignIn: false,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#6A9B00', // Normal green color
      },
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'pan',
      package: 'com.bendee.GHands',
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAJNN3NAbytlRW498oZHDcsc-lA1fPKDp0',
        },
      },
    },
    androidStatusBar: {
      backgroundColor: '#6A9B00', // Normal green color
      barStyle: 'dark-content', // Dark text on light green background
      translucent: false,
      hidden: false,
    },
    androidNavigationBar: {
      barStyle: 'dark-content', // Dark icons on light green background
      backgroundColor: '#6A9B00', // Normal green color
    },
    web: {
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#6A9B00',
          sounds: [],
          mode: 'production',
        },
      ],
      [
        'expo-navigation-bar',
        {
          position: 'relative',
          visibility: 'visible',
          behavior: 'inset-swipe',
          backgroundColor: '#6A9B00', // Normal green color
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/icon.png',
          imageWidth: 140, // 70% of 200px icon container
          resizeMode: 'contain',
          backgroundColor: '#6A9B00', // Normal green color
          dark: {
            backgroundColor: '#6A9B00', // Keep green in dark mode too
          },
        },
      ],
      'expo-asset',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
