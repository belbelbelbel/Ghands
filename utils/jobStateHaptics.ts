import { haptics } from '@/hooks/useHaptics';

export type JobState = 
  | 'requested' 
  | 'accepted' 
  | 'on_the_way' 
  | 'started' 
  | 'completed' 
  | 'cancelled';

/**
 * Utility to trigger appropriate haptics for job state changes
 * Similar to Uber/Airbnb job tracking experience
 */
export function triggerJobStateHaptic(state: JobState) {
  switch (state) {
    case 'accepted':
      // Artisan accepted job - success pattern
      haptics.success();
      break;
    case 'on_the_way':
      // Provider is on the way - medium impact
      haptics.medium();
      break;
    case 'started':
      // Job started - success pattern
      haptics.success();
      break;
    case 'completed':
      // Job completed - success pattern (payment success)
      haptics.success();
      break;
    case 'cancelled':
      // Job cancelled - warning
      haptics.warning();
      break;
    default:
      haptics.light();
  }
}

/**
 * Helper to determine if state change should trigger haptic
 */
export function shouldTriggerHaptic(oldState: JobState | null, newState: JobState): boolean {
  if (!oldState) return true;
  
  const stateOrder: JobState[] = ['requested', 'accepted', 'on_the_way', 'started', 'completed'];
  const oldIndex = stateOrder.indexOf(oldState);
  const newIndex = stateOrder.indexOf(newState);
  
  // Only trigger if moving forward in state progression
  return newIndex > oldIndex;
}



