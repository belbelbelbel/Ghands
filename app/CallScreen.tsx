import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Spacing, BorderRadius, SHADOWS } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, Shield, User, Calendar, MapPin, Hash, MessageCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { haptics } from '@/hooks/useHaptics';
import { communicationService } from '@/services/api';

export type CallState = 'incoming' | 'outgoing' | 'active' | 'ended';

interface CallScreenParams {
  callState?: CallState;
  callerName?: string;
  callerId?: string;
  callerImage?: string;
  jobTitle?: string;
  jobDescription?: string;
  orderNumber?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  jobStatus?: string;
  requestId?: string;
  isProvider?: string; // 'true' or 'false'
}

interface JobDetails {
  title: string;
  description: string;
  orderNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: string;
}

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<CallScreenParams>();
  
  // Parse call state from params
  const initialCallState: CallState = (params.callState as CallState) || 'incoming';
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [callDuration, setCallDuration] = useState(0); // in seconds
  const [callId, setCallId] = useState<string | null>(null);
  const [callReference, setCallReference] = useState<string | null>(null);
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [callSetupError, setCallSetupError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isProvider] = useState(params.isProvider === 'true');
  
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestIdNum = params.requestId ? parseInt(params.requestId, 10) : null;
  const hasRequestId = requestIdNum !== null && !isNaN(requestIdNum);

  // Job details from params
  const jobDetails: JobDetails = {
    title: params.jobTitle || 'Plumbing Repair',
    description: params.jobDescription || 'Kitchen pipe leak repair',
    orderNumber: params.orderNumber || '#WO-2024-1157',
    scheduledDate: params.scheduledDate || 'Oct 20, 2024',
    scheduledTime: params.scheduledTime || '2:00 PM',
    location: params.location || '123 Main St, Downtown',
    status: params.jobStatus || 'In Progress',
  };

  const callerName = params.callerName || (isProvider ? 'JohnDoe Akpan' : 'AquaFix Solutions');
  const callerImage = params.callerImage;

  // Format call duration (HH:MM:SS)
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start call duration timer
  useEffect(() => {
    if (callState === 'active') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState]);

  // Initiate call via API when outgoing and we have requestId
  useEffect(() => {
    if (callState === 'outgoing' && hasRequestId && !callId) {
      setIsCreatingCall(true);
      setCallSetupError(null);
      communicationService
        .initiateCall(requestIdNum!)
        .then(({ callId: id, callReference: ref }) => {
          setCallId(id || null);
          setCallReference(ref || null);
          // Mark call as ringing once call record exists
          if (id) {
            communicationService.updateCallStatus(id, 'ringing').catch(() => {});
          }
        })
        .catch(() => {
          setCallSetupError('Could not start call. Please try again.');
          if (__DEV__) console.warn('Could not initiate call via API');
        })
        .finally(() => {
          setIsCreatingCall(false);
        });
    }
  }, [callState, hasRequestId, requestIdNum, callId]);

  const updateStatus = useCallback(async (status: string) => {
    if (callId) {
      try {
        await communicationService.updateCallStatus(callId, status);
      } catch {
        if (__DEV__) console.warn('Could not update call status');
      }
    }
  }, [callId]);

  const handleAcceptCall = () => {
    haptics.success();
    updateStatus('connected');
    setCallState('active');
    setCallDuration(0);
  };

  const handleDeclineCall = () => {
    haptics.error();
    updateStatus('ended');
    setCallState('ended');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const handleEndCall = () => {
    haptics.error();
    updateStatus('ended');
    setCallState('ended');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const handleToggleMute = () => {
    haptics.light();
    setIsMuted(!isMuted);
  };

  const handleToggleSpeaker = () => {
    haptics.light();
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleCallAgain = () => {
    haptics.light();
    setCallId(null);
    setCallReference(null);
    setCallSetupError(null);
    setCallState('outgoing');
    setCallDuration(0);
  };

  const handleMessage = () => {
    haptics.light();
    router.push({
      pathname: '/ChatScreen',
      params: {
        providerName: isProvider ? undefined : callerName,
        clientName: isProvider ? callerName : undefined,
        providerId: params.callerId,
        requestId: params.requestId,
      },
    } as any);
  };

  const handleCheckUpdates = () => {
    haptics.light();
    if (params.requestId) {
      router.push({
        pathname: isProvider ? '/ProviderJobDetailsScreen' : '/OngoingJobDetails',
        params: {
          requestId: params.requestId,
        },
      } as any);
    } else {
      router.back();
    }
  };

  // Job Details Card Component
  const JobDetailsCard = () => (
    <View
      style={{
        backgroundColor: '#F3F4F6',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Poppins-Bold',
            color: Colors.textPrimary,
            flex: 1,
          }}
        >
          {jobDetails.title}
        </Text>
        <View
          style={{
            backgroundColor: '#FEF9C3',
            paddingHorizontal: Spacing.sm + 2,
            paddingVertical: 4,
            borderRadius: BorderRadius.default,
            marginLeft: Spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins-SemiBold',
              color: '#92400E',
            }}
          >
            {jobDetails.status}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Poppins-Regular',
          color: Colors.textSecondaryDark,
          marginBottom: Spacing.sm,
        }}
      >
        {jobDetails.description}
      </Text>

      <View style={{ gap: Spacing.sm, marginTop: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Calendar size={15} color={Colors.textSecondaryDark} style={{ marginRight: Spacing.sm }} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
            }}
          >
            {jobDetails.scheduledDate} - {jobDetails.scheduledTime}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={15} color={Colors.textSecondaryDark} style={{ marginRight: Spacing.sm }} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
            }}
          >
            {jobDetails.location}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Hash size={15} color={Colors.textSecondaryDark} style={{ marginRight: Spacing.sm }} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
            }}
          >
            {jobDetails.orderNumber}
          </Text>
        </View>
      </View>
      {callState === 'ended' && (
        <TouchableOpacity
          onPress={handleCheckUpdates}
          activeOpacity={0.8}
          style={{
            marginTop: Spacing.lg,
            alignSelf: 'center',
            backgroundColor: Colors.textPrimary,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.default,
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
            Check updates
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1, backgroundColor: Colors.white }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md + 4,
            paddingBottom: Spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.back();
            }}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
            }}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            {callState === 'active' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-SemiBold',
                    color: '#10B981',
                  }}
                >
                  Connected
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textPrimary,
                  }}
                >
                  {formatDuration(callDuration)}
                </Text>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#EF4444',
                  }}
                />
              </View>
            )}
            {callState === 'ended' && (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#EF4444',
                }}
              >
                Call ended
              </Text>
            )}
            {callState !== 'active' && callState !== 'ended' && (
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                {callState === 'incoming'
                  ? 'Incoming call'
                  : isCreatingCall
                  ? 'Starting call...'
                  : callSetupError
                  ? 'Call failed'
                  : 'Ringing...'}
              </Text>
            )}
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Caller Info */}
        <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#111827',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.lg,
              borderWidth: 4,
              borderColor: '#3B82F6',
              overflow: 'hidden',
            }}
          >
            {callerImage ? (
              <Image
                source={{ uri: callerImage }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#3B82F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={40} color={Colors.white} />
              </View>
            )}
          </View>

          <Text
            style={{
              fontSize: 24,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: Spacing.xs,
            }}
          >
            {callerName}
          </Text>

          {callState === 'active' && (
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
              }}
            >
              {isProvider ? 'Client' : 'Provider'}
            </Text>
          )}

          {callState === 'outgoing' && (
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: callSetupError ? '#DC2626' : Colors.textSecondaryDark,
                marginTop: Spacing.sm,
              }}
            >
              {callSetupError
                ? callSetupError
                : isCreatingCall
                ? 'Preparing secure call session...'
                : 'Waiting for recipient to answer'}
            </Text>
          )}

          {callState === 'ended' && (
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginTop: Spacing.sm,
              }}
            >
              Call duration: {formatDuration(callDuration)}
            </Text>
          )}
        </View>

        {/* Job Details Card */}
        {(callState === 'incoming' || callState === 'outgoing' || callState === 'active' || callState === 'ended') && (
          <JobDetailsCard />
        )}

        {/* Call Controls */}
        {callState === 'incoming' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: Spacing.xl,
              marginTop: 'auto',
              paddingBottom: Spacing.xxl,
            }}
          >
            <TouchableOpacity
              onPress={handleDeclineCall}
              activeOpacity={0.8}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.md,
              }}
            >
              <PhoneOff size={32} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAcceptCall}
              activeOpacity={0.8}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.md,
              }}
            >
              <Phone size={32} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {callState === 'outgoing' && (
          <View
            style={{
              alignItems: 'center',
              marginTop: 'auto',
              paddingBottom: Spacing.xxl,
              gap: Spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={handleEndCall}
              activeOpacity={0.8}
              disabled={isCreatingCall}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCreatingCall ? 0.6 : 1,
                ...SHADOWS.md,
              }}
            >
              <PhoneOff size={32} color={Colors.white} />
            </TouchableOpacity>

            {!!callSetupError && (
              <TouchableOpacity
                onPress={handleCallAgain}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Retry call
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {callState === 'active' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: Spacing.xl,
              marginTop: 'auto',
              paddingBottom: Spacing.xxl,
            }}
          >
            <TouchableOpacity
              onPress={handleToggleMute}
              activeOpacity={0.8}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: Colors.backgroundGray,
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.sm,
              }}
            >
              {isMuted ? (
                <MicOff size={24} color={Colors.textPrimary} />
              ) : (
                <Mic size={24} color={Colors.textPrimary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEndCall}
              activeOpacity={0.8}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.md,
              }}
            >
              <PhoneOff size={32} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleSpeaker}
              activeOpacity={0.8}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: Colors.backgroundGray,
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.sm,
              }}
            >
              <Volume2 size={24} color={isSpeakerOn ? Colors.accent : Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {callState === 'ended' && (
          <View
            style={{
              alignItems: 'center',
              marginTop: 'auto',
              paddingBottom: Spacing.xxl,
              gap: Spacing.lg,
            }}
          >
            <View style={{ flexDirection: 'row', gap: Spacing.xl }}>
              <TouchableOpacity
                onPress={handleMessage}
                activeOpacity={0.8}
                style={{
                  alignItems: 'center',
                  gap: Spacing.xs,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: Colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...SHADOWS.sm,
                  }}
                >
                  <MessageCircle size={22} color={Colors.textPrimary} />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Message {isProvider ? 'client' : 'provider'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCallAgain}
                activeOpacity={0.8}
                style={{
                  alignItems: 'center',
                  gap: Spacing.xs,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: Colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...SHADOWS.sm,
                  }}
                >
                  <Phone size={24} color={Colors.textPrimary} />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Call again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Call Recording Disclaimer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: Spacing.lg,
            gap: Spacing.xs,
          }}
        >
          <Shield size={14} color={Colors.textSecondaryDark} />
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
            }}
          >
            Calls are recorded for quality and dispute resolution
          </Text>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}
