import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { walletService, providerService } from '@/services/api';
import { Colors, BorderRadius, Spacing } from '@/lib/designSystem';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ArrowUp, Bell, CheckCircle, Info, Star, ThumbsUp, Wallet } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH < 375 ? 0.85 : SCREEN_WIDTH < 414 ? 0.92 : 1.0;

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

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<number | null>(null);
  const [totalJobs, setTotalJobs] = useState<number | null>(null);
  const [completedJobs, setCompletedJobs] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  const formatNaira = useCallback((value: number | null | undefined) => {
    if (!value || !isFinite(value)) return '₦0.00';
    return (
      '₦' +
      Number(value).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1) Wallet balance
      const wallet = await walletService.getWallet();
      const balanceValue =
        typeof wallet.balance === 'number'
          ? wallet.balance
          : parseFloat(String(wallet.balance)) || 0;
      setBalance(balanceValue);

      // 2) Recent transactions – used to compute monthly earnings
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const txResult = await walletService.getTransactions({ limit: 200, offset: 0 });
      const transactions = Array.isArray(txResult?.transactions) ? txResult.transactions : [];

      const monthTotal = transactions
        .filter((tx: any) => {
          if (!tx) return false;
          if (tx.status !== 'completed') return false;
          const amt = Number(tx.amount ?? 0);
          if (!isFinite(amt) || amt <= 0) return false;
          const ts = tx.createdAt || tx.updatedAt || tx.timestamp;
          if (!ts) return false;
          const d = new Date(ts);
          if (isNaN(d.getTime())) return false;
          return d >= monthStart;
        })
        .reduce((sum: number, tx: any) => sum + Number(tx.amount ?? 0), 0);
      setMonthlyEarnings(monthTotal);

      // 3) Provider stats (jobs + rating)
      const provider = await providerService.getProvider();
      const stats: any = (provider as any)?.stats || {};
      setTotalJobs(
        typeof stats.totalJobs === 'number' ? stats.totalJobs : stats.totalCompletedJobs ?? null
      );
      setCompletedJobs(
        typeof stats.totalCompletedJobs === 'number'
          ? stats.totalCompletedJobs
          : stats.completedJobs ?? null
      );
      setAverageRating(
        typeof stats.averageRating === 'number'
          ? stats.averageRating
          : typeof (provider as any)?.rating === 'number'
          ? (provider as any).rating
          : null
      );
      setReviewCount(
        typeof stats.reviewCount === 'number'
          ? stats.reviewCount
          : (provider as any)?.reviewCount ?? null
      );

      // 4) Recent reviews (if provider has them)
      const rawReviews: any[] = Array.isArray((provider as any)?.recentReviews)
        ? (provider as any).recentReviews
        : [];
      const mappedReviews: Review[] = rawReviews.slice(0, 5).map((r: any, index: number) => ({
        id: String(r.id ?? index),
        name: r.reviewerName || r.clientName || 'Client',
        time: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('en-NG', {
              month: 'short',
              day: 'numeric',
            })
          : '',
        rating: Number(r.rating ?? r.stars ?? 0) || 0,
        comment: r.comment || r.feedback || '',
        avatar: r.avatarUrl,
      }));
      setRecentReviews(mappedReviews);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading analytics:', error);
      }
      // On error fall back to safe defaults
      setBalance((prev) => prev ?? 0);
      setMonthlyEarnings((prev) => prev ?? 0);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [formatNaira]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useFocusEffect(
    useCallback(() => {
      // Refresh when user comes back to the screen
      setIsRefreshing(true);
      loadAnalytics();
    }, [loadAnalytics])
  );

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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                This Month
              </Text>
              {monthlyEarnings != null && (
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textTertiary,
                  }}
                >
                  Based on completed wallet payments
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                {formatNaira(monthlyEarnings)}
              </Text>
              {/* Placeholder growth chip – we don't fabricate %; show neutral label instead */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E5E7EB',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <ArrowUp size={14} color={Colors.textSecondaryDark} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginLeft: 4,
                  }}
                >
                  Monthly earnings
                </Text>
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
              {formatNaira(balance)}
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
              title="Go to wallet"
              onPress={() => {
                router.push('/provider/wallet' as any);
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
                {completedJobs ?? totalJobs ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Total completed jobs
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
                {averageRating && reviewCount && reviewCount > 0
                  ? averageRating.toFixed(1)
                  : '—'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Average rating ({reviewCount ?? 0} reviews)
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
                {averageRating ? averageRating.toFixed(1) : '—'}
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
              {reviewCount && reviewCount > 0
                ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}`
                : 'No reviews yet'}
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
            {recentReviews.length === 0 && (
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                You don&apos;t have any reviews yet. Completed jobs with ratings will appear here.
              </Text>
            )}
            {recentReviews.map((review) => (
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
