import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'provider';
  timestamp: string;
  time: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello, Please can someone explain how to use plugins?',
    sender: 'user',
    timestamp: '2:10pm',
    time: '2:10pm',
  },
  {
    id: '2',
    text: 'Sure, You can locate the plugins icon by first clicking on the icon beside the text icon and then navigate to plugins...',
    sender: 'provider',
    timestamp: '2:35pm',
    time: '2:35pm',
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerName?: string; providerId?: string }>();
  const providerName = params.providerName || 'AquaFix Solutions';
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        className={`flex-row items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
        key={item.id}
      >
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
            {isUser ? 'You' : providerName} {item.time}
          </Text>
          <View className="flex-row items-start">
            {!isUser && <View style={{ width: 0 }} />}
            <View
              className={`rounded-2xl px-4 py-3 ${
                isUser ? 'bg-gray-200' : 'bg-gray-200'
              }`}
            >
              <Text className="text-sm text-gray-900" style={{ fontFamily: 'Poppins-Regular' }}>
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100" style={{ paddingTop: 20 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text className="text-lg text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
            {providerName}
          </Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Ionicons name="call-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Messages Area */}
        <FlatList
          ref={flatListRef}
          data={MOCK_MESSAGES}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* View Quotation Button */}
        <View className="px-4 pb-3">
          <TouchableOpacity
            activeOpacity={0.85}
            className="bg-[#3B82F6] rounded-xl py-4 px-4 flex-row items-center justify-center"
            onPress={() => {
              // Navigate to quotation view
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
              View Quotation
            </Text>
          </TouchableOpacity>
        </View>

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
            />
            <TouchableOpacity activeOpacity={0.85} className="mr-3">
              <Ionicons name="image-outline" size={24} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={handleSend}>
              <View className="w-10 h-10 rounded-full bg-[#6A9B00] items-center justify-center">
                <Ionicons name="mic" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

