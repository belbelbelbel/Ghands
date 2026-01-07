import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import '../global.css';
import { QueryProvider } from '../providers/QueryProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { analytics } from '@/services/analytics';
import { performance } from '@/services/performance';
import { crashReporting } from '@/services/crashReporting';
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

  useEffect(() => {
    const configureAndroidNav = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync('#000000');
        await NavigationBar.setButtonStyleAsync('light');
      } catch (error) {
        console.warn('Navigation bar config failed', error);
        crashReporting.captureException(error as Error, { context: 'android_nav_config' });
      }
    };

    configureAndroidNav();
  }, []);

  useEffect(() => {
    // Initialize analytics and performance monitoring
    performance.mark('app_init_start');
    
    // Track app launch
    analytics.track('app_launched', {
      timestamp: new Date().toISOString(),
    });

    return () => {
      performance.measure('app_init', 'app_init_start');
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
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
        <Stack.Screen name="AddPhotosScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ServiceMapScreen" options={{ headerShown: false }} />
        <Stack.Screen name="BookingConfirmationScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CancelRequestScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CompletedJobDetail" options={{ headerShown: false }} />
        <Stack.Screen name="OngoingJobDetails" options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderDetailScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderJobDetailsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderUpdatesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderCompletedJobScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SendQuotationScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderReceiptScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PhotosGalleryScreen" options={{ headerShown: false }} />
        <Stack.Screen name="HelpSupportScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SupportScreen" options={{ headerShown: false }} />
        <Stack.Screen name="LiveChatScreen" options={{ headerShown: false }} />
        <Stack.Screen name="UserGuideScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentMethodsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="WalletScreen" options={{ headerShown: false }} />
        <Stack.Screen name="TopUpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="BankTransferScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentPendingScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentSuccessfulScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ActivityScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AddCardDetailsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main" options={{ headerShown: false }} />
        <Stack.Screen name="provider" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderSignInScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderSignUpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderOtpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderResetPasswordScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderProfileSetupScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderUploadDocumentsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderVerifyIdentityScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SettingsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="LegalAboutScreen" options={{ headerShown: false }} />
        <Stack.Screen name="TermsOfServiceScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicyScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AboutGHandsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AnalyticsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SecurityScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CreatePINScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderActivityScreen" options={{ headerShown: false }} />
        </Stack>
      </QueryProvider>
    </ErrorBoundary>
  );
}
