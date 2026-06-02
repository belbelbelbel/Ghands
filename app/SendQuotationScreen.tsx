import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { ScreenHeader } from '@/components/ScreenHeader';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors, SPACING } from '@/lib/designSystem';
import { providerService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { isDuplicateActionError } from '@/utils/idempotentSubmit';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calculator, ChevronDown, ChevronUp, FileText, MapPin, Minus, Plus, ReceiptText, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
}

const MATERIAL_OPTIONS = ['Pipe Connector', "Plumber's Tape", 'Pipe Fitting', 'Sealant', 'Other'];
const PLATFORM_FEE_PERCENTAGE = 5;

const sectionCard = {
  backgroundColor: Colors.white,
  borderRadius: BorderRadius.default,
  borderWidth: 1,
  borderColor: Colors.border,
  padding: 14,
  marginBottom: SPACING.md,
};

const fieldInput = {
  borderRadius: BorderRadius.sm,
  borderWidth: 1,
  borderColor: Colors.border,
  backgroundColor: Colors.white,
  paddingHorizontal: 12,
  height: 44,
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
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
    setMaterials(materials.filter((mat) => mat.id !== id));
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
    if (submitLockRef.current || isSubmitting) return;

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

    submitLockRef.current = true;
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

      try {
        await providerService.acceptRequest(requestId);
      } catch (acceptErr: any) {
        const msg = (acceptErr?.message || acceptErr?.details?.data?.message || '').toLowerCase();
        if (!msg.includes('already accepted') && !isDuplicateActionError(acceptErr)) throw acceptErr;
      }

      await providerService.sendQuotation(requestId, payload);

      haptics.success();
      showSuccess('Quotation sent successfully! Waiting for client response.');

      setTimeout(() => {
        router.back();
      }, 800);
    } catch (error: any) {
      if (isDuplicateActionError(error, ['quotation'])) {
        haptics.success();
        showSuccess('Quotation was already sent.');
        setTimeout(() => router.back(), 800);
        return;
      }

      console.error('Error sending quotation:', error);
      haptics.error();
      submitLockRef.current = false;

      const rawMsg =
        (error?.details?.data?.error ||
          error?.details?.error ||
          error?.details?.message ||
          error?.message ||
          '') as string;
      const normalized = rawMsg.toLowerCase();

      let errorMessage =
        getSpecificErrorMessage(error, 'send_quotation') ||
        'Failed to send quotation. Please try again.';

      if (
        rawMsg &&
        !normalized.includes('request failed with status') &&
        !normalized.includes('invalid information') &&
        !normalized.includes('failed to send quotation')
      ) {
        errorMessage = rawMsg;
      }

      showError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    laborCost &&
    logisticsCost &&
    findings &&
    findings.trim().length >= 10 &&
    totals.total > 0 &&
    !isSubmitting;

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1, backgroundColor: Colors.backgroundLight }}>
        <ScreenHeader title="Send Quotation" onBack={() => router.back()} />

        <TouchableOpacity
          onPress={() => {
            if (!params.requestId) return;
            haptics.light();
            router.replace({
              pathname: '/RequestVisitScreen' as any,
              params: { requestId: params.requestId, jobTitle: params.jobTitle || jobTitle || undefined },
            } as any);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginRight: SPACING.xl,
            marginBottom: 4,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: BorderRadius.sm,
            backgroundColor: '#F2F8EA',
          }}
          activeOpacity={0.85}
        >
          <MapPin size={14} color={Colors.accent} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
            Request visit instead
          </Text>
        </TouchableOpacity>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SPACING.xl,
                paddingTop: SPACING.sm,
                paddingBottom: 100,
              }}
              style={{ flex: 1 }}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: Colors.accent, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  Quotation for
                </Text>
                <Text style={{ fontSize: 18, lineHeight: 24, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginTop: 4 }} numberOfLines={2}>
                  {jobTitle || params.jobTitle || 'Service request'}
                </Text>
                <Text style={{ fontSize: 12, lineHeight: 18, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginTop: 4 }}>
                  Break down costs clearly. The client reviews this before paying.
                </Text>
              </View>

              <View style={sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Calculator size={16} color={Colors.accent} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                    Core costs
                  </Text>
                </View>

              {/* Labor Cost */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginBottom: 6 }}>
                  Labor
                </Text>
                <View style={{ ...fieldInput, flexDirection: 'row', alignItems: 'center' }}>
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
              <View>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginBottom: 6 }}>
                  Logistics
                </Text>
                <View style={{ ...fieldInput, flexDirection: 'row', alignItems: 'center' }}>
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
              </View>

              {/* Material List */}
              <View style={sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: materials.length ? 10 : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ReceiptText size={16} color={Colors.textPrimary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                      Materials
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textTertiary }}>
                    Optional
                  </Text>
                </View>

                {materials.length === 0 ? (
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginBottom: 8 }}>
                    Add parts or supplies if needed.
                  </Text>
                ) : null}

                {materials.map((material, index) => (
                  <View
                    key={material.id}
                    style={{
                      backgroundColor: Colors.backgroundLight,
                      borderRadius: BorderRadius.sm,
                      padding: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {/* Material Dropdown */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMaterialIndex(index);
                        setShowMaterialDropdown(true);
                      }}
                      style={{
                        flex: 2,
                        ...fieldInput,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: 40,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {material.name}
                      </Text>
                      <ChevronDown size={16} color={Colors.textSecondaryDark} />
                    </TouchableOpacity>

                    {/* Quantity Selector */}
                    <View
                      style={{
                        width: 56,
                        ...fieldInput,
                        height: 40,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 6,
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
                        flex: 1.4,
                        ...fieldInput,
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 40,
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
                    <TouchableOpacity
                      onPress={() => handleRemoveMaterial(material.id)}
                      style={{
                        width: 36,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      activeOpacity={0.7}
                    >
                      <Minus size={18} color={Colors.error} />
                    </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add Item Button */}
                <TouchableOpacity
                  onPress={handleAddMaterial}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    marginTop: 4,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color={Colors.accent} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                    Add item
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Findings & Work Required */}
              <View style={sectionCard}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 4 }}>
                  Findings & work required
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginBottom: 10 }}>
                  What you found and what needs to be done.
                </Text>
                <TextInput
                  placeholder="e.g. Stain on curtain — dry clean section, treat fabric, re-hang."
                  value={findings}
                  onChangeText={setFindings}
                  multiline
                  textAlignVertical="top"
                  style={{
                    ...fieldInput,
                    height: undefined,
                    minHeight: 88,
                    paddingVertical: 10,
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                    lineHeight: 20,
                  }}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Quotation Summary */}
              <View
                style={{
                  ...sectionCard,
                  marginBottom: SPACING.sm,
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    backgroundColor: '#F2F8EA',
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  }}
                >
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                    Summary
                  </Text>
                </View>

                <View style={{ padding: 14 }}>
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
                      borderTopColor: 'rgba(17, 24, 39, 0.08)',
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
                        fontSize: 18,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.accent,
                      }}
                    >
                      ₦{formatCurrency(totals.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>

        {/* Fixed Bottom Buttons */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: SPACING.xl,
            paddingTop: 10,
            paddingBottom: 22,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              handleSubmit();
            }}
            disabled={!canSubmit || isSubmitting}
            style={{
              backgroundColor: canSubmit && !isSubmitting ? Colors.accent : Colors.backgroundGray,
              borderRadius: BorderRadius.default,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: canSubmit && !isSubmitting ? Colors.white : Colors.textTertiary,
                }}
              >
                Send quotation
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark }}>
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
