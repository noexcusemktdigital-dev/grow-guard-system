

# Fix: Chat Layout -- Prevent Parent Scroll Overflow

## Root Cause

The `ClienteLayout` content wrapper (line 17) has `overflow-y-auto flex flex-col`. In a scrollable flex container, children with `flex-1` are allowed to grow beyond the container's viewport -- the parent simply scrolls. When messages load in the conversation panel, the total content height exceeds the viewport and the parent scrolls up, hiding:
- The PageHeader ("CONVERSAS")
- The contact list header with filters
- The conversation header (contact name, avatar)

Previous fixes added `flex-1 min-h-0` but this alone does NOT prevent growth in a scrollable parent. The missing piece is `overflow-hidden` on the chat wrapper, which creates a block formatting context that prevents the element from expanding beyond its flex allocation.

## Fix

### File: `src/pages/cliente/ClienteChat.tsx` (line 122)

Add `overflow-hidden` to the chat page wrapper:

```
Before: "flex flex-col flex-1 min-h-0 gap-3"
After:  "flex flex-col flex-1 min-h-0 overflow-hidden gap-3"
```

This single change ensures:
- The chat div NEVER exceeds its flex-allocated space
- The parent layout div will not scroll
- The internal flex chain (PageHeader shrink-0 + Card flex-1 min-h-0) properly constrains all children
- The contact list ScrollArea scrolls independently within its column
- The messages ScrollArea scrolls independently within its column

No other files need changes. The `ClienteLayout`, `ChatContactList`, and `ChatConversation` components already have the correct internal structure.

## Technical Summary

| File | Line | Change |
|------|------|--------|
| `src/pages/cliente/ClienteChat.tsx` | 122 | Add `overflow-hidden` to wrapper classes |

