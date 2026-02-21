import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { providerService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AM_HOURS = ['09:00', '10:00', '11:00', '12:00'];
const PM_HOURS = ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'];

export default function RequestVisitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    jobTitle?: string;
  }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [logisticsCost, setLogisticsCost] = useState<string>('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number | null) => {
    if (day === null) return;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const formattedDateTime = useMemo(() => {
    if (!selectedDate || !selectedTime) return '';
    
    const month = MONTHS[selectedDate.getMonth()];
    const day = selectedDate.getDate();
    const year = selectedDate.getFullYear();
    
    const [hours, minutes] = selectedTime.split(':');
    const hourNum = parseInt(hours, 10);
    const isAM = AM_HOURS.includes(selectedTime);
    const isPM = PM_HOURS.includes(selectedTime);
    
    let displayHour: number;
    let period: string;
    
    if (isAM) {
      if (hourNum === 12) {
        displayHour = 12;
        period = 'pm';
      } else {
        displayHour = hourNum;
        period = 'am';
      }
    } else if (isPM) {
      displayHour = hourNum;
      period = 'pm';
    } else {
      const isAMHour = hourNum < 12;
      displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      period = isAMHour ? 'am' : 'pm';
    }
    
    return `${month} ${day}, ${year} ${displayHour}${period}`;
  }, [selectedDate, selectedTime]);

  const formattedDateForSummary = useMemo(() => {
    if (!selectedDate) return '';
    const month = MONTHS[selectedDate.getMonth()];
    const day = selectedDate.getDate();
    const year = selectedDate.getFullYear();
    return `${day}, ${month}, ${year}`;
  }, [selectedDate]);

  const formattedTimeForSummary = useMemo(() => {
    if (!selectedTime) return '';
    const [hours, minutes] = selectedTime.split(':');
    const hourNum = parseInt(hours, 10);
    const isAM = AM_HOURS.includes(selectedTime);
    const isPM = PM_HOURS.includes(selectedTime);
    
    let displayHour: number;
    let period: string;
    
    if (isAM) {
      if (hourNum === 12) {
        displayHour = 12;
        period = 'PM';
      } else {
        displayHour = hourNum;
        period = 'AM';
      }
    } else if (isPM) {
      displayHour = hourNum;
      period = 'PM';
    } else {
      const isAMHour = hourNum < 12;
      displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      period = isAMHour ? 'AM' : 'PM';
    }
    
    return `${displayHour}:${minutes} ${period}`;
  }, [selectedTime]);

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      showError('Please select both date and time');
      return;
    }
    if (!logisticsCost || parseFloat(logisticsCost) <= 0) {
      showError('Please enter a valid logistics cost');
      return;
    }
    setShowSummaryModal(true);
  };

  const handleConfirmAppointment = async () => {
    if (!params.requestId || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const timeFormatted = formattedTimeForSummary || `${selectedTime} AM`;

      await providerService.requestVisit(Number(params.requestId), {
        scheduledDate: formattedDate,
        scheduledTime: timeFormatted,
        logisticsCost: parseFloat(logisticsCost) || 0,
      });

      haptics.success();
      showSuccess('Visit request submitted successfully!');
      setShowSummaryModal(false);

      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'request_visit');
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const animatedStyles = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }), [fadeAnim, slideAnim]);

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md,
            paddingBottom: Spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.backgroundGray,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: Spacing.md,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
            }}
          >
            Request visit
          </Text>
        </View>

        <Animated.View style={[{ flex: 1 }, animatedStyles]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              paddingBottom: 100,
            }}
          >
            {/* Logistics Cost */}
            <View style={{ marginBottom: Spacing.xl }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: Spacing.sm,
                }}
              >
                Logistics Cost:
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: Spacing.md,
                  backgroundColor: Colors.white,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textPrimary,
                    marginRight: Spacing.xs,
                  }}
                >
                  ₦
                </Text>
                <TextInput
                  value={logisticsCost}
                  onChangeText={setLogisticsCost}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textPrimary,
                    paddingVertical: Spacing.md,
                  }}
                  placeholder="0"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            {/* Select Date */}
            <View style={{ marginBottom: Spacing.xl }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: Spacing.md,
                }}
              >
                Select Date
              </Text>
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                {/* Month Navigation */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: Spacing.md,
                  }}
                >
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={{
                      padding: Spacing.xs,
                    }}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={20} color={Colors.textSecondaryDark} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </Text>
                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={{
                      padding: Spacing.xs,
                    }}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={20} color={selectedDate ? Colors.accent : Colors.textSecondaryDark} />
                  </TouchableOpacity>
                </View>

                {/* Days of Week */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    marginBottom: Spacing.sm,
                  }}
                >
                  {DAYS.map((day) => (
                    <Text
                      key={day}
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Medium',
                        color: Colors.textSecondaryDark,
                        width: 40,
                        textAlign: 'center',
                      }}
                    >
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                  }}
                >
                  {days.map((day, index) => {
                    if (day === null) {
                      return <View key={`empty-${index}`} style={{ width: 40, height: 40 }} />;
                    }

                    const isSelected =
                      selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear();

                    const isCurrentMonth = true; // All days shown are in current month

                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => handleDateSelect(day)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: isSelected ? Colors.accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: 2,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: isSelected ? 'Poppins-SemiBold' : 'Poppins-Regular',
                            color: isSelected
                              ? Colors.white
                              : isCurrentMonth
                              ? Colors.textPrimary
                              : Colors.textTertiary,
                          }}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Select Hours */}
            <View style={{ marginBottom: Spacing.xl }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: Spacing.md,
                }}
              >
                Select Hours
              </Text>

              {/* AM Hours */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: Spacing.sm,
                  }}
                >
                  AM
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: Spacing.sm,
                  }}
                >
                  {AM_HOURS.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        style={{
                          paddingVertical: Spacing.sm,
                          paddingHorizontal: Spacing.md,
                          borderRadius: BorderRadius.default,
                          backgroundColor: isSelected ? Colors.accent : Colors.backgroundGray,
                          borderWidth: 1,
                          borderColor: isSelected ? Colors.accent : Colors.border,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Poppins-SemiBold',
                            color: isSelected ? Colors.white : Colors.accent,
                          }}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* PM Hours */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: Spacing.sm,
                  }}
                >
                  PM
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: Spacing.sm,
                  }}
                >
                  {PM_HOURS.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        style={{
                          paddingVertical: Spacing.sm,
                          paddingHorizontal: Spacing.md,
                          borderRadius: BorderRadius.default,
                          backgroundColor: isSelected ? Colors.accent : Colors.backgroundGray,
                          borderWidth: 1,
                          borderColor: isSelected ? Colors.accent : Colors.border,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Poppins-SemiBold',
                            color: isSelected ? Colors.white : Colors.accent,
                          }}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                backgroundColor: Colors.accent,
                paddingVertical: Spacing.md,
                borderRadius: BorderRadius.default,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: Spacing.lg,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                }}
              >
                Submit Request
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmitting && setShowSummaryModal(false)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => !isSubmitting && setShowSummaryModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderTopLeftRadius: BorderRadius.xl,
                  borderTopRightRadius: BorderRadius.xl,
                  padding: Spacing.lg,
                  paddingBottom: 40,
                }}
              >
                {/* Handle */}
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: Colors.border,
                    borderRadius: 2,
                    alignSelf: 'center',
                    marginBottom: Spacing.lg,
                  }}
                />

                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: Spacing.xl,
                    textAlign: 'center',
                  }}
                >
                  Confirm Appointment
                </Text>

                {/* Date Selected */}
                <View style={{ marginBottom: Spacing.lg }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: Spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      Date Selected
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowSummaryModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.accent,
                        }}
                      >
                        Change
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {formattedDateForSummary}
                  </Text>
                </View>

                {/* Time Selected */}
                <View style={{ marginBottom: Spacing.xl }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: Spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      Time Selected
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowSummaryModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.accent,
                        }}
                      >
                        Change
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {formattedTimeForSummary}
                  </Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  onPress={handleConfirmAppointment}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: Colors.black,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.default,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                      }}
                    >
                      Okay
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}
