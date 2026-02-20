import { EmptyState } from '@/components/EmptyState';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { Notification, notificationService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Archive, ArrowLeft, Calendar, Clock, FileText, Handshake, MessageCircle, Trash2, Wallet, X } from 'lucide-react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
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
  const swipeableRefs = useRef<Map<number, Swipeable | null>>(new Map());

  const hasNotifications = notifications.length > 0;

  const formatTimeAgo = (isoDate: string): string => {
    try {
      const created = new Date(isoDate).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - created);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}mins ago`;
      if (diffHours < 24) return `${diffHours}hrs ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return '';
    }
  };

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

  // Map backend notification type to UI presentation
  const mapNotificationToUI = (notification: Notification): UINotification => {
    // Default UI values
    let typeLabel = notification.title || 'Notification';
    let description = notification.description || notification.message || '';
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
        // For other notification types, show preview modal
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
          <EmptyState
            title="You don't have any notifications"
            description="When you receive notifications, they'll appear here."
            actionLabel="Go back"
            onAction={() => router.back()}
            style={{ flex: 1 }}
          />
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
          style={{ paddingBottom: 8 }}
          rightElement={
            <TouchableOpacity
              onPress={handleClearAll}
              activeOpacity={0.7}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}
              accessibilityLabel="Clear all notifications"
              accessibilityHint="Marks all notifications as read"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.accent,
                }}
              >
                Clear all
              </Text>
            </TouchableOpacity>
          }
        />

        {/* Filter Pills - compact, minimal vertical gap */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 2,
            paddingRight: 40,
            flexDirection: 'row',
            alignItems: 'center',
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
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
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
                  {pill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
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
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.xl,
                    padding: 16,
                    opacity: 0.6,
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
                paddingVertical: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
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
            </View>
          )}

          {(['Recent', 'Yesterday', 'Last week'] as const).map((section) => {
            const sectionNotifications = groupedNotifications[section] || [];
            if (sectionNotifications.length === 0) return null;

            return (
              <View key={section} style={{ marginBottom: 24 }}>
                {/* Section Header */}
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 12,
                  }}
                >
                  {section}
                </Text>

                {/* Notifications in Section */}
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
                      borderRadius: BorderRadius.xl,
                      paddingVertical: 16,
                      paddingHorizontal: 10,
                      borderLeftWidth: 3,
                      borderColor: notification.isRead ? Colors.accent : '#3B82F6',
                    }}
                  >
                    {/* Colored Bar - Blue for unread, Green for read */}
                    <View
                      style={{
                        width: 0,
                        backgroundColor: notification.isRead ? Colors.accent : '#3B82F6',
                        borderRadius: 2,
                        marginRight: 12,
                        alignSelf: 'stretch',
                        
                      }}
                    />

                    {/* Icon */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: notification.iconBgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {notification.icon && (
                        <notification.icon
                          size={30}
                          color={notification.iconColor}
                        />
                      )}
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {notification.type}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textSecondaryDark,
                          marginBottom: 8,
                          lineHeight: 18,
                        }}
                      >
                        {notification.description}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          // When user taps "View details", mark as read and navigate
                          handleMarkAsRead(notification.id);
                          // Navigate directly to the appropriate screen
                          handleNavigateToDetails(notification);
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          marginBottom: 8,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-SemiBold',
                            color: Colors.accent,
                          }}
                        >
                          View details
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Right Side - Time and Mark as read */}
                    <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textSecondaryDark,
                          marginBottom: 4,
                        }}
                      >
                        {notification.time}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleMarkAsRead(notification.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textTertiary,
                          }}
                        >
                          Mark as read
                        </Text>
                      </TouchableOpacity>
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
                  borderRadius: BorderRadius.xl,
                  padding: 24,
                  width: '100%',
                  maxWidth: 400,
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
                        borderRadius: 22,
                        backgroundColor: previewNotification.iconBgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {previewNotification.icon && (
                        <previewNotification.icon
                          size={22}
                          color={previewNotification.barColor === Colors.accent ? Colors.accent : Colors.textSecondaryDark}
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
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 24,
                    lineHeight: 20,
                  }}
                >
                  {previewNotification.description}
                </Text>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setPreviewNotification(null)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.backgroundGray,
                      borderRadius: BorderRadius.default,
                      paddingVertical: 12,
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
                      borderRadius: BorderRadius.default,
                      paddingVertical: 12,
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
