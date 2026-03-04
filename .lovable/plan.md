

# Fix: Ref Warnings in Chat Components

## Problem
Console warnings: "Function components cannot be given refs" for `DateSeparator` and `ChatMessageBubble` in `ChatConversation.tsx`.

## Changes

### 1. `src/components/cliente/ChatMessageBubble.tsx`
- Wrap the component export with `React.forwardRef` to accept refs properly.

### 2. `src/components/cliente/ChatConversation.tsx`
- Convert inline `DateSeparator` function component to use `React.forwardRef`.

Both changes are minimal — just wrapping the existing function signatures with `forwardRef` and adding the `ref` parameter to the outer element.

