import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { providerService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
}

const MATERIAL_OPTIONS = ['Pipe Connector', "Plumber's Tape", 'Pipe Fitting', 'Sealant', 'Other'];
const PLATFORM_FEE_PERCENTAGE = 5;

export default function SendQuotationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string; jobTitle?: string; returnToTab?: string }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [jobTitle, setJobTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!params.requestId) {
      showError('Request ID is missing. Please navigate from a job details screen.');
    }
    
    // Load job title if not provided in params
    if (params.jobTitle) {
      setJobTitle(params.jobTitle);
    } else if (params.requestId) {
      // Optionally load job title from API for context
      // This is optional - we can skip if it adds unnecessary API call
    }
  }, [params.requestId, params.jobTitle, showError]);

  const [laborCost, setLaborCost] = useState('10');
  const [logisticsCost, setLogisticsCost] = useState('10');
  const [findings, setFindings] = useState('');
  const [total, setTotal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: '1', name: 'Pipe Connector', quantity: 1, price: '100000' },
    { id: '2', name: "Plumber's Tape", quantity: 3, price: '100000' },
  ]);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState<number | null>(null);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const calculateTotals = () => {
    const labor = parseFloat(laborCost.replace(/,/g, '')) || 0;
    const logistics = parseFloat(logisticsCost.replace(/,/g, '')) || 0;
    const materialTotal = materials.reduce((sum, mat) => {
      const price = parseFloat(mat.price.replace(/,/g, '')) || 0;
      return sum + price * mat.quantity;
    }, 0);
    const subtotal = labor + logistics + materialTotal;
    const platformFee = subtotal * (PLATFORM_FEE_PERCENTAGE / 100);
    const tax = 10; // Fixed tax of ₦10
    const calculatedTotal = subtotal + platformFee + tax;
    
    return { labor, logistics, materialTotal, subtotal, platformFee, tax, total: calculatedTotal };
  };

  const totals = useMemo(() => calculateTotals(), [laborCost, logisticsCost, materials]);
  
  // Auto-update total when other fields change (if total is empty or matches calculated value)
  useEffect(() => {
    const calculatedTotalStr = totals.total.toString();
    const formattedCalculated = formatInput(calculatedTotalStr);
    const currentTotalFormatted = formatInput(total);
    
    // Only auto-update if total is empty or matches the calculated value
    if (!total || currentTotalFormatted === formattedCalculated) {
      setTotal(calculatedTotalStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.total]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatInput = (value: string) => {
    const numericValue = value.replace(/,/g, '');
    if (numericValue === '') return '';
    const num = parseFloat(numericValue);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-NG');
  };

  const handleAddMaterial = () => {
    const newId = (materials.length + 1).toString();
    setMaterials([...materials, { id: newId, name: MATERIAL_OPTIONS[0], quantity: 1, price: '0' }]);
  };

  const handleRemoveMaterial = (id: string) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((mat) => mat.id !== id));
    }
  };

  const handleUpdateMaterial = (id: string, field: keyof MaterialItem, value: string | number) => {
    setMaterials(materials.map((mat) => (mat.id === id ? { ...mat, [field]: value } : mat)));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setMaterials(materials.map((mat) => {
      if (mat.id === id) {
        const newQuantity = Math.max(1, mat.quantity + delta);
        return { ...mat, quantity: newQuantity };
      }
      return mat;
    }));
  };

  const handleSelectMaterial = (materialId: string, materialName: string) => {
    handleUpdateMaterial(materialId, 'name', materialName);
    setShowMaterialDropdown(false);
    setSelectedMaterialIndex(null);
  };

  const handleSubmit = async () => {
    if (!params.requestId) {
      showError('Request ID is missing. Please try again.');
      return;
    }

    const labor = parseFloat(laborCost.replace(/,/g, '')) || 0;
    const logistics = parseFloat(logisticsCost.replace(/,/g, '')) || 0;

    if (labor <= 0) {
      showError('Labor cost must be greater than 0');
      return;
    }

    if (logistics <= 0) {
      showError('Logistics cost must be greater than 0');
      return;
    }

    if (!findings || findings.trim().length < 10) {
      showError('Findings & Work required must be at least 10 characters');
      return;
    }

    const totalValue = parseFloat(total.replace(/,/g, '')) || totals.total;
    if (totalValue <= 0) {
      showError('Total must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    haptics.light();

    try {
      const requestId = parseInt(params.requestId, 10);
      if (isNaN(requestId)) {
        throw new Error('Invalid request ID');
      }

      const materialsPayload = materials
        .filter((mat) => {
          const price = parseFloat(mat.price.replace(/,/g, '')) || 0;
          return mat.name && price > 0;
        })
        .map((mat) => ({
          name: mat.name,
          quantity: mat.quantity,
          unitPrice: parseFloat(mat.price.replace(/,/g, '')) || 0,
        }));

      const subtotal = labor + logistics + materialsPayload.reduce((sum, mat) => sum + (mat.unitPrice * mat.quantity), 0);
      const serviceCharge = Math.round(subtotal * (PLATFORM_FEE_PERCENTAGE / 100));

      const payload = {
        laborCost: labor,
        logisticsCost: logistics,
        materials: materialsPayload.length > 0 ? materialsPayload : undefined,
        findingsAndWorkRequired: findings.trim(),
        serviceCharge: serviceCharge,
        tax: 10, // Fixed tax of ₦10
      };

      await providerService.sendQuotation(requestId, payload);

      haptics.success();
      showSuccess('Quotation sent successfully! Waiting for client response.');
      
      // Navigate back and optionally switch to Quotations tab
      setTimeout(() => {
        if (params.returnToTab === 'Quotations') {
          // Navigate back and the parent screen should handle tab switching
          router.back();
        } else {
          router.back();
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error sending quotation:', error);
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'send_quotation') || 'Failed to send quotation. Please try again.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = laborCost && logisticsCost && findings && findings.trim().length >= 10 && total && !isSubmitting;

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: Colors.white,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
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
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
              }}
            >
              Send Quotation
            </Text>
            {jobTitle && (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {jobTitle}
              </Text>
            )}
          </View>
        </View>

        {/* Content with Green Side Bars */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {/* Left Green Bar */}
            <View style={{ width: 4, backgroundColor: Colors.accent }} />
            
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 24,
                paddingBottom: 100,
              }}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Labor Cost */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Labor Cost:
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      marginRight: 4,
                    }}
                  >
                    ₦
                  </Text>
                  <TextInput
                    placeholder="10"
                    value={formatInput(laborCost)}
                    onChangeText={(text) => setLaborCost(text.replace(/,/g, ''))}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                    }}
                    placeholderTextColor={Colors.textSecondaryDark}
                  />
                </View>
              </View>

              {/* Logistics Cost */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Logistics Cost:
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      marginRight: 4,
                    }}
                  >
                    ₦
                  </Text>
                  <TextInput
                    placeholder="10"
                    value={formatInput(logisticsCost)}
                    onChangeText={(text) => setLogisticsCost(text.replace(/,/g, ''))}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                    }}
                    placeholderTextColor={Colors.textSecondaryDark}
                  />
                </View>
              </View>

              {/* Material List */}
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    Material List
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.error,
                      marginLeft: 8,
                    }}
                  >
                    Optional
                  </Text>
                </View>

                {materials.map((material, index) => (
                  <View
                    key={material.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    {/* Material Dropdown */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMaterialIndex(index);
                        setShowMaterialDropdown(true);
                      }}
                      style={{
                        flex: 2,
                        backgroundColor: Colors.white,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        paddingHorizontal: 12,
                        height: 48,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                      >
                        {material.name}
                      </Text>
                      <ChevronDown size={16} color={Colors.textSecondaryDark} />
                    </TouchableOpacity>

                    {/* Quantity Selector */}
                    <View
                      style={{
                        width: 60,
                        backgroundColor: Colors.white,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        height: 48,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 8,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(material.id, -1)}
                        activeOpacity={0.7}
                        style={{ padding: 4 }}
                      >
                        <ChevronDown size={14} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.textPrimary,
                        }}
                      >
                        {material.quantity}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(material.id, 1)}
                        activeOpacity={0.7}
                        style={{ padding: 4 }}
                      >
                        <ChevronUp size={14} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    {/* Price Input */}
                    <View
                      style={{
                        flex: 1.5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: Colors.white,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        paddingHorizontal: 12,
                        height: 48,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                          marginRight: 4,
                        }}
                      >
                        ₦
                      </Text>
                      <TextInput
                        value={formatInput(material.price)}
                        onChangeText={(text) =>
                          handleUpdateMaterial(material.id, 'price', text.replace(/,/g, ''))
                        }
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                        placeholder="100,000"
                        placeholderTextColor={Colors.textSecondaryDark}
                      />
                    </View>

                    {/* Remove Button */}
                    {materials.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMaterial(material.id)}
                        style={{
                          width: 48,
                          height: 48,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                      >
                        <Minus size={20} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* Add Item Button */}
                <TouchableOpacity
                  onPress={handleAddMaterial}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    marginTop: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={Colors.accent} style={{ marginRight: 6 }} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.accent,
                    }}
                  >
                    Add Item
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Findings & Work Required */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Findings & Work required <Text style={{ color: Colors.error }}>*</Text>
                </Text>
                <View
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    minHeight: 120,
                  }}
                >
                  <TextInput
                    placeholder="Message"
                    value={findings}
                    onChangeText={setFindings}
                    multiline
                    textAlignVertical="top"
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      minHeight: 100,
                    }}
                    placeholderTextColor={Colors.textSecondaryDark}
                  />
                </View>
              </View>

              {/* Total Field */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Total <Text style={{ color: Colors.error }}>*</Text>
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      marginRight: 4,
                    }}
                  >
                    ₦
                  </Text>
                  <TextInput
                    placeholder="10"
                    value={formatInput(total)}
                    onChangeText={(text) => setTotal(text.replace(/,/g, ''))}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                    }}
                    placeholderTextColor={Colors.textSecondaryDark}
                  />
                </View>
              </View>

              {/* Quotation Summary */}
              <View
                style={{
                  borderRadius: BorderRadius.xl,
                  overflow: 'hidden',
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                {/* Green Header */}
                <View
                  style={{
                    backgroundColor: '#CAFF33',
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                    }}
                  >
                    Quotation Summary
                  </Text>
                </View>

                {/* White Content Area */}
                <View
                  style={{
                    backgroundColor: Colors.white,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textPrimary,
                      }}
                    >
                      Labor Cost
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      ₦{formatCurrency(totals.labor)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textPrimary,
                      }}
                    >
                      Logistics Cost
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      ₦{formatCurrency(totals.logistics)}
                    </Text>
                  </View>

                  {materials.map((mat) => {
                    const price = parseFloat(mat.price.replace(/,/g, '')) || 0;
                    if (price === 0) return null;
                    return (
                      <View
                        key={mat.id}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textPrimary,
                          }}
                        >
                          {mat.name} (Qty: {mat.quantity})
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-SemiBold',
                            color: Colors.textPrimary,
                          }}
                        >
                          ₦{formatCurrency(price * mat.quantity)}
                        </Text>
                      </View>
                    );
                  })}

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textPrimary,
                      }}
                    >
                      Service charge
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      ₦{formatCurrency(totals.platformFee)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textPrimary,
                      }}
                    >
                      Tax
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      ₦{formatCurrency(totals.tax)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                      }}
                    >
                      Total Amount
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                      }}
                    >
                      ₦{formatCurrency(totals.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Right Green Bar */}
            <View style={{ width: 4, backgroundColor: Colors.accent }} />
          </View>
        </KeyboardAvoidingView>

        {/* Fixed Bottom Buttons */}
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
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            style={{
              backgroundColor: canSubmit && !isSubmitting ? Colors.accent : Colors.backgroundGray,
              borderRadius: BorderRadius.default,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Bold',
                  color: canSubmit && !isSubmitting ? Colors.textPrimary : Colors.textTertiary,
                }}
              >
                Submit Quotation
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: Colors.error,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.error,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Material Dropdown Modal */}
        <Modal
          visible={showMaterialDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowMaterialDropdown(false);
            setSelectedMaterialIndex(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setShowMaterialDropdown(false);
              setSelectedMaterialIndex(null);
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.default,
                padding: 16,
                width: '80%',
                maxWidth: 300,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Select Material
              </Text>
              {MATERIAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    if (selectedMaterialIndex !== null && materials[selectedMaterialIndex]) {
                      handleSelectMaterial(materials[selectedMaterialIndex].id, option);
                    }
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
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
