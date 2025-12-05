import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, FileText, Upload, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

export default function ProviderUploadDocumentsScreen() {
  const router = useRouter();
  const [businessLicense, setBusinessLicense] = useState<UploadedFile | null>(null);
  const [taxDocument, setTaxDocument] = useState<UploadedFile | null>(null);
  const [certification, setCertification] = useState<string>('');

  const handleUpload = (type: 'license' | 'tax') => {
    const mockFile: UploadedFile = {
      id: Date.now().toString(),
      name: 'Upload Representative ID',
      size: '101kb',
    };
    
    if (type === 'license') {
      setBusinessLicense(mockFile);
    } else {
      setTaxDocument(mockFile);
    }
  };

  const handleRemoveFile = (type: 'license' | 'tax') => {
    if (type === 'license') {
      setBusinessLicense(null);
    } else {
      setTaxDocument(null);
    }
  };

  const handleContinue = () => {
    router.push('/ProviderVerifyIdentityScreen');
  };

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: 40 }}>
        <Text style={{
          ...Fonts.h1,
          fontSize: 28,
          color: Colors.textPrimary,
          marginBottom: Spacing.lg,
        }}>Upload Documents</Text>

        <View style={{ marginBottom: Spacing.lg + 2 }}>
          <Text style={{
            ...Fonts.body,
            fontFamily: 'Poppins-SemiBold',
            color: Colors.textPrimary,
            marginBottom: Spacing.sm + 1,
          }}>
            Business License
          </Text>
          <TouchableOpacity 
            onPress={() => handleUpload('license')}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: Colors.border,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.xxxl,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.sm + 1,
            }}
          >
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
          {businessLicense && (
            <View style={{
              backgroundColor: Colors.backgroundLight,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: BorderRadius.default,
              paddingHorizontal: Spacing.xs + 4,
              paddingVertical: Spacing.sm + 1,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <FileText size={20} color={Colors.accent} />
              <View style={{ flex: 1, marginLeft: Spacing.sm + 1 }}>
                <Text style={{
                  ...Fonts.bodySmall,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}>
                  {businessLicense.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{
                    backgroundColor: Colors.accent,
                    height: 4,
                    borderRadius: 2,
                    width: '60%',
                  }} />
                  <Text style={{
                    ...Fonts.bodyTiny,
                    color: Colors.textTertiary,
                    marginLeft: Spacing.xs + 2,
                    fontFamily: 'Poppins-Medium',
                  }}>
                    {businessLicense.size}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveFile('license')}>
                <X size={20} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ marginBottom: Spacing.lg + 2 }}>
          <Text style={{
            ...Fonts.body,
            fontFamily: 'Poppins-SemiBold',
            color: Colors.textPrimary,
            marginBottom: Spacing.sm + 1,
          }}>
            Tax Document
          </Text>
          <TouchableOpacity 
            onPress={() => handleUpload('tax')}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: Colors.border,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.xxxl,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.sm + 1,
            }}
          >
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
          {taxDocument && (
            <View style={{
              backgroundColor: Colors.backgroundLight,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: BorderRadius.default,
              paddingHorizontal: Spacing.xs + 4,
              paddingVertical: Spacing.sm + 1,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <FileText size={20} color={Colors.accent} />
              <View style={{ flex: 1, marginLeft: Spacing.sm + 1 }}>
                <Text style={{
                  ...Fonts.bodySmall,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}>
                  {taxDocument.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{
                    backgroundColor: Colors.accent,
                    height: 4,
                    borderRadius: 2,
                    width: '60%',
                  }} />
                  <Text style={{
                    ...Fonts.bodyTiny,
                    color: Colors.textTertiary,
                    marginLeft: Spacing.xs + 2,
                    fontFamily: 'Poppins-Medium',
                  }}>
                    {taxDocument.size}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveFile('tax')}>
                <X size={20} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{
            ...Fonts.body,
            fontFamily: 'Poppins-SemiBold',
            color: Colors.textPrimary,
            marginBottom: Spacing.sm + 1,
          }}>
            License or certification
          </Text>
          <View style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.default,
            paddingHorizontal: Spacing.xs + 4,
            paddingVertical: Spacing.sm + 1,
          }}>
            <Text style={{
              ...Fonts.body,
              color: Colors.textTertiary,
              fontFamily: 'Poppins-Medium',
            }}>
              Enter certification details
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          style={{
            ...CommonStyles.buttonSecondary,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg + 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{
            ...Fonts.button,
            fontSize: 16,
            color: Colors.textPrimary,
            marginRight: Spacing.xs + 2,
          }}>
            Continue
          </Text>
          <ArrowRight size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

