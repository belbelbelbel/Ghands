# Location API Debugging Guide

## Issue: Backend Says It Works, But App Doesn't

If the backend team has tested the location endpoints and they work, but the app is still failing, here's what to check:

## 1. Check Console Logs

The app now has **comprehensive logging** for location API calls. When you test location search or "use current location", check the console for:

### Location Search Logs:
```
🔍 ========== LOCATION SEARCH REQUEST ==========
🔍 Query: [your search query]
🔍 Encoded Query: [encoded version]
🔍 Full URL: [complete URL]
🔍 Base URL: [API base URL]
🔍 =============================================

🌐 ========== FETCH REQUEST ==========
🌐 URL: [full URL]
🌐 Method: GET
🌐 Headers: [request headers]
🌐 Skip Auth: true
🌐 ===================================

🌐 Fetch attempt 1/3: [URL]

📥 ========== FETCH RESPONSE ==========
📥 URL: [URL]
📥 Status: [HTTP status code]
📥 Status Text: [status text]
📥 OK: [true/false]
📥 Headers: [response headers]
📥 ====================================

✅ Location Search Response: [response data]
```

### If There's an Error:
```
❌ ========== LOCATION SEARCH ERROR DETAILS ==========
❌ Request URL: [full URL]
❌ Query: [search query]
❌ Error Message: [error message]
❌ Error Status: [HTTP status code]
❌ Error StatusText: [status text]
❌ Error Details: [full error object]
❌ Full Error: [complete error]
❌ =================================================
```

## 2. Common Issues to Check

### A. CORS (Cross-Origin Resource Sharing)
**Symptom:** Network error, status 0, or CORS error in console

**Check:**
- Backend must allow requests from mobile app origin
- For React Native/Expo, CORS might not apply (native apps don't have CORS), but check if backend has any origin restrictions

**Solution:** Backend should allow all origins for mobile apps, or specifically allow the app's user-agent

### B. Network Connectivity
**Symptom:** "Network request failed" or "Failed to fetch"

**Check:**
- Is the device/emulator connected to internet?
- Can the device reach the backend URL?
- Is the backend server actually running and accessible?

**Test:** Try accessing the backend URL directly in a browser:
```
https://bamibuildit-backend-v1.onrender.com/api/user/location/search?query=Lagos
```

### C. URL Encoding Issues
**Symptom:** 400 Bad Request or "Invalid query"

**Check:**
- The app uses `encodeURIComponent()` for query parameters
- Check if backend expects a different encoding format
- Check if special characters in search queries are handled correctly

**Example:**
- App sends: `query=Lagos%20Nigeria` (URL encoded)
- Backend might expect: `query=Lagos Nigeria` (not encoded)

### D. Request Headers
**Symptom:** 401 Unauthorized or 403 Forbidden

**Check:**
- Location endpoints should NOT require authentication (`skipAuth: true`)
- Check if backend is checking for auth headers even though it shouldn't
- Check if backend expects specific headers (User-Agent, Accept, etc.)

**Current Headers Sent:**
```json
{
  "Content-Type": "application/json"
}
```

### E. Response Format Mismatch
**Symptom:** "Cannot read property 'data' of undefined" or empty results

**Check:**
- Backend response format vs what app expects

**App Expects:**
```json
{
  "data": [
    {
      "placeId": "...",
      "placeName": "...",
      "fullAddress": "...",
      "address": "..."
    }
  ]
}
```

**Backend Might Be Returning:**
```json
{
  "success": true,
  "data": {
    "data": [...]  // Nested data
  }
}
```

### F. Query Parameter Name
**Symptom:** Empty results or 400 Bad Request

**Check:**
- App sends: `?query=Lagos`
- Backend might expect: `?q=Lagos` or `?search=Lagos` or `?location=Lagos`

### G. Base URL Configuration
**Symptom:** "Network request failed" or wrong endpoint

**Check:**
- Current base URL: `https://bamibuildit-backend-v1.onrender.com`
- Is this the correct backend URL?
- Check if backend is on a different domain or port

**To Check:** Look for `EXPO_PUBLIC_API_URL` in `.env` file or check `services/api.ts` line 4

## 3. What to Share with Backend Team

When reporting the issue, share:

1. **Full Request URL** (from console logs)
2. **Request Headers** (from console logs)
3. **Response Status Code** (from console logs)
4. **Response Body** (if available from console logs)
5. **Error Message** (from console logs)
6. **What Works:** 
   - Does it work in Postman/curl?
   - Does it work in browser?
   - What's the exact curl command that works?

## 4. Test Commands for Backend Team

Ask backend team to test with these exact commands:

### Location Search:
```bash
curl -X GET "https://bamibuildit-backend-v1.onrender.com/api/user/location/search?query=Lagos" \
  -H "Content-Type: application/json"
```

### Reverse Geocoding:
```bash
curl -X GET "https://bamibuildit-backend-v1.onrender.com/api/user/location/current?latitude=6.5244&longitude=3.3792" \
  -H "Content-Type: application/json"
```

**Important:** These endpoints should work WITHOUT authentication (no token required).

## 5. Quick Diagnostic Checklist

- [ ] Check console logs for full request/response details
- [ ] Verify backend URL is correct and accessible
- [ ] Test endpoint directly in browser/Postman
- [ ] Compare request format (headers, query params) between working test and app
- [ ] Check if backend logs show the request arriving
- [ ] Verify response format matches what app expects
- [ ] Check for CORS or network restrictions
- [ ] Verify query parameter names match backend expectations

## 6. Next Steps

1. **Run the app and test location search**
2. **Copy ALL console logs** (from 🔍 to ❌ or ✅)
3. **Share logs with backend team** along with this document
4. **Ask backend team:**
   - "Can you see the request in your server logs?"
   - "What's the exact response your server is sending?"
   - "Does the endpoint work when tested with curl/Postman?"
   - "Are there any differences between how the app calls it vs how you test it?"
