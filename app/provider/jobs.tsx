import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import { ArrowRight, Calendar, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  images: string[];
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
    images: ['pipe1', 'pipe2', 'pipe3'],
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
    images: ['pipe1', 'pipe2', 'pipe3'],
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
    images: ['pipe1', 'pipe2', 'pipe3'],
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
    images: ['pipe1', 'pipe2', 'pipe3'],
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
    images: ['pipe1', 'pipe2', 'pipe3'],
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
    images: ['pipe1', 'pipe2', 'pipe3'],
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
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
      {(job.matchedTime || job.completedTime) && (
        <Text style={{ fontSize: 11, color: '#999999', fontFamily: 'Poppins-Medium', marginBottom: 6 }}>
          {job.completedTime ? `completed ${job.completedTime}` : `matched ${job.matchedTime}`}
        </Text>
      )}

      {job.status === 'Ongoing' && (
        <View
                style={{
                  backgroundColor: '#FEF3C7',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  borderRadius: 10,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 10, color: '#166534', fontFamily: 'Poppins-SemiBold' }}>In Progress</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#E5E7EB',
                marginRight: 10,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000' }}>
                {job.clientName}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666', marginTop: 2 }}>
                {job.service}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Calendar size={12} color="#666666" />
            <Text style={{ fontSize: 12, color: '#666666', fontFamily: 'Poppins-Medium', marginLeft: 6 }}>
              {job.date} - {job.time}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MapPin size={12} color="#666666" />
            <Text style={{ fontSize: 12, color: '#666666', fontFamily: 'Poppins-Medium', marginLeft: 6 }}>
              {job.location}
            </Text>
          </View>

          {job.status === 'Ongoing' ? (
            <TouchableOpacity
                style={{
                  backgroundColor: '#000000',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => router.push('/ProviderJobDetailsScreen')}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
                  Check Updates
                </Text>
                <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : job.status === 'Pending' ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#FEE2E2',
                  backgroundColor: '#FEF2F2',
                }}
              >
                <Text style={{ color: '#DC2626', fontFamily: 'Poppins-SemiBold', fontSize: 12, textAlign: 'center' }}>
                  Decline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: '#6A9B00',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => router.push('/ProviderJobDetailsScreen')}
              >
                <Text style={{ color: '#000000', fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
                  View details
                </Text>
                <ArrowRight size={14} color="#000000" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: '#6A9B00',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#000000', fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
                View Receipt
              </Text>
              <ArrowRight size={14} color="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', gap: -6 }}>
            {[1, 2, 3].map((index) => (
              <View
                key={index}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#E5E7EB',
                  marginLeft: index > 1 ? -6 : 0,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  zIndex: 3 - index,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 17, paddingBottom: 12 }}>
          <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: '#000000', textAlign: 'center' }}>
            Job History
          </Text>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            marginBottom: 16,
          }}
        >
          {(['Ongoing', 'Pending', 'Completed'] as JobStatus[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingBottom: 12,
                alignItems: 'center',
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: activeTab === tab ? '#6A9B00' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: activeTab === tab ? '#000000' : '#999999',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Job List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
        >
          {getJobsForTab().length > 0 ? (
            getJobsForTab().map((job) => renderJobCard(job))
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: '#999999' }}>
                No {activeTab.toLowerCase()} jobs yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
