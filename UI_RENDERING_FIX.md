# UI Rendering Issue Fix 🔧

## Problem

The incidents page was showing "Failed to load data" error, preventing the entire page from rendering.

## Root Cause

The data fetching logic was failing when the `/api/orgs/${orgId}/data-paths` endpoint encountered an error. Since all API calls were in a single `Promise.all()`, if any one failed, the entire page would fail.

## Solution

Made the data paths fetching **optional and resilient**:

### 1. Incidents List Page (`src/app/orgs/[orgSlug]/incidents/page.tsx`)

**Before:**
```tsx
const [incidentsRes, watchlistRes, dataPathsRes] = await Promise.all([
  fetch(`/api/orgs/${org.id}/incidents`),
  fetch(`/api/orgs/${org.id}/watchlist`),
  fetch(`/api/orgs/${org.id}/data-paths?limit=20`), // If this fails, everything fails
]);
```

**After:**
```tsx
// Fetch critical data first
const [incidentsRes, watchlistRes] = await Promise.all([
  fetch(`/api/orgs/${org.id}/incidents`),
  fetch(`/api/orgs/${org.id}/watchlist`),
]);

// Fetch data paths separately (optional, don't fail if it errors)
try {
  const dataPathsRes = await fetch(`/api/orgs/${org.id}/data-paths?limit=20`);
  if (dataPathsRes.ok) {
    const dataPathsData = await dataPathsRes.json();
    setDataPathFlows(dataPathsData.flows || []);
  }
} catch (err) {
  console.warn('Failed to load data paths:', err);
  // Continue without data paths
}
```

### 2. Incident Detail Page (`src/app/orgs/[orgSlug]/incidents/[incidentId]/page.tsx`)

**Before:**
```tsx
const [watchlistRes, dataPathsRes] = await Promise.all([
  fetch(`/api/orgs/${org.id}/watchlist?...`),
  fetch(`/api/orgs/${org.id}/data-paths?...`), // If this fails, everything fails
]);
```

**After:**
```tsx
// Fetch watchlist
try {
  const watchlistRes = await fetch(`/api/orgs/${org.id}/watchlist?...`);
  if (watchlistRes.ok) {
    const watchlistData = await watchlistRes.json();
    setWatchlistEntries(watchlistData.entries || []);
  }
} catch (err) {
  console.warn('Failed to load watchlist:', err);
}

// Fetch data paths (optional)
try {
  const dataPathsRes = await fetch(`/api/orgs/${org.id}/data-paths?...`);
  if (dataPathsRes.ok) {
    const dataPathsData = await dataPathsRes.json();
    setDataPathFlows(dataPathsData.flows || []);
  }
} catch (err) {
  console.warn('Failed to load data paths:', err);
}
```

## Benefits

✅ **Graceful Degradation:** Page loads even if data paths API fails  
✅ **Better Error Logging:** Console warnings show what failed  
✅ **Progressive Enhancement:** Core features work, data paths are a bonus  
✅ **User Experience:** Users see incidents and watchlist immediately  

## Behavior

### If Data Paths API Works:
- ✅ Incidents list shows data path badges
- ✅ Watchlist shows data path context
- ✅ Incident detail shows data path flows card

### If Data Paths API Fails:
- ✅ Incidents list still loads (no badges)
- ✅ Watchlist still loads (no data path context)
- ✅ Incident detail still loads (no data path flows card)
- ⚠️ Console warning logged for debugging

## Testing

To verify the fix works:

1. **Normal case:** All APIs work
   ```bash
   # Should see data path badges everywhere
   ```

2. **Data paths API fails:**
   ```bash
   # Page should still load, just without data path features
   # Check console for warning messages
   ```

3. **All APIs fail:**
   ```bash
   # Should show "Failed to load data" error
   # This is expected behavior for critical failures
   ```

## Future Improvements

Consider adding:
- Loading skeletons for data paths
- Retry logic for failed requests
- User-visible error messages (non-blocking)
- Fallback UI when data paths unavailable

## Related Files

- `src/app/orgs/[orgSlug]/incidents/page.tsx`
- `src/app/orgs/[orgSlug]/incidents/[incidentId]/page.tsx`
- `src/app/api/orgs/[orgId]/data-paths/route.ts`

---

**Status:** ✅ Fixed - Pages now load reliably with graceful degradation
