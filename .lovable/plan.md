
# Fix: Chat Layout -- Definitive Overflow Fix

## Problem

When clicking a conversation, the entire chat page scrolls up inside the `ClienteLayout` content wrapper, hiding the PageHeader, filters, and contact list header. This happens because:

1. `ClienteLayout` content div has `overflow-y-auto` (it scrolls)
2. Chat page uses `h-full` (= 100% of parent height)
3. But the PageHeader sits above, so total content = PageHeader + 100% = more than available space
4. Parent scrolls, pushing everything up

## Solution

Two small CSS changes to create a proper flex chain:

### 1. `src/components/ClienteLayout.tsx` (line 17)
Add `flex flex-col` to the content wrapper div so child pages can use `flex-1` to fill remaining space.

```
Before: "flex-1 min-h-0 overflow-y-auto page-enter p-6 lg:p-8"
After:  "flex-1 min-h-0 overflow-y-auto flex flex-col page-enter p-6 lg:p-8"
```

Other pages are unaffected -- they use natural height and the parent scrolls normally.

### 2. `src/pages/cliente/ClienteChat.tsx` (line 122)
Replace `h-full` with `flex-1 min-h-0` so the chat fills only the **remaining** space after PageHeader, instead of claiming 100% of parent.

```
Before: "flex flex-col h-full gap-3"
After:  "flex flex-col flex-1 min-h-0 gap-3"
```

This way the flex chain is: Layout (h-screen) -> content div (flex-1, flex-col) -> PageHeader (auto height) -> Card (flex-1 min-h-0) -> grid (h-full). Everything stays within bounds.

## Technical Summary

| File | Line | Change |
|------|------|--------|
| `src/components/ClienteLayout.tsx` | 17 | Add `flex flex-col` to content wrapper classes |
| `src/pages/cliente/ClienteChat.tsx` | 122 | Replace `h-full` with `flex-1 min-h-0` |
