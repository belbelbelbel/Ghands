import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Calendar, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type JobStatus = 'Ongoing' | 'Pending' | 'Completed';

interface JobItem {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: JobStatus;
  matchedTime?: string;
  completedTime?: string;
  images: any[];
}

const ONGOING_JOBS: JobItem[] = [
  {
    id: '1',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'Ongoing',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
];

const PENDING_JOBS: JobItem[] = [
  {
    id: '2',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'Pending',
    matchedTime: '24min. ago',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
  {
    id: '3',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'Pending',
    matchedTime: '24min. ago',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
];

const COMPLETED_JOBS: JobItem[] = [
  {
    id: '4',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'Completed',
    completedTime: '24min. ago',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
  {
    id: '5',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'Completed',
    completedTime: '24min. ago',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
  {
    id: '6',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'Completed',
    completedTime: '24min. ago',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
];

export default function ProviderJobsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<JobStatus>('Ongoing');

  const getJobsForTab = () => {
    switch (activeTab) {
      case 'Ongoing':
        return ONGOING_JOBS;
      case 'Pending':
        return PENDING_JOBS;
      case 'Completed':
        return COMPLETED_JOBS;
      default:
        return [];
    }
  };

  const renderJobCard = (job: JobItem) => (
    <View
      key={job.id}
          style={{
            ...CommonStyles.card,
            position: 'relative',
          }}
        >
      {(job.matchedTime || job.completedTime) && (
        <Text style={{ ...Fonts.bodyTiny, color: Colors.textTertiary, marginBottom: Spacing.xs + 2 }}>
          {job.completedTime ? `completed ${job.completedTime}` : `matched ${job.matchedTime}`}
        </Text>
      )}

      {job.status === 'Ongoing' && (
        <View style={CommonStyles.badgeSuccess}>
          <Text style={{ ...Fonts.label, color: Colors.success }}>In Progress</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, paddingRight: 50 }}>
        <Image source={require('../../assets/images/userimg.jpg')} style={{ width: 36, height: 36, borderRadius: 18, marginRight: Spacing.sm + 2 }} resizeMode='cover' />
        <View style={{ flex: 1 }}>
          <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
            {job.clientName}
          </Text>
          <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, marginTop: 2 }}>
            {job.service}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs }}>
        <Calendar size={12} color={Colors.textSecondaryDark} />
        <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium', marginLeft: Spacing.xs + 2 }}>
          {job.date} - {job.time}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm + 2 }}>
        <MapPin size={12} color={Colors.textSecondaryDark} />
        <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium', marginLeft: Spacing.xs + 2 }}>
          {job.location}
        </Text>
      </View>

      {job.status === 'Ongoing' ? (
        <TouchableOpacity
            style={{ ...CommonStyles.buttonPrimary, width: '100%' }}
            onPress={() => router.push('/ProviderJobDetailsScreen')}
          >
            <Text style={{ ...Fonts.button, color: Colors.white, marginRight: Spacing.xs }}>
              Check Updates
            </Text>
            <ArrowRight size={14} color={Colors.white} />
        </TouchableOpacity>
      ) : job.status === 'Pending' ? (
        <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
          <TouchableOpacity style={CommonStyles.buttonDanger}>
            <Text style={{ ...Fonts.button, color: Colors.error, textAlign: 'center' }}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...CommonStyles.buttonSecondary,
              flex: 1,
            }}
            onPress={() => router.push('/ProviderJobDetailsScreen')}
          >
            <Text style={{ ...Fonts.button, color: Colors.textPrimary, marginRight: Spacing.xs }}>
              View details
            </Text>
            <ArrowRight size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={{
            ...CommonStyles.buttonSecondary,
            width: '100%',
          }}
        >
          <Text style={{ ...Fonts.button, color: Colors.textPrimary, marginRight: Spacing.xs }}>
            View Receipt
          </Text>
          <ArrowRight size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}

      <View style={{ position: 'absolute', right: Spacing.md, top: 60 }}>
        <View style={{ flexDirection: 'row', gap: -6 }}>
          {job.images.slice(0, 3).map((imgSource, index) => (
            <Image
              key={index}
              source={imgSource}
              style={{
                width: 40,
                height: 40,
                borderRadius: BorderRadius.sm,
                marginLeft: index > 0 ? -6 : 0,
                borderWidth: 2,
                borderColor: Colors.white,
                zIndex: 3 - index,
              }}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1 }}>
        
        <View style={{ ...CommonStyles.container, paddingTop: Spacing.md + 1 }}>
          <Text style={{ ...Fonts.h2, color: Colors.textPrimary, textAlign: 'center' }}>
            Job History
          </Text>
        </View>

        
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: Spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            marginBottom: Spacing.lg,
          }}
        >
          {(['Ongoing', 'Pending', 'Completed'] as JobStatus[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingBottom: Spacing.md,
                alignItems: 'center',
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: activeTab === tab ? Colors.accent : 'transparent',
              }}
            >
              <Text
                style={{
                  ...Fonts.bodyMedium,
                  color: activeTab === tab ? Colors.textPrimary : Colors.textTertiary,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: 100,
          }}
        >
          {getJobsForTab().length > 0 ? (
            getJobsForTab().map((job) => renderJobCard(job))
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ ...Fonts.bodyMedium, color: Colors.textTertiary }}>
                No {activeTab.toLowerCase()} jobs yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
