import React, { useEffect, useRef } from 'react';
import { View, ViewProps } from 'react-native';
import { registerTarget, unregisterTarget } from './CoachMarks';

interface CoachMarkTargetProps extends ViewProps {
  name: string;
  children: React.ReactNode;
}

/**
 * Wrapper component that registers a view as a target for coach marks
 * Wrap any element you want to highlight in a CoachMarkTarget
 */
export const CoachMarkTarget: React.FC<CoachMarkTargetProps> = ({
  name,
  children,
  ...viewProps
}) => {
  const ref = useRef<View>(null);

  useEffect(() => {
    if (ref.current) {
      registerTarget(name, ref.current);
    }

    return () => {
      unregisterTarget(name);
    };
  }, [name]);

  return (
    <View ref={ref} {...viewProps}>
      {children}
    </View>
  );
};

export default CoachMarkTarget;
