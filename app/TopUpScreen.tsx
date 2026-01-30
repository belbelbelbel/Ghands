import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedModal from '@/components/AnimatedModal';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronRight, Lock, Wallet } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, Linking, AppState } from 'react-native';
import { Button } from '@/components/ui/Button';
import { walletService, profileService, authService } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import Toast from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000]; // More realistic amounts in Naira
const DEPOSIT_REFERENCE_KEY = '@ghands:pending_deposit_reference';

export default function TopUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnTo?: string; // Screen to return to after top-up (e.g., PaymentMethodsScreen)
    returnParams?: string; // JSON string of params to pass back
  }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [balance, setBalance] = useState<number>(0);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [pendingDepositReference, setPendingDepositReference] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const hasVerifiedRef = useRef(false); // Prevent multiple verifications

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  // Helper function to extract email from JWT token
  const extractEmailFromToken = async (): Promise<string | null> => {
    try {
      const token = await authService.getAuthToken();
      if (!token) return null;
      
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (second part)
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      // Try common email fields in JWT
      return decoded?.email || decoded?.userEmail || decoded?.user?.email || null;
    } catch (error) {
      return null;
    }
  };

  // Function to load wallet balance
  const loadWalletBalance = useCallback(async () => {
    try {
      const wallet = await walletService.getWallet();
      const balanceValue = typeof wallet.balance === 'number' 
        ? wallet.balance 
        : parseFloat(String(wallet.balance)) || 0;
      
      if (__DEV__) {
        console.log('💰 [TopUpScreen] Loaded wallet balance:', balanceValue, 'from wallet:', wallet);
      }
      
      setBalance(balanceValue);
      return balanceValue;
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading wallet balance:', error);
      }
      // Don't throw - just return current balance state
      return 0;
    }
  }, []);

  // Load wallet balance and user profile on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load wallet balance
        await loadWalletBalance();
        
        // Try multiple methods to get user email
        let email = '';
        let name = '';
        
        try {
          // Method 1: Try profile API
          const profile = await profileService.getCurrentUserProfile();
          email = profile?.email || profile?.userEmail || '';
          name = profile?.firstName && profile?.lastName 
            ? `${profile.firstName} ${profile.lastName}` 
            : profile?.name || '';
        } catch (profileError) {
          // Method 2: If profile API fails, try extracting from token
          if (__DEV__) {
            console.log('Profile API failed, trying token extraction:', profileError);
          }
          const tokenEmail = await extractEmailFromToken();
          if (tokenEmail) {
            email = tokenEmail;
          }
        }
        
        // If still no email, try extracting from token as fallback
        if (!email) {
          const tokenEmail = await extractEmailFromToken();
          if (tokenEmail) {
            email = tokenEmail;
          }
        }
        
        setUserEmail(email);
        setUserName(name);
        
        if (__DEV__) {
          console.log('📧 [TopUpScreen] Loaded user data:', { email, name, hasEmail: !!email });
        }
        
        // Check for pending deposit reference (from previous session)
        const storedReference = await AsyncStorage.getItem(DEPOSIT_REFERENCE_KEY);
        if (storedReference) {
          setPendingDepositReference(storedReference);
          // Auto-verify if we have a pending reference
          verifyPendingDeposit(storedReference);
        }
      } catch (error) {
        // Silently fail - user can still top up
        console.error('Error loading wallet/profile:', error);
      }
    };
    loadData();
  }, [loadWalletBalance]);

  // Refresh balance when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh balance when screen is focused
      loadWalletBalance();
    }, [loadWalletBalance])
  );

  // Verify pending deposit
  const verifyPendingDeposit = useCallback(async (reference: string, isManualRetry = false) => {
    // Allow manual retries even if already verified once
    if (!isManualRetry && hasVerifiedRef.current) return;
    
    try {
      setIsLoading(true);
      if (!isManualRetry) {
        hasVerifiedRef.current = true;
      }
      
      if (__DEV__) {
        console.log('🔍 [TopUpScreen] Verifying deposit with reference:', reference);
      }
      
      const verification = await walletService.verifyDeposit(reference);
      
      if (__DEV__) {
        console.log('✅ [TopUpScreen] Verification response:', verification);
      }
      
      if (verification.status === 'completed') {
        haptics.success();
        
        // Clear stored reference only on success
        await AsyncStorage.removeItem(DEPOSIT_REFERENCE_KEY);
        setPendingDepositReference(null);
        hasVerifiedRef.current = true;
        
        // Refresh wallet balance
        try {
          const updatedBalance = await loadWalletBalance();
          // If wallet fetch succeeded but balance is 0, use verification balance
          if (updatedBalance === 0 && verification.balance > 0) {
            setBalance(verification.balance);
          }
        } catch (error) {
          // Use balance from verification if wallet fetch fails
          const verificationBalance = typeof verification.balance === 'number' 
            ? verification.balance 
            : parseFloat(String(verification.balance)) || 0;
          setBalance(verificationBalance);
        }
        
        showSuccess(`Successfully topped up ₦${verification.amount.toLocaleString()}. Your new balance is ₦${(verification.balance || 0).toLocaleString()}`);
        
        // Return to previous screen if specified
        if (params.returnTo) {
          setTimeout(() => {
            try {
              const returnParams = params.returnParams 
                ? JSON.parse(params.returnParams) 
                : {};
              router.replace({
                pathname: params.returnTo as any,
                params: returnParams,
              } as any);
            } catch {
              router.replace(params.returnTo as any);
            }
          }, 2000);
        }
      } else if (verification.status === 'pending') {
        // Still pending - keep reference and allow retry
        hasVerifiedRef.current = false;
        showError('Payment is still being processed. Please wait a moment and try verifying again.');
      } else if (verification.status === 'failed') {
        // Failed
        hasVerifiedRef.current = false;
        await AsyncStorage.removeItem(DEPOSIT_REFERENCE_KEY);
        setPendingDepositReference(null);
        showError('Payment verification failed. Please contact support if you have already paid.');
      } else {
        // Unknown status
        hasVerifiedRef.current = false;
        showError('Unable to verify payment status. Please try again or contact support.');
      }
    } catch (error: any) {
      hasVerifiedRef.current = false;
      
      if (__DEV__) {
        console.error('❌ [TopUpScreen] Verification error:', error);
      }
      
      const errorMsg = getSpecificErrorMessage(error, 'verify_deposit');
      const status = error?.status || error?.response?.status;
      
      // Provide more helpful error messages
      if (status === 404) {
        showError('Payment reference not found. If you have already paid, please contact support.');
      } else if (status === 500) {
        showError('Server error during verification. Please try again in a moment.');
      } else {
        showError(errorMsg || 'Failed to verify payment. Please try again or contact support if you have already paid.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.returnTo, params.returnParams, router, showSuccess, showError]);

  // Verify deposit when screen comes into focus (user returns from payment gateway)
  useFocusEffect(
    useCallback(() => {
      // If we have a pending deposit reference, verify it automatically
      if (pendingDepositReference && !hasVerifiedRef.current) {
        // Small delay to ensure screen is fully loaded
        const timeout = setTimeout(() => {
          verifyPendingDeposit(pendingDepositReference, false);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }, [pendingDepositReference, verifyPendingDeposit])
  );

  // Also listen to AppState changes to verify when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && pendingDepositReference && !hasVerifiedRef.current) {
        // App came to foreground - verify deposit
        verifyPendingDeposit(pendingDepositReference, false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pendingDepositReference, verifyPendingDeposit]);

  const handleCustomAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setCustomAmount(numericValue);
    if (numericValue && !isNaN(parseFloat(numericValue))) {
      setSelectedAmount(parseFloat(numericValue));
    }
  };

  // Handle card payment - initialize deposit and redirect to Kora
  const handleCardPayment = async () => {
    const amount = parseFloat(customAmount) || selectedAmount;
    
    // Validate amount (minimum 100 NGN per API docs)
    if (amount < 100) {
      showError('Minimum deposit amount is ₦100');
      return;
    }

    // Try to get email - use stored email or extract from token
    let emailToUse = userEmail;
    
    if (!emailToUse) {
      // Try extracting from token one more time
      try {
        const tokenEmail = await extractEmailFromToken();
        if (tokenEmail) {
          emailToUse = tokenEmail;
          setUserEmail(tokenEmail);
        }
      } catch (error) {
        // Token extraction failed - will show modal
        if (__DEV__) {
          console.log('Token extraction failed:', error);
        }
      }
    }
    
    // If still no email, show email input modal
    if (!emailToUse || !emailToUse.trim() || !emailToUse.includes('@')) {
      setPendingAmount(amount);
      setEmailInput(userEmail || ''); // Pre-fill if we have a partial email
      setShowEmailModal(true);
      return;
    }
    
    // Validate email format before proceeding
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse.trim())) {
      // Invalid email format - show modal to re-enter
      setPendingAmount(amount);
      setEmailInput(emailToUse);
      setShowEmailModal(true);
      return;
    }
    
    // Proceed with payment using available email
    await processCardPayment(emailToUse, amount);
  };

  // Separate function to process card payment with email
  const processCardPayment = async (email: string, amount: number) => {
    // Validate email before proceeding
    if (!email || !email.trim() || !email.includes('@')) {
      showError('Please enter a valid email address.');
      setShowEmailModal(true);
      setPendingAmount(amount);
      setEmailInput(email);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError('Please enter a valid email address.');
      setShowEmailModal(true);
      setPendingAmount(amount);
      setEmailInput(email);
      return;
    }

    setIsProcessingCard(true);
    haptics.light();

    try {
      // Initialize deposit - creates payment link
      const depositResponse = await walletService.initializeDeposit({
        amount,
        email: email.trim(),
        name: userName || undefined,
      });

      haptics.success();
      
      // Store deposit reference for verification when user returns
      await AsyncStorage.setItem(DEPOSIT_REFERENCE_KEY, depositResponse.reference);
      setPendingDepositReference(depositResponse.reference);
      hasVerifiedRef.current = false; // Reset verification flag
      
      // Open payment gateway in browser
      const canOpen = await Linking.canOpenURL(depositResponse.authorizationUrl);
      if (canOpen) {
        await Linking.openURL(depositResponse.authorizationUrl);
        
        // Show instructions - user will be auto-verified when they return
        Alert.alert(
          'Payment Gateway Opened',
          'Complete your payment in the browser. When you return to the app, your payment will be automatically verified.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsProcessingCard(false);
                // Verification will happen automatically when screen comes into focus
              },
            },
          ]
        );
        
        // Also set up AppState listener to verify when app comes to foreground
        const depositRef = depositResponse.reference; // Capture reference in closure
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
          if (nextAppState === 'active' && depositRef) {
            // App came to foreground - verify deposit
            await verifyPendingDeposit(depositRef);
            subscription.remove();
          }
        });
        
        // Cleanup subscription after 5 minutes
        setTimeout(() => {
          subscription.remove();
        }, 5 * 60 * 1000);
      } else {
        showError('Unable to open payment gateway. Please try again.');
        await AsyncStorage.removeItem(DEPOSIT_REFERENCE_KEY);
        setPendingDepositReference(null);
      }
    } catch (error: any) {
      haptics.error();
      setIsProcessingCard(false);
      
      // Log error for debugging
      if (__DEV__) {
        console.error('Error initializing deposit:', {
          error,
          message: error?.message,
          status: error?.status,
          details: error?.details,
        });
      }
      
      // Extract error message
      const errorMessage = error?.message || error?.details?.data?.error || error?.details?.error || '';
      let errorMsg = getSpecificErrorMessage(error, 'initialize_deposit');
      
      // If no specific error message, provide helpful default
      if (!errorMsg || errorMsg === 'Failed to initialize payment. Please try again.') {
        if (errorMessage.toLowerCase().includes('email')) {
          errorMsg = 'Invalid email address. Please check and try again.';
        } else if (errorMessage.toLowerCase().includes('amount')) {
          errorMsg = 'Invalid amount. Minimum deposit is ₦100.';
        } else if (error?.status === 400) {
          errorMsg = 'Invalid payment information. Please check your details and try again.';
        } else if (error?.status === 401) {
          errorMsg = 'Session expired. Please sign in again.';
        } else if (error?.status === 500) {
          errorMsg = 'Server error. Please try again in a moment.';
        } else {
          errorMsg = errorMessage || 'Failed to initialize payment. Please try again.';
        }
      }
      
      showError(errorMsg);
      
      // If it's an email-related error, show email modal again
      if (errorMessage.toLowerCase().includes('email') || error?.status === 400) {
        setShowEmailModal(true);
        setPendingAmount(amount);
        setEmailInput(email);
      }
    }
  };

  // Handle bank transfer confirmation
  const handleBankTransferConfirm = () => {
    Alert.alert(
      'Bank Transfer Initiated',
      'Please complete the transfer using the account details shown. Your wallet will be credited once we verify your payment (usually within 24 hours).',
      [
        {
          text: 'I\'ve Completed Transfer',
          onPress: () => {
            showSuccess('Your transfer is being processed. You will receive a confirmation once verified.');
            setShowBankTransferModal(false);
            
            // Return to previous screen if specified
            if (params.returnTo) {
              setTimeout(() => {
                try {
                  const returnParams = params.returnParams 
                    ? JSON.parse(params.returnParams) 
                    : {};
                  router.replace({
                    pathname: params.returnTo as any,
                    params: returnParams,
                  } as any);
                } catch {
                  router.replace(params.returnTo as any);
                }
              }, 2000);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                flex: 1,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Top Up
            </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Current Balance Section */}
        <View
          style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: 14,
            padding: 18,
            marginBottom: 24,
            position: 'relative',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins-Medium',
              color: Colors.textSecondaryDark,
              marginBottom: 6,
            }}
          >
            Current balance
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                letterSpacing: -0.3,
              }}
            >
              ₦{balance.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Wallet size={20} color={Colors.textSecondaryDark} />
          </View>
        </View>

        {/* Choose Amount to Add Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 17,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 14,
              letterSpacing: -0.2,
            }}
          >
            Choose Amount to Add
          </Text>

          {/* Preset Amount Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {PRESET_AMOUNTS.map((amount) => {
              const isSelected = selectedAmount === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  onPress={() => handleAmountSelect(amount)}
                  style={{
                    flex: 1,
                    backgroundColor: isSelected
                      ? Colors.accent
                      : Colors.backgroundGray,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: Colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-Bold',
                      color: isSelected ? Colors.white : Colors.textPrimary,
                      letterSpacing: -0.2,
                    }}
                  >
                    ₦{amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <View
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <TextInput
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                letterSpacing: -0.2,
              }}
              placeholderTextColor={Colors.textSecondaryDark}
            />
          </View>
        </View>

        {/* Select Payment Method Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 17,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 14,
              letterSpacing: -0.2,
            }}
          >
            Select Payment Method
          </Text>

          {/* Bank Transfer Option */}
          <TouchableOpacity
            onPress={() => {
              setShowBankTransferModal(true);
            }}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
              Bank Transfer
            </Text>
            <ChevronRight size={18} color={Colors.textSecondaryDark} />
          </TouchableOpacity>

          {/* Card Option */}
          <TouchableOpacity
            onPress={handleCardPayment}
            disabled={isProcessingCard || isLoading}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: Colors.border,
              opacity: (isProcessingCard || isLoading) ? 0.6 : 1,
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {isProcessingCard && (
                <ActivityIndicator 
                  size="small" 
                  color={Colors.accent} 
                  style={{ marginRight: 8 }} 
                />
              )}
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
                {isProcessingCard ? 'Processing...' : 'Card Payment'}
            </Text>
            </View>
            {!isProcessingCard && <ChevronRight size={18} color={Colors.textSecondaryDark} />}
          </TouchableOpacity>
        </View>

        {/* Pending Payment Verification Section */}
        {pendingDepositReference && (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 14,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#FCD34D',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Lock size={18} color="#D97706" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#92400E',
                  flex: 1,
                }}
              >
                Payment Pending Verification
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: '#78350F',
                marginBottom: 12,
                lineHeight: 18,
              }}
            >
              If you have already completed the payment, click below to verify and update your balance.
            </Text>
            {pendingDepositReference && (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins-Regular',
                  color: '#92400E',
                  marginBottom: 12,
                  fontStyle: 'italic',
                }}
              >
                Reference: {pendingDepositReference}
              </Text>
            )}
        <Button
              title={isLoading ? "Verifying..." : "Verify Payment"}
              onPress={() => {
                if (pendingDepositReference) {
                  verifyPendingDeposit(pendingDepositReference, true);
                }
              }}
              variant="secondary"
              size="medium"
          fullWidth
              disabled={isLoading || !pendingDepositReference}
              style={{
                backgroundColor: '#D97706',
              }}
            />
          </View>
        )}

        {/* Info Note */}
        <View
          style={{
            backgroundColor: '#F0F9FF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: Colors.accent,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Regular',
              color: Colors.textPrimary,
              lineHeight: 20,
            }}
          >
            💡 <Text style={{ fontFamily: 'Poppins-SemiBold' }}>Note:</Text> Card payments are processed instantly. Bank transfers may take up to 24 hours to verify.
          </Text>
        </View>
      </ScrollView>

      {/* Bank Transfer Modal */}
      <AnimatedModal
        visible={showBankTransferModal}
        onClose={() => setShowBankTransferModal(false)}
        animationType="slide"
      >
        <View>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                flex: 1,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Account details
            </Text>
            <TouchableOpacity
              onPress={() => setShowBankTransferModal(false)}
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Number */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Account Number
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                2219300511
              </Text>
            </View>
          </View>

          {/* Amount Due */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Amount Due
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                ₦{parseFloat(customAmount || selectedAmount.toString()).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Account Name */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Account Name
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                BAMCHURCH LTD
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Payment method
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                Transfer
              </Text>
            </View>
          </View>

          {/* Secure Payment */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Lock size={16} color={Colors.textSecondaryDark} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginLeft: 8,
              }}
            >
              Secure Payment
            </Text>
          </View>

          {/* I have paid Button */}
          <Button
            title="I have paid"
            onPress={handleBankTransferConfirm}
            variant="secondary"
            size="large"
            fullWidth
            style={{
              backgroundColor: Colors.black,
            }}
          />
        </View>
      </AnimatedModal>

      {/* Email Input Modal - Shown when email is not available */}
      <AnimatedModal
        visible={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailInput('');
          setPendingAmount(null);
        }}
        animationType="slide"
      >
        <View>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                flex: 1,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Email Required
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowEmailModal(false);
                setEmailInput('');
                setPendingAmount(null);
              }}
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              marginBottom: 16,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            We need your email address to process the payment. Please enter your email:
          </Text>

          {/* Email Input */}
          <View
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.md,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: Colors.border,
              marginBottom: 24,
            }}
          >
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
              }}
              placeholderTextColor={Colors.textSecondaryDark}
            />
          </View>

          {/* Continue Button */}
          <Button
            title="Continue"
            onPress={async () => {
              const trimmedEmail = emailInput.trim();
              if (!trimmedEmail || !trimmedEmail.includes('@')) {
                showError('Please enter a valid email address.');
                return;
              }

              // Validate email format
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(trimmedEmail)) {
                showError('Please enter a valid email address.');
                return;
              }

              // Save email first, then close modal
              setUserEmail(trimmedEmail);
              
              // Get amount to use
              const amountToUse = pendingAmount || parseFloat(customAmount) || selectedAmount;
              
              // Close modal first
              setShowEmailModal(false);
              setEmailInput('');
              setPendingAmount(null);
              
              // Small delay to ensure modal closes smoothly
              setTimeout(async () => {
                // Proceed with payment using entered email
                await processCardPayment(trimmedEmail, amountToUse);
              }, 300);
            }}
            variant="primary"
            size="large"
            fullWidth
            disabled={!emailInput.trim()}
          />
        </View>
      </AnimatedModal>
      
      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}

