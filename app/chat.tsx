import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

export default function SimpleBarChart() {
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <Text>Chat Page</Text>
      </SafeAreaView>

    </SafeAreaProvider>

  )
}
