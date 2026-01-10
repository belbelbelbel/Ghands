# Provider Section - Tasks & Implementation Order

## ✅ Already Implemented (API Layer)
All provider API endpoints are already implemented in `services/api.ts`:
- ✅ Provider Signup (`providerService.signup`)
- ✅ Provider Login (`providerService.login`)
- ✅ Get Provider Details (`providerService.getProvider`)
- ✅ Update Provider Location (`providerService.updateLocation`)
- ✅ Add Categories (`providerService.addCategories`)
- ✅ Get Provider Services (`providerService.getServices`)
- ✅ Get Available Requests (`providerService.getAvailableRequests`)
- ✅ Accept Request (`providerService.acceptRequest`)
- ✅ Get Accepted Requests (`providerService.getAcceptedRequests`)

---

## 📋 Implementation Order

### **PHASE 1: Authentication & Setup** (Foundation)
**Priority: HIGH - Must be done first**

#### 1.1 Provider Signup Integration
**File:** `app/ProviderSignUpScreen.tsx`
**Status:** ❌ Not integrated
**Tasks:**
- [ ] Integrate `providerService.signup()` API call
- [ ] Add form fields: `name`, `email`, `password`, `phoneNumber`, `age`
- [ ] Add validation (email format, password min 6 chars, age 18-100)
- [ ] Save token and provider ID after successful signup
- [ ] Set role to 'provider' in auth state
- [ ] Navigate to profile setup or home after signup
- [ ] Show exact error messages from backend
- [ ] Add loading state during signup

**API Endpoint:** `POST /api/provider/signup`
**Required Fields:** `name`, `email`, `password`, `age`
**Optional Fields:** `phoneNumber`, `categories`, `location`

---

#### 1.2 Provider Login Integration
**File:** `app/ProviderSignInScreen.tsx`
**Status:** ❌ Not integrated (currently just sets role)
**Tasks:**
- [ ] Integrate `providerService.login()` API call
- [ ] Add email and password validation
- [ ] Save token and provider ID after successful login
- [ ] Set role to 'provider' in auth state
- [ ] Navigate to provider home after login
- [ ] Show exact error messages from backend
- [ ] Add loading state during login
- [ ] Handle "Provider not found" or "Invalid credentials" errors

**API Endpoint:** `POST /api/provider/login`
**Required Fields:** `email`, `password`

---

#### 1.3 Provider Profile Setup Integration
**File:** `app/ProviderProfileSetupScreen.tsx`
**Status:** ❌ Not integrated
**Tasks:**
- [ ] Integrate location update API (`providerService.updateLocation`)
- [ ] Integrate categories API (`providerService.addCategories`)
- [ ] Allow provider to select service categories they offer
- [ ] Save location using location search (same as client)
- [ ] Show success message after setup
- [ ] Navigate to provider home after completion

**API Endpoints:**
- `PUT /api/provider/:providerId/location` - Update location
- `POST /api/provider/:providerId/categories` - Add categories

---

### **PHASE 2: Core Provider Features** (Main Functionality)
**Priority: HIGH - Core provider workflow**

#### 2.1 Provider Home Screen - Available Requests
**File:** `app/provider/home.tsx`
**Status:** ❌ Using mock data (`MOCK_PENDING_JOBS`, `MOCK_ACTIVE_JOBS`)
**Tasks:**
- [ ] Integrate `providerService.getAvailableRequests()` API
- [ ] Replace mock data with real API data
- [ ] Show loading skeleton while fetching
- [ ] Display requests sorted by distance (API already sorts)
- [ ] Show distance and estimated travel time for each request
- [ ] Add pull-to-refresh functionality
- [ ] Handle "Provider location not set" error gracefully
- [ ] Show empty state when no requests available
- [ ] Add filter by category (if provider has multiple categories)
- [ ] Add filter by distance (maxDistanceKm slider)

**API Endpoint:** `GET /api/provider/:providerId/requests/available?maxDistanceKm=50`
**Note:** Requires provider location to be set first

---

#### 2.2 Provider Jobs Screen - Accepted Requests
**File:** `app/provider/jobs.tsx`
**Status:** ❌ Using mock data (`ONGOING_JOBS`, `PENDING_JOBS`, `COMPLETED_JOBS`)
**Tasks:**
- [ ] Integrate `providerService.getAcceptedRequests()` API
- [ ] Replace mock data with real API data
- [ ] Filter requests by status (pending, accepted, in_progress, completed)
- [ ] Show loading skeleton while fetching
- [ ] Display request details (job title, description, location, date/time, client info)
- [ ] Add pull-to-refresh functionality
- [ ] Show empty state when no jobs
- [ ] Navigate to job details when job is clicked

**API Endpoint:** `GET /api/provider/:providerId/requests/accepted`
**Note:** This shows requests the provider has accepted

---

#### 2.3 Accept Request Functionality
**File:** `app/provider/home.tsx` or `app/ProviderJobDetailsScreen.tsx`
**Status:** ❌ Not implemented
**Tasks:**
- [ ] Add "Accept Request" button to available requests
- [ ] Integrate `providerService.acceptRequest()` API
- [ ] Show confirmation modal before accepting
- [ ] Update UI after successful acceptance (remove from available, add to accepted)
- [ ] Show success message
- [ ] Handle errors (e.g., "Provider does not offer this service category")
- [ ] Navigate to job details after acceptance

**API Endpoint:** `POST /api/provider/:providerId/requests/:requestId/accept`
**Note:** Provider must offer the service category of the request

---

### **PHASE 3: Provider Profile & Settings** (Enhancement)
**Priority: MEDIUM - Profile management**

#### 3.1 Provider Profile Screen
**File:** `app/provider/profile.tsx`
**Status:** ❓ Check if integrated
**Tasks:**
- [ ] Integrate `providerService.getProvider()` to show provider details
- [ ] Show provider categories using `providerService.getServices()`
- [ ] Display verification status
- [ ] Show location if set
- [ ] Allow editing profile information
- [ ] Allow updating location
- [ ] Allow adding/removing categories

**API Endpoints:**
- `GET /api/provider/:providerId` - Get provider details
- `GET /api/provider/:providerId/services` - Get provider categories

---

#### 3.2 Update Provider Location
**File:** `app/provider/home.tsx` or separate location screen
**Status:** ❌ Not integrated
**Tasks:**
- [ ] Add "Update Location" button/functionality
- [ ] Use location search modal (same as client)
- [ ] Integrate `providerService.updateLocation()` API
- [ ] Show success message
- [ ] Refresh available requests after location update
- [ ] Show current location in UI

**API Endpoint:** `PUT /api/provider/:providerId/location`
**Note:** Important - providers need location to see nearby requests

---

#### 3.3 Manage Provider Categories
**File:** `app/provider/profile.tsx` or separate screen
**Status:** ❌ Not integrated
**Tasks:**
- [ ] Show current categories provider offers
- [ ] Allow adding new categories
- [ ] Integrate `providerService.addCategories()` API
- [ ] Show available categories to choose from
- [ ] Display category icons
- [ ] Show success message after adding

**API Endpoint:** `POST /api/provider/:providerId/categories`
**Note:** Provider can offer multiple categories

---

### **PHASE 4: Job Management** (Details & Updates)
**Priority: MEDIUM - Job workflow**

#### 4.1 Provider Job Details Screen
**File:** `app/ProviderJobDetailsScreen.tsx`
**Status:** ❓ Check if integrated
**Tasks:**
- [ ] Show full request details (job title, description, location, date/time)
- [ ] Show client information (name, phone, email)
- [ ] Show distance and travel time
- [ ] Add "Accept Request" button (if not accepted yet)
- [ ] Show request status
- [ ] Add navigation to client location (maps)
- [ ] Add call client functionality
- [ ] Show request timeline/updates

**API Endpoint:** Use `getAcceptedRequests` or `getAvailableRequests` data

---

#### 4.2 Provider Updates Screen
**File:** `app/ProviderUpdatesScreen.tsx`
**Status:** ❓ Check if integrated
**Tasks:**
- [ ] Show updates/notifications for provider
- [ ] Show new requests matching provider categories
- [ ] Show accepted request updates
- [ ] Show client messages/communications

---

### **PHASE 5: Additional Features** (Nice to have)
**Priority: LOW - Enhancements**

#### 5.1 Provider Wallet Integration
**File:** `app/provider/wallet.tsx`
**Status:** ❓ Check if integrated
**Tasks:**
- [ ] Show earnings from completed jobs
- [ ] Show pending payments
- [ ] Show transaction history
- [ ] Add withdrawal functionality

**Note:** Wallet endpoints may not be in current API documentation

---

#### 5.2 Provider Analytics
**File:** `app/AnalyticsScreen.tsx` (if provider-specific)
**Status:** ❓ Check if integrated
**Tasks:**
- [ ] Show job statistics
- [ ] Show earnings over time
- [ ] Show completion rate
- [ ] Show average rating

---

## 🎯 Recommended Implementation Order

### **Week 1: Foundation**
1. ✅ Provider Signup Integration (1.1)
2. ✅ Provider Login Integration (1.2)
3. ✅ Provider Profile Setup Integration (1.3)

### **Week 2: Core Features**
4. ✅ Provider Home - Available Requests (2.1)
5. ✅ Accept Request Functionality (2.3)
6. ✅ Provider Jobs - Accepted Requests (2.2)

### **Week 3: Profile & Settings**
7. ✅ Update Provider Location (3.2)
8. ✅ Manage Provider Categories (3.3)
9. ✅ Provider Profile Screen (3.1)

### **Week 4: Job Management**
10. ✅ Provider Job Details Screen (4.1)
11. ✅ Provider Updates Screen (4.2)

---

## 📝 Notes

### Important Considerations:
1. **Provider Location is Critical**: Providers MUST set location to see available requests
2. **Categories Required**: Providers should add at least one category to see relevant requests
3. **Token Management**: Same as client - save token and provider ID after login/signup
4. **Error Handling**: Show exact backend error messages
5. **Loading States**: Add spinners/skeletons for all API calls
6. **Empty States**: Show helpful messages when no data available

### Common Patterns to Follow:
- Use same error handling as client (`getSpecificErrorMessage`)
- Use same loading patterns (skeletons, spinners)
- Use same location search components
- Follow same design principles and animations
- Use `apiClient.getUserId()` to get provider ID (same as client)

---

## 🔍 Quick Check Commands

To see what's already integrated:
```bash
# Check provider signup
grep -r "providerService.signup" app/

# Check provider login
grep -r "providerService.login" app/

# Check available requests
grep -r "getAvailableRequests" app/

# Check accept request
grep -r "acceptRequest" app/
```
