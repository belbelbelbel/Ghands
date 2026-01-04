import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TIMELINE_STEPS = [
  {
    id: '1',
    title: 'Job Request Received',
    description: 'Awaiting your quotation',
    status: 'Completed - 2 hours ago',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
  {
    id: '2',
    title: 'Quotation Sent',
    description: 'Waiting for confirmation',
    status: '',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
  {
    id: '3',
    title: 'Quotation Accepted',
    description: 'Client Accepted your quote',
    status: '',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
  {
    id: '4',
    title: 'Payment Confirmed',
    description: 'Payment Secured',
    status: '',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
  {
    id: '5',
    title: 'Job In Progress',
    description: 'You are onsite!',
    status: '',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
  {
    id: '6',
    title: 'Complete',
    description: 'Job Approved',
    status: '',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
];

export default function ProviderCompletedJobScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: Colors.white,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 100,
          }}
        >
          {/* Client Information Card */}
          <View
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.xl,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../assets/images/userimg.jpg')}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: 12,
                }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 3,
                  }}
                >
                  Lawal Johnson
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Individual Client
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: Colors.accent,
                    borderRadius: BorderRadius.default,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Phone size={18} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: Colors.accent,
                    borderRadius: BorderRadius.default,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Job Description Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 10,
              }}
            >
              Job Description
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                lineHeight: 20,
              }}
            >
              Kitchen sink pipe has developed a leak underneath the cabinet. Water is dripping continuously and needs
              immediate repair. The pipe appears to be loose at the joint connection.
            </Text>
          </View>

          {/* Scheduled Details Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {/* Date */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Calendar size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 3,
                  }}
                >
                  Saturday October 20, 2024
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Scheduled date
                </Text>
              </View>
            </View>

            {/* Time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Clock size={18} color={Colors.accent} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                From 10:00AM
              </Text>
            </View>

            {/* Location */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <MapPin size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 3,
                  }}
                >
                  Downtown Apartment
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  123 Main St, Apt 48, shomolu Estate
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.accent,
                borderRadius: BorderRadius.xl,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => router.push('/ProviderReceiptScreen' as any)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                  marginRight: 6,
                }}
              >
                View receipt
              </Text>
              <ArrowRight size={16} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: Colors.error,
                borderRadius: BorderRadius.xl,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.error,
                }}
              >
                Report Issue
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timeline Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {TIMELINE_STEPS.map((step, index) => {
              const isLast = index === TIMELINE_STEPS.length - 1;
              return (
                <View key={step.id} style={{ flexDirection: 'row', marginBottom: isLast ? 0 : 16 }}>
                  {/* Timeline Indicator */}
                  <View style={{ alignItems: 'center', marginRight: 16 }}>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: step.dotColor,
                        borderWidth: 2,
                        borderColor: Colors.white,
                      }}
                    />
                    {!isLast && (
                      <View
                        style={{
                          width: 2,
                          flex: 1,
                          backgroundColor: step.lineColor,
                          marginTop: 4,
                          minHeight: 40,
                        }}
                      />
                    )}
                  </View>

                  {/* Timeline Content */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {step.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                        marginBottom: 4,
                      }}
                    >
                      {step.description}
                    </Text>
                    {step.status && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.accent,
                        }}
                      >
                        {step.status}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Job Completed Button */}
          <TouchableOpacity
            disabled
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.xl,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textTertiary,
              }}
            >
              Job Completed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
