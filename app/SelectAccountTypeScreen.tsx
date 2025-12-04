import SafeAreaWrapper from '@/components/SafeAreaWrapper';
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

  const handleCardPress = (nextRole: 'consumer' | 'provider') => {
    setRole(nextRole);
    if (nextRole === 'provider') {
      router.replace('/ProviderSignUpScreen');
    } else {
      router.replace('/SignupScreen');
    }
  };


  const handleSkip = () => {
    router.push('/main');
  };

  const interpolatedBackgroundColor = backgroundFade.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0b0b07', '#ffffff'], 
  });

  return (
    <Animated.View style={{ flex: 1, backgroundColor: interpolatedBackgroundColor,  }}>
      <SafeAreaWrapper>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header Icon */}
          <Animated.View style={{ opacity: fadeAnim }} className="items-center mt-16 mb-8">
            <View className="w-40 h-40 bg-[#6A9B00] rounded-full items-center justify-center">
              <Users size={60} color="white" />
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: fadeAnim, flex: 0, justifyContent: 'center' }}>
               <Animated.Text
            style={{
              opacity: fadeAnim,
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'left',
              marginBottom: 10,
              color: '#000000', 
              fontFamily: 'Poppins-ExtraBold',
              marginLeft: 15
            }}
          >
            Choose Your Account Type
          </Animated.Text>
            <AccountTypeCard
              icon={<User size={32} color="white" />}
              title="Individual Client"
              subtitle="Personal service requests"
              tags={["Established", "Licensed", "Certified"]}
              onPress={() => handleCardPress('consumer')}
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