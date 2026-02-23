

# Filter Out WhatsApp Groups and Broadcasts

## Problem

The database contains contacts that are actually WhatsApp groups and broadcast lists. They can be identified by their `phone` field:
- Groups: phone ends with `-group` (e.g., `120363327736786495-group`)
- Broadcasts: phone is `status@broadcast`

These should not appear in the contact list, should not trigger AI responses, and should not be linkable to CRM leads.

## Solution

### 1. Frontend: Filter groups from contact list

**File: `src/hooks/useWhatsApp.ts`**

Add a filter after fetching contacts to exclude groups and broadcasts:

```typescript
const filtered = (data || []).filter((c: any) => {
  const phone = c.phone || "";
  return !phone.endsWith("-group") && !phone.includes("@broadcast");
});
```

### 2. Backend: Prevent AI from replying to groups

**File: `supabase/functions/ai-agent-reply/index.ts`**

Add an early return at the top of the function when the incoming phone number matches a group or broadcast pattern, so the AI agent never processes group messages.

### 3. Backend: Prevent webhook from creating group contacts (optional improvement)

**File: `supabase/functions/whatsapp-webhook/index.ts`**

Add a check in the webhook handler to skip creating contacts for group/broadcast messages entirely, preventing future pollution of the contacts table.

## Scope

| File | Change |
|------|--------|
| `src/hooks/useWhatsApp.ts` | Filter out group/broadcast contacts from query results |
| `supabase/functions/ai-agent-reply/index.ts` | Skip AI replies for group messages |
| `supabase/functions/whatsapp-webhook/index.ts` | Skip contact creation for group messages |

## Existing Data Cleanup

After the code changes, we can also clean up the existing group contacts from the database if desired.

