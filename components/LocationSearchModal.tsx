import AnimatedModal from '@/components/AnimatedModal';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import * as Location from 'expo-location';
import { Search, Send, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected?: (location: string) => void;
}

export default function LocationSearchModal({ visible, onClose, onLocationSelected }: LocationSearchModalProps) {
  const { location, setLocation } = useUserLocation();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (location) {
      setSearchQuery(location);
      setSelectedLocation(location);
    }
  }, [location]);

  useEffect(() => {
    if (visible) {
      setSearchQuery(location || '');
      setSelectedLocation(location || '');
    }
  }, [visible, location]);

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

  const handleSave = async () => {
    if (!searchQuery.trim()) {
      showError('Please enter a location');
      return;
    }

    setIsSaving(true);

    try {
      const locationToSave = searchQuery.trim();
      await setLocation(locationToSave);
      setSelectedLocation(locationToSave);
      
      if (onLocationSelected) {
        onLocationSelected(locationToSave);
      }
      
      showSuccess('Location saved successfully!');
      
      setTimeout(() => {
        onClose();
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      showError('Failed to save location. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <>
      <AnimatedModal visible={visible} onClose={onClose} animationType="slide">
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                flex: 1,
              }}
            >
              Change Address
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 20,
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
                  onSubmitEditing={handleSave}
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
                onPress={handleSave}
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
          <View style={{ marginTop: 16 }}>
            <Button
              title={isSaving ? 'Saving...' : 'Save location'}
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
              loading={isSaving}
              disabled={isSaving || !searchQuery.trim()}
            />
          </View>
        </View>
      </AnimatedModal>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </>
  );
}
