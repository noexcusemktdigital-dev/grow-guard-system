

# Fix: Chat Scroll Bug -- Overflow Containment

## Root Cause Analysis

The scroll doesn't work because CSS overflow containment is broken across multiple parent elements. Even though `ScrollArea` has `min-h-0`, the content overflows because:

1. **`ClienteLayout.tsx`**: The `<main>` element has no height constraint or `overflow-y: hidden`. It grows infinitely with content.
2. **`ClienteLayout.tsx`**: The wrapper `<div className="page-enter p-6 lg:p-8">` also has no height limit -- it grows with its children.
3. **`ClienteChat.tsx`**: The grid has `h-[calc(100vh-160px)]` but the grid **cell** has no `overflow: hidden`, so ChatConversation content spills out.
4. **`ChatConversation.tsx`**: The root `<div className="flex flex-col h-full">` lacks `overflow-hidden`, so messages push the container open.

For CSS flexbox scroll to work, **every ancestor** from the fixed-height container down to the ScrollArea must prevent overflow.

## Fix (3 files, small changes)

### 1. `src/components/ClienteLayout.tsx`
- Add `overflow-hidden` to the `<main>` and make the content wrapper respect height:
  - `<main>`: add `h-screen overflow-hidden flex flex-col`
  - Content div: add `flex-1 min-h-0 overflow-auto` (but for pages like Chat that manage their own scroll, the inner Card handles it)

### 2. `src/pages/cliente/ClienteChat.tsx`
- Add `overflow-hidden` to the grid container so the grid cells clip their children

### 3. `src/components/cliente/ChatConversation.tsx`
- Add `overflow-hidden` to the root `<div>` so the flex column clips properly
- The ScrollArea already has `flex-1 min-h-0` which is correct

## Technical Details

| File | Line | Change |
|------|------|--------|
| `src/components/ClienteLayout.tsx` | 15 | `<main>`: add `h-screen overflow-hidden flex flex-col` |
| `src/components/ClienteLayout.tsx` | 17 | Content div: add `flex-1 min-h-0 overflow-y-auto` |
| `src/pages/cliente/ClienteChat.tsx` | 130 | Grid container: add `overflow-hidden` |
| `src/components/cliente/ChatConversation.tsx` | 272 | Root div: change to `flex flex-col h-full overflow-hidden` |

These are all CSS-only changes (adding overflow containment classes). No logic changes needed.

