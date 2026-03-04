

# Fix: Onboarding Data Not Persisting

## Root Cause

The `organizations` table has an RLS policy that only allows `super_admin` to update rows. When a `cliente_admin` user completes the onboarding form, the update to `onboarding_completed = true` silently fails due to RLS, so every time they navigate to `/cliente/inicio`, they get redirected back to onboarding.

## Solution

### 1. Database Migration — Add RLS policy for org members to update their own org

```sql
CREATE POLICY "Members can update own org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (is_member_of_org(auth.uid(), id))
WITH CHECK (is_member_of_org(auth.uid(), id));
```

This allows any authenticated member of an organization to update it (for onboarding, settings, etc.).

### 2. `ClienteOnboardingCompany.tsx` — Skip if already completed

Add a redirect at the top: if `orgData.onboarding_completed === true`, navigate to `/cliente/inicio` immediately. This prevents showing the form again after successful completion.

### 3. `ClienteInicio.tsx` — Handle null gracefully

Change the check from `!(orgData as any).onboarding_completed` to `orgData.onboarding_completed === false` — treating `null` as "not required" to avoid redirect loops for orgs that don't need onboarding (like franqueadora orgs).

### 4. Fix remaining ref warnings

Console shows ref warnings for `ClienteInicio` and `ProgressCtaCard`. Will wrap `ProgressCtaCard` with `forwardRef` to resolve.

## Files

| File | Action |
|------|--------|
| Database migration | Add UPDATE RLS policy on `organizations` |
| `src/pages/cliente/ClienteOnboardingCompany.tsx` | Add redirect when already completed |
| `src/pages/cliente/ClienteInicio.tsx` | Fix null check for `onboarding_completed` |
| `src/components/premium/ProgressCtaCard.tsx` | Wrap with `forwardRef` |

