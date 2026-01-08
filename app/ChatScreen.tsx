import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, Image as ImageIcon, Mic, Phone, Send, User } from 'lucide-react-native';
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
} from 'react-native';
import { haptics } from '@/hooks/useHaptics';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'provider';
  timestamp: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello, I need help with my plumbing issue',
    sender: 'user',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    time: '2:10pm',
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
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
      haptics.selection();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // In provider view: 'user' sender = client, 'provider' sender = provider
    // In user view: 'user' sender = user, 'provider' sender = provider
    const isFromClient = isProviderView ? item.sender === 'user' : item.sender === 'user';
    const isFromProvider = isProviderView ? item.sender === 'provider' : item.sender === 'provider';
    
    return (
      <View
        key={item.id}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 16,
          justifyContent: isFromClient ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Avatar on left for provider messages, right for user messages */}
        {isFromProvider && (
          <Image
            source={require('../assets/images/plumbericon2.png')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 8,
            }}
            resizeMode="cover"
          />
        )}

        <View
          style={{
            maxWidth: '75%',
            alignItems: isFromClient ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Timestamp */}
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins-Medium',
              color: Colors.textSecondaryDark,
              marginBottom: 4,
              textAlign: isFromClient ? 'right' : 'left',
            }}
          >
            {isFromClient ? 'You' : providerName} {item.time}
          </Text>

          {/* Message Bubble */}
          <View
            style={{
              backgroundColor: isFromClient ? Colors.accent : Colors.backgroundGray,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: isFromClient ? Colors.white : Colors.textPrimary,
              }}
            >
              {item.text}
            </Text>
          </View>
        </View>

        {/* Avatar on right for user messages */}
        {isFromClient && (
          <Image
            source={require('../assets/images/userimg.jpg')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginLeft: 8,
            }}
            resizeMode="cover"
          />
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
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            backgroundColor: Colors.white,
          }}
        >
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.back();
            }} 
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
              textAlign: 'center',
            }}
          >
            {isProviderView ? clientName : providerName}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              // Phone call action
            }} 
            activeOpacity={0.7}
          >
            <Phone size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Messages Area */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Send Quotation Button - Only show for providers */}
        {isProviderView && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/SendQuotationScreen' as any);
              }}
              style={{
                backgroundColor: '#E0F2FE',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#0284C7',
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <FileText size={18} color="#0284C7" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#0284C7',
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
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === 'ios' ? 20 : 16,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            backgroundColor: Colors.white,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.white,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: Colors.border,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <TextInput
              placeholder="Type a message"
              value={message}
              onChangeText={setMessage}
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
                paddingVertical: 0,
              }}
              placeholderTextColor={Colors.textSecondaryDark}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity 
              onPress={() => {
                haptics.light();
                // Image picker action
              }}
              activeOpacity={0.7} 
              style={{ marginRight: 12 }}
            >
              <ImageIcon size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            {message.trim() ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSend}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={18} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
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
