import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Shield } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProviderJobDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              backgroundColor: '#F3F4F6',
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: '#000000', flex: 1 }}>
            Job Details
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 100,
          }}
        >
          {/* Client Information Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E5E7EB',
                  marginRight: 10,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 2 }}>
                  Lawal Johnson
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' }}>
                  Individual Client
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Medium', color: '#666666', marginBottom: 2 }}>
                  Member since
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#000000' }}>Jan 2023</Text>
              </View>
            </View>
          </View>

          {/* Job Type Card */}
          <View
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Shield size={20} color="#6A9B00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#666666', marginBottom: 2 }}>
                Service Type
              </Text>
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: '#000000' }}>House Cleaning</Text>
            </View>
          </View>

          {/* Description Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 8 }}>
              Description
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666', lineHeight: 20 }}>
              I need a thorough cleaning of my 3-bedroom apartment. This includes kitchen deep cleaning, bathroom
              sanitization, living areas dusting and vacuuming, and bedroom organization. I have two cats, so please be
              mindful of pet hair. The apartment is approximately 1,200 sq ft.
            </Text>
          </View>

          {/* Date and Time Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Calendar size={16} color="#6A9B00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 2 }}>
                  Saturday October 20, 2024
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#666666' }}>
                  Preferred date
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Clock size={16} color="#6A9B00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000' }}>From 10:00AM</Text>
              </View>
            </View>
          </View>

          {/* Photos Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000' }}>Photos</Text>
              <TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#6A9B00', marginRight: 4 }}>
                    View all
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#6A9B00" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    backgroundColor: '#E5E7EB',
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                  }}
                />
              ))}
            </View>
          </View>

          {/* Location Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <MapPin size={16} color="#6A9B00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 2 }}>
                  Downtown Apartment
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' }}>
                  123 Main St, Apt 48, shomolu Estate
                </Text>
              </View>
            </View>
            <View
              style={{
                height: 160,
                borderRadius: 10,
                backgroundColor: '#F3F4F6',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                overflow: 'hidden',
              }}
            >
              {/* Map placeholder */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={32} color="#9CA3AF" />
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#9CA3AF', marginTop: 6 }}>
                  Map View
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 12,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#6A9B00',
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 10,
            }}
            onPress={() => {
              // Handle send quotation
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#000000' }}>Send Quotation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#FFFFFF',
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#FEE2E2',
            }}
            onPress={() => {
              // Handle decline request
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#DC2626' }}>Decline Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}
