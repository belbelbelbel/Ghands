# G-Hands Backend Specification – Critical for App to Work

**Copy this entire document and send to your backend team.** These fixes are required for the client–provider flow to work correctly in production.

---

## Endpoint Overview: What We Have vs What We Need

### Endpoints the app already calls (must work)

| Endpoint | Method | Used for |
|----------|--------|----------|
| `/api/request-service/requests/:requestId` | GET | Client & provider get job details |
| `/api/request-service/requests` | GET | Client list of requests |
| `/api/request-service/requests/:requestId/quotations` | GET | Get quotations for a request |
| `/api/request-service/quotations/:quotationId/accept` | POST | Client accepts quotation |
| `/api/request-service/requests/:requestId/complete` | PUT | **Client** marks job complete (releases payment) |
| `/api/wallet/pay` | POST | Client pays for service |
| `/api/provider/requests/available` | GET | Provider sees new requests |
| `/api/provider/requests/accepted` | GET | Provider sees accepted jobs |
| `/api/provider/requests/:requestId/accept` | POST | Provider accepts request |
| `/api/provider/requests/:requestId/reject` | POST | Provider rejects request |
| `/api/request-service/requests/:requestId/quotation` | POST | Provider sends quotation |
| `/api/communication/requests/:requestId/messages` | GET, POST | Chat between client and provider |

### New or modified endpoints we need

| Endpoint | Method | Status | What backend must do |
|----------|--------|--------|----------------------|
| `/api/wallet/pay` | POST | **Fix existing** | Add: when payment succeeds, set `request.status = 'scheduled'` |
| `/api/provider/requests/:requestId/start` | POST | **Implement if missing** | Set `request.status = 'in_progress'` |
| `/api/provider/requests/:requestId/complete` | POST | **NEW – implement** | Set `request.status = 'reviewing'` |
| `/api/provider/requests/:requestId/request-visit` | POST | Implement if missing | Store visit, set status to `inspecting` |
| `/api/wallet/pay-logistics-fee` | POST | Implement if missing | Deduct wallet, set `logisticsStatus = 'paid'` |

### GET endpoints – must return up-to-date status

These must always return the latest `status` from the database (no stale cache):

- `GET /api/request-service/requests/:requestId`
- `GET /api/provider/requests/accepted`

---

## Summary of Required Changes

| # | What | Endpoint | Priority |
|---|------|----------|----------|
| 1 | Update request status when client pays | `POST /api/wallet/pay` (side effect) | **CRITICAL** |
| 2 | Provider marks work complete | `POST /api/provider/requests/:requestId/complete` | **CRITICAL** |
| 3 | Provider starts job | `POST /api/provider/requests/:requestId/start` | **CRITICAL** |
| 4 | Client confirms and releases payment | `PUT /api/request-service/requests/:requestId/complete` | Likely exists |
| 5 | Visit request + logistics fee | See Inspection Flow section | Important |

---

## 1. Payment Status Update (CRITICAL)

**Problem:** After the client pays via wallet, the app still shows "Waiting for payment" because the request status is not updated.

**What the backend must do:** When `POST /api/wallet/pay` succeeds, update the service request status to `scheduled`.

### Flow

1. Client calls: `POST /api/wallet/pay`  
   ```json
   { "requestId": 5, "amount": 5000, "pin": "1234" }
   ```
2. Backend: validate PIN, deduct wallet, create transaction
3. **Backend: set `service_request.status = 'scheduled'` for the given requestId**
4. Backend: update `service_request.updatedAt`
5. Return: `{ "data": { "reference": "...", "status": "completed", "amount": 5000, "balance": ..., "requestId": 5 } }`

### Why this matters

- Provider sees "Work Order Assigned" with a green **Start** button only when `status === 'scheduled'`.
- Client sees "Payment secured" only when `status === 'scheduled'`.
- If status stays `accepted` after payment, both apps show incorrect UI.

### Verification

After payment, call:

- `GET /api/request-service/requests/:requestId` (client token)
- `GET /api/provider/requests/accepted` (provider token)

Both must return `status: "scheduled"` for the paid request.

---

## 2. Provider Mark Work Complete (CRITICAL – likely missing)

**Purpose:** When the provider finishes the job, they tap "Mark as complete". This moves the job to `reviewing` so the client can confirm and release payment.

### Endpoint

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `/api/provider/requests/:requestId/complete` |
| **Auth** | `Authorization: Bearer <provider-token>` |
| **Content-Type** | `application/json` |

**Request body:** `{}` (empty) or omit

**Success (200):**
```json
{
  "data": {
    "requestId": 5,
    "status": "reviewing",
    "message": "Work marked complete. Waiting for client to confirm."
  }
}
```

**Logic:**
1. Resolve provider from JWT.
2. Check request exists and provider is the assigned provider.
3. Check request status is `in_progress`.
4. Update: `service_request.status = 'reviewing'`
5. Update `updatedAt`.
6. Return the response above.

**Errors:**
- 400: "Request is not in progress" (e.g. still `scheduled` or already `completed`)
- 403: "Not authorized to complete this request"
- 404: "Request not found"

---

## 3. Provider Start Job (CRITICAL – may exist)

**Purpose:** Provider taps "Start" after payment is received. Job status moves from `scheduled` to `in_progress`.

### Endpoint

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `/api/provider/requests/:requestId/start` |
| **Auth** | `Authorization: Bearer <provider-token>` |

**Success (200):**
```json
{
  "data": {
    "requestId": 5,
    "status": "in_progress",
    "message": "Job started successfully."
  }
}
```

**Logic:**
1. Verify provider is assigned to the request.
2. Verify request status is `scheduled` (payment received).
3. Update: `service_request.status = 'in_progress'`
4. Update `updatedAt`.
5. Return the response above.

---

## 4. Client Complete (Likely Exists – Endpoint 5.16)

**Purpose:** Client confirms the job is done and releases payment from escrow to the provider.

| Field | Value |
|-------|-------|
| **Method** | `PUT` |
| **URL** | `/api/request-service/requests/:requestId/complete` |
| **Auth** | `Authorization: Bearer <user-token>` |

**Logic:**
1. Verify request status is `in_progress` or `reviewing`.
2. Update: `service_request.status = 'completed'`
3. Transfer escrow funds to provider wallet.
4. Update `updatedAt`.
5. Return `{ "data": { "id": 5, "status": "completed", "message": "..." } }`

---

## 5. Status Flow (Reference)

| Status | Meaning |
|--------|---------|
| pending | Request created, no provider selected |
| accepted | Provider selected, quotation accepted, payment not yet made |
| inspecting | Provider requested visit; client may or may not have paid logistics fee |
| quoting | Provider sent quotation |
| **scheduled** | **Client accepted quote and paid (escrow funded). Provider can start.** |
| **in_progress** | **Provider tapped Start; job ongoing** |
| **reviewing** | **Provider tapped "Mark as complete"; waiting for client to confirm** |
| **completed** | **Client confirmed; funds released to provider** |
| cancelled | Request cancelled |

**Important:** After `POST /api/wallet/pay` succeeds → status must be `scheduled`.  
**Important:** After provider "Mark as complete" → status must be `reviewing`.  
**Important:** After client "Mark as complete" → status must be `completed` and escrow released.

---

## 6. GET Endpoints Must Return Current Status

These endpoints must return the latest `status` and `updatedAt` from the database (no stale caching):

- `GET /api/request-service/requests/:requestId` (client)
- `GET /api/provider/requests/accepted` (provider)
- `GET /api/request-service/requests` (user's requests)

If a request was just paid or just completed, the next GET must reflect the new status.

---

## 7. Visit Request & Logistics Fee (Inspection Flow)

If the "Request Visit" flow is not yet implemented, the app needs:

### 7a. Provider requests visit

```
POST /api/provider/requests/:requestId/request-visit
Authorization: Bearer <provider-token>
Content-Type: application/json

{
  "scheduledDate": "2025-02-25",
  "scheduledTime": "10:00 AM",
  "logisticsCost": 5000
}
```

**Success:** Store visit; set request status to `inspecting`; set `logisticsStatus: "pending_payment"`.

### 7b. Client pays logistics fee

```
POST /api/wallet/pay-logistics-fee
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "requestId": 5,
  "amount": 5000,
  "pin": "1234"
}
```

**Success:** Deduct from wallet; set `logisticsStatus: "paid"` on the visit/request.

### 7c. Request details must include visit data

When calling `GET /api/request-service/requests/:requestId` or provider equivalent, the response should include:

- `visitRequest` or nested object with: `scheduledDate`, `scheduledTime`, `logisticsCost`, `logisticsStatus` (`"pending_payment"` or `"paid"`)

Full details: see `BACKEND_SPEC_INSPECTION_AND_LOGISTICS_FLOW.md` in the repo.

---

## 8. Quick Verification Checklist

After implementing, verify:

1. **Payment:** Client pays → `GET` returns `status: "scheduled"` ✓
2. **Start:** Provider taps Start → `GET` returns `status: "in_progress"` ✓
3. **Provider complete:** Provider taps "Mark as complete" → `GET` returns `status: "reviewing"` ✓
4. **Client complete:** Client taps "Mark as complete" → `GET` returns `status: "completed"` ✓
5. **Escrow:** After client complete, provider wallet balance increases ✓

---

## 9. Base URL (if needed)

Current backend base: `https://bamibuildit-backend-v1.onrender.com` (or as configured in the app).

---

ix	What	Priority
1	Update request status to scheduled when POST /api/wallet/pay succeeds	Critical
2	Add POST /api/provider/requests/:requestId/complete (provider marks work complete → reviewing)	Critical
3	Ensure POST /api/provider/requests/:requestId/start updates status to in_progress	Critical
4	Confirm client PUT .../complete works when status is reviewing	Critical
5	Visit request + logistics fee flow

**End of specification.** Questions? Reply with endpoint paths and response shapes so we can align the frontend.
