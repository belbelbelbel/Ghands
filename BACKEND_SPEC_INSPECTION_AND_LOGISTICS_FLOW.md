oayment succesful , you can aos write the document for the backedn so i can copy and past to thenm to fix ti leave if theer is incosnstency work on it 
# Backend Specification: Inspection Flow & Logistics Fee

**Purpose:** This document describes everything the backend must implement for the "Request Visit" (inspection-first) flow. It merges provider scheduling and client payment into one flow.

**IMPORTANT TERMINOLOGY:**  
In this flow, the **logistics fee** = the amount the provider charges for traveling to inspect the job. The client pays this logistics fee before the provider visits. It is the same field as `logisticsCost`.

---

## Table of Contents

1. [Overview: What Is This Flow?](#1-overview-what-is-this-flow)
2. [End-to-End Flow Diagram](#2-end-to-end-flow-diagram)
3. [Endpoint 1: Provider Requests Visit](#3-endpoint-1-provider-requests-visit)
4. [Endpoint 2: Client Pays Logistics Fee](#4-endpoint-2-client-pays-logistics-fee)
5. [Include Visit & Logistics Data in Request Details](#5-include-visit--logistics-data-in-request-details)
6. [Request Status Values](#6-request-status-values)
7. [Transaction History](#7-transaction-history)
8. [Summary: Exact Requests & Responses](#8-summary-exact-requests--responses)

---

## 1. Overview: What Is This Flow?

When a provider accepts a service request, they can choose:

- **Option A:** "Send Quote" → Provider sends quotation directly (existing flow, works today).
- **Option B:** "Request Visit" → Provider schedules an inspection visit and sets a **logistics fee**. The client must pay this logistics fee before the provider visits. After the visit, the provider sends a quotation (same as Option A from that point).

This spec covers **Option B** only. The backend must support:

1. Provider scheduling a visit (date, time, logistics fee).
2. Client paying the logistics fee from their wallet.
3. Exposing visit and logistics data so both provider and client can see it.

---

## 2. End-to-End Flow Diagram

```
[Provider] Accepts request → Clicks "Request Visit"
       ↓
[Provider] Submits: date, time, logisticsCost (logistics fee in NGN)
       ↓
[Backend] POST /api/provider/requests/:requestId/request-visit
       ↓
[Backend] Stores visit; status → "inspecting"; logisticsStatus → "pending_payment"
       ↓
[Client] Sees job with "Pay Logistics Fee (₦5,000)" button
       ↓
[Client] Enters PIN, confirms payment
       ↓
[Backend] POST /api/wallet/pay-logistics-fee
       ↓
[Backend] Deducts from wallet; logisticsStatus → "paid"
       ↓
[Provider] Visits; then sends quotation (existing flow)
       ↓
[Client] Accepts quote, pays main service (existing flow)
```

---

## 3. Endpoint 1: Provider Requests Visit

**When:** Provider has accepted the request and chosen "Request Visit". They submit date, time, and logistics fee.

### Request

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/provider/requests/:requestId/request-visit` |
| **Base URL** | `https://bamibuildit-backend-v1.onrender.com` (or your configured base) |
| **Auth** | `Authorization: Bearer <provider-token>` |
| **Content-Type** | `application/json` |

**URL Parameters:**
- `requestId` (number, required): Service request ID

**Request Body:**
```json
{
  "scheduledDate": "2025-02-25",
  "scheduledTime": "10:00 AM",
  "logisticsCost": 5000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduledDate | string | Yes | `YYYY-MM-DD` |
| scheduledTime | string | Yes | `"HH:MM AM/PM"` (e.g. `"09:00 AM"`, `"02:00 PM"`) |
| logisticsCost | number | Yes | Logistics fee in NGN (transportation/inspection cost) |

### Success Response (200)

We expect this structure so we can show success and refresh the screen:

```json
{
  "data": {
    "requestId": 5,
    "scheduledDate": "2025-02-25",
    "scheduledTime": "10:00 AM",
    "logisticsCost": 5000,
    "logisticsStatus": "pending_payment",
    "message": "Visit request submitted successfully. Waiting for client to pay logistics fee."
  }
}
```

| Field | Description |
|-------|-------------|
| requestId | Same as in URL |
| scheduledDate | Echo of what was sent |
| scheduledTime | Echo of what was sent |
| logisticsCost | Echo of what was sent |
| logisticsStatus | `"pending_payment"` until client pays |
| message | Optional; used for toast/success message |

### Error Responses

Return `{ "error": "Error message" }` with appropriate HTTP status (4xx):

| Error | When |
|-------|------|
| `"You must accept the request before requesting a visit"` | Provider has not accepted this request |
| `"Service request not found"` | Invalid requestId |
| `"You have not accepted this request"` | Provider is not in accepted providers |
| `"A visit has already been requested for this request"` | Visit already exists |
| `"Logistics cost must be a positive number"` | logisticsCost <= 0 |
| `"Scheduled date cannot be in the past"` | scheduledDate is in the past |

### Backend Logic

1. Verify provider has accepted this request.
2. Ensure request is in a valid status (e.g. pending or equivalent).
3. Create/update visit record: requestId, providerId (from token), scheduledDate, scheduledTime, logisticsCost.
4. Set `logisticsStatus` to `"pending_payment"`.
5. Optionally set request status to `"inspecting"`.

---

## 4. Client Decline Visit (Optional)

**When:** Client declines the provider's visit request. Provider can then send a quotation directly without visiting.

**Endpoint (suggested):** `POST /api/request-service/requests/:requestId/decline-visit`

**Request:** No body required (or empty `{}`). User ID from token.

**Response (Success):**
```json
{
  "data": {
    "requestId": 5,
    "visitStatus": "declined",
    "message": "Visit declined. Provider can send quotation directly."
  }
}
```

**Backend logic:** Set `visitRequest.logisticsStatus` to `"cancelled"` or add `"declined"` status. Provider should see that the visit was declined and can proceed to send quotation without visiting.

---

## 5. Endpoint 2: Client Pays Logistics Fee

**When:** Client taps "Pay Logistics Fee" and confirms with PIN. This pays the `logisticsCost` the provider set when requesting the visit.

### Request

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/wallet/pay-logistics-fee` |
| **Base URL** | Same as above |
| **Auth** | `Authorization: Bearer <user-token>` |
| **Content-Type** | `application/json` |

**Request Body:**
```json
{
  "requestId": 5,
  "amount": 5000,
  "pin": "1234"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| requestId | number | Yes | Service request ID that has a pending visit |
| amount | number | Yes | Must exactly match `logisticsCost` from the visit request |
| pin | string | Yes | User's 4-digit wallet PIN |

### Success Response (200)

```json
{
  "data": {
    "reference": "LOG_abc123xyz",
    "status": "completed",
    "amount": 5000.00,
    "balance": 45000.00,
    "requestId": 5,
    "logisticsStatus": "paid",
    "message": "Logistics fee paid successfully. Provider has been notified."
  }
}
```

| Field | Description |
|-------|-------------|
| reference | Unique transaction reference (we show this in success screen) |
| status | `"completed"` or `"pending"` |
| amount | Amount paid |
| balance | User's wallet balance after payment |
| requestId | Same as in request |
| logisticsStatus | Must be `"paid"` |
| message | Optional; for success toast |

### Error Responses

| Error | When |
|-------|------|
| `"Invalid PIN"` | PIN verification failed |
| `"Insufficient balance"` | User's wallet balance < amount |
| `"Service request not found"` | Invalid requestId |
| `"No visit has been requested for this service request"` | No visit record exists |
| `"Logistics fee has already been paid"` | logisticsStatus is already "paid" |
| `"Amount does not match logistics fee. Expected 5000."` | amount != stored logisticsCost |
| `"You are not authorized to pay for this request"` | Request does not belong to this user |

### Backend Logic

1. Verify user from token.
2. Verify request exists and belongs to this user.
3. Verify a visit exists with `logisticsStatus` = `"pending_payment"`.
4. Verify `amount` exactly matches stored `logisticsCost`.
5. Verify PIN.
6. Deduct amount from user wallet.
7. Create transaction with type `"logistics_fee_payment"` (or similar).
8. Update visit: `logisticsStatus` = `"paid"`.
9. Optionally credit provider or hold per your business rules.
10. Return success payload above.

**Note:** This payment is separate from the main service payment (POST `/api/wallet/pay`). The main payment happens later, after the client accepts the quotation.

---

## 6. Include Visit & Logistics Data in Request Details

Both provider and client need visit and logistics info when they fetch request details. You already have endpoints like:

- `GET /api/request-service/requests/:requestId` (client)
- Provider equivalent for job/request details

**Add this to the response when a visit has been requested:**

```json
{
  "data": {
    "id": 5,
    "jobTitle": "Kitchen faucet repair",
    "status": "inspecting",
    "scheduledDate": "2025-02-25",
    "scheduledTime": "10:00 AM",
    "logisticsCost": 5000,
    "logisticsStatus": "pending_payment",
    "visitRequestedAt": "2025-02-19T14:30:00.000Z"
  }
}
```

Or nested:

```json
{
  "data": {
    "id": 5,
    "jobTitle": "Kitchen faucet repair",
    "status": "inspecting",
    "visitRequest": {
      "scheduledDate": "2025-02-25",
      "scheduledTime": "10:00 AM",
      "logisticsCost": 5000,
      "logisticsStatus": "pending_payment",
      "requestedAt": "2025-02-19T14:30:00.000Z"
    }
  }
}
```

**How we use it:**

| logisticsStatus | Client sees | Provider sees |
|-----------------|-------------|---------------|
| `pending_payment` | "Pay Logistics Fee (₦5,000)" button | "Waiting for client to pay logistics fee" |
| `paid` | "Visit confirmed - [date] @ [time]" | "Visit confirmed. Proceed with inspection." |

Use either flat or nested structure; we will adapt. Just ensure `scheduledDate`, `scheduledTime`, `logisticsCost`, and `logisticsStatus` are present.

---

## 7. Request Status Values

Our timeline uses these statuses. Use equivalents if your system uses different names:

| Status | Meaning |
|--------|---------|
| pending | Request submitted; providers can accept |
| inspecting | Provider requested visit; client may or may not have paid logistics fee |
| quoting | Provider sent quotation (or skipped visit and sent quote) |
| scheduled | Client accepted quote and paid main service (escrow funded) |
| in_progress | Provider started job |
| reviewing | Provider marked complete; waiting for client confirmation |
| completed | Client confirmed; funds released |

When a visit is requested, set status to `inspecting` (or your equivalent).

---

## 8. Transaction History

When the client pays the logistics fee, create a transaction so it appears in `GET /api/wallet/transactions`.

**Transaction type:** Add `"logistics_fee_payment"` (or similar).

**Example transaction object:**
```json
{
  "id": 123,
  "type": "logistics_fee_payment",
  "amount": 5000.00,
  "status": "completed",
  "requestId": 5,
  "narration": "Logistics fee - Kitchen faucet repair",
  "createdAt": "2025-02-19T15:00:00.000Z"
}
```

---

## 9. Summary: Exact Requests & Responses

### Request 1 – Provider submits visit

```
POST /api/provider/requests/5/request-visit
Authorization: Bearer <provider-jwt>
Content-Type: application/json

{
  "scheduledDate": "2025-02-25",
  "scheduledTime": "10:00 AM",
  "logisticsCost": 5000
}
```

**Expected success (200):**
```json
{
  "data": {
    "requestId": 5,
    "scheduledDate": "2025-02-25",
    "scheduledTime": "10:00 AM",
    "logisticsCost": 5000,
    "logisticsStatus": "pending_payment",
    "message": "Visit request submitted successfully. Waiting for client to pay logistics fee."
  }
}
```

---

### Request 2 – Client pays logistics fee

```
POST /api/wallet/pay-logistics-fee
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "requestId": 5,
  "amount": 5000,
  "pin": "1234"
}
```

**Expected success (200):**
```json
{
  "data": {
    "reference": "LOG_abc123xyz",
    "status": "completed",
    "amount": 5000.00,
    "balance": 45000.00,
    "requestId": 5,
    "logisticsStatus": "paid",
    "message": "Logistics fee paid successfully. Provider has been notified."
  }
}
```

---

### GET request details – include visit/logistics

When we call `GET /api/request-service/requests/:requestId` (or your provider equivalent), the response must include when a visit exists:

- `scheduledDate`
- `scheduledTime`
- `logisticsCost`
- `logisticsStatus` (`"pending_payment"` or `"paid"`)

---

**Questions?** Reply with the endpoint paths and response shapes you implement so we can wire the frontend correctly.
