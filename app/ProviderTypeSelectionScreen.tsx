import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { Building2, User, ArrowLeft, Briefcase } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AccountTypeCard } from '../components/AccountTypeCard';
import { haptics } from '@/hooks/useHaptics';

export default function ProviderTypeSelectionScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleIndividualProvider = () => {
    haptics.light();
    router.push('/IndividualProviderComingSoonScreen');
  };

  const handleCorporateProvider = () => {
    haptics.light();
    router.push('/ProviderSignUpScreen');
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaWrapper>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
            <Text
              style={{
                marginLeft: 8,
                color: Colors.textPrimary,
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          {/* Header Icon */}
          <Animated.View
            style={[
              {
                alignItems: 'center',
                marginTop: 24,
                marginBottom: 32,
              },
              animatedStyle,
            ]}
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
              <Briefcase size={60} color={Colors.white} />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              {
                flex: 0,
                justifyContent: 'center',
                paddingHorizontal: 20,
                paddingBottom: 32,
              },
              animatedStyle,
            ]}
          >
            <Text
              style={{
                ...Fonts.h3,
                textAlign: 'left',
                marginBottom: 24,
                color: Colors.textPrimary,
                fontFamily: 'Poppins-Bold',
              }}
            >
              Choose Your Provider Type
            </Text>

            {/* Individual Provider Card - Using AccountTypeCard with Coming Soon badge */}
            <View style={{ position: 'relative', marginBottom: 16 }}>
              <AccountTypeCard
                icon={<User size={32} color="white" />}
                title="Individual Provider"
                subtitle="You work alone"
                tags={["Established", "Licensed", "Certified"]}
                onPress={handleIndividualProvider}
              />
            </View>

            {/* Corporate Provider Card */}
            <AccountTypeCard
              icon={<Building2 size={32} color="white" />}
              title="Corporate Provider"
              subtitle="Provider service solutions"
              tags={["Established", "Licensed", "Certified"]}
              onPress={handleCorporateProvider}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaWrapper>
    </Animated.View>
  );
}
