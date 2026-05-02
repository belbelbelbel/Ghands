import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type JobActivityStatus = 'Completed' | 'In Progress' | 'Pending';

export type JobActivity = {
  id: string;
  title: string;
  category: string;
  submittedAt: string;
  quotes: number;
  priceRange: string;
  status: JobActivityStatus;
};

const jobStatusTheme: Record<JobActivityStatus, { badgeBg: string; badgeText: string }> = {
  Completed: {
    badgeBg: '#E7F6E5',
    badgeText: '#2F6B1D'
  },
  'In Progress': {
    badgeBg: '#E4ECFF',
    badgeText: '#2750B8'
  },
  Pending: {
    badgeBg: '#FFF4E0',
    badgeText: '#9E6B1F'
  }
};

type JobActivityCardProps = {
  activity: JobActivity;
};

const JobActivityCardComponent = ({ activity }: JobActivityCardProps) => {
  const router = useRouter();
  const theme = jobStatusTheme[activity.status];
  const isAwaitingQuote = activity.priceRange.toLowerCase().includes('awaiting');

  const handlePress = () => {
    const requestId = parseInt(activity.id, 10);
    if (isNaN(requestId)) return;

    // All non-completed jobs (In Progress, Pending) go to OngoingJobDetails (Check Updates page)
    if (activity.status === 'Completed') {
      router.push({
        pathname: '/CompletedJobDetail',
        params: { requestId: activity.id },
      } as any);
    } else {
      // Navigate to OngoingJobDetails for In Progress and Pending jobs
      router.push({
        pathname: '/OngoingJobDetails',
        params: { requestId: activity.id },
      } as any);
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl px-4 py-4 shadow-[0px_6px_18px_rgba(16,24,40,0.04)]"
      activeOpacity={0.7}
      onPress={handlePress}
      style={{
        borderWidth: 0.5,
        borderColor: 'rgba(16, 24, 40, 0.045)',
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.03,
        shadowRadius: 16,
        elevation: 0.76,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 pr-3">
          <View className="w-9 h-9 rounded-full bg-[#F2F7EC] items-center justify-center mr-3">
            <Ionicons name="construct" size={17} color="#6A9B00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              className="text-base text-black"
              style={{ fontFamily: 'Poppins-SemiBold', lineHeight: 20 }}
              numberOfLines={1}
            >
              {activity.title}
            </Text>
            <Text
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              {activity.category} • {activity.submittedAt}
            </Text>
          </View>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: theme.badgeBg }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ fontFamily: 'Poppins-SemiBold', color: theme.badgeText }}
          >
            {activity.status}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between pt-2">
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Poppins-Medium', marginBottom: 3 }}
          >
            {activity.quotes} {activity.quotes === 1 ? 'quote' : 'quotes'} received
          </Text>
          <Text
            className="text-xs text-gray-400"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {isAwaitingQuote ? 'Price will appear after a provider sends a quote' : 'Estimated total'}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: isAwaitingQuote ? '#F9FAFB' : '#F2F7EC',
            borderRadius: 13,
            paddingHorizontal: 10,
            paddingVertical: 7,
            alignItems: 'flex-end',
            minWidth: isAwaitingQuote ? 82 : 74,
          }}
        >
          <Text
            className="text-[10px] text-gray-500"
            style={{ fontFamily: 'Poppins-Medium', marginBottom: 1 }}
          >
            {isAwaitingQuote ? 'Pending' : 'Price'}
          </Text>
          <Text
            className="text-xs text-black"
            style={{ fontFamily: 'Poppins-SemiBold' }}
            numberOfLines={1}
          >
            {isAwaitingQuote ? 'No quote yet' : activity.priceRange}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const JobActivityCard = React.memo(JobActivityCardComponent);

export default JobActivityCard;

