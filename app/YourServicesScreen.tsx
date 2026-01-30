import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, SHADOWS, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { providerService, serviceRequestService, ServiceCategory } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { ActivityIndicator } from 'react-native';

interface ProviderService {
  id: number;
  name: string;
  status: 'active' | 'pending';
}

export default function YourServicesScreen() {
  const router = useRouter();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [yourServices, setYourServices] = useState<ProviderService[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      // Load provider's current services
      const provider = await providerService.getProvider();
      if (provider?.categories && Array.isArray(provider.categories)) {
        // Provider categories are strings (e.g., ["plumbing", "electrical"])
        const services: ProviderService[] = provider.categories.map((cat, index) => ({
          id: index + 1,
          name: typeof cat === 'string' ? cat : String(cat),
          status: 'active' as const, // Default to active, update when API provides status
        }));
        setYourServices(services);
        setSelectedServices(services.map(s => s.name));
      }

      // Load all available services
      const categories = await serviceRequestService.getCategories();
      setAvailableServices(categories || []);
    } catch (error) {
      console.error('Error loading services:', error);
      showError('Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveService = (serviceName: string) => {
    haptics.light();
    setYourServices(yourServices.filter(s => s.name !== serviceName));
    setSelectedServices(selectedServices.filter(s => s !== serviceName));
  };

  const handleToggleAvailableService = (serviceName: string) => {
    haptics.light();
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceName));
      setYourServices(yourServices.filter(s => s.name !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
      // Check if service already exists in yourServices
      if (!yourServices.some(s => s.name === serviceName)) {
        setYourServices([...yourServices, {
          id: yourServices.length + 1,
          name: serviceName,
          status: 'active',
        }]);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (selectedServices.length === 0) {
      showError('Please select at least one service');
      return;
    }

    setIsSaving(true);
    haptics.light();

    try {
      await providerService.addCategories(selectedServices);
      haptics.success();
      showSuccess('Services updated successfully!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving services:', error);
      haptics.error();
      
      // Handle duplicate categories error more gracefully
      const errorMessage = error?.message || '';
      if (errorMessage.includes('already has the following categories')) {
        // Extract the categories from the error message
        const match = errorMessage.match(/categories: ([^.]+)/);
        if (match) {
          const existingCategories = match[1].split(',').map((c: string) => c.trim());
          showError(`You already have these services: ${existingCategories.join(', ')}. Please select different services or remove existing ones first.`);
        } else {
          showError('Some of these services are already added. Please select different services.');
        }
      } else {
        showError('Failed to save services. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md + 4,
            paddingBottom: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            backgroundColor: Colors.white,
            ...SHADOWS.small,
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
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
              }}
            >
              Your Services
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 100,
            }}
          >
            {/* Your Services Section */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Your Services
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {yourServices.map((service, index) => (
                  <View
                    key={`${service.id}-${service.name}-${index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: service.status === 'active' ? Colors.accent : Colors.backgroundGray,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: service.status === 'active' ? Colors.textPrimary : Colors.textSecondaryDark,
                      }}
                    >
                      {service.name}
                    </Text>
                    {service.status === 'pending' && (
                      <View
                        style={{
                          backgroundColor: '#F97316',
                          borderRadius: 12,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: 'Poppins-SemiBold',
                            color: Colors.white,
                          }}
                        >
                          Pending
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => handleRemoveService(service.name)}
                      activeOpacity={0.7}
                    >
                      <X size={14} color={service.status === 'active' ? Colors.textPrimary : Colors.textSecondaryDark} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Add Custom Service - Moved up to be visible without scrolling */}
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/AddCustomServiceScreen' as any);
              }}
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                borderWidth: 2,
                borderColor: Colors.border,
                borderStyle: 'dashed',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 32,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Plus size={20} color={Colors.textSecondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Add Service
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Create a niche service not listed here
                </Text>
              </View>
              <ArrowRight size={20} color={Colors.textSecondaryDark} />
            </TouchableOpacity>

            {/* Available Services Section */}
            <View style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Available Services
              </Text>
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.xl,
                  padding: 16,
                  gap: 12,
                }}
              >
                {availableServices.map((service, index) => {
                  // Use 'name' field for matching (this is what provider categories use)
                  const serviceName = service.name || '';
                  const displayName = service.displayName || serviceName;
                  const isSelected = selectedServices.includes(serviceName);
                  return (
                    <TouchableOpacity
                      key={`${service.id || serviceName}-${index}`}
                      onPress={() => handleToggleAvailableService(serviceName)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        backgroundColor: Colors.white,
                        borderRadius: BorderRadius.default,
                        borderWidth: 1,
                        borderColor: Colors.border,
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isSelected ? Colors.accent : Colors.border,
                          backgroundColor: isSelected ? Colors.accent : Colors.white,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {isSelected && <Check size={12} color={Colors.white} />}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                          flex: 1,
                        }}
                      >
                        {displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Fixed Bottom Button */}
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
          <TouchableOpacity
            onPress={handleSaveChanges}
            disabled={isSaving}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.default,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}
