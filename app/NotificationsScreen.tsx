import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { haptics } from '@/hooks/useHaptics';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { Notification, notificationService } from '@/services/api';
import { formatTimeAgo } from '@/utils/dateFormatting';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Archive, Bell, Calendar, CheckCheck, Clock, FileText, Handshake, MessageCircle, Trash2, Wallet, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

type UINotificationSection = 'Recent' | 'Yesterday' | 'Last week';

interface UINotification {
  id: number;
  isRead: boolean;
  createdAt: string;
  requestId?: number | null;
  quotationId?: number | null;
  transactionId?: number | null;
  type: string;
  description: string;
  barColor: string;
  icon: any;
  iconBgColor: string;
  iconColor: string;
  time: string;
  section: UINotificationSection;
  raw: Notification;
}

const ARCHIVED_IDS_KEY = '@ghands:notification_archived_ids';

type FilterPill = 'all' | 'unread' | 'read' | 'archive';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [previewNotification, setPreviewNotification] = useState<UINotification | null>(null);
  const [filterPill, setFilterPill] = useState<FilterPill>('all');
  const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());
  const [userRole, setUserRole] = useState<'client' | 'provider'>('client');
  const swipeableRefs = useRef<Map<number, Swipeable | null>>(new Map());

  const hasNotifications = notifications.length > 0;
  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read').length,
    [notifications]
  );

  const getSectionFromDate = (isoDate: string): UINotificationSection => {
    try {
      const created = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return 'Recent';
      if (diffDays === 1) return 'Yesterday';
      return 'Last week';
    } catch {
      return 'Recent';
    }
  };

  useEffect(() => {
    const loadRole = async () => {
      try {
        const role = await AsyncStorage.getItem('@ghands:user_role');
        if (role === 'provider') {
          setUserRole('provider');
        } else {
          setUserRole('client');
        }
      } catch {
        setUserRole('client');
      }
    };
    loadRole();
  }, []);

  // Map backend notification type to UI presentation
  const mapNotificationToUI = (notification: Notification): UINotification => {
    // Default UI values
    let typeLabel = notification.title || 'Notification';
    const rawBackendDescription = String(notification.description || notification.message || '').trim();
    let description = rawBackendDescription.replace(/^null[\s:,-]*/i, '').trim();
    let barColor = Colors.accent;
    let IconComponent: any = FileText;
    let iconBgColor = '#E5E7EB';
    let iconColor = Colors.textPrimary;

    switch (notification.type) {
      case 'deposit_success': {
        typeLabel = 'Deposit Successful';
        const amount = notification.metadata?.amount ?? notification.metadata?.total;
        const amountText =
          typeof amount === 'number'
            ? `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
            : '';
        description =
          description ||
          (amountText
            ? `${amountText} has been successfully deposited to your wallet.`
            : 'Your deposit has been successfully completed and added to your wallet balance.');
        barColor = '#16A34A';
        IconComponent = Wallet;
        iconBgColor = '#DCFCE7';
        iconColor = '#15803D'; // rich green
        break;
      }
      case 'quotation_sent': {
        typeLabel = 'Quotation Sent';
        const total = notification.metadata?.total;
        const totalText =
          typeof total === 'number'
            ? `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
            : '';
        description =
          description ||
          (totalText
            ? `A provider has sent you a quotation with a total amount of ${totalText}.`
            : 'A provider has sent you a new quotation. Please review and decide whether to accept or decline.');
        barColor = Colors.accent;
        IconComponent = FileText;
        iconBgColor = '#DBEAFE';
        iconColor = '#1D4ED8'; // blue
        break;
      }
      case 'quotation_accepted': {
        // Client-side view: quotation was accepted
        typeLabel = 'Quotation Accepted';
        const total = notification.metadata?.total;
        const totalText =
          typeof total === 'number'
            ? `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
            : '';
        description =
          description ||
          (totalText
            ? `You have accepted a quotation for ${totalText}. Proceed to payment to start the job.`
            : 'You have accepted a quotation. Proceed to payment to start the job.');
        barColor = '#16A34A';
        IconComponent = Handshake;
        iconBgColor = '#DCFCE7';
        iconColor = '#15803D'; // rich green
        break;
      }
      case 'request_accepted': {
        // Client-side view: provider accepted their request
        typeLabel = 'Request Accepted';
        {
          const providerName = notification.metadata?.providerName || 'A provider';
          description =
            description ||
            `${providerName} has accepted your request. They will review the details and send you a quotation shortly.`;
        }
        barColor = '#3B82F6';
        IconComponent = Handshake;
        iconBgColor = '#FEF3C7';
        iconColor = '#92400E'; // warm brown
        break;
      }
      case 'request_received':
      case 'new_request': {
        // Provider-side view: they received a new job request
        typeLabel = 'New Request';
        description =
          description ||
          'You have a new job request. Review the details and decide whether to proceed.';
        barColor = Colors.accent;
        IconComponent = FileText;
        iconBgColor = '#DBEAFE';
        iconColor = '#1D4ED8';
        break;
      }
      case 'work_order_issued':
      case 'work_order_created': {
        typeLabel = 'Work order issued';
        description =
          description ||
          'A work order has been issued for this job. Check the schedule and get ready to start.';
        barColor = Colors.accent;
        IconComponent = Calendar;
        iconBgColor = '#DCFCE7';
        iconColor = '#15803D';
        break;
      }
      case 'payment_released':
      case 'payout_released':
      case 'job_payment_released': {
        typeLabel = 'Payment Released';
        const amount = notification.metadata?.amount ?? notification.metadata?.total;
        const amountText =
          typeof amount === 'number'
            ? `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
            : '';
        description =
          description ||
          (amountText
            ? `${amountText} has been released for this job. Funds will be available in your wallet shortly.`
            : 'Payment has been released for this job. Funds will be available in your wallet shortly.');
        barColor = '#3B82F6';
        IconComponent = Wallet;
        iconBgColor = '#DCFCE7';
        iconColor = '#15803D';
        break;
      }
      case 'withdrawal_success':
      case 'withdrawal_processed':
      case 'withdrawal_completed': {
        typeLabel = 'Withdrawal Status';
        const amount = notification.metadata?.amount ?? notification.metadata?.total;
        const amountText =
          typeof amount === 'number'
            ? `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
            : '';
        description =
          description ||
          (amountText
            ? `Your withdrawal request of ${amountText} has been processed successfully.`
            : 'Your withdrawal request has been processed successfully.');
        barColor = '#3B82F6';
        IconComponent = Clock;
        iconBgColor = '#E5E7EB';
        iconColor = '#1F2937';
        break;
      }
      default: {
        // Fallback styling
        if (notification.type === 'message' || notification.type === 'chat_new') {
          typeLabel = 'New message';
          // Keep message notifications backend-driven (no invented text).
          // Also fix direction wording when sender metadata indicates current side.
          const senderType = String(
            notification.metadata?.senderType ??
            (notification.metadata as any)?.sender_type ??
            ''
          ).toLowerCase();
          if (description) {
            const fromCurrentSide =
              (userRole === 'client' &&
                (senderType === 'user' || senderType === 'client' || senderType === 'customer')) ||
              (userRole === 'provider' &&
                (senderType === 'provider' || senderType === 'company'));
            if (fromCurrentSide) {
              description = description
                .replace(/provider sent you a text/gi, 'You sent a message')
                .replace(/sent you a text/gi, 'You sent a message');
            }
          } else {
            description = '';
          }
          barColor = '#3B82F6';
          IconComponent = MessageCircle;
          iconBgColor = '#E5E7EB';
          iconColor = '#1F2937'; // dark gray
        }
        break;
      }
    }

    return {
      id: notification.id,
      isRead: notification.status === 'read',
      createdAt: notification.createdAt,
      requestId: notification.requestId,
      quotationId: notification.quotationId,
      transactionId: notification.transactionId,
      type: typeLabel,
      description,
      barColor,
      icon: IconComponent,
      iconBgColor,
      iconColor,
      time: formatTimeAgo(notification.createdAt),
      section: getSectionFromDate(notification.createdAt),
      raw: notification,
    };
  };

  const uiNotifications = useMemo<UINotification[]>(
    () => notifications.map(mapNotificationToUI),
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filterPill === 'archive') {
      return uiNotifications.filter((n) => archivedIds.has(n.id));
    }
    let list = uiNotifications.filter((n) => !archivedIds.has(n.id));
    if (filterPill === 'unread') list = list.filter((n) => !n.isRead);
    if (filterPill === 'read') list = list.filter((n) => n.isRead);
    return list;
  }, [uiNotifications, filterPill, archivedIds]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<UINotificationSection, UINotification[]> = {
      Recent: [],
      Yesterday: [],
      'Last week': [],
    };
    filteredNotifications.forEach((notif) => {
      groups[notif.section].push(notif);
    });
    return groups;
  }, [filteredNotifications]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Fetch all notifications (both read and unread) to show full history
      // Increase limit to get more notifications
      const result = await notificationService.getNotifications({ limit: 100, offset: 0 });
      setNotifications(result.notifications || []);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const loadArchivedIds = async () => {
      try {
        const stored = await AsyncStorage.getItem(ARCHIVED_IDS_KEY);
        if (stored) {
          const ids = JSON.parse(stored) as number[];
          setArchivedIds(new Set(ids));
        }
      } catch (e) {
        if (__DEV__) console.error('Error loading archived IDs:', e);
      }
    };
    loadArchivedIds();
  }, []);

  const persistArchivedIds = useCallback(async (ids: Set<number>) => {
    try {
      await AsyncStorage.setItem(ARCHIVED_IDS_KEY, JSON.stringify([...ids]));
    } catch (e) {
      if (__DEV__) console.error('Error persisting archived IDs:', e);
    }
  }, []);

  const handleClearAll = async () => {
    if (!hasNotifications || isClearing) return;
    setIsClearing(true);
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
    } catch (error) {
      if (__DEV__) {
        console.error('Error clearing notifications:', error);
      }
    } finally {
      setIsClearing(false);
    }
  };

  const getFilterLabel = (pill: FilterPill) => {
    if (pill === 'all') return `All ${notifications.length}`;
    if (pill === 'unread') return `Unread ${unreadCount}`;
    if (pill === 'read') return `Read ${Math.max(notifications.length - unreadCount, 0)}`;
    return `Archive ${archivedIds.size}`;
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleArchive = useCallback(
    (id: number) => {
      haptics.light();
      swipeableRefs.current.get(id)?.close();
      setArchivedIds((prev) => {
        const next = new Set(prev).add(id);
        persistArchivedIds(next);
        return next;
      });
    },
    [persistArchivedIds]
  );

  const handleUnarchive = useCallback(
    (id: number) => {
      haptics.light();
      swipeableRefs.current.get(id)?.close();
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        persistArchivedIds(next);
        return next;
      });
    },
    [persistArchivedIds]
  );

  const handleDelete = useCallback(async (id: number) => {
    haptics.light();
    swipeableRefs.current.get(id)?.close();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        persistArchivedIds(next);
        return next;
      });
    } catch (error) {
      if (__DEV__) console.error('Error deleting notification:', error);
    }
  }, [persistArchivedIds]);

  // Navigate to the correct screen for a backend notification
  const handleNavigateToDetails = (notification: Notification | UINotification) => {
    setPreviewNotification(null);

    // Extract raw notification if it's a UINotification
    const rawNotification = 'raw' in notification ? notification.raw : notification;

    switch (rawNotification.type) {
      case 'message':
      case 'chat_new':
        if (rawNotification.requestId) {
          router.push({
            pathname: '/ChatScreen' as any,
            params: {
              requestId: String(rawNotification.requestId),
              ...(rawNotification.providerId != null && {
                providerId: String(rawNotification.providerId),
              }),
              ...(rawNotification.metadata &&
                typeof rawNotification.metadata.providerName === 'string' && {
                  providerName: rawNotification.metadata.providerName,
                }),
            },
          } as any);
          return;
        }
        break;
      case 'request_accepted':
      case 'quotation_sent':
      case 'quotation_accepted':
      case 'work_order_issued':
      case 'work_order_created':
        // Navigate to job details timeline for client
        if (rawNotification.requestId) {
          router.push({
            pathname: '/OngoingJobDetails' as any,
            params: { requestId: String(rawNotification.requestId) },
          } as any);
          return;
        }
        break;
      case 'deposit_success':
        router.push('/WalletScreen' as any);
        return;
      default:
        // If request-linked but not explicitly handled, still open details screen.
        if (rawNotification.requestId) {
          router.push({
            pathname: userRole === 'provider' ? '/ProviderJobDetailsScreen' : '/OngoingJobDetails',
            params: { requestId: String(rawNotification.requestId) },
          } as any);
          return;
        }
        // For other notification types without route, show preview modal
        const uiNotif = 'raw' in notification ? notification : mapNotificationToUI(rawNotification);
        setPreviewNotification(uiNotif);
        break;
    }
  };

  if (!isLoading && !hasNotifications) {
    return (
      <SafeAreaWrapper backgroundColor={Colors.white}>
        <View style={{ flex: 1 }}>
          <ScreenHeader title="Notifications" onBack={() => router.back()} />
          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 28,
                backgroundColor: '#F2F8EA',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <Bell size={30} color={Colors.accent} />
            </View>
            <Text
              style={{
                fontSize: 19,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              No notifications yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 20,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              Booking updates, payments, messages, and job activity will appear here.
            </Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        <ScreenHeader
          title="Notifications"
          onBack={() => router.back()}
          style={{ paddingBottom: 10 }}
          rightElement={
            <TouchableOpacity
              onPress={handleClearAll}
              activeOpacity={0.7}
              disabled={!hasNotifications || isClearing}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}
              accessibilityLabel="Clear all notifications"
              accessibilityHint="Deletes all notifications"
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-SemiBold',
                  color: hasNotifications && !isClearing ? Colors.accent : Colors.textTertiary,
                }}
              >
                {isClearing ? 'Clearing' : 'Clear'}
              </Text>
            </TouchableOpacity>
          }
        />

        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
          <View
            style={{
              backgroundColor: '#111827',
              borderRadius: 24,
              padding: 18,
              marginBottom: 14,
              overflow: 'hidden',
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -36,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: Colors.accent,
                opacity: 0.18,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Bell size={21} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.white,
                  }}
                >
                  Stay updated
                </Text>
                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    lineHeight: 18,
                    fontFamily: 'Poppins-Regular',
                    color: 'rgba(255,255,255,0.74)',
                  }}
                >
                  {unreadCount > 0
                    ? `${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'} need your attention.`
                    : 'You are all caught up.'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 40,
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 0,
              minHeight: 36,
            }}
          >
            {(['all', 'unread', 'read', 'archive'] as FilterPill[]).map((pill, index) => {
              const isActive = filterPill === pill;
              return (
                <TouchableOpacity
                  key={pill}
                  onPress={() => {
                    haptics.light();
                    setFilterPill(pill);
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: isActive ? Colors.accent : Colors.backgroundGray,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: Colors.border,
                    marginRight: index < 3 ? 8 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-SemiBold',
                      color: isActive ? Colors.white : Colors.textSecondaryDark,
                      textTransform: 'capitalize',
                      lineHeight: 14,
                    }}
                  >
                    {getFilterLabel(pill)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 100,
          }}
        >
          {/* Simple skeleton while loading and list is empty */}
          {isLoading && !hasNotifications && (
            <View style={{ marginBottom: 24 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    marginBottom: i < 3 ? 12 : 0,
                    backgroundColor: '#F8FAF7',
                    borderRadius: 22,
                    padding: 16,
                    opacity: 0.6,
                    borderWidth: 1,
                    borderColor: '#EEF1E8',
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      backgroundColor: '#E5E7EB',
                      borderRadius: 2,
                      marginRight: 12,
                      alignSelf: 'stretch',
                    }}
                  />
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#E5E7EB',
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        width: '40%',
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#E5E7EB',
                        marginBottom: 8,
                      }}
                    />
                    <View
                      style={{
                        width: '90%',
                        height: 10,
                        borderRadius: 6,
                        backgroundColor: '#E5E7EB',
                        marginBottom: 6,
                      }}
                    />
                    <View
                      style={{
                        width: '60%',
                        height: 10,
                        borderRadius: 6,
                        backgroundColor: '#E5E7EB',
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {filteredNotifications.length === 0 && !isLoading && (
            <View
              style={{
                marginTop: 20,
                paddingVertical: 36,
                paddingHorizontal: 20,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#EEF1E8',
                backgroundColor: '#F8FAF7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={28} color={Colors.textTertiary} />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  textAlign: 'center',
                }}
              >
                {filterPill === 'archive'
                  ? 'No archived notifications'
                  : filterPill === 'all' && archivedIds.size > 0
                    ? 'No notifications to show'
                    : filterPill === 'unread'
                      ? 'No unread notifications'
                      : filterPill === 'read'
                        ? 'No read notifications'
                        : 'No notifications'}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 18,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  textAlign: 'center',
                }}
              >
                Try another filter or check back after new job activity.
              </Text>
            </View>
          )}

          {(['Recent', 'Yesterday', 'Last week'] as const).map((section) => {
            const sectionNotifications = groupedNotifications[section] || [];
            if (sectionNotifications.length === 0) return null;

            return (
              <View key={section} style={{ marginBottom: 26 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textSecondaryDark,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {section}
                </Text>

                {sectionNotifications.map((notification, index) => (
                  <Swipeable
                    key={notification.id}
                    ref={(ref) => {
                      if (ref) swipeableRefs.current.set(notification.id, ref);
                      else swipeableRefs.current.delete(notification.id);
                    }}
                    friction={2}
                    rightThreshold={40}
                    renderRightActions={() => {
                      const isArchiveTab = filterPill === 'archive';
                      return (
                        <View
                          style={{
                            flexDirection: 'row',
                            marginBottom: index < sectionNotifications.length - 1 ? 14 : 0,
                            minHeight: 90,
                            alignItems: 'stretch',
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => (isArchiveTab ? handleUnarchive(notification.id) : handleArchive(notification.id))}
                            style={{
                              width: 72,
                              backgroundColor: isArchiveTab ? '#6A9B00' : '#6B7280',
                              borderTopRightRadius: 0,
                              borderBottomRightRadius: 0,
                              borderRadius: BorderRadius.xl,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginLeft: 6,
                            }}
                          >
                            <Archive size={20} color={Colors.white} />
                            <Text style={{ fontSize: 10, fontFamily: 'Poppins-Medium', color: Colors.white, marginTop: 4 }}>
                              {isArchiveTab ? 'Unarchive' : 'Archive'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(notification.id)}
                            style={{
                              width: 72,
                              backgroundColor: '#DC2626',
                              borderTopLeftRadius: 0,
                              borderBottomLeftRadius: 0,
                              borderRadius: BorderRadius.xl,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={20} color={Colors.white} />
                            <Text style={{ fontSize: 10, fontFamily: 'Poppins-Medium', color: Colors.white, marginTop: 4 }}>
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        marginBottom: index < sectionNotifications.length - 1 ? 14 : 0,
                        backgroundColor: Colors.white,
                        borderRadius: 22,
                        paddingVertical: 14,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: notification.isRead ? '#EEF1E8' : 'rgba(106, 155, 0, 0.22)',
                        shadowColor: '#101828',
                        shadowOffset: { width: 0, height: 7 },
                        shadowOpacity: notification.isRead ? 0.025 : 0.055,
                        shadowRadius: 14,
                        elevation: notification.isRead ? 1 : 3,
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 16,
                          backgroundColor: notification.iconBgColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {notification.icon && (
                          <notification.icon
                            size={21}
                            color={notification.iconColor}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text
                          style={{
                              flex: 1,
                              fontSize: 14,
                            fontFamily: 'Poppins-Bold',
                            color: Colors.textPrimary,
                              lineHeight: 19,
                          }}
                            numberOfLines={2}
                        >
                          {notification.type}
                        </Text>
                          {!notification.isRead && (
                            <View
                              style={{
                                marginLeft: 8,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: Colors.accent,
                              }}
                            />
                          )}
                        </View>
                        {!!notification.description && (
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: 'Poppins-Regular',
                              color: Colors.textSecondaryDark,
                              marginBottom: 10,
                              lineHeight: 18,
                            }}
                            numberOfLines={3}
                          >
                            {notification.description}
                          </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => {
                              handleMarkAsRead(notification.id);
                              handleNavigateToDetails(notification);
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              borderRadius: 999,
                              backgroundColor: '#F2F8EA',
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: 'Poppins-SemiBold',
                                color: Colors.accent,
                              }}
                            >
                              View details
                            </Text>
                          </TouchableOpacity>
                          {!notification.isRead && (
                            <TouchableOpacity
                              onPress={() => handleMarkAsRead(notification.id)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                                paddingVertical: 7,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                              }}
                              activeOpacity={0.7}
                            >
                              <CheckCheck size={13} color={Colors.textSecondaryDark} style={{ marginRight: 4 }} />
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'Poppins-SemiBold',
                                  color: Colors.textSecondaryDark,
                                }}
                              >
                                Mark read
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', marginLeft: 10, minWidth: 52 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Poppins-Medium',
                            color: Colors.textSecondaryDark,
                            marginBottom: 4,
                            textAlign: 'right',
                          }}
                        >
                          {notification.time}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: 'Poppins-SemiBold',
                            color: notification.isRead ? Colors.textTertiary : Colors.accent,
                          }}
                        >
                          {notification.isRead ? 'Read' : 'New'}
                        </Text>
                      </View>
                    </View>
                  </Swipeable>
                ))}
              </View>
            );
          })}
        </ScrollView>

        {/* Preview Modal */}
        <Modal
          visible={!!previewNotification}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewNotification(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            {previewNotification && (
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 26,
                  padding: 22,
                  width: '100%',
                  maxWidth: 400,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 18 },
                  shadowOpacity: 0.18,
                  shadowRadius: 28,
                  elevation: 8,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        backgroundColor: previewNotification.iconBgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {previewNotification.icon && (
                        <previewNotification.icon
                          size={21}
                          color={previewNotification.iconColor}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {previewNotification.type}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textSecondaryDark,
                          lineHeight: 17,
                        }}
                      >
                        {previewNotification.time}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPreviewNotification(null)}
                    style={{
                      width: 32,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={Colors.textSecondaryDark} />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                {!!previewNotification.description && (
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 24,
                      lineHeight: 21,
                    }}
                  >
                    {previewNotification.description}
                  </Text>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setPreviewNotification(null)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.backgroundGray,
                      borderRadius: 14,
                      paddingVertical: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleNavigateToDetails(previewNotification)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.accent,
                      borderRadius: 14,
                      paddingVertical: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                      }}
                    >
                      View Full Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </SafeAreaWrapper>
  );
}
