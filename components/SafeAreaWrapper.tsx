import React from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function SafeAreaWrapper({
  children,
  backgroundColor = '#ffffff',
  style,
  className = '',
  edges = ['top', 'bottom'],
}: SafeAreaWrapperProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          {
            flex: 1,
            backgroundColor,
          },
          style,
        ]}
        className={className}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

