import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
      <View style={{ flex: 1, paddingHorizontal: Spacing.xs + 4, paddingTop: Spacing.xl }}>
        <Text style={{
          ...Fonts.h2,
          fontSize: 24,
          color: Colors.textPrimary,
          marginBottom: Spacing.lg + 2,
          textAlign: 'center',
        }}>
          Jobs
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xs + 4 }}>
          {(['Ongoing', 'Completed', 'Cancelled'] as JobStatus[]).map((status) => {
            const isActive = activeTab === status;
            return (
              <TouchableOpacity key={status} onPress={() => setActiveTab(status)} activeOpacity={0.8}>
                <Text
                  style={{
                    ...Fonts.body,
                    fontFamily: 'Poppins-Medium',
                    color: isActive ? Colors.textPrimary : Colors.textTertiary,
                  }}
                >
                  {status}
                </Text>
                <View
                  style={{
                    marginTop: Spacing.xs + 2,
                    height: 2,
                    borderRadius: 1,
                    width: 68,
                    backgroundColor: isActive ? Colors.accent : 'transparent',
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
          {jobs.map((job) => (
            <View
              key={`${activeTab}-${job.id}`}
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                marginBottom: Spacing.lg + 2,
                paddingHorizontal: Spacing.xl + 1,
                paddingVertical: Spacing.xl + 1,
                borderRadius: BorderRadius.lg,
                backgroundColor: Colors.backgroundLight,
                shadowColor: Colors.shadow,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.04,
                shadowRadius: 18,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm + 1 }}>
                <View style={{ flex: 1, paddingRight: Spacing.sm + 1 }}>
                  <Text style={{
                    ...Fonts.h3,
                    fontSize: 18,
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}>
                    {job.title}
                  </Text>
                  <Text style={{
                    ...Fonts.bodySmall,
                    color: Colors.textSecondaryDark,
                  }}>
                    {job.subtitle}
                  </Text>
                </View>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: Spacing.sm + 1,
                    paddingVertical: 4,
                    borderRadius: BorderRadius.default,
                    backgroundColor: activeTab === 'Ongoing'
                      ? '#FEF3C7'
                      : activeTab === 'Completed'
                        ? Colors.successLight
                        : Colors.backgroundGray,
                  }}
                >
                  <Text style={{
                    ...Fonts.bodyTiny,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textPrimary,
                  }}>
                    {job.status}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 1, marginTop: Spacing.xs + 2 }}>
                <Ionicons name="person-outline" size={16} color={Colors.textSecondaryDark} />
                <Text style={{
                  ...Fonts.bodySmall,
                  color: Colors.textSecondaryDark,
                }}>
                  {job.name}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 1, marginTop: Spacing.xs + 2 }}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondaryDark} />
                <Text style={{
                  ...Fonts.bodySmall,
                  color: Colors.textSecondaryDark,
                }}>
                  {job.time}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 1, marginTop: Spacing.xs + 2 }}>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondaryDark} />
                <Text style={{
                  ...Fonts.bodySmall,
                  color: Colors.textSecondaryDark,
                }}>
                  {job.location}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  paddingTop: Spacing.xs + 4,
                  justifyContent: activeTab === 'Ongoing' ? 'space-between' : 'center',
                }}
              >
                {activeTab === 'Ongoing' && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: Colors.errorLight,
                      borderWidth: 1,
                      borderColor: Colors.error,
                      paddingVertical: Spacing.xs + 2,
                      paddingHorizontal: Spacing.xl + 1,
                      borderRadius: BorderRadius.md,
                    }}
                    activeOpacity={0.85}
                    onPress={() => setPendingCancelJob(job)}
                  >
                    <Text style={{
                      ...Fonts.bodySmall,
                      fontFamily: 'Poppins-Medium',
                      color: Colors.error,
                    }}>
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    paddingVertical: Spacing.sm + 1,
                    paddingHorizontal: Spacing.lg + 2,
                    borderRadius: BorderRadius.md,
                    backgroundColor: activeTab === 'Ongoing'
                      ? Colors.backgroundGray
                      : activeTab === 'Completed'
                        ? Colors.accent
                        : Colors.black,
                    width: activeTab === 'Ongoing' ? undefined : '100%',
                    flex: activeTab === 'Ongoing' ? 1 : undefined,
                    marginLeft: activeTab === 'Ongoing' ? Spacing.sm + 1 : 0,
                  }}
                  activeOpacity={0.85}
                  onPress={() => handlePrimaryAction(activeTab)}
                >
                  <Text
                    style={{
                      ...Fonts.bodySmall,
                      fontFamily: 'Poppins-Medium',
                      color: activeTab === 'Ongoing' ? Colors.textPrimary : Colors.white,
                      textAlign: 'center',
                    }}
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

      <Modal visible={!!pendingCancelJob} transparent animationType="fade" onRequestClose={() => setPendingCancelJob(null)}>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white px-6 py-6 shadow-[0px_20px_45px_rgba(15,23,42,0.25)]">
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
                onPress={() => setPendingCancelJob(null)}
              >
                <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Go back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
