import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Calendar, ChevronDown, MapPin, Plus, Shield, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface JobCard {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: 'in-progress' | 'pending';
  matchedTime?: string;
  images: any[];
}

const MOCK_ACTIVE_JOBS: JobCard[] = [
  {
    id: '1',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'in-progress',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
];

const MOCK_PENDING_JOBS: JobCard[] = [
  {
    id: '2',
    clientName: 'Lawal Johnson',
    service: 'Kitchen pipe leak repair',
    date: 'Oct 20, 2024',
    time: '2:00 PM',
    location: '123 Main St, Downtown',
    status: 'pending',
    matchedTime: '24min. ago',
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
  },
];

export default function ProviderHomeScreen() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [hasActiveJobs, setHasActiveJobs] = useState(true); 

  const renderJobCard = (job: JobCard, isActive: boolean) => (
    <View
      key={job.id}
      style={{
        ...CommonStyles.card,
        position: 'relative',
      }}
    >
      {job.matchedTime && (
        <Text style={{ ...Fonts.bodyTiny, color: Colors.textTertiary, marginBottom: Spacing.xs + 2 }}>
          matched {job.matchedTime}
        </Text>
      )}
      {isActive && (
        <View style={CommonStyles.badgeSuccess}>
          <Text style={{ ...Fonts.label, color: Colors.success }}>In Progress</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs + 2, paddingRight: 50 }}>
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

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
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

      {isActive ? (
        <TouchableOpacity
          style={{ ...CommonStyles.buttonPrimary, width: '100%' }}
          onPress={() => router.push('/ProviderJobDetailsScreen')}
        >
          <Text style={{ ...Fonts.button, color: Colors.white, marginRight: Spacing.xs }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.white} />
        </TouchableOpacity>
      ) : (
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 17, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <MapPin size={16} color="#6A9B00" />
              </View>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#000000', flex: 1 }}>
                Enter your location
              </Text>
              <ChevronDown size={16} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={{ position: 'relative', padding: 8, marginLeft: 16 }}>
              <Bell size={22} color="#000000" />
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#6A9B00',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#000000' }}>Welcome, Alex</Text>
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#000000' }}>Online</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: '#E5E7EB', true: '#6A9B00' }}
                thumbColor="#FFFFFF"
              />
            </View> */}
          </View>

          {!hasActiveJobs && (
            <TouchableOpacity
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Shield size={18} color="#666666" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#000000' }}>
                  Verification Pending
                </Text>
              </View>
              <ArrowRight size={18} color="#666666" />
            </TouchableOpacity>
          )}

          <Text style={{ fontSize: 17, fontFamily: 'Poppins-SemiBold', color: '#000000', marginBottom: 10 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#000000',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', marginLeft: 6 }}>
                Add Service
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#000000',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', marginLeft: 6 }}>
                Invite Friends
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {hasActiveJobs && MOCK_ACTIVE_JOBS.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Poppins-SemiBold', color: '#000000' }}>Active Jobs</Text>
              <TouchableOpacity onPress={() => router.push('/provider/jobs')}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#6A9B00' }}>
                  View all <ArrowRight size={12} color="#6A9B00" />
                </Text>
              </TouchableOpacity>
            </View>
            {MOCK_ACTIVE_JOBS.map((job) => renderJobCard(job, true))}
          </View>
        )}

        {hasActiveJobs && MOCK_PENDING_JOBS.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Poppins-SemiBold', color: '#000000' }}>Pending Requests</Text>
              <TouchableOpacity onPress={() => router.push('/provider/jobs')}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#6A9B00' }}>
                  View all <ArrowRight size={12} color="#6A9B00" />
                </Text>
              </TouchableOpacity>
            </View>
            {MOCK_PENDING_JOBS.map((job) => renderJobCard(job, false))}
          </View>
        )}

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#000000', marginBottom: 10 }}>
            Featured Resources
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 100,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                }}
              >
                <Image source={require('../../assets/images/guideimg.jpg')} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode='cover' />
              </View>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 3 }}>
                  How to get started
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#666666' }}>
                  Learn best practices and guidelines for providing services.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 100,
                  backgroundColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins-Bold', fontSize: 11 }}>GET YOUR GUIDE</Text> */}
                <Image source={require('../../assets/images/guideimg.jpg')} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode='cover' />
              </View>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 3 }}>
                  FAQ & Support
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#666666' }}>
                  Find answers to common questions and get support.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insights Section */}
        {hasActiveJobs ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 10 }}>
              Insights
            </Text>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#000000' }}>Job Completion Rate</Text>
                <TouchableOpacity>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#6A9B00' }}>
                    View full analytics <ArrowRight size={11} color="#6A9B00" />
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 32, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 4 }}>
                95%
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' }}>Last 30 Days </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#6A9B00' }}>+5%</Text>
              </View>
              <View
                style={{
                  height: 32,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 3,
                }}
              >
                {[20, 35, 28, 45, 38, 52, 48, 60, 55, 70, 65, 75, 80, 85, 90, 88, 92, 95, 93, 95].map(
                  (height, index) => (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        height: `${height}%`,
                        backgroundColor: '#6A9B00',
                        borderRadius: 2,
                      }}
                    />
                  )
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 10 }}>
              Insights
            </Text>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed',
                padding: 32,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: '#000000', marginBottom: 6 }}>
                No insights yet
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666', textAlign: 'center', marginBottom: 16 }}>
                Once you start getting jobs, you'll see insights here.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#000000',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF' }}>Learn more</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
