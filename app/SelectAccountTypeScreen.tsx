import { useRouter } from 'expo-router';
import { Building, User, Users } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { AccountTypeCard } from '../components/AccountTypeCard';

export default function SelectAccountTypeScreen() {
  const router = useRouter();

  const handleCardPress = () => {
    router.push('/SignupScreen');
  };

  const handleSkip = () => {
    // Navigate to main screen or next appropriate screen
    router.push('/main');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
       <View className="items-center mt-0 mb-0">
          <View className="w-40 h-40 absolute top-10 bg-[#ADF802] rounded-full items-center justify-center" style={{borderRadius: 100}}>
            <Users size={60} color="black" />
          </View>
        </View>
      <View className="flex-1 justify-center">
       

        {/* Title */}
        <Text className="text-2xl ml-4 font-bold text-black text-left mb-3">
          Choose Your Account Type
        </Text>
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
      </View>
    </SafeAreaView>
  );
}