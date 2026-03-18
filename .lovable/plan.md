

## Fix: CreditAlertBanner hooks order violation

The error is clear — in `CreditAlertBanner.tsx` line 39, `useNavigate()` is called **after** an early `return null` on line 37. This violates React's rules of hooks (hooks must always be called in the same order).

### Change

**`src/components/cliente/CreditAlertBanner.tsx`**: Move `useNavigate()` to the top of the component, before any conditional returns.

```typescript
export function CreditAlertBanner() {
  const { level, percent, balance, isLoading } = useCreditAlert();
  const [dismissed, setDismissed] = useState(isDismissed);
  const navigate = useNavigate(); // ← move here, before early return

  if (isLoading) return null;
  if (level === "normal" || (dismissed && level !== "zero")) return null;
  // ...rest unchanged
}
```

One line moved, one line deleted. Fixes the crash immediately.

