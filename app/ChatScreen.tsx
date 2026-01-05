import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, Image as ImageIcon, Mic, Phone, User } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
  const params = useLocalSearchParams<{ providerName?: string; providerId?: string; clientName?: string }>();
  const providerName = params.providerName || 'AquaFix Solutions';
  const clientName = params.clientName || 'Client';
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Determine if this is provider view (has clientName) or user view
  const isProviderView = !!params.clientName;

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
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
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: Colors.black,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <User size={16} color={Colors.white} />
          </View>
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
              backgroundColor: Colors.backgroundGray,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
              }}
            >
              {item.text}
            </Text>
          </View>
        </View>

        {/* Avatar on right for user messages */}
        {isFromClient && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: Colors.black,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <User size={16} color={Colors.white} />
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
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            backgroundColor: Colors.white,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
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
          <TouchableOpacity activeOpacity={0.7}>
            <Phone size={22} color={Colors.textPrimary} />
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

        {/* Send Quotation Button - Only show for providers */}
        {isProviderView && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/SendQuotationScreen' as any)}
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
            />
            <TouchableOpacity activeOpacity={0.7} style={{ marginRight: 12 }}>
              <ImageIcon size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
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
              <Mic size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
