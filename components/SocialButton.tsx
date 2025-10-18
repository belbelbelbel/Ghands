import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SocialButtonProps {
  title: string;
  icon: ReactNode;
  onPress: () => void;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ title, icon, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white border border-gray-300 rounded-xl py-4 px-6 mb-3 flex-row items-center justify-center"
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="mr-3">
        {icon}
      </View>
      <Text className="text-black text-base font-medium">
        {title}
      </Text>
    </TouchableOpacity>
  );
};