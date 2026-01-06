# Backend Configuration Required

## ⚠️ Google Maps API Key Configuration

### Issue
The location search feature requires a **Google Maps API key** to be configured on the backend server.

### Current Error
```
Google Places API error: REQUEST_DENIED - You must use an API key to authenticate each request to Google Maps Platform APIs.
```

### Solution for Backend Developer

The backend needs to:

1. **Get a Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Places API" and "Geocoding API"
   - Create API key
   - Restrict the API key to only the required APIs

2. **Configure the API Key in Backend**
   - Add the Google Maps API key to backend environment variables
   - Update the location service endpoints to use the API key
   - The backend should pass the API key when making requests to Google Places API

3. **Required Google Maps APIs**
   - **Places API** - For location autocomplete/search
   - **Geocoding API** - For reverse geocoding (GPS → Address)

### Backend Endpoints Affected

These endpoints require Google Maps API:
- `GET /api/user/location/search?query=...` - Location autocomplete
- `GET /api/user/location/details?placeId=...` - Get location details
- `GET /api/user/location/current?latitude=...&longitude=...` - Reverse geocoding

### Frontend Behavior

**Current Implementation:**
- ✅ Frontend gracefully handles API errors
- ✅ Users can still enter locations manually
- ✅ Location saving works (saves to local storage)
- ⚠️ Autocomplete search will return empty results until backend is configured

**User Experience:**
- Users can type location manually and save it
- Search autocomplete won't work until backend API key is configured
- No error messages shown to users (graceful degradation)

### Testing

Once backend is configured:
1. Test location search with query "Lagos"
2. Should return array of location results
3. Test "Use current location" - should return formatted address
4. Test saving location - should work with placeId

### Environment Variables (Backend)

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Cost Considerations

- Google Maps Platform has a free tier
- After free tier, pay-as-you-go pricing
- Consider implementing rate limiting on backend
- Monitor API usage in Google Cloud Console

---

**Status:** ⚠️ Backend configuration required for location search to work fully.

**Workaround:** Users can manually enter locations until backend is configured.
