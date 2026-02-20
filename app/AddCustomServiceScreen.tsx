import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors, SHADOWS, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Lightbulb, Mail, Upload } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { providerService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';

export default function AddCustomServiceScreen() {
  const router = useRouter();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLicenseImage(result.assets[0].uri);
        haptics.light();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!email || !email.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    if (!jobTitle || jobTitle.trim().length < 3) {
      showError('Job title must be at least 3 characters');
      return;
    }

    if (!description || description.trim().length < 10) {
      showError('Description must be at least 10 characters');
      return;
    }

    if (description.length > 500) {
      showError('Description must not exceed 500 characters');
      return;
    }

    setIsSubmitting(true);
    haptics.light();

    try {
      // TODO: Implement API call to submit custom service request
      // await providerService.submitCustomService({
      //   email,
      //   jobTitle: jobTitle.trim(),
      //   description: description.trim(),
      //   licenseImage,
      // });

      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      haptics.success();
      showSuccess('Custom service submitted for approval!');
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting custom service:', error);
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'submit_custom_service') || 'Failed to submit custom service. Please try again.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md + 4,
            paddingBottom: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            backgroundColor: Colors.white,
            ...SHADOWS.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.back();
            }}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
            }}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
              }}
            >
              Add Custom Service
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Email Input */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 16,
                  height: 52,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: Colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Mail size={14} color={Colors.accent} />
                </View>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                  }}
                  placeholderTextColor={Colors.textSecondaryDark}
                />
              </View>
            </View>

            {/* Job Title Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                Job Title <Text style={{ color: Colors.error }}>*</Text>
              </Text>
              <View
                style={{
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 16,
                  height: 52,
                }}
              >
                <TextInput
                  placeholder="e.g., Kitchen faucet repair, Electrical outlet installation"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                  }}
                  placeholderTextColor={Colors.textSecondaryDark}
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                Description
              </Text>
              <View
                style={{
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  minHeight: 120,
                }}
              >
                <TextInput
                  placeholder="Describe the service in detail..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                    minHeight: 100,
                  }}
                  placeholderTextColor={Colors.textSecondaryDark}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {description.length}/500
                  </Text>
                </View>
              </View>
            </View>

            {/* License or Certification Upload */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                License or certification:
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                style={{
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                  borderWidth: 2,
                  borderColor: Colors.border,
                  borderStyle: 'dashed',
                  padding: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 150,
                }}
                activeOpacity={0.7}
              >
                {licenseImage ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.accent,
                        marginBottom: 8,
                      }}
                    >
                      Image Selected
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      Tap to change
                    </Text>
                  </View>
                ) : (
                  <>
                    <Upload size={32} color={Colors.textSecondaryDark} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                        marginTop: 12,
                      }}
                    >
                      Tap to upload
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Tips Section */}
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Lightbulb size={20} color={Colors.accent} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  Tips for Custom Services
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Check size={16} color={Colors.accent} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      flex: 1,
                    }}
                  >
                    Be specific and clear about what the service includes
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Check size={16} color={Colors.accent} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      flex: 1,
                    }}
                  >
                    Use professional terminology that customers understand
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Check size={16} color={Colors.accent} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      flex: 1,
                    }}
                  >
                    Approval typically takes 24-48 hours
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed Bottom Button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 32,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.default,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginRight: 8,
                  }}
                >
                  Submit for Approval
                </Text>
                <ArrowRight size={16} color={Colors.textPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}
