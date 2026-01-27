import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, FileText, Handshake, MessageCircle, Wallet, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Modal } from 'react-native';

interface Notification {
  id: string;
  type: string;
  description: string;
  time: string;
  barColor: string;
  icon: any;
  iconBgColor: string;
  isRead: boolean;
  section: 'Recent' | 'Yesterday' | 'Last week';
  requestId?: string;
  workOrderId?: string;
  amount?: string;
  clientName?: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#3B82F6',
    icon: Handshake,
    iconBgColor: '#FEF3C7',
    isRead: false,
    section: 'Recent',
    requestId: '123',
    clientName: 'Marcus lee',
  },
  {
    id: '2',
    type: 'New message',
    description: 'Marcus lee sent you a text.',
    time: '20mins ago',
    barColor: '#3B82F6',
    icon: MessageCircle,
    iconBgColor: '#E5E7EB',
    isRead: false,
    section: 'Recent',
    requestId: '123',
    clientName: 'Marcus lee',
  },
  {
    id: '3',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: Colors.accent,
    icon: Handshake,
    iconBgColor: '#FEF3C7',
    isRead: true,
    section: 'Yesterday',
    requestId: '124',
    clientName: 'Marcus lee',
  },
  {
    id: '4',
    type: 'New Request',
    description: 'You have a new job request.',
    time: '20mins ago',
    barColor: Colors.accent,
    icon: FileText,
    iconBgColor: '#DBEAFE',
    isRead: true,
    section: 'Yesterday',
    requestId: '125',
  },
  {
    id: '5',
    type: 'Work order Issued',
    description: 'Work order for #WO-2024-115 has been issued. Start date: Dec 12, 2024.',
    time: '20mins ago',
    barColor: Colors.accent,
    icon: Calendar,
    iconBgColor: '#DCFCE7',
    isRead: true,
    section: 'Yesterday',
    workOrderId: 'WO-2024-115',
  },
  {
    id: '6',
    type: 'Payment Released',
    description: '20,000 has been released for #WO-2024-1157. Funds will be available in your wallet shortly.',
    time: '20mins ago',
    barColor: '#3B82F6',
    icon: Wallet,
    iconBgColor: '#DCFCE7',
    isRead: false,
    section: 'Last week',
    workOrderId: 'WO-2024-1157',
    amount: '20000',
  },
  {
    id: '7',
    type: 'Withdrawal Status',
    description: 'Your withdrawal request of 45,000 has been processed successfully.',
    time: '20mins ago',
    barColor: '#3B82F6',
    icon: Clock,
    iconBgColor: '#E5E7EB',
    isRead: false,
    section: 'Last week',
    amount: '45000',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [hasNotifications] = useState(true); // Set to false to show empty state
  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);

  const groupedNotifications = NOTIFICATIONS.reduce((acc, notif) => {
    if (!acc[notif.section]) {
      acc[notif.section] = [];
    }
    acc[notif.section].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  const handleClearAll = () => {
    // Handle clear all
  };

  const handleMarkAsRead = (id: string) => {
    // Handle mark as read
  };

  const handleViewDetails = (notification: Notification) => {
    setPreviewNotification(notification);
  };

  const handleNavigateToDetails = (notification: Notification) => {
    setPreviewNotification(null);
    
    // Map notification types to appropriate screens
    switch (notification.type) {
      case 'Job Status':
        if (notification.requestId) {
          router.push({
            pathname: '/OngoingJobDetails' as any,
            params: { requestId: notification.requestId },
          } as any);
        }
        break;
      case 'New message':
        if (notification.requestId && notification.clientName) {
          router.push({
            pathname: '/ChatScreen' as any,
            params: {
              clientName: notification.clientName,
              requestId: notification.requestId,
            },
          } as any);
        }
        break;
      case 'New Request':
        if (notification.requestId) {
          router.push({
            pathname: '/ProviderJobDetailsScreen' as any,
            params: { requestId: notification.requestId },
          } as any);
        }
        break;
      case 'Work order Issued':
        if (notification.requestId) {
          router.push({
            pathname: '/ProviderJobDetailsScreen' as any,
            params: { requestId: notification.requestId },
          } as any);
        }
        break;
      case 'Payment Released':
        router.push('/WalletScreen' as any);
        break;
      case 'Withdrawal Status':
        router.push('/WalletScreen' as any);
        break;
      default:
        break;
    }
  };

  if (!hasNotifications) {
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
              Notifications
            </Text>
          </View>

          {/* Empty State */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
              }}
            >
              You don't have any Notifications
            </Text>
          </View>

          {/* Skip Button */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 32,
              alignItems: 'flex-end',
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.accent,
                }}
              >
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

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
            Notifications
          </Text>
          <TouchableOpacity
            onPress={handleClearAll}
            activeOpacity={0.7}
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
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 100,
          }}
        >
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
                  <View
                    key={notification.id}
                    style={{
                      flexDirection: 'row',
                      marginBottom: index < sectionNotifications.length - 1 ? 12 : 0,
                      backgroundColor: Colors.white,
                      borderRadius: BorderRadius.xl,
                      padding: 16,
                    }}
                  >
                    {/* Colored Bar - Blue for unread, Green for read */}
                    <View
                      style={{
                        width: 4,
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
                          size={20}
                          color={Colors.white}
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
                        onPress={() => handleViewDetails(notification)}
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
