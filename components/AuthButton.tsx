import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-black rounded-xl py-4 px-6 mb-6"
    >
      <Text className="text-white text-center text-lg font-semibold">
        {title}
      </Text>
    </TouchableOpacity>
  );
};