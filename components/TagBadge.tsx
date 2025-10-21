import React from 'react';
import { Text, View } from 'react-native';

interface TagBadgeProps {
  text: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ text }) => {
  return (
    <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
      <Text className="text-xs text-gray-600 font-medium" style={{
           fontFamily: 'Poppins-Regular',
      }}>{text}</Text>
    </View>
  );
};