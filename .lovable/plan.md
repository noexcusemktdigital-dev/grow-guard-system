
# Fix: Lead Created from Chat Not Appearing in CRM

## Root Cause

When clicking "Criar Lead" in a chat conversation, the `handleCreateLead` function (line 183-198 of `ChatConversation.tsx`) creates the lead without a `funnel_id`:

```typescript
const lead = await createLead.mutateAsync({
  name: contact.name || contact.phone,
  phone: contact.phone,
  source: "whatsapp",
  tags: ["whatsapp"],
  // funnel_id is missing!
});
```

The CRM page displays leads grouped by funnel. A lead without a `funnel_id` doesn't belong to any funnel and is invisible in the Kanban/list views.

## Fix

### File: `src/components/cliente/ChatConversation.tsx`

Update `handleCreateLead` to assign the lead to the **default funnel** (or the first available funnel) and set the initial stage to the first stage of that funnel:

```typescript
const handleCreateLead = async () => {
  if (!contact) return;
  try {
    const defaultFunnel = funnelsData?.find(f => f.is_default) || funnelsData?.[0];
    const firstStage = defaultFunnel
      ? (Array.isArray(defaultFunnel.stages) && (defaultFunnel.stages as any[]).length > 0
          ? (defaultFunnel.stages as any[])[0].key || "novo"
          : "novo")
      : "novo";

    const lead = await createLead.mutateAsync({
      name: contact.name || contact.phone,
      phone: contact.phone,
      source: "whatsapp",
      tags: ["whatsapp"],
      funnel_id: defaultFunnel?.id,
      stage: firstStage,
    });
    // ... rest stays the same
  }
};
```

This ensures every lead created from the chat:
1. Gets assigned to the default CRM funnel
2. Starts at the first stage of that funnel
3. Appears immediately in the CRM Kanban/list view

## Scope

| File | Change |
|------|--------|
| `src/components/cliente/ChatConversation.tsx` | Add `funnel_id` and `stage` to `handleCreateLead` |

Single file, ~5 lines changed.
