import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as Haptics from 'expo-haptics';
import { haptics } from '../hooks/useHaptics';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('success', () => {
    it('should trigger medium then light impact', () => {
      haptics.success();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
      
      jest.advanceTimersByTime(50);
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('warning', () => {
    it('should trigger medium impact', () => {
      haptics.warning();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('error', () => {
    it('should trigger heavy impact', () => {
      haptics.error();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('light', () => {
    it('should trigger light impact', () => {
      haptics.light();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('medium', () => {
    it('should trigger medium impact', () => {
      haptics.medium();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('heavy', () => {
    it('should trigger heavy impact', () => {
      haptics.heavy();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('selection', () => {
    it('should trigger selection haptic', () => {
      haptics.selection();
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    });
  });
});

