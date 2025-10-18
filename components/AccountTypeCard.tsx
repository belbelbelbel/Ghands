import { ChevronRight } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TagBadge } from './TagBadge';

interface AccountTypeCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tags: string[];
  onPress: () => void;
}

export const AccountTypeCard: React.FC<AccountTypeCardProps> = ({
  icon,
  title,
  subtitle,
  tags,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white border-2 border-[#ADF802] rounded-2xl p-6 mx-4 my-2 relative"
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Right Arrow */}
      <View className="absolute top-16 right-6">
        <ChevronRight size={24} color="black" />
      </View>

      <View className='flex items-start '>
        <View className='flex flex-row gap-4 items-center mb-4'>
          <View className="w-16 h-16 bg-[#ADF802] rounded-2xl items-center justify-center mb-4 mx-auto">
            {icon}
          </View>
          <View className='flex flex-col items-start '>
            <Text className="text-lg font-bold text-black text-center mb-1">
              {title}
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-4">
              {subtitle}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-center flex-wrap">
          {tags.map((tag, index) => (
            <TagBadge key={index} text={tag} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};