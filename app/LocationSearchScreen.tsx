import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Search, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Button } from '@/components/ui/Button';
import { Colors, BorderRadius } from '@/lib/designSystem';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import * as Location from 'expo-location';
import { locationService, LocationSearchResult, apiClient } from '@/services/api';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';

export default function LocationSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    next?: string;
    serviceType?: string;
    selectedDateTime?: string;
    selectedDate?: string;
    selectedTime?: string;
    photoCount?: string;
    location?: string;
  }>();
  const next = params?.next;
  const { location, setLocation, refreshLocation } = useUserLocation();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    }
  }, [location]);

  // Debounced location search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is too short, clear results
    if (!searchQuery || (typeof searchQuery === 'string' && searchQuery.trim().length < 2)) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Set searching state
    setIsSearching(true);
    setShowResults(true);
    setSearchError(null);

    // Debounce search by 400ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = typeof searchQuery === 'string' ? searchQuery.trim() : '';
        if (!query) {
          setIsSearching(false);
          return;
        }
        
        const results = await locationService.searchLocations(query);
        
        // Check if we got valid results
        if (results && Array.isArray(results) && results.length > 0) {
          setSearchResults(results);
          setSearchError(null);
        } else {
          // Empty results - no locations found for this query
          setSearchResults([]);
          setSearchError(null); // Clear error, just show "no results" message
        }
        setIsSearching(false);
      } catch (error: any) {
        console.error('Error searching locations:', error);
        setSearchResults([]);
        setIsSearching(false);
        
        // Extract error message
        const errorMessage = error.details?.data?.error || error.details?.error || error.message || '';
        const isNetworkError = errorMessage.includes('Network') || 
                              errorMessage.includes('Failed to fetch') ||
                              errorMessage.includes('Network request failed');
        const isGoogleApiKeyError = errorMessage.includes('API key') || 
                                     errorMessage.includes('REQUEST_DENIED') ||
                                     errorMessage.includes('Google Maps');
        
        if (isNetworkError) {
          setSearchError('Unable to connect. Please check your internet connection and try again.');
          if (__DEV__) {
            console.error('Network error during location search:', error);
          }
        } else if (isGoogleApiKeyError) {
          setSearchError('Location search is temporarily unavailable. Please enter your location manually.');
          if (__DEV__) {
            console.warn('⚠️ Backend Google Maps API Key Missing - Location search disabled.');
          }
        } else {
          setSearchError('Unable to search locations. Please try again or enter manually.');
          if (__DEV__) {
            console.error('Location search error:', {
              message: error.message,
              status: error.status,
              details: error.details,
              query: query,
            });
          }
        }
      }
    }, 400);

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleSelectLocation = (result: LocationSearchResult) => {
    haptics.light();
    setSelectedLocation(result);
    setSearchQuery(result.fullAddress);
    setShowResults(false);
  };

  const handleUseCurrentLocation = async () => {
    try {
      haptics.light();
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showError('Location permission is required to use current location.');
        return;
      }

      setIsSearching(true);
      
      // Use highest accuracy for precise location with optimal settings
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, // Most accurate GPS (within 10 meters)
        maximumAge: 3000, // Accept location up to 3 seconds old (fresher data)
        timeout: 20000, // Wait up to 20 seconds for accurate location
        mayShowUserSettingsDialog: true, // Allow user to enable location services if disabled
      });

      const { latitude, longitude } = currentLocation.coords;
      
      // Log coordinates for debugging
      if (__DEV__) {
        console.log('📍 GPS Coordinates:', {
          latitude,
          longitude,
          accuracy: currentLocation.coords.accuracy, // Accuracy in meters
          altitude: currentLocation.coords.altitude,
          heading: currentLocation.coords.heading,
        });
      }
      
      // Use API for reverse geocoding
      try {
        const locationDetails = await locationService.getCurrentLocation(latitude, longitude);
        
        // Log the address received from API
        if (__DEV__) {
          console.log('📍 Reverse Geocoding Result:', {
            formattedAddress: locationDetails.formattedAddress,
            city: locationDetails.city,
            state: locationDetails.state,
            country: locationDetails.country,
            coordinates: { latitude, longitude },
          });
        }
        
        // If we get here, we have a valid address from the API
        // Generate placeId from coordinates if not provided by reverse geocoding
        const placeId = locationDetails.placeId || `lat_${latitude}_${longitude}`;
        
        const result: LocationSearchResult = {
          placeId: placeId,
          placeName: locationDetails.city || locationDetails.formattedAddress || 'Current Location',
          fullAddress: locationDetails.formattedAddress,
          address: locationDetails.city && locationDetails.state 
            ? `${locationDetails.city}, ${locationDetails.state}`
            : locationDetails.formattedAddress,
        };
        
        setSelectedLocation(result);
        setSearchQuery(locationDetails.formattedAddress);
        setShowResults(false);
        
        // Automatically save to backend if user is signed in
        const userId = await apiClient.getUserId();
        if (userId) {
          try {
            // Try to save using placeId first (more accurate)
            if (locationDetails.placeId && !locationDetails.placeId.startsWith('lat_')) {
              await locationService.saveUserLocation(userId, { 
                placeId: locationDetails.placeId 
              });
            } else {
              // If no placeId or it's a generated one, save using coordinates
              await locationService.saveUserLocation(userId, {
                latitude: locationDetails.latitude || latitude,
                longitude: locationDetails.longitude || longitude,
              });
            }
            // Also save locally
            await setLocation(locationDetails.formattedAddress);
            await refreshLocation();
            if (__DEV__) {
              console.log('✅ Current location saved to backend automatically');
            }
          } catch (saveError: any) {
            // Log but don't fail - location is still selected
            if (__DEV__) {
              console.warn('⚠️ Could not save location to backend:', saveError);
              console.warn('⚠️ Error details:', JSON.stringify(saveError, null, 2));
            }
            // Still save locally
            await setLocation(locationDetails.formattedAddress);
            // Show a subtle warning but don't block the user
            if (saveError.message?.includes('not set') || saveError.message?.includes('400')) {
              // This shouldn't happen, but if it does, we'll try again on confirm
              if (__DEV__) {
                console.warn('⚠️ Location save failed - will retry on confirm');
              }
            }
          }
        } else {
          // Save locally even if not signed in
          await setLocation(locationDetails.formattedAddress);
        }
        
        showSuccess('Current location detected and saved!');
      } catch (error: any) {
        console.error('❌ Error getting current location:', error);
        
        // Detailed error logging
        if (__DEV__) {
          console.error('❌ ========== CURRENT LOCATION ERROR ==========');
          console.error('❌ Error Message:', error.message);
          console.error('❌ Error Status:', error.status);
          console.error('❌ Error StatusText:', error.statusText);
          console.error('❌ Error Details:', JSON.stringify(error.details, null, 2));
          console.error('❌ Full Error:', JSON.stringify(error, null, 2));
          console.error('❌ Coordinates:', { latitude, longitude });
          console.error('❌ ===========================================');
        }
        
        // Check error type
        const errorMessage = error.details?.data?.error || error.details?.error || error.message || '';
        const isNetworkError = errorMessage.includes('Network') || 
                              errorMessage.includes('Failed to fetch') ||
                              errorMessage.includes('Network request failed');
        const isGoogleApiKeyError = errorMessage.includes('API key') || 
                                     errorMessage.includes('REQUEST_DENIED') ||
                                     errorMessage.includes('Google Maps');
        
        if (isNetworkError) {
          showError('Unable to connect. Please check your internet connection and try again.');
        } else if (isGoogleApiKeyError) {
          showError('Location service is temporarily unavailable. Please search for your location manually.');
        } else {
          // Show more specific error message if available
          const userMessage = errorMessage && errorMessage.length < 100 
            ? errorMessage 
            : 'Unable to get address for your location. Please search for your location manually.';
          showError(userMessage);
        }
      }
    } catch (error) {
      showError('Failed to get current location. Please enter manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedLocation && (!searchQuery || (typeof searchQuery === 'string' && !searchQuery.trim()))) {
      showError('Please select or enter a location');
      return;
    }

    setIsSaving(true);
    haptics.light();

    try {
      const userId = await apiClient.getUserId();
      
      if (!userId) {
        // If no user ID, just save locally
        if (searchQuery && typeof searchQuery === 'string') {
          await setLocation(searchQuery.trim());
        }
        showSuccess('Location saved successfully!');
        setTimeout(() => {
          handleNavigation();
        }, 1000);
        return;
      }

      // If we have a selected location with placeId, use it
      if (selectedLocation?.placeId) {
        try {
          // Check if placeId is generated (starts with "lat_") - if so, use coordinates
          if (selectedLocation.placeId.startsWith('lat_')) {
            // Extract coordinates from generated placeId
            const coordMatch = selectedLocation.placeId.match(/lat_([\d.-]+)_([\d.-]+)/);
            if (coordMatch && coordMatch[1] && coordMatch[2]) {
              const lat = parseFloat(coordMatch[1]);
              const lng = parseFloat(coordMatch[2]);
              // Save using coordinates
              await locationService.saveUserLocation(userId, {
                latitude: lat,
                longitude: lng,
              });
            } else {
              // Fallback: try to get location details again
              throw new Error('Invalid generated placeId format');
            }
          } else {
            // Real placeId from API - use it
            await locationService.saveUserLocation(userId, {
              placeId: selectedLocation.placeId,
            });
          }
          
          // Also save locally for offline access
          await setLocation(selectedLocation.fullAddress);
          
          // Refresh location in hook
          await refreshLocation();
          
          showSuccess('Location saved successfully!');
          haptics.success();
          
          setTimeout(() => {
            handleNavigation();
          }, 1000);
        } catch (error: any) {
          console.error('Error saving location via API:', error);
          // Fallback to local storage
          await setLocation(selectedLocation.fullAddress);
          showSuccess('Location saved locally!');
          setTimeout(() => {
            handleNavigation();
          }, 1000);
        }
      } else {
        // If no placeId, try to get location details from search query
        // For now, just save locally
        await setLocation(searchQuery.trim());
        showSuccess('Location saved successfully!');
        setTimeout(() => {
          handleNavigation();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      const errorMessage = getSpecificErrorMessage(error, 'save_location');
      showError(errorMessage);
      haptics.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigation = () => {
    if (next === 'ProfileSetupScreen') {
      router.replace('/ProfileSetupScreen');
    } else if (next === 'ServiceMapScreen') {
      // Navigate back to ServiceMapScreen with all booking params preserved
      router.replace({
        pathname: '/ServiceMapScreen' as any,
        params: {
          serviceType: params.serviceType,
          selectedDateTime: params.selectedDateTime,
          selectedDate: params.selectedDate,
          selectedTime: params.selectedTime,
          photoCount: params.photoCount,
          location: (searchQuery && typeof searchQuery === 'string') ? searchQuery.trim() : '', // Updated location
        },
      } as any);
    } else {
      router.back();
    }
  };

  const renderSearchResult = ({ item }: { item: LocationSearchResult }) => (
    <TouchableOpacity
      onPress={() => handleSelectLocation(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MapPin size={20} color={Colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'Poppins-SemiBold',
            color: Colors.textPrimary,
            marginBottom: 4,
          }}
        >
          {item.placeName}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Poppins-Regular',
            color: Colors.textSecondaryDark,
          }}
        >
          {item.fullAddress}
        </Text>
      </View>
    </TouchableOpacity>
  );

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

        <View style={{ flex: 1 }}>
          {/* Search Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
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
                borderColor: showResults ? Colors.accent : Colors.border,
              }}
            >
              <TextInput
                placeholder="Search for a location..."
                placeholderTextColor={Colors.textSecondaryDark}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleConfirm}
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textPrimary,
                }}
                autoFocus
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
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Search size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Use Current Location */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={isSearching}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 16,
              opacity: isSearching ? 0.5 : 1,
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
              {isSearching ? 'Getting location...' : 'Use my current location'}
            </Text>
          </TouchableOpacity>

          {/* Search Results */}
          {showResults && searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length >= 2 && (
            <View
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                borderTopWidth: 1,
                borderTopColor: Colors.border,
              }}
            >
              {isSearching && searchResults.length === 0 && !searchError ? (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    Searching...
                  </Text>
                </View>
              ) : searchError ? (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: '#DC2626',
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {searchError}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      textAlign: 'center',
                    }}
                  >
                    You can still type and save your location manually.
                  </Text>
                </View>
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.placeId}
                  style={{ flex: 1 }}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    No locations found. Try a different search.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Selected Location Display */}
          {selectedLocation && !showResults && (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 100,
              }}
            >
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
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {selectedLocation.placeName}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    lineHeight: 20,
                  }}
                >
                  {selectedLocation.fullAddress}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Save Button */}
        <View
          style={{
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
            disabled={isSaving || (!selectedLocation && (!searchQuery || (typeof searchQuery === 'string' && !searchQuery.trim())))}
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
