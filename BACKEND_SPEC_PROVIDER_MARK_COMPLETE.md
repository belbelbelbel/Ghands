# Backend Spec: Provider Mark Work Complete

**Purpose:** When the provider finishes the job on site, they tap "Mark as complete". This moves the job status to `reviewing`. The client must then tap "Mark as complete" (endpoint 5.16) to release payment from escrow to the provider.

**Flow:**
1. Status `in_progress` → Provider taps "Mark as complete"
2. Backend updates status to `reviewing`
3. Client sees "Provider finished – Confirm to release payment"
4. Client taps "Mark as complete" → Backend updates status to `completed`, releases escrow to provider

---

## Endpoint: Provider Mark Work Complete

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/provider/requests/:requestId/complete` |
| **Auth** | `Authorization: Bearer <provider-token>` |

**URL Parameters:**
- `requestId` (number, required): Service request ID

**Request Body:** `{}` (empty) or none

**Success Response (200):**
```json
{
  "data": {
    "requestId": 5,
    "status": "reviewing",
    "message": "Work marked complete. Waiting for client to confirm."
  }
}
```

**Preconditions:**
- Request status must be `in_progress`
- Caller must be the assigned provider for this request

**Errors:**
- 400: "Request is not in progress" (e.g. already completed or still scheduled)
- 403: "Not authorized" (not the assigned provider)
- 404: "Request not found"

---

## Status Values (Reference)

| Status | Meaning |
|--------|---------|
| pending | Request submitted |
| inspecting | Visit requested |
| quoting | Quotation sent |
| scheduled | Client accepted quote and paid |
| in_progress | Provider started job (tapped Start) |
| **reviewing** | **Provider marked complete; waiting for client** |
| completed | Client confirmed; funds released |
