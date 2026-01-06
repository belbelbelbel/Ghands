export default {
  expo: {
    name: 'GHands',
    slug: 'GHands',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'ghands',
    userInterfaceStyle: 'automatic',
    backgroundColor: '#000000',
    newArchEnabled: false,
    ios: {
      icon: './assets/images/icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.demo.temp.yourapp',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAJNN3NAbytlRW498oZHDcsc-lA1fPKDp0',
      },
      infoPlist: {
        NSCameraUsageDescription: 'This app needs access to camera to take profile photos.',
        NSPhotoLibraryUsageDescription: 'This app needs access to photo library to select profile photos.',
        NSAllowsArbitraryLoads: true,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'pan',
      package: 'com.bendee.GHands',
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAJNN3NAbytlRW498oZHDcsc-lA1fPKDp0',
        },
      },
    },
    androidStatusBar: {
      backgroundColor: '#000000',
      barStyle: 'light-content',
      translucent: false,
      hidden: false,
    },
    androidNavigationBar: {
      barStyle: 'light-content',
      backgroundColor: '#000000',
    },
    web: {
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-navigation-bar',
        {
          position: 'relative',
          visibility: 'visible',
          behavior: 'inset-swipe',
          backgroundColor: '#000000',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ADF802',
          dark: {
            backgroundColor: '#000000',
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

