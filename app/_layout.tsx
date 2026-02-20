import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { QueryProvider } from '../providers/QueryProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthErrorBoundary } from '@/components/AuthErrorBoundary';
import { analytics } from '@/services/analytics';
import { performance } from '@/services/performance';
import { crashReporting } from '@/services/crashReporting';
import { AuthError } from '@/utils/errors';
import { handleTokenExpiration } from '@/utils/tokenExpirationHandler';
import { authService } from '@/services/authService';
import { useNotifications } from '@/hooks/useNotifications';
import * as Notifications from 'expo-notifications';

// ErrorUtils is a global in React Native, not exported from react-native
declare const ErrorUtils: {
  getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | null;
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { notification } = useNotifications();
  
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

    // Global error handler for AuthError (catches async errors that React error boundaries can't)
    // ErrorUtils is a global in React Native
    const ErrorUtilsGlobal = (global as any).ErrorUtils;
    if (ErrorUtilsGlobal) {
      const originalHandler = ErrorUtilsGlobal.getGlobalHandler?.();
      const globalErrorHandler = async (error: Error, isFatal?: boolean) => {
        // Check if it's an AuthError
        if (error instanceof AuthError || error.name === 'AuthError') {
          // Clear auth tokens immediately
          await authService.clearAuthTokens();
          
          // Navigate to login immediately (no error message, no delay)
          const route = await handleTokenExpiration();
          if (route) {
            router.replace(route as any);
          } else {
            router.replace('/SelectAccountTypeScreen' as any);
          }
          // Don't call original handler - we've handled it
          return;
        }
        
        // For other errors, call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      };

      // Set global error handler
      ErrorUtilsGlobal.setGlobalHandler(globalErrorHandler);
    }

    // Also handle unhandled promise rejections (async errors)
    // React Native doesn't have a built-in handler, so we use a workaround
    const handleUnhandledRejection = (event: any) => {
      const error = event?.reason || event;
      if (error instanceof AuthError || (error?.name === 'AuthError')) {
        // Prevent default logging
        event?.preventDefault?.();
        
        // Handle auth error immediately
        (async () => {
          await authService.clearAuthTokens();
          const route = await handleTokenExpiration();
          if (route) {
            router.replace(route as any);
          } else {
            router.replace('/SelectAccountTypeScreen' as any);
          }
        })();
      }
    };

    // Try to add promise rejection handler (works in some React Native environments)
    if (typeof global !== 'undefined') {
      (global as any).onunhandledrejection = handleUnhandledRejection;
    }

    return () => {
      performance.measure('app_init', 'app_init_start');
      // Restore original handler
      const ErrorUtilsGlobal = (global as any).ErrorUtils;
      if (ErrorUtilsGlobal) {
        const originalHandler = ErrorUtilsGlobal.getGlobalHandler?.();
        if (originalHandler) {
          ErrorUtilsGlobal.setGlobalHandler(originalHandler);
        }
      }
      // Cleanup promise rejection handler
      if (typeof global !== 'undefined') {
        delete (global as any).onunhandledrejection;
      }
    };
  }, [router]);

  // Handle notification navigation
  useEffect(() => {
    if (!notification) return;

    const data = notification.request.content.data;
    if (!data) return;

    // Navigate based on notification type and data
    if (data.requestId) {
      // Job-related notifications
      if (data.type === 'quotation_accepted' || 
          data.type === 'quotation_sent' || 
          data.type === 'request_accepted' ||
          data.type === 'work_order_issued' ||
          data.type === 'work_order_created') {
        // Check if user is provider or client based on notification type
        const isProviderNotification = data.type === 'quotation_sent' || data.type === 'work_order_issued';
        const screen = isProviderNotification ? '/ProviderJobDetailsScreen' : '/OngoingJobDetails';
        
        router.push({
          pathname: screen as any,
          params: { requestId: String(data.requestId) },
        } as any);
      }
    } else if (data.type === 'deposit_success') {
      router.push('/WalletScreen' as any);
    }
  }, [notification, router]);

  // Note: AuthError handling is now done by AuthErrorBoundary component
  // ApiClient throws AuthError, AuthErrorBoundary catches it and handles navigation + toast

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryProvider>
          <AuthErrorBoundary router={router}>
          <StatusBar 
            barStyle="dark-content" 
            backgroundColor="white" 
            translucent={false}
          />
          <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="provider-onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderSplashScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ClientTypeSelectionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SelectAccountTypeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderTypeSelectionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="IndividualProviderComingSoonScreen" options={{ headerShown: false }} />
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
        <Stack.Screen name="RequestVisitScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProviderReceiptScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ReportIssueScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PhotosGalleryScreen" options={{ headerShown: false }} />
        <Stack.Screen name="HelpSupportScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SupportScreen" options={{ headerShown: false }} />
        <Stack.Screen name="LiveChatScreen" options={{ headerShown: false }} />
        <Stack.Screen name="UserGuideScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentMethodsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ConfirmWalletPaymentScreen" options={{ headerShown: false }} />
        <Stack.Screen name="WalletScreen" options={{ headerShown: false }} />
        <Stack.Screen name="TopUpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="BankTransferScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentPendingScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PaymentSuccessfulScreen" options={{ headerShown: false }} />
        <Stack.Screen name="TransactionFailedScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CallScreen" options={{ headerShown: false }} />
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
        <Stack.Screen name="ProviderLinkBankAccountScreen" options={{ headerShown: false }} />
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
        <Stack.Screen name="YourServicesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AddCustomServiceScreen" options={{ headerShown: false }} />
          </Stack>
          </AuthErrorBoundary>
        </QueryProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
