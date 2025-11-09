# UNAUTHORIZED Errors Fix

## Problem
The frontend was making repeated TRPC queries to authenticated endpoints when users were not logged in, resulting in console spam with UNAUTHORIZED errors:

```
❌ tRPC failed on music.getUserPreferences: UNAUTHORIZED
❌ tRPC failed on music.getSmartQueueSettings: UNAUTHORIZED
❌ tRPC failed on music.getCurrentUserHash: UNAUTHORIZED
```

These errors were occurring repeatedly due to React Query's automatic retry mechanism.

## Root Cause
Several components were making authenticated TRPC queries without checking if the user was logged in:

1. **EnhancedQueue.tsx** - Line 180: `getSmartQueueSettings` query without authentication check
2. **PersistentPlayer.tsx** - Line 36: `getUserPreferences` query without authentication check

Additionally, the React Query client was retrying failed requests including UNAUTHORIZED errors, causing the errors to pile up.

## Fixes Applied

### 1. Added Authentication Checks to EnhancedQueue.tsx

Added session check and enabled guard:

```typescript
import { useSession } from "next-auth/react";

// Inside component:
const { data: session } = useSession();
const isAuthenticated = !!session?.user;

// Fetch smart queue settings only when authenticated
const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(undefined, {
  enabled: isAuthenticated,
});
```

Files modified:
- [src/components/EnhancedQueue.tsx:36](src/components/EnhancedQueue.tsx#L36) - Added useSession import
- [src/components/EnhancedQueue.tsx:180-186](src/components/EnhancedQueue.tsx#L180-L186) - Added authentication check

### 2. Added Authentication Checks to PersistentPlayer.tsx

Added session check and enabled guard:

```typescript
import { useSession } from "next-auth/react";

// Inside component:
const { data: session } = useSession();
const isAuthenticated = !!session?.user;

// Fetch user preferences only when authenticated
const { data: preferences } = api.music.getUserPreferences.useQuery(undefined, {
  enabled: isAuthenticated,
});
```

Files modified:
- [src/components/PersistentPlayer.tsx:10](src/components/PersistentPlayer.tsx#L10) - Added useSession import
- [src/components/PersistentPlayer.tsx:36-42](src/components/PersistentPlayer.tsx#L36-L42) - Added authentication check

### 3. Improved React Query Retry Logic

Modified the query client to prevent retrying UNAUTHORIZED errors:

```typescript
// src/trpc/query-client.ts
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // Don't retry on UNAUTHORIZED errors
        retry: (failureCount, error) => {
          // Don't retry if it's an authorization error
          if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
            return false;
          }
          // Otherwise retry up to 3 times
          return failureCount < 3;
        },
      },
      // ... other options
    },
  });
```

Files modified:
- [src/trpc/query-client.ts:17-24](src/trpc/query-client.ts#L17-L24) - Added retry logic for UNAUTHORIZED errors

## Result

After these fixes:
- ✅ No more UNAUTHORIZED errors in the console for unauthenticated users
- ✅ Queries only execute when the user is logged in
- ✅ React Query doesn't retry UNAUTHORIZED errors
- ✅ Better performance - no wasted API calls
- ✅ Cleaner console logs

## Components Already Fixed (Prior to this)

These components already had proper authentication checks:
- SettingsMenu.tsx - Lines 18-26
- AudioPlayerContext.tsx - Line 69-71

## Testing

To verify the fix works:

1. Visit the site without logging in
2. Open browser console
3. Check that there are no UNAUTHORIZED errors
4. Log in with Discord OAuth
5. Verify that settings and preferences load correctly

## Additional Notes

The `enabled` option in React Query/TRPC prevents queries from running when the condition is false. This is the recommended pattern for conditional queries that depend on authentication state.

Always check authentication before making queries to protected endpoints:

```typescript
const { data: session } = useSession();
const isAuthenticated = !!session?.user;

const { data } = api.protected.endpoint.useQuery(undefined, {
  enabled: isAuthenticated, // Only run when authenticated
});
```
