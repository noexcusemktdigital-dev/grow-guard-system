
# Fix: Chat Conversas - Layout, IA Badge, and Proportions

## Issues Identified

1. **PageHeader cut off**: When conversation is selected, the flex layout pushes the header partially off-screen. The parent `overflow-y-auto` scrolls but the `flex-1 min-h-0` on the chat container compresses the PageHeader.

2. **False "IA" badge on all contacts**: The code defaults `attending_mode` to `"ai"` when the field is null/undefined (line 51 in ChatContactList, line 74 in ChatConversation). Since new contacts have no `attending_mode` set, they all appear as "being attended by IA" even when there are zero active agents.

3. **Message bubbles too wide**: The `max-w-[75%]` on ChatMessageBubble allows AI-generated messages to stretch across most of the screen. Need a pixel cap (e.g. `max-w-[520px]`) alongside the percentage.

4. **Profile photos not showing**: The Avatar uses `contact.photo_url` correctly, but most contacts have null photos. The whatsapp-webhook should be saving `photo_url` from Z-API data. This is likely a data/webhook issue, but the UI code is correct (it shows initials as fallback).

---

## Fixes

### 1. `src/pages/cliente/ClienteChat.tsx`

Remove the PageHeader from inside the flex-constrained container. The PageHeader should NOT be inside the flex-1 div. Instead, make the PageHeader a fixed-height element and only the Card should flex.

Change the return (line 121-154):
```
Before:
<div className="flex flex-col flex-1 min-h-0 gap-3">
  <PageHeader ... />
  <Card className="flex-1 min-h-0 ...">

After:
<div className="flex flex-col flex-1 min-h-0 gap-3">
  <div className="shrink-0">
    <PageHeader ... />
  </div>
  <Card className="flex-1 min-h-0 ...">
```

The `shrink-0` prevents the PageHeader from being compressed by the flex layout.

### 2. `src/components/cliente/ChatContactList.tsx` (line 51, 176)

Change the default `attending_mode` from `"ai"` to `null`, and only show the IA/Humano badge when the mode is explicitly set:

```
Before: const mode = contactAny.attending_mode || "ai";
After:  const mode = contactAny.attending_mode || null;
```

Update the badge indicator (line 210-214): Only show the AI/Human icon indicator when `mode` is explicitly set. If `mode` is null, show a neutral indicator.

### 3. `src/components/cliente/ChatConversation.tsx` (line 74)

Same fix for the conversation header:
```
Before: const attendingMode = contactAny?.attending_mode || "ai";
After:  const attendingMode = contactAny?.attending_mode || null;
```

Update the header badge (line 293-297) to only show when `attendingMode` is explicitly set.

### 4. `src/components/cliente/ChatMessageBubble.tsx` (line 62)

Add a max pixel width to prevent overly wide bubbles:
```
Before: max-w-[75%]
After:  max-w-[75%] lg:max-w-[520px]
```

---

## Technical Summary

| File | Line(s) | Change |
|------|---------|--------|
| `src/pages/cliente/ClienteChat.tsx` | 123-127 | Wrap PageHeader in `shrink-0` div |
| `src/components/cliente/ChatContactList.tsx` | 51, 176, 210-214 | Default mode to null, show neutral badge when unset |
| `src/components/cliente/ChatConversation.tsx` | 74, 293-297, 300-307 | Default mode to null, hide IA/Humano badge and "Assumir" button when unset |
| `src/components/cliente/ChatMessageBubble.tsx` | 62 | Add `lg:max-w-[520px]` cap on bubble width |
