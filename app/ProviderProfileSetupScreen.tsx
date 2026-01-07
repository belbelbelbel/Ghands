import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Building, ChevronDown, Upload, User, X, FileText } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Modal, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { serviceCategories } from '@/data/serviceCategories';

export default function ProviderProfileSetupScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [description, setDescription] = useState('');
  const [licenseText, setLicenseText] = useState('');
  const [licenseDocument, setLicenseDocument] = useState<string | null>(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const serviceOptions = ['All Services', ...serviceCategories.map(cat => cat.title)];

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setShowServiceDropdown(false);
  };

  const handleUploadLicense = async () => {
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
        setLicenseDocument(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveDocument = () => {
    setLicenseDocument(null);
  };

  const handleContinue = () => {
    if (businessName.trim() && description.trim()) {
      router.push('/ProviderUploadDocumentsScreen' as any);
    }
  };

  const isFormValid = businessName.trim() && description.trim();

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
        }}>Setup your Profile</Text>

        <View className="bg-gray-100 rounded-xl mb-4 px-4 py-3 flex-row items-center">
          <View className="w-12 h-12 mr-4 bg-[#6A9B00] border border-[#6A9B00] rounded-xl items-center justify-center">
            <User size={20} color="white" />
          </View>
          <TextInput
            placeholder="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            className="flex-1 text-black text-base"
            placeholderTextColor="#666666"
            style={{ fontFamily: 'Poppins-Medium' }}
          />
        </View>

        <View className="mb-6">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Service Category
          </Text>
          <TouchableOpacity 
            onPress={() => setShowServiceDropdown(true)}
            className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              {selectedService}
            </Text>
            <ChevronDown size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Description
          </Text>
          <TextInput
            placeholder="Describe your business"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            className="bg-gray-100 rounded-xl px-4 py-3 text-black text-base"
            placeholderTextColor="#666666"
            style={{ 
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 120,
            }}
          />
        </View>

        <View className="mb-8">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            License or certification
          </Text>
          
          {/* Text Input for License/Certification */}
          <TextInput
            placeholder="Enter license or certification details"
            value={licenseText}
            onChangeText={setLicenseText}
            multiline
            numberOfLines={3}
            className="bg-gray-100 rounded-xl px-4 py-3 text-black text-base mb-3"
            placeholderTextColor="#666666"
            style={{ 
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 80,
            }}
          />

          {/* Document Upload Section */}
          {licenseDocument ? (
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <FileText size={20} color="#6A9B00" />
              <View className="flex-1 ml-3">
                <Image 
                  source={{ uri: licenseDocument }} 
                  style={{ width: 60, height: 60, borderRadius: 8, marginBottom: 4 }}
                  resizeMode="cover"
                />
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  License document uploaded
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveDocument} className="ml-2">
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={handleUploadLicense}
              className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <Upload size={32} color="#9CA3AF" />
              <Text className="text-gray-500 text-base mt-2" style={{ fontFamily: 'Poppins-Medium' }}>
                Tap to upload document
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid}
          className={`rounded-xl py-4 px-6 ${
            isFormValid ? 'bg-[#6A9B00]' : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
        >
          <Text 
            className={`text-center text-lg font-semibold ${
              isFormValid ? 'text-white' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Finish Setup
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Service Dropdown Modal */}
      <Modal
        visible={showServiceDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceDropdown(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowServiceDropdown(false)}
          />
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70%',
              paddingTop: 20,
            }}
          >
            <View className="px-4 pb-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-black" style={{ fontFamily: 'Poppins-Bold' }}>
                Select Service Category
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {serviceOptions.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleServiceSelect(service)}
                  className={`px-4 py-4 border-b border-gray-100 ${
                    selectedService === service ? 'bg-green-50' : 'bg-white'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base ${
                        selectedService === service ? 'text-[#6A9B00]' : 'text-black'
                      }`}
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {service}
                    </Text>
                    {selectedService === service && (
                      <Ionicons name="checkmark" size={20} color="#6A9B00" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

