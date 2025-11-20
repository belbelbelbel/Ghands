import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const notificationsData = [
  {
    id: '1',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#2196F3',
    icon: 'checkbox-outline',
    iconBgColor: '#BBDEFB',
    isRead: false
  },
  {
    id: '2',
    type: 'New message',
    description: 'Marcus lee sent you a text',
    time: '20mins ago',
    barColor: '#6A9B00',
    icon: 'chatbubble-ellipses-outline',
    iconBgColor: '#C8E6C9',
    isRead: false
  },
  {
    id: '3',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#6A9B00',
    icon: 'checkmark-circle-outline',
    iconBgColor: '#C8E6C9',
    isRead: false
  },
  {
    id: '4',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#666',
    icon: 'document-text-outline',
    iconBgColor: '#E0E0E0',
    isRead: true
  },
  {
    id: '5',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#666',
    icon: 'document-text-outline',
    iconBgColor: '#E0E0E0',
    isRead: true
  },
  {
    id: '6',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#666',
    icon: 'document-text-outline',
    iconBgColor: '#E0E0E0',
    isRead: true
  },
  {
    id: '7',
    type: 'Job Status',
    description: 'Marcus lee marked job as completed.',
    time: '20mins ago',
    barColor: '#666',
    icon: 'document-text-outline',
    iconBgColor: '#E0E0E0',
    isRead: true
  }
];

const NotificationsScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaWrapper>
      <View className='flex-row items-center justify-between px-4 py-3 border-b border-gray-100' style={{ paddingTop: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color="#000" />
        </TouchableOpacity>
        <Text
          className='text-xl font-bold text-black'
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Notifications
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Job Inspection Banner - Fixed at top */}
      <View className='px-4 pt-4'>
        <View className='bg-[#8BC34A] rounded-2xl p-4'>
          <Text
            className='text-white text-2xl font-bold mb-2'
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Job Inspection Ready
          </Text>
          <Text
            className='text-white text-base mb-4'
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            3 providers have submitted quotes for Kitchen Faucet Repair
          </Text>
          <TouchableOpacity className='bg-white rounded-xl py-3 px-4 items-center'>
            <Text
              className='text-[#6A9B00] font-semibold'
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              View Quotes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className='flex-row items-center justify-between px-4 py-4'>
        <Text
          className='text-lg font-bold text-black'
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Recent
        </Text>
        <TouchableOpacity>
          <Text
            className='text-[#6A9B00] text-sm font-semibold'
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Clear all
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className='flex-1'>
        <View className='px-4'>
          {notificationsData.map((notification, index) => (
            <View key={notification.id}>
              <View className='flex-row my-4 items-start mb-1'>
                <View
                  style={{
                    width: 4,
                    height: '100%',
                    backgroundColor: notification.barColor,
                    borderTopLeftRadius: 4,
                    borderBottomLeftRadius: 4,
                    marginRight: 12
                  }}
                />

                <View className='flex-1 pb-4'>
                  <View className='flex-row items-start'>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: notification.iconBgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}
                    >
                      <Ionicons
                        name={notification.icon as any}
                        size={22}
                        color={notification.barColor}
                      />
                    </View>
                    <View className='flex-1'>
                      <View className='flex-row items-start justify-between mb-1'>
                        <Text
                          className='text-base font-bold text-black'
                          style={{ fontFamily: 'Poppins-Bold' }}
                        >
                          {notification.type}
                        </Text>
                        <Text
                          className='text-gray-400 text-xs'
                          style={{ fontFamily: 'Poppins-Medium' }}
                        >
                          {notification.time}
                        </Text>
                      </View>

                      <Text
                        className='text-gray-600 text-sm mb-2'
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        {notification.description}
                      </Text>

                      <View className='flex-row items-center justify-between'>
                        <TouchableOpacity>
                          <Text
                            className='text-[#6A9B00] text-sm font-semibold'
                            style={{ fontFamily: 'Poppins-SemiBold' }}
                          >
                            View details
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                          <Text
                            className='text-gray-400 text-sm'
                            style={{ fontFamily: 'Poppins-Medium' }}
                          >
                            Mark as read
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              {index < notificationsData.length - 1 && (
                <View className='border-b border-gray-100 mb-1' />
              )}
            </View>
          ))}
        </View>
        
        <View className='px-4 pb-6 pt-4'>
          <TouchableOpacity className='border border-gray-300 rounded-xl py-4 px-6 flex-row items-center justify-center bg-white'>
            <Ionicons name='add' size={20} color="#666" />
            <Text
              className='text-gray-700 text-base font-semibold ml-2'
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Load More Notifications
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default NotificationsScreen;
