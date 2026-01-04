import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, FileText, Handshake, MessageCircle, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#4B5563',
    icon: Handshake,
    iconBgColor: '#FEF3C7',
    isRead: false,
    section: 'Recent',
  },
  {
    id: '2',
    type: 'New message',
    description: 'Marcus lee sent you a text.',
    time: '20mins ago',
    barColor: '#4B5563',
    icon: MessageCircle,
    iconBgColor: '#E5E7EB',
    isRead: false,
    section: 'Recent',
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
  },
  {
    id: '4',
    type: 'New Request',
    description: 'You have a new job request.',
    time: '20mins ago',
    barColor: '#4B5563',
    icon: FileText,
    iconBgColor: '#DBEAFE',
    isRead: true,
    section: 'Yesterday',
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
  },
  {
    id: '6',
    type: 'Payment Released',
    description: '20,000 has been released for #WO-2024-1157. Funds will be available in your wallet shortly.',
    time: '20mins ago',
    barColor: '#4B5563',
    icon: Wallet,
    iconBgColor: '#DCFCE7',
    isRead: true,
    section: 'Last week',
  },
  {
    id: '7',
    type: 'Withdrawal Status',
    description: 'Your withdrawal request of 45,000 has been processed successfully.',
    time: '20mins ago',
    barColor: '#4B5563',
    icon: Clock,
    iconBgColor: '#E5E7EB',
    isRead: true,
    section: 'Last week',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [hasNotifications] = useState(true); // Set to false to show empty state

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
                      marginBottom: index < sectionNotifications.length - 1 ? 16 : 0,
                    }}
                  >
                    {/* Colored Bar */}
                    <View
                      style={{
                        width: 4,
                        backgroundColor: notification.barColor,
                        borderRadius: 2,
                        marginRight: 12,
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
                          size={22}
                          color={notification.barColor === Colors.accent ? Colors.accent : Colors.textSecondaryDark}
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
      </View>
    </SafeAreaWrapper>
  );
}
