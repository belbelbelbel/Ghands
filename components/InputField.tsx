import React, { ReactNode } from 'react';
import { KeyboardTypeOptions, TextInput, View } from 'react-native';

interface InputFieldProps {
  placeholder: string;
  icon: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  value: string;
  onChangeText: (text: string) => void;
  iconPosition?: 'left' | 'right';
}

export const InputField: React.FC<InputFieldProps> = ({
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  value,
  onChangeText,
  iconPosition = 'left',
}) => {
  return (
    <View className="bg-gray-100 border-[0pc] rounded-xl mb-4 px-4 py-3 flex-row items-center">
      {iconPosition === 'left' && (
        <View className="w-12 h-12 mr-4 bg-[#6A9B00]    border-blackx rounded-xl items-center justify-center">
          {icon}
        </View>
      )}
      <TextInput
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-black text-base"
        placeholderTextColor="#666666"
        style={{
          fontFamily: 'Poppins-Medium',
        }}
      />
      {iconPosition === 'right' && (
        <View className="w-12 h-12 ml-4 bg-[#6A9B00] r border-blsack rounded-xl items-center justify-center">
          {icon}
        </View>
      )}
    </View>
  );
};