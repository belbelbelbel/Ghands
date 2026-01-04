import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Button } from '@/components/ui/Button';
import { Colors, BorderRadius } from '@/lib/designSystem';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import * as Location from 'expo-location';

export default function LocationSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const next = params?.next;
  const { location, setLocation } = useUserLocation();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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
  }, []);

  useEffect(() => {
    if (location) {
      setSearchQuery(location);
      setSelectedLocation(location);
    }
  }, [location]);

  const handleBack = () => {
    router.back();
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showError('Location permission is required to use current location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      const locationText = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      
      setSearchQuery(locationText);
      setSelectedLocation(locationText);
      showSuccess('Current location detected!');
    } catch (error) {
      showError('Failed to get current location. Please enter manually.');
    }
  };

  const handleConfirm = async () => {
    if (!searchQuery.trim()) {
      showError('Please enter a location');
      return;
    }

    setIsSaving(true);

    try {
      await setLocation(searchQuery.trim());
      showSuccess('Location saved successfully!');

      setTimeout(() => {
        if (next === 'ProfileSetupScreen') {
          router.replace('/ProfileSetupScreen');
        } else {
          router.back();
        }
      }, 1000);
    } catch (error) {
      showError('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          flex: 1,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
        >
          {/* Search Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <TextInput
                placeholder="Lagos, 100001"
                placeholderTextColor={Colors.textSecondaryDark}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleConfirm}
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textPrimary,
                }}
              />
            </View>
            <TouchableOpacity
              style={{
                width: 48,
                height: 48,
                backgroundColor: Colors.black,
                borderRadius: BorderRadius.default,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
              onPress={handleConfirm}
            >
              <Search size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Use Current Location */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
            activeOpacity={0.7}
          >
            <Send size={20} color={Colors.accent} style={{ marginRight: 12 }} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.accent,
              }}
            >
              Use my current location
            </Text>
          </TouchableOpacity>

          {/* Selected Location Display */}
          {selectedLocation && (
            <View
              style={{
                backgroundColor: '#FFF9E6',
                borderRadius: BorderRadius.xl,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textPrimary,
                  lineHeight: 20,
                }}
              >
                {selectedLocation}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 32,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          }}
        >
          <Button
            title={isSaving ? 'Saving...' : 'Save location'}
            onPress={handleConfirm}
            variant="primary"
            size="large"
            fullWidth
            loading={isSaving}
            disabled={isSaving || !searchQuery.trim()}
          />
        </View>
      </Animated.View>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}
