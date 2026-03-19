import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing, SHADOWS } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, AlertCircle, FileText, Image as ImageIcon, Mic, Phone, Send, User, MoreVertical, Check, CheckCheck } from 'lucide-react-native';
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
import { useToast } from '@/hooks/useToast';
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
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isRead?: boolean;
  isFromCurrentUser?: boolean; // Whether this message is from the current user
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
  const { showError } = useToast();
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
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMarkingAsReadRef = useRef(false);

  // Determine if this is provider view (has clientName) or user view
  const isProviderView = !!params.clientName;

  /**
   * Format date to time string (e.g., "2:30pm")
   */
  const formatTime = useCallback((dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
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
   * Standard layout: my messages = right, received = left
   */
  const mapApiMessageToUI = useCallback(
    (apiMessage: ApiMessage, currentUserId: number | null): UIMessage => {
      // Normalize sender type coming from backend: could be 'user', 'client', 'customer', 'provider'
      const rawSenderType = ((apiMessage as any).senderType || (apiMessage as any).sender_type || '')
        .toString()
        .toLowerCase();
      const isFromClient =
        rawSenderType === 'user' || rawSenderType === 'client' || rawSenderType === 'customer';
      const sender: 'user' | 'provider' = isFromClient ? 'user' : 'provider';

      // My messages go right: prefer senderId match; fallback on view + normalized sender role
      const isFromCurrentUser =
        (currentUserId !== null && apiMessage.senderId === currentUserId) ||
        (isProviderView ? sender === 'provider' : sender === 'user');

      const rawContent = (apiMessage as any).content ?? (apiMessage as any).body ?? (apiMessage as any).text ?? '';
      const safeText = (rawContent == null || String(rawContent).toLowerCase() === 'null') ? '' : String(rawContent);
      const createdAt = apiMessage.createdAt || apiMessage.updatedAt || new Date().toISOString();

      return {
        id: String(apiMessage.id),
        text: safeText,
        sender,
        timestamp: createdAt,
        time: formatTime(createdAt),
        status: isFromCurrentUser
          ? apiMessage.isRead || apiMessage.readAt
            ? 'read'
            : 'delivered'
          : undefined,
        isRead: apiMessage.isRead || !!apiMessage.readAt,
        isFromCurrentUser, // Store this for alignment logic
      };
    },
    [formatTime, isProviderView]
  );

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

      // Don't overwrite with empty on background refresh – API may return bad/malformed data
      // and we'd wipe sent messages. Only overwrite if we got messages or this is initial load.
      setMessages((prev) => {
        if (showLoading || uiMessages.length > 0) return uiMessages;
        // Background refresh returned 0 messages – keep existing to avoid disappearing messages
        return prev;
      });

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
      isFromCurrentUser: true, // Optimistic messages are always from current user
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
        type: 'text',
      });

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? mapApiMessageToUI(sentMessage as ApiMessage, currentUserId)
            : msg
        )
      );

      // Don't refresh here – backend may not include the new message yet, causing it to disappear.
      // The 5s auto-refresh will pick up replies from the other party.
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error sending message:', error);
      }
      // Keep message visible but mark as failed – don't remove (so it doesn't disappear)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id ? { ...msg, status: 'failed' as const } : msg
        )
      );
      const msg = (error?.message || '').toLowerCase();
      const isServerSide = msg.includes('foreign key') || msg.includes('receiverid');
      showError(isServerSide ? 'Message could not be sent. Please try again or contact support.' : 'Message failed to send. Tap to retry.');
    } finally {
      setIsSending(false);
    }
  }, [message, isValidRequestId, isSending, isProviderView, formatTime, mapApiMessageToUI, currentUserId, requestId, showError]);

  /**
   * Retry sending a failed message
   */
  const retryFailedMessage = useCallback(
    async (msg: UIMessage) => {
      if (msg.status !== 'failed' || !isValidRequestId || isSending) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'sending' as const } : m))
      );
      try {
        const sentMessage = await communicationService.sendMessage(requestId!, {
          content: msg.text,
          type: 'text',
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? mapApiMessageToUI(sentMessage as ApiMessage, currentUserId) : m
          )
        );
      } catch (error: any) {
        if (__DEV__) console.error('Error retrying message:', error);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' as const } : m))
        );
        const errMsg = (error?.message || '').toLowerCase();
        const isServerSide = errMsg.includes('foreign key') || errMsg.includes('receiverid');
        showError(isServerSide ? 'Message could not be sent. Please try again or contact support.' : 'Message failed to send. Tap to retry.');
      }
    },
    [isValidRequestId, requestId, isSending, mapApiMessageToUI, currentUserId, showError]
  );

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
    // Determine alignment: messages from current user go to the right, received messages go to the left
    const isFromCurrentUser = item.isFromCurrentUser ?? false;
    
    const isFromProvider = item.sender === 'provider';
    
    const getStatusIcon = () => {
      if (!isFromCurrentUser || !item.status) return null;
      switch (item.status) {
        case 'sending':
          return <ActivityIndicator size="small" color={Colors.textSecondaryDark} style={{ marginLeft: 4 }} />;
        case 'failed':
          return <AlertCircle size={12} color="#DC2626" style={{ marginLeft: 4 }} />;
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
    
    // Standard chat layout: MY messages → right, RECEIVED → left (like WhatsApp/iMessage)
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginBottom: 12,
          paddingHorizontal: 16,
          justifyContent: isFromCurrentUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Received: avatar left, bubble, spacer */}
        {!isFromCurrentUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              overflow: 'hidden',
              marginRight: 8,
              marginBottom: 4,
            }}
          >
            <Image
              source={isFromProvider ? require('../assets/images/plumbericon2.png') : require('../assets/images/userimg.jpg')}
              style={{ width: 32, height: 32, borderRadius: 16 }}
              resizeMode="cover"
            />
          </View>
        )}

        <TouchableOpacity
          style={{
            maxWidth: '78%',
            alignItems: isFromCurrentUser ? 'flex-end' : 'flex-start',
          }}
          activeOpacity={item.status === 'failed' && isFromCurrentUser ? 0.7 : 1}
          onPress={item.status === 'failed' && isFromCurrentUser ? () => retryFailedMessage(item) : undefined}
        >
          <View
            style={{
              backgroundColor: isFromCurrentUser ? '#6A9B00' : Colors.white,
              borderRadius: 18,
              borderBottomRightRadius: isFromCurrentUser ? 4 : 18,
              borderBottomLeftRadius: isFromCurrentUser ? 18 : 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: isFromCurrentUser ? 0 : 1,
              borderColor: 'rgba(0,0,0,0.06)',
              ...SHADOWS.sm,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: isFromCurrentUser ? Colors.white : Colors.textPrimary,
                lineHeight: 21,
              }}
            >
              {item.text}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              paddingHorizontal: 4,
              justifyContent: isFromCurrentUser ? 'flex-end' : 'flex-start',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#9CA3AF' }}>
              {item.time}
            </Text>
            {getStatusIcon()}
          </View>
        </TouchableOpacity>

        {/* My messages: spacer, bubble, avatar right */}
        {isFromCurrentUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              overflow: 'hidden',
              marginLeft: 8,
              marginBottom: 4,
            }}
          >
            <Image
              source={isProviderView ? require('../assets/images/plumbericon2.png') : require('../assets/images/userimg.jpg')}
              style={{ width: 32, height: 32, borderRadius: 16 }}
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
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm }}>
            Request ID not found
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center' }}>
            Please go back and try again.
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
            ...SHADOWS.sm,
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
              paddingVertical: 16,
              paddingBottom: 24,
            }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1, backgroundColor: '#F0F2F5' }}
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
