import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors } from '@/lib/designSystem';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
  sender: 'user' | 'support';
  timestamp: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello, I need help with my account',
    sender: 'user',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    time: '2:10pm',
  },
  {
    id: '2',
    text: 'Hello! I\'m here to help. What specific issue are you experiencing with your account?',
    sender: 'support',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    time: '2:12pm',
  },
];

// Auto-response messages for support chat demo
const SUPPORT_RESPONSES = [
  "I understand your concern. Let me help you with that right away.",
  "Thank you for reaching out! I'm looking into this for you.",
  "I see the issue. Here's what we can do to resolve it...",
  "That's a common question. Let me explain...",
  "I'm here to help! Can you provide a bit more detail?",
  "Thank you for your patience. I'm working on finding a solution for you.",
  "I understand. Let me transfer this to our technical team.",
  "Great question! Here's how we can handle this...",
];

export default function LiveChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
    // Auto-respond if last message is from user
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'user') {
        const timeout = setTimeout(() => {
          const randomResponse = SUPPORT_RESPONSES[Math.floor(Math.random() * SUPPORT_RESPONSES.length)];
          const newMessage: Message = {
            id: `response-${Date.now()}`,
            text: randomResponse,
            sender: 'support',
            timestamp: new Date().toISOString(),
            time: formatTime(new Date()),
          };
          setMessages((prev) => [...prev, newMessage]);
          haptics.light();
        }, 2000); // 2 second delay for realistic feel

        return () => clearTimeout(timeout);
      }
    }
  }, [messages]);

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
        sender: 'user',
        timestamp: new Date().toISOString(),
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
      haptics.selection();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View className={`flex-row items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`} key={item.id}>
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-[#1E40AF] items-center justify-center mr-2">
            <Ionicons name="person" size={16} color="white" />
          </View>
        )}
        <View className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
          <Text
            className={`text-xs text-gray-500 mb-1 ${isUser ? 'text-right mr-2' : 'text-left ml-2'}`}
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {isUser ? 'You' : 'Support'} {item.time}
          </Text>
          <View className="flex-row items-start">
            {!isUser && <View style={{ width: 0 }} />}
            <View 
              className="rounded-2xl px-4 py-3"
              style={{
                backgroundColor: isUser ? Colors.accent : Colors.backgroundGray,
              }}
            >
              <Text 
                className="text-sm"
                style={{ 
                  fontFamily: 'Poppins-Regular',
                  color: isUser ? Colors.white : Colors.textPrimary,
                }}
              >
                {item.text}
              </Text>
            </View>
            {isUser && <View style={{ width: 0 }} />}
          </View>
        </View>
        {isUser && (
          <View className="w-8 h-8 rounded-full bg-[#1E40AF] items-center justify-center ml-2">
            <Ionicons name="person" size={16} color="white" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100" style={{ paddingTop: 20 }}>
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.back();
            }} 
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text className="text-lg text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
            Live chat
          </Text>
          <View style={{ width: 24 }} />
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

        {/* Input Field */}
        <View className="px-4 pb-4 pt-2 border-t border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
            <TextInput
              placeholder="Type a message"
              value={message}
              onChangeText={setMessage}
              className="flex-1 text-base text-black"
              style={{ fontFamily: 'Poppins-Regular' }}
              placeholderTextColor="#9CA3AF"
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
              activeOpacity={0.85} 
              className="mr-3"
            >
              <Ionicons name="image-outline" size={24} color="#000000" />
            </TouchableOpacity>
            {message.trim() ? (
              <TouchableOpacity activeOpacity={0.85} onPress={handleSend}>
                <View className="w-10 h-10 rounded-full bg-[#6A9B00] items-center justify-center">
                  <Send size={18} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.85}>
                <View className="w-10 h-10 rounded-full bg-[#6A9B00] items-center justify-center">
                  <Ionicons name="mic" size={20} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

