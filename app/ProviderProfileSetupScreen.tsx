import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { Building, ChevronDown, Upload, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProviderProfileSetupScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [description, setDescription] = useState('');

  const handleContinue = () => {
    if (businessName.trim() && description.trim()) {
      router.push('/ProviderUploadDocumentsScreen');
    }
  };

  const isFormValid = businessName.trim() && description.trim();

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: 40 }}>
        <Text style={{
          ...Fonts.h1,
          fontSize: 28,
          color: Colors.textPrimary,
          marginBottom: Spacing.lg,
        }}>Setup your Profile</Text>

        <View style={{
          backgroundColor: Colors.backgroundGray,
          borderRadius: BorderRadius.default,
          marginBottom: Spacing.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 48,
            height: 48,
            marginRight: Spacing.md,
            backgroundColor: Colors.accent,
            borderRadius: BorderRadius.default,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={20} color={Colors.white} />
          </View>
          <TextInput
            placeholder="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            style={{
              flex: 1,
              color: Colors.textPrimary,
              fontSize: 16,
              fontFamily: 'Poppins-Medium',
              paddingVertical: 0,
            }}
            placeholderTextColor={Colors.textSecondaryDark}
          />
        </View>

        <TouchableOpacity style={{
          backgroundColor: Colors.backgroundGray,
          borderRadius: BorderRadius.default,
          marginBottom: Spacing.lg + 2,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            ...Fonts.body,
            color: Colors.textPrimary,
            fontFamily: 'Poppins-Medium',
          }}>
            {selectedService}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondaryDark} />
        </TouchableOpacity>

        <View style={{ marginBottom: Spacing.lg + 2 }}>
          <Text style={{
            ...Fonts.body,
            fontFamily: 'Poppins-SemiBold',
            color: Colors.textPrimary,
            marginBottom: Spacing.xs + 2,
          }}>
            Description
          </Text>
          <TextInput
            placeholder="Describe your business"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.default,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.md,
              color: Colors.textPrimary,
              fontSize: 16,
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 120,
            }}
            placeholderTextColor={Colors.textSecondaryDark}
          />
        </View>

        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{
            ...Fonts.body,
            fontFamily: 'Poppins-SemiBold',
            color: Colors.textPrimary,
            marginBottom: Spacing.xs + 2,
          }}>
            License or certification:
          </Text>
          <TouchableOpacity style={{
            backgroundColor: Colors.backgroundGray,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: Colors.border,
            borderRadius: BorderRadius.default,
            paddingVertical: Spacing.xxxl,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Upload size={32} color={Colors.tabInactive} />
            <Text style={{
              ...Fonts.body,
              color: Colors.textTertiary,
              marginTop: Spacing.xs + 2,
              fontFamily: 'Poppins-Medium',
            }}>
              Tap to upload
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid}
          style={{
            borderRadius: BorderRadius.default,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg + 2,
            backgroundColor: isFormValid ? Colors.accent : Colors.borderLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text 
            style={{
              ...Fonts.button,
              fontSize: 16,
              color: isFormValid ? Colors.textPrimary : Colors.textTertiary,
              textAlign: 'center',
            }}
          >
            Finish Setup
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

