

# Fix: Login Page Flickering (Infinite Reload Loop)

## Root Cause

When a **franchise user** (logged in with `noe-franchise-auth` token) visits `/` (SaaS login page):

1. `getPortalStorageKey()` in `lib/supabase.ts` detects `hasFranchise && !hasSaas` → returns `"noe-franchise-auth"`
2. `PORTAL_STORAGE_KEY` is set to `"noe-franchise-auth"`
3. The guard in `SaasAuth.tsx` (line 62) sees `PORTAL_STORAGE_KEY !== "noe-saas-auth"` → calls `window.location.replace()`
4. Page reloads → same detection → same reload → **infinite loop = flickering**

Additionally, the new `useEffect` (line 52-56) detects `authUser` (the franchise user) and tries to redirect to `/cliente/inicio`, but the franchise user doesn't have SaaS roles, so `ProtectedRoute` bounces them back, compounding the instability.

## Fix

### 1. `src/pages/SaasAuth.tsx` — Remove the reload guard and fix redirect logic
- **Remove** the `window.location.replace()` guard (lines 61-65) — it causes the infinite loop when a franchise token exists
- **Update** the auth redirect `useEffect` to check the user's **role** before redirecting:
  - If user has a SaaS role (`cliente_admin`/`cliente_user`) → redirect to `/cliente/inicio`
  - If user has a franchise role → redirect to their franchise portal (`/franqueado/inicio` or `/franqueadora/inicio`)
  - If no role yet (still loading) → don't redirect

### 2. `src/pages/Auth.tsx` — Same fix for franchise login page
- **Remove** the equivalent `window.location.replace()` guard (lines 40-44) to prevent the same infinite loop scenario when a SaaS user visits `/acessofranquia`
- Add role-aware redirect for already-authenticated users

## Technical Details

```typescript
// SaasAuth.tsx — REPLACE the two useEffects with:
const { user: authUser, role: authRole, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return;
  if (!authUser) return;
  
  // Already authenticated — redirect based on role
  if (authRole === "cliente_admin" || authRole === "cliente_user") {
    navigate("/cliente/inicio", { replace: true });
  } else if (authRole === "super_admin" || authRole === "admin") {
    navigate("/franqueadora/inicio", { replace: true });
  } else if (authRole === "franqueado") {
    navigate("/franqueado/inicio", { replace: true });
  }
  // If role is null but user exists, wait for role to resolve
}, [authUser, authRole, authLoading, navigate]);
```

## Files Modified
1. `src/pages/SaasAuth.tsx` — remove reload guard, add role-aware redirect
2. `src/pages/Auth.tsx` — remove reload guard, add role-aware redirect

