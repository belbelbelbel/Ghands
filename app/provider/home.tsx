import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import LocationSearchModal from '@/components/LocationSearchModal';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Calendar, ChevronDown, MapPin, Plus, Shield, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
  const { location, refreshLocation } = useUserLocation();
  const [isOnline, setIsOnline] = useState(true);
  const [hasActiveJobs, setHasActiveJobs] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Refresh location when modal closes
  useEffect(() => {
    if (!showLocationModal) {
      refreshLocation();
    }
  }, [showLocationModal, refreshLocation]); 

  const renderJobCard = (job: JobCard, isActive: boolean) => (
    <View
      key={job.id}
      style={{
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {job.matchedTime && (
        <Text style={{ fontSize: 11, color: Colors.textTertiary, fontFamily: 'Poppins-Regular', marginBottom: 6 }}>
          matched {job.matchedTime}
        </Text>
      )}
      {isActive && (
        <View
          style={{
            backgroundColor: Colors.successLight,
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: BorderRadius.default,
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 11, color: Colors.success, fontFamily: 'Poppins-SemiBold' }}>In Progress</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Image source={require('../../assets/images/userimg.jpg')} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} resizeMode='cover' />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
                {job.clientName}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginTop: 2 }}>
                {job.service}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Calendar size={12} color={Colors.textSecondaryDark} />
            <Text style={{ fontSize: 12, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Regular', marginLeft: 6 }}>
              {job.date} - {job.time}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MapPin size={12} color={Colors.textSecondaryDark} />
            <Text style={{ fontSize: 12, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Regular', marginLeft: 6 }}>
              {job.location}
            </Text>
          </View>
        </View>

        <View style={{ marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', gap: -6 }}>
            {job.images.slice(0, 3).map((imgSource, index) => (
              <Image
                key={index}
                source={imgSource}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  marginLeft: index > 0 ? -6 : 0,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  zIndex: 3 - index,
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
      </View>

      {/* Buttons - Full Width */}
      {isActive ? (
        <TouchableOpacity
          style={{
            backgroundColor: Colors.black,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: BorderRadius.default,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
          onPress={() => router.push('/ProviderUpdatesScreen' as any)}
        >
          <Text style={{ color: Colors.white, fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <TouchableOpacity
            style={{
              width: '100%',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: Colors.errorBorder,
              backgroundColor: Colors.errorLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: Colors.error, fontFamily: 'Poppins-SemiBold', fontSize: 12 }}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: '100%',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: BorderRadius.default,
              backgroundColor: Colors.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.push('/ProviderJobDetailsScreen' as any)}
          >
            <Text style={{ color: Colors.textPrimary, fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
              View details
            </Text>
            <ArrowRight size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
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
              onPress={() => setShowLocationModal(true)}
            >
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
                <MapPin size={16} color={Colors.accent} />
              </View>
              <Text 
                style={{ 
                  fontSize: 14, 
                  fontFamily: 'Poppins-Medium', 
                  color: location ? Colors.textPrimary : Colors.textSecondaryDark, 
                  flex: 1 
                }}
                numberOfLines={1}
              >
                {location || 'Enter your location'}
              </Text>
              <ChevronDown size={16} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ position: 'relative', padding: 8, marginLeft: 16 }}
              onPress={() => router.push('/NotificationsScreen' as any)}
              activeOpacity={0.7}
            >
              <Bell size={22} color={Colors.textPrimary} />
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.accent,
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>Welcome, Alex</Text>
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
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
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
                  backgroundColor: Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Shield size={18} color={Colors.textSecondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                  Verification Pending
                </Text>
              </View>
              <ArrowRight size={18} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
          )}

          <Text style={{ fontSize: 15, fontFamily: 'Poppins-Medium', color: Colors.textPrimary, marginBottom: 10 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.black,
                borderRadius: BorderRadius.xl,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} color={Colors.white} />
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.white, marginLeft: 6 }}>
                Add Service
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.black,
                borderRadius: BorderRadius.xl,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} color={Colors.white} />
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.white, marginLeft: 6 }}>
                Invite Friends
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {hasActiveJobs && MOCK_ACTIVE_JOBS.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>Active Jobs</Text>
              <TouchableOpacity onPress={() => router.push('/provider/jobs')}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                  View all <ArrowRight size={12} color={Colors.accent} />
                </Text>
              </TouchableOpacity>
            </View>
            {MOCK_ACTIVE_JOBS.map((job) => renderJobCard(job, true))}
          </View>
        )}

        {hasActiveJobs && MOCK_PENDING_JOBS.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>Pending Requests</Text>
              <TouchableOpacity onPress={() => router.push('/provider/jobs')}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                  View all <ArrowRight size={12} color={Colors.accent} />
                </Text>
              </TouchableOpacity>
            </View>
            {MOCK_PENDING_JOBS.map((job) => renderJobCard(job, false))}
          </View>
        )}

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 10 }}>
            Featured Resources
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
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
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 3 }}>
                  How to get started
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                  Learn best practices and guidelines for providing services.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 100,
                  backgroundColor: Colors.black,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image source={require('../../assets/images/guideimg.jpg')} style={{ width: '100%', height: '100%', borderRadius: BorderRadius.xl }} resizeMode='cover' />
              </View>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 3 }}>
                  FAQ & Support
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                  Find answers to common questions and get support.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insights Section */}
        {hasActiveJobs ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 10 }}>
              Insights
            </Text>
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>Job Completion Rate</Text>
                <TouchableOpacity onPress={() => router.push('/AnalyticsScreen' as any)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                    View full analytics <ArrowRight size={11} color={Colors.accent} />
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 32, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 4 }}>
                95%
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>Last 30 Days </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>+5%</Text>
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
                        backgroundColor: Colors.accent,
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
            <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 10 }}>
              Insights
            </Text>
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 2,
                borderColor: Colors.border,
                borderStyle: 'dashed',
                padding: 32,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 6 }}>
                No insights yet
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 16 }}>
                Once you start getting jobs, you'll see insights here.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.black,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: BorderRadius.default,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>Learn more</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          refreshLocation();
        }}
        onLocationSelected={(selectedLocation) => {
          setShowLocationModal(false);
          refreshLocation();
        }}
      />
    </SafeAreaWrapper>
  );
}
