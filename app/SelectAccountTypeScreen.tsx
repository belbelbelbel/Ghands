import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { Building, User, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { AccountTypeCard } from '../components/AccountTypeCard';
import { useAuthRole } from '../hooks/useAuth';

export default function SelectAccountTypeScreen() {
  const router = useRouter();
  const { setRole } = useAuthRole();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const backgroundFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(50),
      Animated.timing(backgroundFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false, 
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCardPress = (nextRole: 'client' | 'provider') => {
    // Persist chosen role for route guards
    setRole(nextRole);
    if (nextRole === 'provider') {
      // Navigate to provider type selection screen
      router.push('/ProviderTypeSelectionScreen');
    } else {
      router.replace('/SignupScreen');
    }
  };


  // Skip button removed - users must select account type
  // const handleSkip = () => {
  //   router.push('/main');
  // };

  const interpolatedBackgroundColor = backgroundFade.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.background, Colors.backgroundLight], 
  });

  return (
    <Animated.View style={{ flex: 1, backgroundColor: interpolatedBackgroundColor,  }}>
      <SafeAreaWrapper>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header Icon */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              alignItems: 'center',
              marginTop: 64,
              marginBottom: 32,
            }}
          >
            <View
              style={{
                width: 160,
                height: 160,
                backgroundColor: Colors.accent,
                borderRadius: 80,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Users size={60} color={Colors.white} />
            </View>
          </Animated.View>
          <Animated.View
            style={{
              opacity: fadeAnim,
              flex: 0,
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Animated.Text
              style={{
                opacity: fadeAnim,
                ...Fonts.h3,
                textAlign: 'left',
                marginBottom: 24,
                color: Colors.textPrimary,
              }}
            >
              Choose Your Account Type
            </Animated.Text>
            <AccountTypeCard
              icon={<User size={32} color="white" />}
              title="Individual Client"
              subtitle="Personal service requests"
              tags={["Established", "Licensed", "Certified"]}
              onPress={() => handleCardPress('client')}
            />

            <AccountTypeCard
              icon={<Building size={32} color="white" />}
              title="Service Provider"
              subtitle="Earn by completing jobs"
              tags={["Verified", "Professional", "Insured"]}
              onPress={() => handleCardPress('provider')}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaWrapper>
    </Animated.View>
  );
}