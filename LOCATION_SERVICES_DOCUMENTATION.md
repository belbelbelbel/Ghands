# Location Services Integration - Complete Documentation

## ✅ Error Fixed
The error `authService.getUserId is not a function` has been resolved by:
1. Adding `USER_ID_KEY` constant
2. Adding `getUserId()` and `setUserId()` methods to `ApiClient` class
3. Exporting these methods in `authService`
4. Updating `clearAuthTokens()` to also clear `USER_ID_KEY`

---

## 📍 How Location Services Work

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Location Flow                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User Input/Selection                                      │
│     ↓                                                         │
│  2. LocationSearchModal / LocationPermissionScreen          │
│     ↓                                                         │
│  3. locationService (API calls)                              │
│     ↓                                                         │
│  4. useUserLocation Hook (State Management)                  │
│     ↓                                                         │
│  5. AsyncStorage (Local Persistence)                         │
│     ↓                                                         │
│  6. Display in UI (Home screens, Profile, etc.)              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. **locationService** (`services/api.ts`)
Centralized API service for all location operations:

- **`searchLocations(query: string)`**
  - Endpoint: `GET /api/user/location/search?query=...`
  - Purpose: Autocomplete search for locations
  - Returns: `LocationSearchResult[]` with `placeId`, `placeName`, `fullAddress`
  - Used in: `LocationSearchModal` for search suggestions

- **`getLocationDetails(placeId: string)`**
  - Endpoint: `GET /api/user/location/details?placeId=...`
  - Purpose: Get full location details from placeId
  - Returns: `LocationDetails` with coordinates, city, state, country
  - Used in: When user selects a location from search results

- **`getCurrentLocation(latitude: number, longitude: number)`**
  - Endpoint: `GET /api/user/location/current?latitude=...&longitude=...`
  - Purpose: Reverse geocoding (GPS → Address)
  - Returns: `LocationDetails` with formatted address
  - Used in: `LocationPermissionScreen`, `LocationSearchModal` ("Use current location")

- **`saveUserLocation(userId: number, options)`**
  - Endpoint: `POST /api/user/update-location`
  - Purpose: Save/update user's location in backend
  - Accepts: `{ placeId }` OR `{ latitude, longitude }`
  - Returns: `SavedLocation` with all location data
  - Used in: After user selects/saves location

- **`getUserLocation(userId: number)`**
  - Endpoint: `GET /api/user/location?userId=...`
  - Purpose: Retrieve user's saved location
  - Returns: `SavedLocation | null`
  - Used in: `useUserLocation` hook on app load

#### 2. **useUserLocation Hook** (`hooks/useUserLocation.ts`)
React hook for location state management:

```typescript
interface UseUserLocationReturn {
  location: string | null;           // Display text (e.g., "Lagos, Nigeria")
  isLoading: boolean;                 // Loading state
  setLocation: (value: string) => Promise<void>;  // Save to local storage
  clearLocation: () => Promise<void>; // Clear location
  refreshLocation: () => Promise<void>; // Reload from API
  loadSavedLocation: () => Promise<void>; // Load on mount
}
```

**How it works:**
1. On mount: Tries to load from API first, falls back to local storage
2. When saving: Saves to both API (via `locationService`) and local storage
3. Provides reactive state that components can subscribe to

#### 3. **LocationSearchModal** (`components/LocationSearchModal.tsx`)
Modal component for location selection:

**Features:**
- ✅ Autocomplete search with 400ms debounce
- ✅ Search results dropdown with placeId selection
- ✅ "Use current location" button (GPS → API reverse geocoding)
- ✅ Selected location preview
- ✅ Saves via API using placeId
- ✅ Loading states and error handling

**Flow:**
1. User types → Debounced API search → Results dropdown
2. User selects result → placeId saved → API save call
3. User clicks "Use current location" → GPS → API reverse geocoding → Save

#### 4. **LocationPermissionScreen** (`app/LocationPermissionScreen.tsx`)
Onboarding screen for location permission:

**Flow:**
1. User clicks "Allow Location Access"
2. Request GPS permission
3. Get GPS coordinates
4. Call `locationService.getCurrentLocation()` for reverse geocoding
5. Save via `locationService.saveUserLocation()` with placeId
6. Navigate to next screen

---

## 📱 Where Location Services Are Used

### Client Side (Consumer)

#### 1. **Client Home Screen** (`app/(tabs)/home.tsx`)
- **Usage**: Displays saved location
- **Implementation**: 
  ```typescript
  const { location } = useUserLocation();
  // Shows location in header/search area
  ```

#### 2. **Client Profile Tab** (`app/(tabs)/profile.tsx`)
- **Usage**: Displays user's location in profile
- **Implementation**: Uses `useUserLocation` hook

#### 3. **Service Map Screen** (`app/ServiceMapScreen.tsx`)
- **Usage**: 
  - Search input for service location (where service is needed)
  - Displays saved location in search field
  - Syncs location when changed
- **Implementation**: 
  ```typescript
  const { location, refreshLocation } = useUserLocation();
  // Location search input syncs with saved location
  ```

#### 4. **Location Search Screen** (`app/LocationSearchScreen.tsx`)
- **Usage**: Full-screen location search (legacy, still used in some flows)
- **Implementation**: Similar to modal but as a screen

#### 5. **Profile Setup Screen** (`app/ProfileSetupScreen.tsx`)
- **Usage**: May display location during profile setup
- **Implementation**: Uses `useUserLocation` hook

#### 6. **Job Details Screen** (`app/JobDetailsScreen.tsx`)
- **Usage**: Displays job location
- **Implementation**: May use location services for job location display

### Provider Side (Service Provider)

#### 1. **Provider Home Screen** (`app/provider/home.tsx`)
- **Usage**: 
  - Displays saved location
  - "Enter your location" text opens `LocationSearchModal`
  - Refreshes location when modal closes
- **Implementation**:
  ```typescript
  const { location, refreshLocation } = useUserLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  useEffect(() => {
    if (!showLocationModal) {
      refreshLocation(); // Refresh after modal closes
    }
  }, [showLocationModal, refreshLocation]);
  ```

### Shared Components

#### 1. **LocationSearchModal** (`components/LocationSearchModal.tsx`)
- **Used in**: 
  - Provider home screen (when clicking "Enter your location")
  - Any screen that needs location selection
- **Features**: Full API integration with autocomplete

#### 2. **LocationPermissionScreen** (`app/LocationPermissionScreen.tsx`)
- **Used in**: Onboarding flow
- **Features**: Automatic GPS location detection and API saving

---

## 🔄 Complete Location Flow Examples

### Example 1: User Searches and Saves Location

```
1. User opens LocationSearchModal
   ↓
2. Types "Lagos" in search input
   ↓
3. API call: locationService.searchLocations("Lagos")
   ↓
4. Results dropdown shows: "Lagos, Nigeria", "Lagos Island", etc.
   ↓
5. User selects "Lagos, Nigeria" (placeId: "ChIJ...")
   ↓
6. API call: locationService.saveUserLocation(userId, { placeId })
   ↓
7. Hook updates: useUserLocation.setLocation("Lagos, Nigeria")
   ↓
8. Location saved to AsyncStorage
   ↓
9. Home screen displays: "Lagos, Nigeria"
```

### Example 2: User Uses Current Location

```
1. User clicks "Use my current location"
   ↓
2. Request GPS permission
   ↓
3. Get GPS coordinates: (6.5244, 3.3792)
   ↓
4. API call: locationService.getCurrentLocation(6.5244, 3.3792)
   ↓
5. API returns: { placeId: "ChIJ...", formattedAddress: "Lagos, Nigeria", ... }
   ↓
6. API call: locationService.saveUserLocation(userId, { placeId })
   ↓
7. Hook updates: useUserLocation.setLocation("Lagos, Nigeria")
   ↓
8. Location saved to AsyncStorage
   ↓
9. UI updates across all screens
```

### Example 3: App Loads with Saved Location

```
1. App starts / Screen mounts
   ↓
2. useUserLocation hook runs loadSavedLocation()
   ↓
3. Gets userId from authService.getUserId()
   ↓
4. API call: locationService.getUserLocation(userId)
   ↓
5. If found: Updates state with saved location
   ↓
6. If not found: Falls back to AsyncStorage
   ↓
7. UI displays location immediately
```

---

## 🎯 Consistency Across the App

### ✅ Design System Consistency

All location-related UI follows the design system:

- **Colors**: Uses `Colors.accent` (green) for location icons
- **Spacing**: Uses `Spacing.md`, `Spacing.lg`, etc. from design system
- **Typography**: Uses Poppins font family consistently
- **Border Radius**: Uses `BorderRadius.xl`, `BorderRadius.default`
- **Components**: Uses standardized `Button`, `InputField` components

### ✅ API Integration Consistency

All location operations go through `locationService`:

- ✅ No direct API calls in components
- ✅ Centralized error handling
- ✅ Consistent response types
- ✅ Proper loading states
- ✅ Error messages via Toast

### ✅ State Management Consistency

All location state managed through `useUserLocation`:

- ✅ Single source of truth
- ✅ Reactive updates across screens
- ✅ Proper loading states
- ✅ Fallback to local storage

### ✅ User Experience Consistency

- ✅ Same modal design for location selection everywhere
- ✅ Consistent "Use current location" behavior
- ✅ Same loading indicators
- ✅ Same error messages
- ✅ Same success feedback

---

## 🔧 API Endpoints Used

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/user/location/search?query=...` | GET | Autocomplete search | No |
| `/api/user/location/details?placeId=...` | GET | Get location details | No |
| `/api/user/location/current?latitude=...&longitude=...` | GET | Reverse geocoding | No |
| `/api/user/update-location` | POST | Save user location | Yes |
| `/api/user/location?userId=...` | GET | Get saved location | Yes |

---

## 🚀 Future Enhancements

1. **Location History**: Store multiple saved locations
2. **Recent Locations**: Show recently searched locations
3. **Favorites**: Allow users to favorite locations
4. **Offline Support**: Cache location data for offline use
5. **Location Validation**: Validate location before saving
6. **Auto-update**: Periodically update location if user moves

---

## 📝 Notes

- All location operations are **non-blocking** (async)
- Location is **cached locally** for offline access
- API calls are **debounced** to reduce server load
- Error handling is **graceful** with fallbacks
- User experience is **consistent** across all screens

---

## ✅ Verification Checklist

- [x] Error fixed: `authService.getUserId` now works
- [x] All location operations use `locationService`
- [x] All components use `useUserLocation` hook
- [x] Design system consistency maintained
- [x] Error handling implemented
- [x] Loading states added
- [x] Toast notifications for user feedback
- [x] Location persists across app sessions
- [x] API integration complete
- [x] Documentation complete

---

**Last Updated**: Phase 2 Location Services Integration Complete ✅
