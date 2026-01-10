# Provider Setup Endpoint Issue

## Endpoint Causing "Provider not found" Error

**Endpoint:** `PUT /api/provider/:providerId/location`

**Full URL:** `PUT /api/provider/{providerId}/location`

**Example:** `PUT /api/provider/8/location`

## Error Details

**Error Message:** `"Failed to update provider location: Provider not found"`

**Status Code:** `400 Bad Request`

## When This Error Occurs

This error happens during **Provider Profile Setup** screen when:
1. User completes company signup
2. User navigates to Provider Profile Setup
3. User enters business name, location, categories, and description
4. User clicks "Continue"
5. Frontend tries to update provider location using the company ID
6. Backend returns "Provider not found"

## Endpoints Called During Provider Setup

During provider profile setup, the following endpoints are called in order:

### 1. Update Provider Location (FAILING)
- **Endpoint:** `PUT /api/provider/:providerId/location`
- **URL Parameter:** `providerId` (e.g., `8`)
- **Request Body:**
  ```json
  {
    "placeId": "ChIJ..." 
    // OR
    "address": "123 Main Street, Lagos, Nigeria"
  }
  ```
- **Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Status:** ❌ **FAILING** - Returns "Provider not found"

### 2. Add Provider Categories (May also fail)
- **Endpoint:** `POST /api/provider/:providerId/categories`
- **URL Parameter:** `providerId` (e.g., `8`)
- **Request Body:**
  ```json
  {
    "categories": ["plumbing", "electrical"]
  }
  ```
- **Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Status:** ⚠️ **May also fail** if location update fails first

## What the Frontend Sends

**Provider ID:** The company ID from company signup (e.g., `8`)

**Token:** The authentication token from company signup

**Payload Example:**
```json
{
  "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

OR

```json
{
  "address": "123 Main Street, Lagos, Nigeria"
}
```

## The Problem

The backend is checking if a **provider record** exists with the given `providerId`, but:
- Company signup creates a **company record** (not a provider record)
- Company and Provider are supposed to be the **same entity**
- The backend should accept the company ID as a valid provider ID

## Backend Fix Required

The backend needs to:

1. **Accept company ID as provider ID** - Since company and provider are the same entity, the backend should recognize company IDs as valid provider IDs

2. **OR create provider record during company signup** - When a company signs up, also create a corresponding provider record with the same ID

3. **OR use a unified account system** - Treat company accounts as provider accounts automatically

## Expected Behavior

When `PUT /api/provider/8/location` is called:
- Backend should recognize that ID `8` is a company account
- Backend should treat it as a provider account
- Backend should update the location successfully
- Backend should return success response

## Current Backend Response (WRONG)

```json
{
  "success": false,
  "message": "Failed",
  "data": {
    "error": "Failed to update provider location: Provider not found"
  }
}
```

## Expected Backend Response (CORRECT)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "providerId": 8,
    "location": {
      "placeId": "ChIJ...",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "formattedAddress": "123 Main Street, Lagos, Nigeria",
      "address": "123 Main Street, Lagos, Nigeria",
      "city": "Lagos",
      "state": "Lagos State",
      "country": "Nigeria"
    },
    "message": "Location updated successfully"
  }
}
```

## Priority

🔴 **CRITICAL** - This is blocking the provider onboarding flow. Users cannot complete their profile setup after company signup.
