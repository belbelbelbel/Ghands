import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { apiClient } from '@/services/api';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Phone, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnimatedModal from './AnimatedModal';
import { InputField } from './InputField';
import { Button } from './ui/Button';

interface ProfileCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { firstName: string; lastName: string; phoneNumber: string; gender: string }) => void;
}

export default function ProfileCompletionModal({
  visible,
  onClose,
  onComplete,
}: ProfileCompletionModalProps) {
  const { showError } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !gender) {
      showError('Please fill in all fields');
      return;
    }

    if (firstName.trim().length < 2) {
      showError('First name must be at least 2 characters');
      return;
    }

    if (lastName.trim().length < 2) {
      showError('Last name must be at least 2 characters');
      return;
    }

    const trimmedPhone = phoneNumber.trim().replace(/\s/g, '');
    if (trimmedPhone.length < 10) {
      showError('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // First-time signup completion - strictly for users who haven't completed profile
      try {
        await apiClient.post(`/api/user/complete-signup`, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: trimmedPhone,
          gender: gender.toLowerCase(),
        });
      } catch (apiError: any) {
        // If API fails, still mark complete locally so user isn't stuck
        if (__DEV__) console.warn('complete-signup API error:', apiError);
      }

      await AsyncStorage.setItem('@ghands:profile_complete', 'true');

      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setGender('');
      setIsSubmitting(false);
      onClose();

      setTimeout(() => {
        onComplete({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: trimmedPhone,
          gender: gender.toLowerCase(),
        });
      }, 300);
    } catch (error: any) {
      setIsSubmitting(false);
      showError(error.message || 'Failed to complete profile. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatedModal visible={visible} onClose={handleClose} dismissible={!isSubmitting}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <User size={24} color={Colors.accent} />
          </View>
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            <X size={20} color={Colors.textSecondaryDark} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title - Shown only for first-time users who haven't completed profile */}
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Just one more step! Add your name, phone, and gender to continue.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name - Column Layout */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name</Text>
              <InputField
                placeholder="Enter your first name"
                icon={<User size={20} color={'white'} />}
                value={firstName}
                onChangeText={setFirstName}
                iconPosition="left"
                autoCapitalize="words"
              />
            </View>

            {/* Last Name - Column Layout */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name</Text>
              <InputField
                placeholder="Enter your last name"
                icon={<User size={20} color={'white'} />}
                value={lastName}
                onChangeText={setLastName}
                iconPosition="right"
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <InputField
                placeholder="Enter your phone number"
                icon={<Phone size={20} color={'white'} />}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                iconPosition="left"
                keyboardType="phone-pad"
              />
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      gender.toLowerCase() === option.toLowerCase() && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender.toLowerCase() === option.toLowerCase() && styles.genderTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actions}>
          <Button
            title="Complete Profile"
            onPress={handleComplete}
            variant="primary"
            size="large"
            fullWidth
            disabled={isSubmitting}
          />
        </View>
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.backgroundGray,
  },
  scrollContent: {
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.sm,
  },
  inputContainer: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  genderText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
  },
  genderTextActive: {
    color: Colors.accent,
    fontFamily: 'Poppins-SemiBold',
  },
  actions: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
