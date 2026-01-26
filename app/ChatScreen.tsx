import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing, SHADOWS } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, Image as ImageIcon, Mic, Phone, Send, User, MoreVertical, Check, CheckCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { haptics } from '@/hooks/useHaptics';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'provider';
  timestamp: string;
  time: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello, I need help with my plumbing issue',
    sender: 'user',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    time: '2:10pm',
    status: 'read',
  },
  {
    id: '2',
    text: 'Sure, I can help! Could you describe the issue in more detail?',
    sender: 'provider',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    time: '2:15pm',
  },
];

// Auto-response messages for demo
const AUTO_RESPONSES = [
  "Thank you for your message! I'll get back to you shortly.",
  "I understand. Let me help you with that.",
  "That's a great question. Here's what I recommend...",
  "I see what you mean. Let me explain...",
  "Perfect! I can definitely help with that.",
  "Thanks for the details. Here's what we can do...",
];

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerName?: string; providerId?: string; clientName?: string }>();
  const providerName = params.providerName || 'AquaFix Solutions';
  const clientName = params.clientName || 'Client';
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Determine if this is provider view (has clientName) or user view
  const isProviderView = !!params.clientName;

  // Format time helper
  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Simulate auto-response for demo
  useEffect(() => {
    // Only auto-respond if last message is from user and it's not provider view
    if (messages.length > 0 && !isProviderView) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'user') {
        const timeout = setTimeout(() => {
          const randomResponse = AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
          const newMessage: Message = {
            id: `response-${Date.now()}`,
            text: randomResponse,
            sender: 'provider',
            timestamp: new Date().toISOString(),
            time: formatTime(new Date()),
          };
          setMessages((prev) => [...prev, newMessage]);
          haptics.light();
        }, 2000); // 2 second delay for realistic feel

        return () => clearTimeout(timeout);
      }
    }
  }, [messages, isProviderView]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        text: message.trim(),
        sender: isProviderView ? 'provider' : 'user',
        timestamp: new Date().toISOString(),
        time: formatTime(new Date()),
        status: 'sent',
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
      haptics.selection();
      
      // Simulate message status progression
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
          )
        );
      }, 1000);
      
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: 'read' as const } : msg
          )
        );
      }, 2000);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // In provider view: 'user' sender = client, 'provider' sender = provider
    // In user view: 'user' sender = user, 'provider' sender = provider
    const isFromClient = isProviderView ? item.sender === 'user' : item.sender === 'user';
    const isFromProvider = isProviderView ? item.sender === 'provider' : item.sender === 'provider';
    
    const getStatusIcon = () => {
      if (!isFromClient || !item.status) return null;
      switch (item.status) {
        case 'sending':
          return <View style={{ width: 12, height: 12 }} />;
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
        />

        {/* Send Quotation Button - Only show for providers */}
        {isProviderView && (
          <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/SendQuotationScreen' as any);
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
            />
            
            {message.trim() ? (
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
