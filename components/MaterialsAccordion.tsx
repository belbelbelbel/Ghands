import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors, BorderRadius, Spacing } from '@/lib/designSystem';
import { QuotationMaterial } from '@/services/api';

interface MaterialsAccordionProps {
  materials: QuotationMaterial[];
}

export default function MaterialsAccordion({ materials }: MaterialsAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!materials || materials.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const totalMaterialsCost = materials.reduce((sum, mat) => {
    const quantity = mat.quantity || 1;
    const unitPrice = mat.unitPrice || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.label}>Materials cost</Text>
          <View style={styles.headerRight}>
            <Text style={styles.amount}>₦{formatCurrency(totalMaterialsCost)}</Text>
            <Text style={styles.breakdownLink}>Breakdown</Text>
            {isExpanded ? (
              <ChevronUp size={16} color={Colors.accent} />
            ) : (
              <ChevronDown size={16} color={Colors.accent} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {materials.map((material, index) => {
            const quantity = material.quantity || 1;
            const unitPrice = material.unitPrice || 0;
            const total = quantity * unitPrice;

            return (
              <View key={index} style={styles.materialItem}>
                <View style={styles.materialHeader}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialTotal}>₦{formatCurrency(total)}</Text>
                </View>
                <View style={styles.materialDetails}>
                  <Text style={styles.materialDetail}>
                    Quantity: {quantity}
                  </Text>
                  <Text style={styles.materialDetail}>
                    Unit Price: ₦{formatCurrency(unitPrice)}
                  </Text>
                </View>
                {index < materials.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.default,
    marginBottom: 8,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.white,
  },
  breakdownLink: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    borderRadius: BorderRadius.default,
  },
  materialItem: {
    paddingVertical: 8,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialName: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    flex: 1,
  },
  materialTotal: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
  },
  materialDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  materialDetail: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
  },
});
