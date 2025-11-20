import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import React from 'react';
import { Text } from 'react-native';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

export default function SimpleBarChart() {
  return (
    <SafeAreaWrapper>
      <Text>Chat Page</Text>
    </SafeAreaWrapper>
  )
}
