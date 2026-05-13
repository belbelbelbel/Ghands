import { Colors } from '@/lib/designSystem';
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
      className="rounded-2xl mx-2 my-1 relative"
      style={{
        paddingHorizontal: 18,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 0,
        backgroundColor: '#FAFBF9',
        borderWidth: 1,
        borderColor: 'rgba(79, 103, 57, 0.35)',
      }}
    >
      {/* Right Arrow */}
      <View className="absolute right-5" style={{ top: 42 }}>
        <ChevronRight size={21} color="black" />
      </View>

      <View className="items-start">
        <View className="flex-row items-center" style={{ marginBottom: 12, paddingRight: 28 }}>
          <View
            className="rounded-2xl items-center justify-center"
            style={{
              width: 52,
              height: 52,
              marginRight: 14,
              backgroundColor: Colors.white,
              borderWidth: 1.5,
              borderColor: 'rgba(79, 103, 57, 0.45)',
            }}
          >
            {icon}
          </View>
          <View className="flex-1 items-start">
            <Text
              className="font-bold text-black mb-1"
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: 16,
                lineHeight: 21,
              }}
            >
              {title}
            </Text>
            <Text
              className="text-gray-600"
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 12,
                lineHeight: 17,
              }}
            >
              {subtitle}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap">
          {tags.map((tag, index) => (
            <TagBadge key={index} text={tag} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};