import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
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
    // Simulate file upload
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
      <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-3xl font-bold text-black mb-8" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Upload Documents</Text>

        <View className="mb-6">
          <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Business License
          </Text>
          <TouchableOpacity 
            onPress={() => handleUpload('license')}
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-12 items-center justify-center mb-3"
          >
            <Upload size={32} color="#9CA3AF" />
            <Text className="text-gray-500 text-base mt-2" style={{ fontFamily: 'Poppins-Medium' }}>
              Tap to upload
            </Text>
          </TouchableOpacity>
          {businessLicense && (
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <FileText size={20} color="#6A9B00" />
              <View className="flex-1 ml-3">
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {businessLicense.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-blue-500 h-1 rounded-full" style={{ width: '60%' }} />
                  <Text className="text-gray-500 text-xs ml-2" style={{ fontFamily: 'Poppins-Medium' }}>
                    {businessLicense.size}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveFile('license')}>
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Tax Document
          </Text>
          <TouchableOpacity 
            onPress={() => handleUpload('tax')}
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-12 items-center justify-center mb-3"
          >
            <Upload size={32} color="#9CA3AF" />
            <Text className="text-gray-500 text-base mt-2" style={{ fontFamily: 'Poppins-Medium' }}>
              Tap to upload
            </Text>
          </TouchableOpacity>
          {taxDocument && (
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <FileText size={20} color="#6A9B00" />
              <View className="flex-1 ml-3">
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {taxDocument.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-blue-500 h-1 rounded-full" style={{ width: '60%' }} />
                  <Text className="text-gray-500 text-xs ml-2" style={{ fontFamily: 'Poppins-Medium' }}>
                    {taxDocument.size}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveFile('tax')}>
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mb-8">
          <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            License or certification
          </Text>
          <View className="bg-gray-100 rounded-xl px-4 py-3">
            <Text className="text-gray-500 text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Enter certification details
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          className="bg-[#6A9B00] rounded-xl py-4 px-6 flex-row items-center justify-center"
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

