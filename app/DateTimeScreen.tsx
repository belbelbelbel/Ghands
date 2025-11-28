import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

export default function DateTimeScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

    const formattedDateTime = useMemo(() => {
    if (!selectedDate || !selectedTime) return '';
    
    const month = MONTHS[selectedDate.getMonth()];
    const day = selectedDate.getDate();
    const year = selectedDate.getFullYear();
    
    // Format time (e.g., "09:00" -> "9am" or "01:00" -> "1pm")
    const [hours, minutes] = selectedTime.split(':');
    const hourNum = parseInt(hours, 10);
    
    // Determine if it's AM or PM based on the hour
    // AM_HOURS: ['09:00', '10:00', '11:00', '12:00'] -> 9am, 10am, 11am, 12pm
    // PM_HOURS: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'] -> 1pm-8pm
    const isAM = AM_HOURS.includes(selectedTime);
    const isPM = PM_HOURS.includes(selectedTime);
    
    let displayHour: number;
    let period: string;
    
    if (isAM) {
      // AM hours: 09:00=9am, 10:00=10am, 11:00=11am, 12:00=12pm
      if (hourNum === 12) {
        displayHour = 12;
        period = 'pm';
      } else {
        displayHour = hourNum;
        period = 'am';
      }
    } else if (isPM) {
      // PM hours: 01:00=1pm, 02:00=2pm, etc.
      displayHour = hourNum;
      period = 'pm';
    } else {
      // Fallback for any other time format
      const isAMHour = hourNum < 12;
      displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      period = isAMHour ? 'am' : 'pm';
    }
    
    return `${month} ${day}, ${year} ${displayHour}${period}`;
  }, [selectedDate, selectedTime]);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleNext = useCallback(() => {
    if (!selectedDate || !selectedTime) {
      return;
    }
    // Show confirmation modal
    setShowConfirmModal(true);
  }, [selectedDate, selectedTime]);

  const handleConfirmAndProceed = useCallback(() => {
    setShowConfirmModal(false);
    
    // Pass formatted date/time as route params
    router.push({
      pathname: '../AddPhotosScreen' as any,
      params: {
        selectedDateTime: formattedDateTime,
        selectedDate: selectedDate?.toISOString(),
        selectedTime: selectedTime || '',
      },
    });
  }, [selectedDate, selectedTime, formattedDateTime, router]);

  const handleChangeDateTime = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleDateSelect = useCallback((day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  }, [currentDate]);

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get last day of previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];

    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
    }

    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }

    // Add days from next month to fill the last week (if needed)
    const remainingCells = 42 - days.length; // 6 rows × 7 days = 42
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ day, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  const monthYear = useMemo(() => {
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  const isDateSelected = useCallback(
    (day: number) => {
      if (!selectedDate) return false;
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear()
      );
    },
    [selectedDate, currentDate]
  );

  const isToday = useCallback(
    (day: number) => {
      const today = new Date();
      return (
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    },
    [currentDate]
  );

  const canProceed = selectedDate !== null && selectedTime !== null;



  const animatedStyles = useMemo(
    () => ({
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }),
    [fadeAnim, slideAnim]
  );

  return (
    <SafeAreaWrapper>
      <Animated.View style={[animatedStyles, { flex: 1 }]}>
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={handleBack}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
              Date & Time
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="mb-6">
            <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Select Date
            </Text>
            <View className="rounded-2xl bg-white border border-gray-200 p-4 shadow-[0_6px_18px_rgba(16,24,40,0.05)]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {monthYear}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={handlePreviousMonth}
                    className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={16} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNextMonth}
                    className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={16} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row mb-2">
                {DAYS.map((day) => (
                  <View key={day} className="flex-1 items-center py-2">
                    <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row flex-wrap">
                {calendarDays.map((item, index) => {
                  const { day, isCurrentMonth } = item;
                  const selected = isCurrentMonth && isDateSelected(day);
                  const today = isCurrentMonth && isToday(day);

                  return (
                    <TouchableOpacity
                      key={`day-${day}-${index}`}
                      onPress={() => {
                        if (isCurrentMonth) {
                          handleDateSelect(day);
                        }
                      }}
                      activeOpacity={isCurrentMonth ? 0.7 : 1}
                      disabled={!isCurrentMonth}
                      className="w-[14.28%] aspect-square p-1"
                    >
                      <View
                        className={`flex-1 items-center justify-center rounded-full ${
                          selected
                            ? 'bg-[#6A9B00]'
                            : today
                              ? 'bg-gray-100 border border-gray-300'
                              : 'bg-transparent'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            selected
                              ? 'text-white'
                              : isCurrentMonth
                                ? today
                                  ? 'text-black'
                                  : 'text-gray-700'
                                : 'text-gray-300'
                          }`}
                          style={{
                            fontFamily: selected ? 'Poppins-SemiBold' : 'Poppins-Medium',
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Select Hours
            </Text>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
                AM
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {AM_HOURS.map((hour) => {
                  const isSelected = selectedTime === hour;
                  return (
                    <TouchableOpacity
                      key={`am-${hour}`}
                      onPress={() => handleTimeSelect(hour)}
                      activeOpacity={0.7}
                      className={`rounded-xl px-4 py-3 border ${
                        isSelected
                          ? 'bg-[#6A9B00] border-[#6A9B00]'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${isSelected ? 'text-white' : 'text-[#6A9B00]'}`}
                        style={{ fontFamily: 'Poppins-SemiBold' }}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
                PM
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PM_HOURS.map((hour) => {
                  const isSelected = selectedTime === hour;
                  return (
                    <TouchableOpacity
                      key={`pm-${hour}`}
                      onPress={() => handleTimeSelect(hour)}
                      activeOpacity={0.7}
                      className={`rounded-xl px-4 py-3 border ${
                        isSelected
                          ? 'bg-[#6A9B00] border-[#6A9B00]'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${isSelected ? 'text-white' : 'text-[#6A9B00]'}`}
                        style={{ fontFamily: 'Poppins-SemiBold' }}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-5 gap-3">
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={canProceed ? 0.85 : 1}
            className={`rounded-xl py-4 items-center justify-center flex-row ${
              canProceed ? 'bg-black' : 'bg-gray-200'
            }`}
            style={{
              opacity: canProceed ? 1 : 0.6,
            }}
          >
            <Text
              className={`text-base mr-2 ${canProceed ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Next
            </Text>
            <ArrowRight size={18} color={canProceed ? '#FFFFFF' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            className="rounded-xl py-4 items-center justify-center bg-white border border-gray-200"
          >
            <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Cancel request
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Confirmation Modal */}
      <Modal
        transparent
        visible={showConfirmModal}
        animationType="fade"
        onRequestClose={handleChangeDateTime}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <Animated.View
            style={[animatedStyles]}
            className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-[0px_24px_48px_rgba(15,23,42,0.2)]"
          >
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-[#E3F4DF] items-center justify-center mb-4">
                <Text className="text-3xl">📅</Text>
              </View>
              <Text className="text-lg text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                Confirm Date & Time
              </Text>
              <Text className="text-base text-gray-600 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
                {formattedDateTime}
              </Text>
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleConfirmAndProceed}
                activeOpacity={0.85}
                className="bg-black rounded-xl py-4 items-center justify-center"
              >
                <View className="flex-row items-center">
                  <Text className="text-base text-white mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                    Next
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangeDateTime}
                activeOpacity={0.85}
                className="bg-white border border-gray-200 rounded-xl py-4 items-center justify-center"
              >
                <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

