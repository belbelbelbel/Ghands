import React from 'react';
import { Text, View } from 'react-native';

interface TagBadgeProps {
  text: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ text }) => {
  return (
    <View
      className="bg-gray-100 rounded-full"
      style={{ paddingHorizontal: 8, paddingVertical: 4, marginRight: 7, marginBottom: 2 }}
    >
      <Text
        className="text-gray-600 font-medium"
        style={{
          fontFamily: 'Poppins-Regular',
          fontSize: 10,
          lineHeight: 13,
        }}
      >
        {text}
      </Text>
    </View>
  );
};