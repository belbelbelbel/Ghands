import { useRouter } from 'expo-router';
import { Building, User, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountTypeCard } from '../components/AccountTypeCard';

export default function SelectAccountTypeScreen() {
  const router = useRouter();
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

  const handleCardPress = () => {
    router.push('/SignupScreen');
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
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header Icon */}
          <Animated.View style={{ opacity: fadeAnim }} className="items-center mt-16 mb-8">
            <View className="w-40 h-40 bg-[#ADF802] rounded-full items-center justify-center">
              <Users size={60} color="black" />
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
              icon={<User size={32} color="black" />}
              title="Individual Client"
              subtitle="Personal service requests"
              tags={["Established", "Licensed", "Certified"]}
              onPress={handleCardPress}
            />

            <AccountTypeCard
              icon={<Building size={32} color="black" />}
              title="Corporate Client"
              subtitle="Business service solutions"
              tags={["Established", "Licensed", "Certified"]}
              onPress={handleCardPress}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}