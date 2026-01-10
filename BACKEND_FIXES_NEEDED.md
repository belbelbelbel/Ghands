# Backend API Issues - Required Fixes

## Summary
The frontend app is experiencing authentication issues because the backend API is not returning complete data in signup/login responses. This document outlines what needs to be fixed.

---

## Issue 1: Missing User ID in Signup/Login Responses

### Problem
The backend is **NOT returning the user ID** in signup and login responses. This causes the app to show "Unable to identify your account" errors.

### Current Response (Signup)
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": {
      "phoneNumber": null,
      "email": "bendeeee@gmail.com",
      "token": "3484fd98-b271-4824-ba57-af0ab2c8858a"
    }
  }
}
```

### Required Response (Signup)
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": {
      "id": 11,  // ← ADD THIS (user ID)
      "userId": 11,  // ← OR THIS (alternative field name)
      "phoneNumber": null,
      "email": "bendeeee@gmail.com",
      "token": "3484fd98-b271-4824-ba57-af0ab2c8858a"
    }
  }
}
```

### Current Response (Login)
```json
{
  "message": "Login successful",
  "user": {
    "id": 11,
    "email": "bendeee@gmail.com",
    "phoneNumber": "22221440728"
  }
}
```

### Required Response (Login)
```json
{
  "message": "Login successful",
  "user": {
    "id": 11,
    "email": "bendeee@gmail.com",
    "phoneNumber": "22221440728"
  },
  "token": "3484fd98-b271-4824-ba57-af0ab2c8858a"  // ← ADD THIS (token is missing!)
}
```

---

## Issue 2: Missing Token in Login Response

### Problem
The login endpoint returns user data but **NO TOKEN**. The frontend needs the token to make authenticated API calls.

### Fix Required
Add the `token` field to the login response (same as signup).

---

## Issue 3: Token Format

### Current Status
✅ **FIXED ON FRONTEND** - The app now accepts both JWT tokens and UUID tokens.

The backend is currently returning UUID tokens (e.g., `"3484fd98-b271-4824-ba57-af0ab2c8858a"`), which is fine. The frontend has been updated to accept this format.

**No backend change needed** for this issue.

---

## Priority Fixes

### 🔴 CRITICAL (Must Fix)
1. **Add `id` or `userId` field to signup response**
   - Endpoint: `POST /api/user/signup`
   - Field name: `id` or `userId` (number)
   - Location: `response.data.data.id` or `response.data.data.userId`

2. **Add `token` field to login response**
   - Endpoint: `POST /api/user/login`
   - Field name: `token` (string)
   - Location: `response.token` or `response.data.token`

### 🟡 IMPORTANT (Should Fix)
3. **Add `id` or `userId` field to login response** (if not already present)
   - The login response already has `user.id`, but ensure it's accessible at the top level or in `response.data.id`

---

## Why This Matters

Without the user ID:
- Users cannot create service requests
- Users see "Unable to identify your account" errors
- The app cannot associate actions with the logged-in user

Without the token in login:
- Users cannot make authenticated API calls after login
- Protected endpoints return 401 Unauthorized errors
- The app cannot maintain the user's session

---

## Testing Checklist

After backend fixes, verify:
- [ ] Signup response includes `id` or `userId` field
- [ ] Login response includes `token` field
- [ ] Login response includes `id` or `userId` field (or `user.id`)
- [ ] Token is a valid string (UUID or JWT format)
- [ ] User ID is a valid number

---

## Example Correct Responses

### Signup Response (Correct)
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": {
      "id": 11,
      "email": "user@example.com",
      "phoneNumber": "12345678901",
      "token": "3484fd98-b271-4824-ba57-af0ab2c8858a"
    }
  }
}
```

### Login Response (Correct)
```json
{
  "message": "Login successful",
  "user": {
    "id": 11,
    "email": "user@example.com",
    "phoneNumber": "12345678901"
  },
  "token": "3484fd98-b271-4824-ba57-af0ab2c8858a"
}
```

---

## Contact
If you have questions or need clarification, please contact the frontend team.
