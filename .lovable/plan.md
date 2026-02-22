

## Remove the Top-Level Switch (TopSwitch)

The three-tab switcher (FRANQUEADORA / FRANQUEADO / CLIENTE FINAL) in the global header contradicts the role-based access control architecture. Each area is accessed exclusively based on the user's role, so there should be no way to "switch" between them in the UI.

### Changes

**1. Remove TopSwitch from the header (`src/pages/Index.tsx`)**
- Remove the `TopSwitch` import and component rendering
- Remove the `level`, `setLevel`, `handleLevelChange`, and `showSwitch` state/logic
- Keep the header with GlobalSearch, NotificationBell, UserMenu, and ThemeToggle

**2. Delete the TopSwitch component (`src/components/TopSwitch.tsx`)**
- This file is no longer needed

### What stays the same
- Role-based routing and redirects (ProtectedRoute) remain unchanged
- Each role still lands on its correct dashboard automatically
- The header retains search, notifications, user menu, and theme toggle

### Technical Details

In `src/pages/Index.tsx`, the header simplifies to:
```
<header>
  <div className="flex items-center justify-between h-14 px-4">
    <div className="flex-1 flex items-center">
      <GlobalSearch />
    </div>
    <div className="flex-1 flex items-center justify-end gap-1.5">
      <NotificationBell />
      <UserMenu />
      <ThemeToggle />
    </div>
  </div>
</header>
```

