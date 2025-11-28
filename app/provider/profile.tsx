import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '../../hooks/useAuth';

export default function ProviderProfileScreen() {
  const { logout } = useAuthRole();
  const router = useRouter();
  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 17,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#E5E7EB',
              marginBottom: 10,
            }}
          />
          <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: '#000000' }}>Isaac Okoro</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#666666', marginTop: 4 }}>
            Professional Electrician
          </Text>
        </View>

        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            backgroundColor: '#fff',
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#000000', marginBottom: 8 }}>
            Metrics
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#000000' }}>4.9</Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#666666' }}>Rating</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#000000' }}>128</Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#666666' }}>Jobs</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#000000' }}>98%</Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#666666' }}>On-time</Text>
            </View>
          </View>
        </View>

        {[
          'Edit profile',
          'Verification & documents',
          'Availability & schedule',
          'Notifications',
          'Support',
        ].map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.8}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#fff',
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#000000' }}>{item}</Text>
            <Text style={{ fontSize: 16, color: '#999999' }}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            marginTop: 6,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#FECACA',
            backgroundColor: '#FEF2F2',
            paddingVertical: 12,
            alignItems: 'center',
          }}
          onPress={async () => {
            await logout();
            router.replace('/onboarding');
          }}
        >
          <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#B91C1C' }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
