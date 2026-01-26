import React, { ReactNode, useState, useEffect, forwardRef } from 'react';
import { KeyboardTypeOptions, TextInput, View, Text } from 'react-native';
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
  errorMessage?: string;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  showCharCount?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  returnKeyType?: 'done' | 'next' | 'search' | 'send' | 'go';
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}

export const InputField = forwardRef<TextInput, InputFieldProps>((props, ref) => {
  const {
    placeholder,
    icon,
    secureTextEntry = false,
    keyboardType = 'default',
    value,
    onChangeText,
    iconPosition = 'left',
    error = false,
    errorMessage,
    disabled = false,
    autoCapitalize = 'sentences',
    maxLength,
    showCharCount = false,
    onBlur,
    onFocus,
    returnKeyType = 'done',
    onSubmitEditing,
    autoFocus = false,
  } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (value.length > 0) {
      setHasInteracted(true);
    }
  }, [value]);

  const showError = error && hasInteracted;
  const charCount = maxLength ? value.length : null;
  const remainingChars = maxLength ? maxLength - value.length : null;

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <View
        style={{
          backgroundColor: Colors.backgroundGray,
          borderRadius: BorderRadius.default,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: INPUT_HEIGHTS.medium,
          borderWidth: showError || isFocused ? 2 : 0,
          borderColor: showError ? Colors.error : isFocused ? Colors.accent : 'transparent',
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
        ref={ref}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={(text) => {
          setHasInteracted(true);
          onChangeText(text);
        }}
        editable={!disabled}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
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
      
      {/* Error Message and Character Count */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: showError || showCharCount ? Spacing.xs : 0,
          marginBottom: showError || showCharCount ? Spacing.xs : 0,
          paddingHorizontal: Spacing.sm,
        }}
      >
        {showError && errorMessage && (
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              fontFamily: 'Poppins-Regular',
              color: Colors.error,
            }}
          >
            {errorMessage}
          </Text>
        )}
        {showCharCount && maxLength && (
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins-Regular',
              color: remainingChars && remainingChars < 10 ? Colors.error : Colors.textSecondaryDark,
              marginLeft: showError ? Spacing.sm : 0,
            }}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
});

InputField.displayName = 'InputField';