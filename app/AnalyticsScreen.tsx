import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, BorderRadius, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowUp, Bell, CheckCircle, Info, Star, ThumbsUp, Wallet } from 'lucide-react-native';
import React from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH < 375 ? 0.85 : SCREEN_WIDTH < 414 ? 0.92 : 1.0;
import { Button } from '@/components/ui/Button';

interface Review {
  id: string;
  name: string;
  time: string;
  rating: number;
  comment: string;
  avatar?: string;
}

export default function AnalyticsScreen() {
  const router = useRouter();

  const reviews: Review[] = [
    {
      id: '1',
      name: 'Sarah Miller',
      time: '2 days ago',
      rating: 5,
      comment: 'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
    {
      id: '2',
      name: 'Sarah Miller',
      time: '2 days ago',
      rating: 5,
      comment: 'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
    {
      id: '3',
      name: 'Sarah Miller',
      time: '2 days ago',
      rating: 5,
      comment: 'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
  ];

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
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
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Analytics
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            activeOpacity={0.7}
            onPress={() => router.push('/NotificationsScreen' as any)}
          >
            <Bell size={24} color={Colors.textPrimary} />
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: Colors.accent,
              }}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 100,
          }}
        >
          {/* Earnings Overview */}
          <View
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 16,
              }}
            >
              Earnings Overview
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 4,
                  }}
                >
                  This Week
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginRight: 8,
                    }}
                  >
                    $1,245
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ArrowUp size={14} color={Colors.accent} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.accent,
                        marginLeft: 2,
                      }}
                    >
                      12%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 4,
                  }}
                >
                  This Month
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginRight: 8,
                    }}
                  >
                    $4,890
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ArrowUp size={14} color={Colors.accent} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.accent,
                        marginLeft: 2,
                      }}
                    >
                      8%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Available Balance */}
          <View
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                Available Balance
              </Text>
              <Wallet size={20} color={Colors.textPrimary} />
            </View>
            <Text
              style={{
                fontSize: 32 * scale,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}
            >
              $2,156.50
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginBottom: 16,
              }}
            >
              Funds available for withdrawal.
            </Text>
            <Button
              title="Withdraw Funds"
              onPress={() => {
                // Navigate to withdraw screen
              }}
              variant="primary"
              fullWidth
            />
          </View>

          {/* Performance Metrics */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Jobs Card */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#F5F5F5',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={18} color={Colors.white} />
                </View>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginBottom: 4,
                }}
              >
                JOBS
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                24
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Completed this week
              </Text>
            </View>

            {/* Quotation Approval Card */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#F5F5F5',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThumbsUp size={18} color={Colors.white} />
                </View>
                <Info size={16} color={Colors.textSecondaryDark} />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                78%
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Quotation approval
              </Text>
            </View>
          </View>

          {/* Average Rating */}
          <View
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Average Rating
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginRight: 8,
                }}
              >
                4.8
              </Text>
              <Star size={24} color={Colors.accent} fill={Colors.accent} />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
              }}
            >
              Based on customer reviews
            </Text>
          </View>

          {/* Latest Reviews */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Latest Reviews
            </Text>
            {reviews.map((review) => (
              <View
                key={review.id}
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.border,
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
                    {review.name.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                      }}
                    >
                      {review.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      {review.time}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} color="#FFD700" fill="#FFD700" />
                    ))}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      lineHeight: 18,
                    }}
                  >
                    {review.comment}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Insights Section */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Insights
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
                lineHeight: 22,
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
