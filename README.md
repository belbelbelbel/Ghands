# GHands - Professional Onboarding App

A polished React Native app built with Expo featuring a professional onboarding flow with animations, gesture handling, and persistent storage.

## Features

- 🎨 **Professional 3-slide onboarding carousel** with swipe gestures
- ✨ **Smooth animations** using React Native Reanimated and Moti
- 🔄 **Persistent onboarding state** with AsyncStorage
- 📱 **Haptic feedback** for enhanced user experience
- ♿ **Accessibility support** with reduce motion detection
- 🎯 **Premium asset support** with intelligent fallbacks
- 🖼️ **Fallback image system** using Unsplash API

## Tech Stack

- **Framework**: Expo (~54.0.13) with TypeScript
- **Navigation**: Expo Router (~6.0.11)
- **Animations**: React Native Reanimated (~3.17.4) & Moti (^0.28.1)
- **Gestures**: React Native Gesture Handler (~2.28.0)
- **Storage**: AsyncStorage (^1.23.1)
- **Haptics**: Expo Haptics (~15.0.7)
- **Icons**: Ionicons & Lottie React Native (^6.4.1)
- **Maps**: React Native Maps (^1.10.0) for map preview

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Premium Assets Setup

The app is designed to work with premium assets for the best visual experience, with intelligent fallbacks when these assets are not available.

### Directory Structure

Create the following directories in your project:

```
assets/
├── premium/           # Premium images (.webp/.png)
│   ├── map-hero.webp
│   ├── pay-3d.webp
│   └── connect-hero.webp
└── lottie/           # Lottie animation files (.json)
    ├── search.json
    ├── pay.json
    └── connect.json
```

### Adding Premium Images

1. **Map Hero Slide** (`assets/premium/map-hero.webp`)
   - Recommended: Dark map/city aerial view
   - Dimensions: 800x600px or higher
   - Format: .webp (preferred) or .png

2. **Payment Slide** (`assets/premium/pay-3d.webp`)
   - Recommended: 3D payment/mobile payment illustration
   - Dimensions: 800x600px or higher
   - Format: .webp (preferred) or .png

3. **Connect/Trust Slide** (`assets/premium/connect-hero.webp`)
   - Recommended: Professional service/trust imagery
   - Dimensions: 800x600px or higher
   - Format: .webp (preferred) or .png

### Adding Lottie Animations

Place your Lottie JSON files in the `assets/lottie/` directory:

1. **Search Animation** (`assets/lottie/search.json`)
   - Icon: Magnifying glass or search animation
   - Duration: 2-3 seconds (loopable)

2. **Payment Animation** (`assets/lottie/pay.json`)
   - Icon: Credit card or payment animation
   - Duration: 2-3 seconds (loopable)

3. **Connect Animation** (`assets/lottie/connect.json`)
   - Icon: Checkmark or connection animation
   - Duration: 2-3 seconds (loopable)

### Fallback System

The app includes a robust fallback system:

1. **Primary**: Premium assets from `assets/premium/` and `assets/lottie/`
2. **Secondary**: Unsplash API images with relevant search terms
3. **Tertiary**: Local app icon and Ionicons for ultimate fallback

When premium assets are missing, the app will:
- Display a subtle notice: "High-quality image unavailable — using fallback"
- Use appropriate Unsplash images or local fallbacks
- Maintain full functionality without any crashes

## Design Tokens

The app uses consistent design tokens defined in `lib/assets.ts`:

```typescript
colors: {
  background: '#0b0b07',    // Dark olive/black
  accent: '#ADF802',        // Bright lemon/neon
  softWarm: '#F5F0E8',      // Warm off-white
  white: '#FFFFFF',         // Pure white
}

spacing: {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
}

borderRadius: {
  default: 16,              // Rounded corners
  full: 999                 // Circular
}
```

## App Configuration

### Splash Screen

The app includes a custom splash screen with:
- Pulse animation on the app icon
- Auto-navigation to onboarding or main app
- Touch-to-continue functionality

### Onboarding Flow

**Slide 1: Map/Discovery**
- Title: "Find Trusted Experts Near You"
- Description: "Get help anywhere, anytime. Connect instantly with nearby professionals."
- Icon: Search/magnifying glass

**Slide 2: Payments**
- Title: "Safe Payments"
- Description: "Pay for rendered services securely through our in-app wallet."
- Icon: Credit card/payment

**Slide 3: Trust/Connect**
- Title: "Book with Confidence"
- Description: "Verified professionals, transparent pricing, and quick support to keep you moving."
- Icon: Checkmark/connection

### Accessibility Features

- Full screen reader support
- Reduced motion detection
- High contrast color ratios
- Semantic accessibility labels
- Haptic feedback for interactions

## File Structure

```
app/
├── index.tsx          # Splash screen with animation
├── onboarding.tsx     # Main onboarding screen
├── main.tsx          # Main app screen (post-onboarding)
└── _layout.tsx       # App layout and navigation

components/
├── OnboardingCarousel.tsx  # Main carousel with gestures
├── OnboardingSlide.tsx     # Individual slide component
└── AnimatedIcon.tsx        # Icon component with animations

hooks/
└── useOnboarding.ts        # Onboarding state management

lib/
└── assets.ts              # Asset management & design tokens
```

## Development Notes

### Customizing Slide Content

Edit the slide data in `hooks/useOnboarding.ts`:

```typescript
export function useOnboardingSlides() {
  return [
    {
      id: 'map',
      title: 'Your Custom Title',
      description: 'Your custom description...',
      icon: 'search', // 'search' | 'pay' | 'connect'
      assetConfig: {
        premiumPath: './assets/premium/your-image.webp',
        fallbackUrl: 'https://your-fallback-url.com',
        localFallback: require('../assets/images/your-fallback.png')
      }
    },
    // ... more slides
  ];
}
```

### Testing Fallbacks

To test the fallback system:
1. Remove premium assets from the directories
2. Disable network connection to test local fallbacks
3. Use the accessibility settings to test reduce motion

### Resetting Onboarding

For development, you can reset the onboarding state:

```typescript
import useOnboarding from './hooks/useOnboarding';

const { resetOnboarding } = useOnboarding();
await resetOnboarding(); // This will show onboarding again
```

## Performance Considerations

- Images are loaded asynchronously with proper error handling
- Animations respect the user's reduce motion preferences
- Haptic feedback is used judiciously to avoid battery drain
- AsyncStorage operations are optimized with error handling

## Contributing

When adding new features:
1. Follow the established design token system
2. Ensure accessibility compliance
3. Test fallback scenarios
4. Update TypeScript types as needed
5. Maintain the smooth animation experience

## License

This project is licensed under the MIT License.
