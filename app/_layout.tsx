import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import '../global.css';
import { QueryProvider } from '../providers/QueryProvider';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('../assets/fonts/Outfit/static/Outfit-Regular.ttf'),
    'Outfit-Medium': require('../assets/fonts/Outfit/static/Outfit-Medium.ttf'),
    'Outfit-SemiBold': require('../assets/fonts/Outfit/static/Outfit-SemiBold.ttf'),
    'Outfit-Bold': require('../assets/fonts/Outfit/static/Outfit-Bold.ttf'),
    'Outfit-ExtraBold': require('../assets/fonts/Outfit/static/Outfit-ExtraBold.ttf'),
    
    'Poppins-Regular': require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins/Poppins-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="white" 
        translucent={false}
      />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="SelectAccountTypeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SignupScreen" options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" options={{ headerShown: false }} />
        <Stack.Screen name="OtpScreen" options={{ headerShown: false }} />
        <Stack.Screen name='categories' options={{headerShown: false}}/>
        {/* <Stack.Screen name='chat' options={{headerShown: false}}/> */}
        <Stack.Screen name="PasswordConfirmation" options={{ headerShown: false }} />
        <Stack.Screen name="LocationPermissionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="LocationSearchScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProfileSetupScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ServicesGridScreen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="AccountInformationScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AddressBookScreen" options={{ headerShown: false }} />
        <Stack.Screen name="EditProfileScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentHistoryScreen" options={{ headerShown: false }} />
        <Stack.Screen name="NotificationsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="JobDetailsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="DateTimeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main" options={{ headerShown: false }} />
      </Stack>
    </QueryProvider>
  );
}
