export interface SlideData {
  id: string;
  title: string;
  description: string;
  icon: 'location' | 'tracking' | 'booking';
  image: any; 
}

export const ONBOARDING_SLIDES: SlideData[] = [
  {
    id: 'map',
    title: 'Find Trusted Experts Near You',
    description: 'Get help anywhere, anytime. Connect instantly with nearby professionals.',
    icon: 'location',
    image: require('../assets/premium/map-hero.png')
  },
  {
    id: 'tracking',
    title: 'Fast Response, Real-Time Track',
    description: 'Track your provider in real-time and get updates on arrival.',
    icon: 'tracking',
    image: require('../assets/premium/pay-3d.png')
  },
  {
    id: 'connect',
    title: 'Book with Confidence',
    description: 'Verified professionals, transparent pricing, and quick support to keep you moving.',
    icon: 'booking',
    image: require('../assets/premium/connect-hero.png')
  }
];

export const DESIGN_TOKENS = {
  colors: {
    // Primary colors
    background: '#0b0b07',
    accent: '#6A9B00',
    softWarm: '#F5F0E8',
    white: '#FFFFFF',
    black: '#000000',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#F5F0E8',
    textPrimary: '#000000',
    textSecondaryDark: '#666666',
    textTertiary: '#999999',
    
    // UI colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    backgroundLight: '#FFFFFF',
    backgroundGray: '#F3F4F6',
    
    // Status colors
    success: '#166534',
    successLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    errorBorder: '#FEE2E2',
    
    // Tab colors
    tabActive: '#6A9B00',
    tabInactive: '#9CA3AF',
    
    // Shadow
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48
  },
  borderRadius: {
    sm: 8,
    md: 10,
    default: 12,
    lg: 16,
    xl: 18,
    full: 999
  },
  fonts: {
    // Heading styles
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 38,
      fontFamily: 'Poppins-Bold'
    },
    h2: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      lineHeight: 26,
      fontFamily: 'Poppins-Bold'
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      fontFamily: 'Poppins-SemiBold'
    },
    h4: {
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 22,
      fontFamily: 'Poppins-SemiBold'
    },
    // Body styles
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
      fontFamily: 'Poppins-Regular'
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      fontFamily: 'Poppins-Medium'
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
      fontFamily: 'Poppins-Regular'
    },
    bodyTiny: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 16,
      fontFamily: 'Poppins-Regular'
    },
    // Button styles
    button: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
      fontFamily: 'Poppins-SemiBold'
    },
    buttonSmall: {
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 14,
      fontFamily: 'Poppins-SemiBold'
    },
    // Label styles
    label: {
      fontSize: 10,
      fontWeight: '600' as const,
      lineHeight: 14,
      fontFamily: 'Poppins-SemiBold'
    }
  }
};