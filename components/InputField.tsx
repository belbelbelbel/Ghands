import React, { ReactNode } from 'react';
import { KeyboardTypeOptions, TextInput, View } from 'react-native';

interface InputFieldProps {
  placeholder: string;
  icon: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  value: string;
  onChangeText: (text: string) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  value,
  onChangeText,
}) => {
  return (
    <View className="bg-gray-100 rounded-xl mb-4 px-4 py-4 flex-row items-center">
      <TextInput
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-black text-base"
        placeholderTextColor="#9CA3AF"
      />
      <View className="w-8 h-8 bg-[#ADF802] rounded-full items-center justify-center ml-2">
        {icon}
      </View>
    </View>
  );
};