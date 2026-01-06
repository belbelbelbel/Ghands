import React, { ReactNode } from 'react';
import { KeyboardTypeOptions, TextInput, View } from 'react-native';
import { Colors, Spacing, BorderRadius, INPUT_HEIGHTS } from '@/lib/designSystem';

interface InputFieldProps {
  placeholder: string;
  icon: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  value: string;
  onChangeText: (text: string) => void;
  iconPosition?: 'left' | 'right';
  error?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const InputField: React.FC<InputFieldProps> = ({
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  value,
  onChangeText,
  iconPosition = 'left',
  error = false,
  disabled = false,
  autoCapitalize = 'sentences',
}) => {
  return (
    <View
      style={{
        backgroundColor: Colors.backgroundGray,
        borderRadius: BorderRadius.default,
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: INPUT_HEIGHTS.medium,
        borderWidth: error ? 1 : 0,
        borderColor: error ? Colors.error : 'transparent',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {iconPosition === 'left' && (
        <View
          style={{
            width: 48,
            height: 48,
            marginRight: Spacing.lg,
            backgroundColor: Colors.accent,
            borderRadius: BorderRadius.default,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      )}
      <TextInput
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        autoCapitalize={autoCapitalize}
        style={{
          flex: 1,
          color: Colors.textPrimary,
          fontSize: 16,
          fontFamily: 'Poppins-Medium',
        }}
        placeholderTextColor={Colors.textSecondaryDark}
      />
      {iconPosition === 'right' && (
        <View
          style={{
            width: 48,
            height: 48,
            marginLeft: Spacing.lg,
            backgroundColor: Colors.accent,
            borderRadius: BorderRadius.default,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      )}
    </View>
  );
};