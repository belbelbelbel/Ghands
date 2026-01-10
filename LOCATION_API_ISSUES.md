# Location API Issues - Backend Team

## Summary
The location search and reverse geocoding endpoints are failing. Users cannot search for locations or get their current location address.

---

## Issue 1: Location Search Not Working

### Endpoint
`GET /api/user/location/search?query={searchTerm}`

### Expected Behavior
- User types location name (e.g., "Lagos")
- API returns array of location suggestions with placeId, placeName, fullAddress

### Current Behavior
- API call fails or returns empty results
- User sees "No locations found. Try a different search term"

### Possible Causes
1. **Google Maps API Key Missing/Invalid**
   - Backend needs to configure Google Places API key
   - Error might be: `REQUEST_DENIED - You must use an API key to authenticate each request to Google Maps Platform APIs`

2. **Network/Connection Issues**
   - Backend server might be down or unreachable
   - Error: `Network request failed` or `Failed to fetch`

3. **API Endpoint Not Implemented**
   - Endpoint might not exist or return 404
   - Endpoint might return wrong response format

4. **Query Parameter Issues**
   - Query might not be properly encoded
   - Backend might require different parameter format

### What Backend Should Check
- [ ] Is Google Places API key configured in backend environment variables?
- [ ] Is the endpoint `/api/user/location/search` implemented and working?
- [ ] Test endpoint directly: `GET /api/user/location/search?query=Lagos`
- [ ] Check backend logs for errors when location search is called
- [ ] Verify Google Places API is enabled in Google Cloud Console
- [ ] Check if API key has proper permissions (Places API, Geocoding API)

### Expected Response Format
```json
{
  "data": [
    {
      "placeId": "ChIJ...",
      "placeName": "Lagos",
      "fullAddress": "Lagos, Nigeria",
      "address": "Lagos, Nigeria",
      "mainText": "Lagos",
      "secondaryText": "Nigeria"
    }
  ]
}
```

---

## Issue 2: Reverse Geocoding Not Working (Current Location)

### Endpoint
`GET /api/user/location/current?latitude={lat}&longitude={lng}`

### Expected Behavior
- User clicks "Use my current location"
- App gets GPS coordinates (e.g., 6.5244, 3.3792)
- API converts coordinates to address (e.g., "Lagos, Nigeria")
- User sees readable address instead of coordinates

### Current Behavior
- API call fails
- User sees error: "Unable to get address for your location. Please search for your location manually."
- Previously showed coordinates like "Current Location (37.7858, -122.4064)" (now fixed to show error)

### Possible Causes
1. **Google Geocoding API Key Missing/Invalid**
   - Backend needs Google Geocoding API (reverse geocoding)
   - Error might be: `REQUEST_DENIED` or `API key not valid`

2. **Network/Connection Issues**
   - Backend server unreachable
   - Error: `Network request failed`

3. **API Endpoint Not Implemented**
   - Endpoint might not exist
   - Endpoint might return wrong format

4. **Invalid Coordinates**
   - Coordinates might be out of range
   - Backend might not handle edge cases

### What Backend Should Check
- [ ] Is Google Geocoding API key configured?
- [ ] Is the endpoint `/api/user/location/current` implemented?
- [ ] Test endpoint: `GET /api/user/location/current?latitude=6.5244&longitude=3.3792`
- [ ] Check backend logs for reverse geocoding errors
- [ ] Verify Geocoding API is enabled in Google Cloud Console
- [ ] Check API key permissions for Geocoding API

### Expected Response Format
```json
{
  "data": {
    "placeId": "ChIJ...",
    "formattedAddress": "123 Main Street, Lagos, Nigeria",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "city": "Lagos",
    "state": "Lagos State",
    "country": "Nigeria",
    "address": "123 Main Street, Lagos, Nigeria"
  }
}
```

---

## Issue 3: Location Details Not Working

### Endpoint
`GET /api/user/location/details?placeId={placeId}`

### Status
- Not confirmed if this is failing, but should be checked

### What Backend Should Check
- [ ] Test endpoint: `GET /api/user/location/details?placeId=ChIJ...`
- [ ] Verify it returns full location details with coordinates

---

## Testing Checklist for Backend Team

### 1. Test Location Search
```bash
# Test with curl or Postman
GET https://bamibuildit-backend-v1.onrender.com/api/user/location/search?query=Lagos

# Expected: Array of location results
# If fails: Check error message and Google Maps API key
```

### 2. Test Reverse Geocoding
```bash
# Test with curl or Postman
GET https://bamibuildit-backend-v1.onrender.com/api/user/location/current?latitude=6.5244&longitude=3.3792

# Expected: Location details with formatted address
# If fails: Check error message and Geocoding API key
```

### 3. Check Google Cloud Console
- [ ] Google Maps Platform API key exists
- [ ] Places API is enabled
- [ ] Geocoding API is enabled
- [ ] API key has proper restrictions (if any)
- [ ] API key billing is enabled

### 4. Check Backend Environment Variables
- [ ] `GOOGLE_MAPS_API_KEY` or similar is set
- [ ] API key is valid and not expired
- [ ] API key has correct permissions

### 5. Check Backend Logs
- [ ] Look for Google Maps API errors
- [ ] Check for `REQUEST_DENIED` errors
- [ ] Check for network/connection errors
- [ ] Verify endpoint is being called correctly

---

## Common Error Messages

### From Frontend (What Users See)
1. **"No locations found. Try a different search term"**
   - API returned empty array OR
   - API call failed but was caught as empty results

2. **"Unable to get address for your location. Please search for your location manually."**
   - Reverse geocoding API failed
   - Network error or API key issue

3. **"Location search is temporarily unavailable. Please enter your location manually."**
   - Google Maps API key error detected
   - Backend configuration issue

4. **"Unable to connect. Please check your internet connection and try again."**
   - Network request failed
   - Backend server unreachable

### From Backend (What Backend Should See in Logs)
1. **`REQUEST_DENIED - You must use an API key`**
   - Google Maps API key missing or not configured

2. **`API key not valid`**
   - API key is invalid or expired

3. **`This API project is not authorized to use this API`**
   - Places API or Geocoding API not enabled in Google Cloud Console

4. **`Network request failed`**
   - Backend cannot reach Google Maps API
   - Network/firewall issues

---

## Required Google Maps APIs

The backend needs these APIs enabled in Google Cloud Console:

1. **Places API** (for location search/autocomplete)
   - Used by: `/api/user/location/search`

2. **Geocoding API** (for reverse geocoding - coordinates to address)
   - Used by: `/api/user/location/current`

3. **Places API - Place Details** (for getting location details from placeId)
   - Used by: `/api/user/location/details`

---

## Quick Fix Steps for Backend

1. **Get Google Maps API Key**
   - Go to Google Cloud Console
   - Create/select project
   - Enable Places API and Geocoding API
   - Create API key
   - Set API key restrictions (optional but recommended)

2. **Configure Backend**
   - Add API key to environment variables
   - Update backend code to use API key in requests to Google Maps API

3. **Test Endpoints**
   - Test each endpoint manually
   - Verify responses match expected format

4. **Check Billing**
   - Google Maps API requires billing to be enabled
   - Free tier available but billing account must be set up

---

## Frontend Error Handling

The frontend now:
- ✅ Shows clear error messages instead of coordinates
- ✅ Distinguishes between network errors and API errors
- ✅ Allows manual location entry when API fails
- ✅ Logs detailed error information in development mode

**No frontend changes needed** - the issue is on the backend side.

---

## Contact
If you need more details or have questions, check the frontend console logs in development mode for specific error messages and status codes.
