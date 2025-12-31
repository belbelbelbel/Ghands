import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedModal from '@/components/AnimatedModal';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type JobStatus = 'Ongoing' | 'Completed' | 'Cancelled';

type JobItem = {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  name: string;
  time: string;
  location: string;
};

const ONGOING_JOBS: JobItem[] = [
  {
    id: 1,
    title: 'Plumbing Repair',
    subtitle: 'Kitchen pipe leak repair',
    status: 'In Progress',
    name: 'Mike Johnson',
    time: 'Dec 12, 2024 • 2:00 PM',
    location: '123 Main St, Downtown',
  },
  {
    id: 2,
    title: 'Bathroom Install',
    subtitle: 'New fixtures installation',
    status: 'In Progress',
    name: 'Andrew Miller',
    time: 'Dec 14, 2024 • 11:30 AM',
    location: '45 Market Rd, Victoria Island',
  },
];

const COMPLETED_JOBS: JobItem[] = [
  {
    id: 1,
    title: 'Electrical Inspection',
    subtitle: 'Fuse box assessment',
    status: 'Completed',
    name: 'Claire Roberts',
    time: 'Nov 22, 2024 • 4:00 PM',
    location: '16 Palm Way, Ikoyi',
  },
  {
    id: 2,
    title: 'AC Servicing',
    subtitle: 'Full apartment servicing',
    status: 'Completed',
    name: 'Kola Adeyemi',
    time: 'Nov 18, 2024 • 9:00 AM',
    location: '88 Bourdillon Rd, Ikoyi',
  },
];

const CANCELLED_JOBS: JobItem[] = [
  {
    id: 1,
    title: 'Carpentry Job',
    subtitle: 'Wardrobe repairs',
    status: 'Cancelled',
    name: 'Angela Cooper',
    time: 'Nov 10, 2024 • 1:00 PM',
    location: '23 Unity Close, Lekki',
  },
];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<JobStatus>('Ongoing');
  const [pendingCancelJob, setPendingCancelJob] = useState<JobItem | null>(null);
  const router = useRouter();

  const jobs = useMemo(() => {
    switch (activeTab) {
      case 'Completed':
        return COMPLETED_JOBS;
      case 'Cancelled':
        return CANCELLED_JOBS;
      default:
        return ONGOING_JOBS;
    }
  }, [activeTab]);

  const handlePrimaryAction = (status: JobStatus) => {
    haptics.selection();
    if (status === 'Ongoing') {
      router.push('/OngoingJobDetails');
    } else if (status === 'Completed') {
      router.push('/CompletedJobDetail');
    } else {
      router.push('/JobDetailsScreen');
    }
  };

  return (
    <SafeAreaWrapper>
      <View className="flex-1 px-4" style={{ paddingTop: 20 }}>
        <Text className="text-2xl text-black mb-6 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
          Jobs
        </Text>

        <View className="flex flex-row justify-around mb-4">
          {(['Ongoing', 'Completed', 'Cancelled'] as JobStatus[]).map((status) => {
            const isActive = activeTab === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  haptics.selection();
                  setActiveTab(status);
                }}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-base ${isActive ? 'text-black' : 'text-gray-500'}`}
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {status}
                </Text>
                <View
                  className={`mt-2 h-0.5 rounded-full ${isActive ? 'bg-[#6A9B00]' : 'bg-transparent'}`}
                  style={{ width: 68 }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {jobs.map((job) => (
            <View
              key={`${activeTab}-${job.id}`}
              className="border border-gray-200 mb-6 px-5 py-5 rounded-2xl shadow-[0px_6px_18px_rgba(15,23,42,0.04)]"
            >
              <View className="flex-row justify-between mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-lg text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                    {job.title}
                  </Text>
                  <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                    {job.subtitle}
                  </Text>
                </View>
                <AnimatedStatusChip
                  status={job.status}
                  statusColor={
                    activeTab === 'Ongoing'
                      ? '#FEF9C3'
                      : activeTab === 'Completed'
                        ? '#DCFCE7'
                        : '#F3F4F6'
                  }
                  textColor={
                    activeTab === 'Ongoing'
                      ? '#92400E'
                      : activeTab === 'Completed'
                        ? '#166534'
                        : '#6B7280'
                  }
                  size="small"
                  animated={true}
                />
              </View>

              <View className="flex-row items-center gap-3 mt-2">
                <Ionicons name="person-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                  {job.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-3 mt-2">
                <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                  {job.time}
                </Text>
              </View>
              <View className="flex-row items-center gap-3 mt-2">
                <Ionicons name="location-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                  {job.location}
                </Text>
              </View>

              <View
                className={`flex flex-row pt-4 ${activeTab === 'Ongoing' ? 'justify-between' : 'justify-center'}`}
              >
                {activeTab === 'Ongoing' && (
                  <TouchableOpacity
                    className="bg-red-50 border border-red-500 py-2 px-5 rounded-lg"
                    activeOpacity={0.85}
                    onPress={() => {
                      haptics.warning();
                      setPendingCancelJob(job);
                    }}
                  >
                    <Text className="text-sm text-[#FF2C2C]" style={{ fontFamily: 'Poppins-Medium' }}>
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className={`py-3 px-6 rounded-lg ${
                    activeTab === 'Ongoing'
                      ? 'bg-gray-100'
                      : activeTab === 'Completed'
                        ? 'bg-[#6A9B00] w-full'
                        : 'bg-black w-full'
                  }`}
                  activeOpacity={0.85}
                  onPress={() => handlePrimaryAction(activeTab)}
                >
                  <Text
                    className={`text-sm  text-center ${
                      activeTab === 'Ongoing' ? 'text-black' : 'text-white '
                    }`}
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {activeTab === 'Ongoing'
                      ? 'Check Updates'
                      : activeTab === 'Completed'
                        ? 'View Details'
                        : 'Rebook Service'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <AnimatedModal
        visible={!!pendingCancelJob}
        onClose={() => {
          haptics.light();
          setPendingCancelJob(null);
        }}
        animationType="slide"
      >
        <View className="px-2">
          <Text className="text-lg text-center text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
            Cancel Request?
          </Text>
          <Text className="text-sm text-center text-gray-500 mb-5" style={{ fontFamily: 'Poppins-Regular' }}>
            This action cannot be undone
          </Text>
          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              className="flex-1 bg-[#FF2C2C] py-3 rounded-xl items-center justify-center"
              activeOpacity={0.85}
              onPress={() => {
                const job = pendingCancelJob;
                haptics.error();
                setPendingCancelJob(null);
                if (job) {
                  router.push('/CancelRequestScreen');
                }
              }}
            >
              <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl items-center justify-center"
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                setPendingCancelJob(null);
              }}
            >
              <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Go back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </SafeAreaWrapper>
  );
}
