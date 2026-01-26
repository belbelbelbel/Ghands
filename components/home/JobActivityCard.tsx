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
      className="bg-white rounded-2xl px-4 py-6 border border-gray-100 shadow-[0px_6px_18px_rgba(16,24,40,0.04)]"
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-[#F2F7EC] items-center justify-center mr-3">
            <Ionicons name="construct" size={18} color="#6A9B00" />
          </View>
          <View>
            <Text
              className="text-base text-black"
              style={{ fontFamily: 'Poppins-SemiBold' }}
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
      <View className="flex-row items-center justify-between">
        <Text
          className="text-xs text-gray-500"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {activity.quotes} quotes received
        </Text>
        <Text
          className="text-sm text-black"
          style={{ fontFamily: 'Poppins-SemiBold' }}
        >
          {activity.priceRange}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const JobActivityCard = React.memo(JobActivityCardComponent);

export default JobActivityCard;

