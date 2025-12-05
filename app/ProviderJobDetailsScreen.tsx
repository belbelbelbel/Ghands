import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Shield } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProviderJobDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.borderLight,
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
              backgroundColor: Colors.borderLight,
              marginRight: Spacing.md,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ ...Fonts.h3, fontSize: 18, color: Colors.textPrimary, flex: 1 }}>
            Job Details
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md,
            paddingBottom: 100,
          }}
        >
          <View style={CommonStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: Colors.border,
                  marginRight: Spacing.sm + 2,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ ...Fonts.bodyMedium, fontSize: 16, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 2 }}>
                  Lawal Johnson
                </Text>
                <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark }}>
                  Individual Client
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ ...Fonts.bodyTiny, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginBottom: 2 }}>
                  Member since
                </Text>
                <Text style={{ ...Fonts.bodySmall, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>Jan 2023</Text>
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: Colors.borderLight,
              borderRadius: BorderRadius.default,
              padding: Spacing.md,
              marginBottom: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.sm + 2,
              }}
            >
              <Shield size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Fonts.bodySmall, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginBottom: 2 }}>
                Service Type
              </Text>
              <Text style={{ ...Fonts.bodyMedium, fontSize: 16, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>House Cleaning</Text>
            </View>
          </View>
          <View style={CommonStyles.card}>
            <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: Spacing.sm }}>
              Description
            </Text>
            <Text style={{ ...Fonts.bodySmall, fontSize: 13, color: Colors.textSecondaryDark, lineHeight: 20 }}>
              I need a thorough cleaning of my 3-bedroom apartment. This includes kitchen deep cleaning, bathroom
              sanitization, living areas dusting and vacuuming, and bedroom organization. I have two cats, so please be
              mindful of pet hair. The apartment is approximately 1,200 sq ft.
            </Text>
          </View>

          <View style={CommonStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: Spacing.sm + 2,
                }}
              >
                <Calendar size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 2 }}>
                  Saturday October 20, 2024
                </Text>
                <Text style={{ ...Fonts.bodyTiny, color: Colors.textSecondaryDark }}>
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
                  backgroundColor: Colors.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: Spacing.sm + 2,
                }}
              >
                <Clock size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>From 10:00AM</Text>
              </View>
            </View>
          </View>

          <View style={CommonStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm + 2 }}>
              <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>Photos</Text>
              <TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ ...Fonts.bodySmall, fontFamily: 'Poppins-SemiBold', color: Colors.accent, marginRight: Spacing.xs }}>
                    View all
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {[1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: BorderRadius.md,
                    backgroundColor: Colors.border,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                />
              ))}
            </View>
          </View>

          <View style={CommonStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm + 2 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: Spacing.sm + 2,
                }}
              >
                <MapPin size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 2 }}>
                  Downtown Apartment
                </Text>
                <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark }}>
                  123 Main St, Apt 48, shomolu Estate
                </Text>
              </View>
            </View>
            <View
              style={{
                height: 160,
                borderRadius: BorderRadius.md,
                backgroundColor: Colors.borderLight,
                borderWidth: 1,
                borderColor: Colors.border,
                overflow: 'hidden',
              }}
            >
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={32} color={Colors.tabInactive} />
                <Text style={{ ...Fonts.bodySmall, fontFamily: 'Poppins-Medium', color: Colors.tabInactive, marginTop: Spacing.xs + 2 }}>
                  Map View
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.lg,
            paddingTop: Spacing.md,
            backgroundColor: Colors.backgroundLight,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            style={{
              ...CommonStyles.buttonSecondary,
              paddingVertical: Spacing.md,
              marginBottom: Spacing.sm + 2,
              width: '100%',
            }}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Text style={{ ...Fonts.button, fontSize: 14, color: Colors.textPrimary }}>Send Quotation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...CommonStyles.buttonDanger,
              paddingVertical: Spacing.md,
              width: '100%',
            }}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Text style={{ ...Fonts.button, fontSize: 14, color: Colors.error }}>Decline Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}
