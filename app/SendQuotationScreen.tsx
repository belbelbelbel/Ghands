import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [amount, setAmount] = useState('');
  const [laborCost, setLaborCost] = useState('450');
  const [findings, setFindings] = useState('');
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: '1', name: 'Pipe Connector', quantity: 1, price: '450' },
    { id: '2', name: "Plumber's Tape", quantity: 3, price: '450' },
  ]);

  const calculateTotals = () => {
    const labor = parseFloat(laborCost.replace(/,/g, '')) || 0;
    const materialTotal = materials.reduce((sum, mat) => {
      const price = parseFloat(mat.price.replace(/,/g, '')) || 0;
      return sum + price * mat.quantity;
    }, 0);
    const subtotal = labor + materialTotal;
    const platformFee = subtotal * (PLATFORM_FEE_PERCENTAGE / 100);
    const total = subtotal + platformFee;
    return { labor, materialTotal, subtotal, platformFee, total };
  };

  const totals = calculateTotals();

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

  const handleSubmit = () => {
    if (!amount || !findings) return;
    router.back();
  };

  const canSubmit = amount && findings;

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Fixed Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
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
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Send Quotation
          </Text>
        </View>

        {/* Scrollable Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                Amount <Text style={{ color: Colors.error }}>*</Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 16,
                  height: 52,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginRight: 8,
                  }}
                >
                  ₦
                </Text>
                <TextInput
                  placeholder="10"
                  value={formatInput(amount)}
                  onChangeText={(text) => setAmount(text.replace(/,/g, ''))}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                  }}
                  placeholderTextColor={Colors.textSecondaryDark}
                />
              </View>
            </View>

            {/* Labor Cost Field */}
            <View style={{ marginBottom: 16 }}>
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
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 16,
                  height: 52,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginRight: 8,
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
                    fontSize: 16,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                  }}
                  placeholderTextColor={Colors.textSecondaryDark}
                />
              </View>
            </View>

            {/* Material List Section */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                    textDecorationLine: 'underline',
                  }}
                >
                  Material List
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Optional
                </Text>
              </View>

              {/* Single Container Box for All Materials */}
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#000000',
                  padding: 12,
                }}
              >
                {materials.map((material, index) => (
                  <View key={material.id}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Medium',
                          color: Colors.textPrimary,
                          width: 70,
                        }}
                      >
                        Material
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: Colors.white,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#000000',
                          paddingHorizontal: 10,
                          height: 36,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textPrimary,
                          }}
                        >
                          {material.name}
                        </Text>
                        <ChevronDown size={14} color={Colors.textSecondaryDark} />
                      </View>
                      <View
                        style={{
                          width: 45,
                          backgroundColor: Colors.white,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#000000',
                          paddingHorizontal: 6,
                          height: 36,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textPrimary,
                          }}
                        >
                          {material.quantity}
                        </Text>
                        <ChevronDown size={12} color={Colors.textSecondaryDark} />
                      </View>
                      <View
                        style={{
                          width: 100,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: Colors.white,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#000000',
                          paddingHorizontal: 8,
                          height: 36,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-SemiBold',
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
                            fontSize: 13,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textPrimary,
                          }}
                          placeholder="100,000"
                          placeholderTextColor={Colors.textSecondaryDark}
                        />
                      </View>
                      {materials.length > 1 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveMaterial(material.id)}
                          style={{
                            width: 28,
                            height: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 4,
                          }}
                          activeOpacity={0.7}
                        >
                          <X size={16} color={Colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {index < materials.length - 1 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: Colors.border,
                          marginVertical: 8,
                        }}
                      />
                    )}
                  </View>
                ))}

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
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.accent,
                    }}
                  >
                    Add Item
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Findings & Work Required */}
            <View style={{ marginBottom: 16 }}>
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
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  minHeight: 100,
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
                    minHeight: 80,
                  }}
                  placeholderTextColor={Colors.textSecondaryDark}
                />
              </View>
            </View>

            {/* Quotation Summary */}
            <View
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.white,
                  marginBottom: 12,
                }}
              >
                Quotation Summary
              </Text>

              {laborCost && parseFloat(laborCost.replace(/,/g, '')) > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.white,
                    }}
                  >
                    Labor Cost:
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.white,
                    }}
                  >
                    ₦{formatCurrency(totals.labor)}
                  </Text>
                </View>
              )}

              {materials.map((mat) => {
                const price = parseFloat(mat.price.replace(/,/g, '')) || 0;
                if (price === 0) return null;
                return (
                  <View
                    key={mat.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.white,
                      }}
                    >
                      {mat.name} (Qty: {mat.quantity}):
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                      }}
                    >
                      ₦{formatCurrency(price * mat.quantity)}
                    </Text>
                  </View>
                );
              })}

              {(totals.labor > 0 || totals.materialTotal > 0) && (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.white,
                      }}
                    >
                      Platform Fee:
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                      }}
                    >
                      ₦{formatCurrency(totals.platformFee)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.white,
                      }}
                    >
                      Total Amount:
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.white,
                      }}
                    >
                      ₦{formatCurrency(totals.total)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Bottom Buttons - Inside ScrollView */}
            <View style={{ marginBottom: 20 }}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{
                  backgroundColor: canSubmit ? Colors.accent : Colors.backgroundGray,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: canSubmit ? Colors.white : Colors.textTertiary,
                  }}
                >
                  Submit Quotation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  backgroundColor: '#FEE2E2',
                  borderRadius: 12,
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
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaWrapper>
  );
}
