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
    background: '#0b0b07',
    accent: '#6A9B00',
    softWarm: '#F5F0E8',
    white: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#F5F0E8'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    default: 16,
    full: 999
  },
  fonts: {
    heading: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 38
    },
    subheading: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 18
    }
  }
};