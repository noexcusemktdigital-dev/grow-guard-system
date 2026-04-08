

# Fix: Google OAuth Login Not Redirecting After Account Selection

## Root Cause
After the user selects their Google account and is redirected back to `/` (SaasAuth page):
1. The `AuthContext` correctly detects the OAuth session on the default Supabase client and transfers it to the custom client (`noe-saas-auth`).
2. The user/session/role state is set correctly in AuthContext.
3. **But `SaasAuth` has no logic to detect that the user is now authenticated and redirect them.** It just keeps showing the login form.

The `handleLogin` function manually calls `navigate("/cliente/inicio")` after email/password login, but there is no equivalent redirect for the Google OAuth flow.

## Fix

### File: `src/pages/SaasAuth.tsx`
Add a `useEffect` that imports `useAuth` and watches for an authenticated user. When `user` is present and `loading` is false, redirect to `/cliente/inicio`:

```typescript
import { useAuth } from "@/contexts/AuthContext";

// Inside the component:
const { user: authUser, loading: authLoading } = useAuth();

useEffect(() => {
  if (!authLoading && authUser) {
    navigate("/cliente/inicio", { replace: true });
  }
}, [authUser, authLoading, navigate]);
```

This handles:
- Google OAuth redirect back (session transfer completes, user appears, redirect fires)
- Direct navigation to `/` when already logged in (immediate redirect)
- No impact on email/password login (which already has its own `navigate` call)

### Summary
- **1 file modified**: `src/pages/SaasAuth.tsx`
- Add `useAuth` import and a redirect `useEffect`
- No database or edge function changes needed

