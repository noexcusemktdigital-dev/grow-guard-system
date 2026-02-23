
# Fix: Chat Layout Overflow (Definitive)

## Root Cause

The chat grid uses `h-[calc(100vh-160px)]` but it sits inside:
1. `ClienteLayout` content div with `p-6 lg:p-8` padding (~48px)
2. A `PageHeader` component above it (~40px)
3. `ActionAlertsBanner` above that
4. The parent has `overflow-y-auto`, so content just scrolls instead of being constrained

The `100vh - 160px` calculation cannot account for all these dynamic ancestors. When a conversation is selected and messages load, the content overflows the grid cell, the parent detects overflow and scrolls, which hides the contact list off-screen.

## Fix

Replace the fixed `vh` calculation with a proper flex layout that fills the available space automatically.

### File: `src/pages/cliente/ClienteChat.tsx` (connected state return, line 121-154)

Change the wrapper from `space-y-3` (which is just a vertical stack) to a flex column that fills the parent height:

```
Before:
<div className="space-y-3">
  <PageHeader ... />
  <Card>
    <div className="grid ... h-[calc(100vh-160px)] min-h-[500px]">

After:
<div className="flex flex-col h-full gap-3">
  <PageHeader ... />
  <Card className="flex-1 min-h-0 overflow-hidden ...">
    <div className="grid ... h-full">
```

Key changes:
- Outer div: `flex flex-col h-full gap-3` -- fills parent, uses flex
- Card: add `flex-1 min-h-0` -- takes remaining space, prevents overflow
- Grid: replace `h-[calc(100vh-160px)] min-h-[500px]` with just `h-full` -- fills the Card

This way the grid height is determined by the actual available space, not a hardcoded viewport calculation. The flex chain from `ClienteLayout` (h-screen) down through the content div (flex-1 min-h-0) to the chat page (h-full) to the Card (flex-1 min-h-0) to the grid (h-full) will properly constrain everything.

### No other files need changes

The `ClienteLayout` and `ChatConversation` already have the correct overflow containment from the previous fix.

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/cliente/ClienteChat.tsx` line 122 | `space-y-3` to `flex flex-col h-full gap-3` |
| `src/pages/cliente/ClienteChat.tsx` line 129 | Card: add `flex-1 min-h-0` |
| `src/pages/cliente/ClienteChat.tsx` line 130 | Grid: `h-[calc(100vh-160px)] min-h-[500px]` to `h-full` |
