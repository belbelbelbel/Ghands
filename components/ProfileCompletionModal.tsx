import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AnimatedModal from './AnimatedModal';
import { InputField } from './InputField';
import { Button } from './ui/Button';
import { Colors, Spacing, BorderRadius } from '@/lib/designSystem';
import { User, X } from 'lucide-react-native';
import { useToast } from '@/hooks/useToast';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { firstName: string; lastName: string; gender: string }) => void;
}

export default function ProfileCompletionModal({
  visible,
  onClose,
  onComplete,
}: ProfileCompletionModalProps) {
  const { showError } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim() || !gender) {
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

    setIsSubmitting(true);
    try {
      // TODO: API call will be added after backend discussion
      await onComplete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender.toLowerCase(),
      });
      
      // Mark profile as complete
      await AsyncStorage.setItem('@ghands:profile_complete', 'true');
      
      // Reset form
      setFirstName('');
      setLastName('');
      setGender('');
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      showError('Failed to complete profile. Please try again.');
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
          {/* Title */}
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Just one more step! This will only take a minute.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
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

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name</Text>
              <InputField
                placeholder="Enter your last name"
                icon={<User size={20} color={'white'} />}
                value={lastName}
                onChangeText={setLastName}
                iconPosition="left"
                autoCapitalize="words"
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
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
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
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
