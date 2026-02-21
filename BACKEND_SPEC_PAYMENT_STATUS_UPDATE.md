# Backend Fix: Payment Status Not Updating in Timeline

**Issue:** After the client successfully pays for a service (via wallet), the timeline in both client and provider apps does not update. The payment step remains "Pending" or "Waiting for payment" even though payment was completed.

**Root cause:** When `POST /api/wallet/pay` succeeds, the backend is not updating the service request status. The frontend relies on `request.status` from the API to determine what to show in the timeline. If the status is never updated to `scheduled`, the UI will not reflect that payment was completed.

---

## What the Frontend Expects

After a successful payment:

1. **Client app (OngoingJobDetails):** Timeline should show "Job in Progress" step as active (or "Payment secured") when status is `scheduled`, `in_progress`, or `completed`.
2. **Provider app (ProviderJobDetailsScreen):** Timeline should show "Work Order Assigned" with the **Start** button enabled (green) when status is `scheduled`, `in_progress`, or `completed`.

The frontend determines "payment received" by checking:

```
request.status === 'scheduled' || request.status === 'in_progress' || request.status === 'completed'
```

So after payment succeeds, the request status **must** be updated to `scheduled`.

---

## What the Backend Must Do

### 1. When `POST /api/wallet/pay` succeeds

**Immediately after deducting the amount and recording the transaction:**

- Update the service request with `requestId` to have **status = `scheduled`**
- Update the `updatedAt` timestamp on the request

**Flow:**
1. Validate PIN, amount, request exists
2. Deduct from user wallet
3. Create payment transaction record
4. **Update service request: set status = 'scheduled'**
5. Return success response

### 2. Ensure GET endpoints return the updated status

When the frontend fetches request details after payment (either by navigating back, pull-to-refresh, or auto-refresh), these endpoints must return the updated status:

- **Client:** `GET /api/request-service/requests/:requestId` – must return `status: "scheduled"` after payment
- **Provider:** `GET /api/provider/requests/accepted` – must return `status: "scheduled"` for the paid request (this is the only source the provider app uses)

The response must include the updated `status` and `updatedAt` fields so the timeline can render correctly.

---

## Status Flow (for reference)

| Status       | Meaning                                                                 |
|-------------|-------------------------------------------------------------------------|
| pending     | Request created, no provider selected yet                               |
| accepted    | Provider selected, quotation accepted, **payment not yet made**         |
| **scheduled** | **Quotation accepted AND payment completed (escrow funded).** Provider can now start the job. |
| in_progress | Provider has started the job                                            |
| completed   | Job finished, payment released to provider                              |
| cancelled   | Request cancelled                                                       |

---

## Example: Correct Behavior

**Before payment:**
- Client accepts quotation → request status = `accepted` (or equivalent)
- Provider sees: "Waiting for client to complete payment"
- Client sees: "Complete payment to secure the job"

**Client calls:** `POST /api/wallet/pay` with `{ requestId: 5, amount: 5000, pin: "1234" }`

**Backend must:**
1. Process payment
2. **Set service_request.status = 'scheduled'** for requestId 5
3. Return `{ data: { reference: "...", status: "completed", amount: 5000, balance: ..., requestId: 5 } }`

**After payment (when client/provider refetches):**
- `GET /api/request-service/requests/5` returns `{ ..., status: "scheduled", updatedAt: "..." }`
- Provider sees: "Work Order Assigned" with green **Start** button
- Client sees: "Payment secured. Provider will start the job shortly."

---

## Summary for Backend Team

1. **On successful `POST /api/wallet/pay`:** Update the service request status to `scheduled`.
2. **Ensure GET request-details endpoints** return the current status from the database (no caching that could return stale `accepted` status).
3. **Confirm** that `updatedAt` is also updated when status changes, so the frontend can show "Completed - X ago" correctly.

---

**Once this is fixed, the timeline will update correctly for both client and provider after successful payment.**

---

## Provider Start Button → in_progress

When the provider taps **Start** (after payment is received), the frontend calls:

```
POST /api/provider/requests/:requestId/start
Authorization: Bearer <provider-token>
```

**Backend must:**
1. Verify the provider is the assigned provider for this request
2. Verify the request status is `scheduled` (payment received)
3. Update the service request: **status = 'in_progress'**
4. Update `updatedAt`
5. Return `{ data: { requestId, status: "in_progress", message: "Job started" } }`

If this endpoint does not exist, the app will show a success message but the client and provider timelines will not persist the "Job in progress" state across refreshes.

---

## How to verify the backend

After the client pays, call these endpoints and check `status`:
- `GET /api/request-service/requests/:requestId` (with client token) – must return `status: "scheduled"`
- `GET /api/provider/requests/accepted` (with provider token) – the matching request in the list must have `status: "scheduled"`

If either returns `"accepted"` or `"pending"` after payment, the backend is not updating status correctly.
