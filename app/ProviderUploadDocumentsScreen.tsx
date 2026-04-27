import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowRight, ShieldCheck, Upload, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface UploadedFile {
  uri: string;
  name: string;
  size?: number;
}

export default function ProviderUploadDocumentsScreen() {
  const router = useRouter();
  const [businessLicense, setBusinessLicense] = useState<UploadedFile | null>(null);
  const [taxDocument, setTaxDocument] = useState<UploadedFile | null>(null);
  const [certification, setCertification] = useState<string>('');

  const handleUpload = async (type: 'license' | 'tax') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'document.jpg';
        const fileSize = asset.fileSize ? `${(asset.fileSize / 1024).toFixed(0)}kb` : undefined;
        
        const file: UploadedFile = {
          uri: asset.uri,
          name: fileName,
          size: asset.fileSize,
        };
        
        if (type === 'license') {
          setBusinessLicense(file);
        } else {
          setTaxDocument(file);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
    router.push('/ProviderLinkBankAccountScreen' as any);
  };

  return (
    <SafeAreaWrapper backgroundColor="#F8FAFC">
      <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: 24,
            padding: 20,
            marginBottom: 22,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: '#6A9B00',
              opacity: 0.14,
            }}
          />
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(202,255,51,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <ShieldCheck size={24} color="#CAFF33" />
          </View>
          <Text className="text-white mb-2" style={{ fontFamily: 'Poppins-Bold', fontSize: 22, letterSpacing: -0.4 }}>
            Upload documents
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.68)' }}>
            Add business documents that help clients trust your provider profile.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Business License
          </Text>
          {!businessLicense ? (
            <TouchableOpacity
              onPress={() => handleUpload('license')}
              className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <Upload size={32} color="#6A9B00" />
              <Text className="text-gray-900 text-base mt-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Upload business license
              </Text>
              <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                JPG or PNG document photo
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex-row items-center">
              <View className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                <Image 
                  source={{ uri: businessLicense.uri }} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {businessLicense.name.length > 30 ? businessLicense.name.substring(0, 30) + '...' : businessLicense.name}
                </Text>
                {businessLicense.size && (
                  <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins-Medium' }}>
                    {(businessLicense.size / 1024).toFixed(0)}kb
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => handleRemoveFile('license')}
                className="ml-2"
                activeOpacity={0.7}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Tax Document
          </Text>
          {!taxDocument ? (
            <TouchableOpacity
              onPress={() => handleUpload('tax')}
              className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <Upload size={32} color="#6A9B00" />
              <Text className="text-gray-900 text-base mt-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Upload tax document
              </Text>
              <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                Optional, but helps verification
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex-row items-center">
              <View className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                <Image 
                  source={{ uri: taxDocument.uri }} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {taxDocument.name.length > 30 ? taxDocument.name.substring(0, 30) + '...' : taxDocument.name}
                </Text>
                {taxDocument.size && (
                  <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins-Medium' }}>
                    {(taxDocument.size / 1024).toFixed(0)}kb
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => handleRemoveFile('tax')}
                className="ml-2"
                activeOpacity={0.7}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mb-8">
          <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            License or certification
          </Text>
          <TextInput
            placeholder="Example: Licensed plumber, CAC registration, years of experience..."
            value={certification}
            onChangeText={setCertification}
            multiline
            numberOfLines={4}
            className="bg-white rounded-2xl px-4 py-3 text-black text-base border border-gray-200"
            placeholderTextColor="#666666"
            style={{ 
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 100,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          className="bg-[#6A9B00] rounded-2xl py-4 px-6 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Continue
          </Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

