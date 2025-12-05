# Performance Optimizations

## Issue
The application was experiencing slow page loads (3-4 seconds per request) due to:
1. Multiple sequential database queries
2. Expensive LLM context building on every guidance request
3. Missing database indexes
4. Next.js recompilation in development mode

## Optimizations Applied

### 1. Database Indexes
Added composite indexes to speed up common query patterns:

```prisma
@@index([orgId, serviceName, status])
@@index([orgId, serviceName, createdAt])
```

These indexes optimize queries that filter by:
- Organization + Service + Status (for finding similar incidents)
- Organization + Service + Created date (for recent incidents)

### 2. Query Optimization
**Before:** Sequential queries loading data multiple times
**After:** Parallel queries using `Promise.all()`

```typescript
// Parallel fetch of independent data
const [events, runbook, recentIncidents] = await Promise.all([
  getIncidentEvents(orgId, incidentId),
  getRunbookForService(orgId, incident.serviceName),
  getRecentIncidentsForService(orgId, incident.serviceName, 10),
]);
```

### 3. LLM Context Builder Optimization
**Before:** Built expensive context on every guidance request
**After:** 
- Skipped for demo/rule-based guidance (only needed for actual LLM calls)
- Reduced past incidents query from 3 to 2
- Made timeline building synchronous (no async overhead)
- Removed postmortem fetching from context builder

### 4. Guidance Caching
Added in-memory cache with 5-minute TTL:

```typescript
const guidanceCache = new Map<string, { data: IncidentGuidance; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
```

This prevents regenerating guidance for the same incident repeatedly.

### 5. Reduced Data Fetching
- Limited past incidents to 2 (from 3)
- Removed postmortem fetching from hot path
- Used `select` to fetch only needed fields

## Expected Performance Improvements

### API Response Times
- **Guidance endpoint:** 4.1s → ~500ms (cached) / ~1.5s (uncached)
- **Dashboard:** 3.7s → ~1s
- **Incident details:** Should see 40-60% improvement

### Database Query Reduction
- Reduced queries per guidance request from ~15 to ~8
- Eliminated duplicate incident fetches
- Parallel execution reduces total wait time

## Development vs Production

**Note:** In development mode, Next.js recompiles on every request, adding 2-3 seconds of overhead. This is normal and won't occur in production builds.

To test production performance:
```bash
npm run build
npm run start
```

## Future Optimizations

If performance is still an issue:

1. **Redis caching** - Replace in-memory cache with Redis for multi-instance deployments
2. **Database connection pooling** - Configure Prisma connection pool size
3. **GraphQL DataLoader** - Batch and cache database queries
4. **Materialized views** - Pre-compute expensive aggregations
5. **CDN caching** - Cache static API responses at edge
6. **Database read replicas** - Separate read/write workloads

## Monitoring

To monitor performance:
1. Check Next.js server logs for response times
2. Enable Prisma query logging: `prisma:query` in logs
3. Use browser DevTools Network tab to measure client-side latency
4. Consider adding APM (Application Performance Monitoring) like Datadog or New Relic
