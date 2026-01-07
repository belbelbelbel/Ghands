import React from 'react';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

export type RecommendedService = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  categoryId?: string;
  onPress?: () => void;
};

const RecommendedCardComponent = ({ title, subtitle, image, onPress }: RecommendedService) => {
  return (
    <TouchableOpacity
      className="w-48 mr-4"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="h-32 rounded-2xl overflow-hidden mb-3 bg-gray-100">
        <Image source={image} resizeMode="cover" className="w-full h-full" />
      </View>
      <Text
        className="text-base text-black mb-1"
        style={{ fontFamily: 'Poppins-SemiBold' }}
      >
        {title}
      </Text>
      <Text
        className="text-xs text-gray-500"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
};

const RecommendedCard = React.memo(RecommendedCardComponent);

export default RecommendedCard;

