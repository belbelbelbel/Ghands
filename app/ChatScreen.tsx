import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing, SHADOWS } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, FileText, Image as ImageIcon, Mic, Phone, Send, User, MoreVertical, Check, CheckCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { haptics } from '@/hooks/useHaptics';
import { providerService, communicationService, authService, Message as ApiMessage } from '@/services/api';

/**
 * UI Message interface - adapted from API message for display
 */
interface UIMessage {
  id: string;
  text: string;
  sender: 'user' | 'provider';
  timestamp: string;
  time: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isRead?: boolean;
}

/**
 * ChatScreen Component
 * 
 * Real-time messaging interface for service requests.
 * Works for both users and providers - automatically detects from route params.
 * 
 * Features:
 * - Load messages from API
 * - Send messages via API
 * - Auto-refresh messages every 5 seconds
 * - Mark messages as read when viewing
 * - Show unread count
 * - Pull-to-refresh
 * 
 * Route Params:
 * - requestId: Service request ID (required)
 * - providerName: Provider name (for user view)
 * - providerId: Provider ID (optional)
 * - clientName: Client name (for provider view)
 */
export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    providerName?: string; 
    providerId?: string; 
    clientName?: string;
    requestId?: string;
  }>();

  // Extract and validate requestId
  const requestId = params.requestId ? parseInt(params.requestId, 10) : null;
  const isValidRequestId = requestId !== null && !isNaN(requestId);

  // UI State
  const providerName = params.providerName || 'Service Provider';
  const clientName = params.clientName || 'Client';
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasQuotation, setHasQuotation] = useState<boolean>(false);
  const [isCheckingQuotation, setIsCheckingQuotation] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMarkingAsReadRef = useRef(false);

  // Determine if this is provider view (has clientName) or user view
  const isProviderView = !!params.clientName;

  /**
   * Format date to time string (e.g., "2:30pm")
   */
  const formatTime = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
    } catch {
      return '';
    }
  }, []);

  /**
   * Convert API message to UI message format
   */
  const mapApiMessageToUI = useCallback((apiMessage: ApiMessage, currentUserId: number | null): UIMessage => {
    // Determine sender type based on senderType from API
    // If senderType is 'user', it's from the client
    // If senderType is 'provider' or 'company', it's from the provider
    const isFromClient = apiMessage.senderType === 'user';
    const sender: 'user' | 'provider' = isFromClient ? 'user' : 'provider';

    // Determine if message is from current user
    const isFromCurrentUser = currentUserId !== null && apiMessage.senderId === currentUserId;

    return {
      id: String(apiMessage.id),
      text: apiMessage.content,
      sender,
      timestamp: apiMessage.createdAt,
      time: formatTime(apiMessage.createdAt),
      status: isFromCurrentUser 
        ? (apiMessage.isRead || apiMessage.readAt ? 'read' : 'delivered')
        : undefined,
      isRead: apiMessage.isRead || !!apiMessage.readAt,
    };
  }, [formatTime]);

  /**
   * Load messages from API
   */
  const loadMessages = useCallback(async (showLoading = true) => {
    if (!isValidRequestId) {
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const result = await communicationService.getMessages(requestId!, {
        limit: 50,
        offset: 0,
      });

      // Get current user ID to determine message sender
      let userId: number | null = null;
      try {
        userId = await authService.getUserId();
        setCurrentUserId(userId);
      } catch (error) {
        if (__DEV__) {
          console.error('Error getting user ID:', error);
        }
      }

      // Convert API messages to UI format
      const uiMessages = result.messages.map((msg) => mapApiMessageToUI(msg, userId));

      // Sort by timestamp (oldest first)
      uiMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(uiMessages);

      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading messages:', error);
      }
      // Keep existing messages on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isValidRequestId, requestId, mapApiMessageToUI]);

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(async () => {
    if (!isValidRequestId || isMarkingAsReadRef.current) {
      return;
    }

    try {
      isMarkingAsReadRef.current = true;
      await communicationService.markMessagesAsRead(requestId!);
      
      // Update local message state to reflect read status
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isRead: true,
          status: msg.status === 'delivered' ? 'read' : msg.status,
        }))
      );
      
      // Refresh unread count
      loadUnreadCount();
    } catch (error) {
      if (__DEV__) {
        console.error('Error marking messages as read:', error);
      }
    } finally {
      isMarkingAsReadRef.current = false;
    }
  }, [isValidRequestId, requestId]);

  /**
   * Load unread message count
   */
  const loadUnreadCount = useCallback(async () => {
    if (!isValidRequestId) {
      return;
    }

    try {
      const result = await communicationService.getUnreadCount(requestId!);
      setUnreadCount(result.count);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading unread count:', error);
      }
    }
  }, [isValidRequestId, requestId]);

  /**
   * Send a message
   */
  const handleSend = useCallback(async () => {
    if (!message.trim() || !isValidRequestId || isSending) {
      return;
    }

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    // Optimistically add message to UI
    const optimisticMessage: UIMessage = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: isProviderView ? 'provider' : 'user',
      timestamp: new Date().toISOString(),
      time: formatTime(new Date().toISOString()),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    haptics.selection();

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send message to API
      const sentMessage = await communicationService.sendMessage(requestId!, {
        content: messageText,
      });

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? mapApiMessageToUI(sentMessage as ApiMessage, currentUserId)
            : msg
        )
      );

      // Refresh messages to get latest
      await loadMessages(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Error sending message:', error);
      }

      // Remove failed message from UI
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));

      // Show error (you can add toast notification here)
      // For now, just log it
    } finally {
      setIsSending(false);
    }
  }, [message, isValidRequestId, isSending, isProviderView, formatTime, mapApiMessageToUI, currentUserId, requestId, loadMessages]);

  /**
   * Check if quotation exists (for provider view)
   */
  const checkQuotation = useCallback(async () => {
    if (!isProviderView || !isValidRequestId) {
      return;
    }

    setIsCheckingQuotation(true);
    try {
      const quotation = await providerService.getQuotation(requestId!);
      setHasQuotation(!!(quotation && quotation.id));
    } catch (error: any) {
      // Quotation doesn't exist or error - that's OK
      setHasQuotation(false);
    } finally {
      setIsCheckingQuotation(false);
    }
  }, [isProviderView, isValidRequestId, requestId]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadMessages(false),
      loadUnreadCount(),
      checkQuotation(),
    ]);
  }, [loadMessages, loadUnreadCount, checkQuotation]);

  // Load messages and unread count on mount
  useEffect(() => {
    if (isValidRequestId) {
      loadMessages();
      loadUnreadCount();
      checkQuotation();
    }
  }, [isValidRequestId, loadMessages, loadUnreadCount, checkQuotation]);

  // Mark messages as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isValidRequestId) {
        markMessagesAsRead();
        loadUnreadCount();
      }
    }, [isValidRequestId, markMessagesAsRead, loadUnreadCount])
  );

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (!isValidRequestId) {
      return;
    }

    // Set up interval for auto-refresh
    refreshIntervalRef.current = setInterval(() => {
      loadMessages(false);
      loadUnreadCount();
    }, 5000); // Refresh every 5 seconds

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isValidRequestId, loadMessages, loadUnreadCount]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    }
  }, [messages.length]);

  /**
   * Render a single message
   */
  const renderMessage = ({ item }: { item: UIMessage }) => {
    // In provider view: 'user' sender = client, 'provider' sender = provider
    // In user view: 'user' sender = user, 'provider' sender = provider
    const isFromClient = isProviderView ? item.sender === 'user' : item.sender === 'user';
    const isFromProvider = isProviderView ? item.sender === 'provider' : item.sender === 'provider';
    
    const getStatusIcon = () => {
      if (!isFromClient || !item.status) return null;
      switch (item.status) {
        case 'sending':
          return <ActivityIndicator size="small" color={Colors.textSecondaryDark} style={{ marginLeft: 4 }} />;
        case 'sent':
          return <Check size={12} color={Colors.textSecondaryDark} style={{ marginLeft: 4 }} />;
        case 'delivered':
          return <CheckCheck size={12} color={Colors.textSecondaryDark} style={{ marginLeft: 4 }} />;
        case 'read':
          return <CheckCheck size={12} color="#4F46E5" style={{ marginLeft: 4 }} />;
        default:
          return null;
      }
    };
    
    return (
      <View
        key={item.id}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginBottom: Spacing.md,
          marginHorizontal: Spacing.md,
          justifyContent: isFromClient ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Avatar on left for provider messages */}
        {isFromProvider && (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.backgroundGray,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: Spacing.sm,
              ...SHADOWS.sm,
            }}
          >
            <Image
              source={require('../assets/images/plumbericon2.png')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
            }}
            resizeMode="cover"
          />
          </View>
        )}

        <View
          style={{
            maxWidth: '75%',
            alignItems: isFromClient ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Message Bubble */}
          <View
            style={{
              backgroundColor: isFromClient ? Colors.accent : Colors.white,
              borderRadius: BorderRadius.lg,
              borderTopLeftRadius: isFromProvider ? 4 : BorderRadius.lg,
              borderTopRightRadius: isFromClient ? 4 : BorderRadius.lg,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm + 2,
              ...(isFromProvider ? SHADOWS.small : {}),
              borderWidth: isFromProvider ? 1 : 0,
              borderColor: Colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: isFromClient ? Colors.white : Colors.textPrimary,
                lineHeight: 20,
              }}
            >
              {item.text}
            </Text>
          </View>
          
          {/* Timestamp and Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
              }}
            >
              {item.time}
            </Text>
            {getStatusIcon()}
          </View>
        </View>

        {/* Avatar on right for user messages */}
        {isFromClient && (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.backgroundGray,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: Spacing.sm,
              ...SHADOWS.sm,
            }}
          >
            <Image
              source={require('../assets/images/userimg.jpg')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
            }}
            resizeMode="cover"
          />
          </View>
        )}
      </View>
    );
  };

  // Show error if requestId is invalid
  if (!isValidRequestId) {
    return (
      <SafeAreaWrapper backgroundColor={Colors.white}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, textAlign: 'center' }}>
            Invalid request ID. Please go back and try again.
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md + 4,
            paddingBottom: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            backgroundColor: Colors.white,
            ...SHADOWS.small,
          }}
        >
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.back();
            }} 
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
            }}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: Colors.backgroundGray,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.sm,
                overflow: 'hidden',
              }}
            >
              <Image
                source={isProviderView ? require('../assets/images/userimg.jpg') : require('../assets/images/plumbericon2.png')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                }}
                resizeMode="cover"
              />
            </View>
            <View style={{ flex: 1 }}>
          <Text
            style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
              color: Colors.textPrimary,
            }}
          >
            {isProviderView ? clientName : providerName}
          </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginTop: 2,
                }}
              >
                {isProviderView ? 'Client' : 'Service Provider'}
                {unreadCount > 0 && ` • ${unreadCount} unread`}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <TouchableOpacity 
              onPress={() => {
                haptics.light();
                router.push({
                  pathname: '/CallScreen',
                  params: {
                    callState: 'outgoing',
                    callerName: isProviderView ? clientName : providerName,
                    callerId: params.providerId,
                    jobTitle: 'Service Request',
                    jobDescription: 'Ongoing service request',
                    orderNumber: '#WO-2024-1157',
                    scheduledDate: 'Oct 20, 2024',
                    scheduledTime: '2:00 PM',
                    location: 'Service Location',
                    jobStatus: 'In Progress',
                    isProvider: isProviderView ? 'true' : 'false',
                  },
                } as any);
              }} 
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: Colors.backgroundGray,
              }}
            >
              <Phone size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
                // More options
            }} 
            activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: Colors.backgroundGray,
              }}
            >
              <MoreVertical size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          </View>
        </View>

        {/* Messages Area */}
        {isLoading && messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={{ marginTop: Spacing.md, fontSize: 14, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
              Loading messages...
            </Text>
          </View>
        ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
            contentContainerStyle={{ 
              paddingVertical: Spacing.md,
              paddingBottom: Spacing.xl,
            }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1, backgroundColor: '#F9FAFB' }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent}
                colors={[Colors.accent]}
              />
            }
          />
        )}

        {/* Send Quotation Button - Only show for providers if quotation hasn't been sent yet */}
        {isProviderView && !hasQuotation && !isCheckingQuotation && (
          <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push({
                  pathname: '/SendQuotationScreen' as any,
                  params: {
                    requestId: params.requestId,
                  },
                });
              }}
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: BorderRadius.lg,
                borderWidth: 1.5,
                borderColor: '#3B82F6',
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.sm,
              }}
              activeOpacity={0.8}
            >
              <FileText size={18} color="#3B82F6" style={{ marginRight: Spacing.sm }} />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#3B82F6',
                }}
              >
                Send Quotation
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Field */}
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
            paddingTop: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            backgroundColor: Colors.white,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.xl,
              borderWidth: 1,
              borderColor: Colors.border,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              minHeight: 48,
            }}
          >
            <TouchableOpacity 
              onPress={() => {
                haptics.light();
                // Image picker action
              }}
              activeOpacity={0.7} 
              style={{ 
                marginRight: Spacing.sm,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
              }}
            >
              <ImageIcon size={20} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
            
            <TextInput
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
              style={{
                flex: 1,
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
                paddingVertical: Spacing.sm,
                maxHeight: 100,
              }}
              placeholderTextColor={Colors.textSecondaryDark}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isSending}
            />
            
            {message.trim() && !isSending ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSend}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: Spacing.sm,
                  ...SHADOWS.sm,
                }}
              >
                <Send size={18} color={Colors.white} />
              </TouchableOpacity>
            ) : isSending ? (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: Spacing.sm,
                }}
              >
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  haptics.light();
                  // Voice message action
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: Spacing.sm,
                  ...SHADOWS.sm,
                }}
              >
                <Mic size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
