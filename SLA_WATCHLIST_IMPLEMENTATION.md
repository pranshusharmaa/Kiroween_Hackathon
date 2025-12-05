# SLA Watchlist Feature Implementation 🎃

## Overview

The SLA Watchlist feature provides proactive monitoring of services approaching or breaching SLA thresholds. It integrates seamlessly with the Halloween-themed Runbook Revenant UI to surface critical risks before they become full incidents.

## Architecture

### Database Schema

**New Model: `SLAWatchEntry`**
```prisma
model SLAWatchEntry {
  id              String   @id @default(cuid())
  orgId           String
  projectId       String
  serviceName     String
  environment     String
  correlationKey  String?
  status          String   // AT_RISK, BREACHED, CLEARED
  riskScore       Float    // 0.0 - 1.0
  source          String
  logsSnapshot    Json
  firstDetectedAt DateTime @default(now())
  lastUpdatedAt   DateTime @updatedAt

  @@index([orgId, projectId, serviceName, environment, status])
}
```

### Connector Modules

#### 1. Risk Evaluator (`src/modules/connectors/risk-evaluator.ts`)

**Purpose**: Analyzes normalized events against SLA thresholds to detect risks.

**Key Function**: `evaluateRiskFromNormalizedEvent()`
- Inspects metrics (error rate, latency, availability)
- Compares against configurable thresholds
- Returns risk update with status and score

**Default Thresholds**:
```typescript
{
  errorRate: {
    warning: 0.01,   // 1%
    critical: 0.05,  // 5%
  },
  latency: {
    warning: 500,    // 500ms
    critical: 1000,  // 1000ms
  },
  availability: {
    warning: 0.99,   // 99%
    critical: 0.95,  // 95%
  }
}
```

**Risk Scoring**:
- `0.0`: No risk (CLEARED)
- `0.5-0.9`: Approaching threshold (AT_RISK)
- `0.9-1.0`: Threshold breached (BREACHED)

#### 2. Watchlist Manager (`src/modules/connectors/watchlist.ts`)

**Purpose**: CRUD operations for watchlist entries.

**Key Functions**:
- `upsertWatchEntry()` - Creates or updates entries
- `getWatchlistEntries()` - Retrieves entries with filtering
- `clearWatchEntry()` - Marks entries as CLEARED
- `getWatchlistForService()` - Service-specific queries
- `cleanupClearedEntries()` - Housekeeping for old entries

### API Routes

#### GET `/api/orgs/:orgId/watchlist`
Returns AT_RISK and BREACHED entries for an organization.

**Query Parameters**:
- `projectId` - Filter by project
- `serviceName` - Filter by service
- `environment` - Filter by environment
- `status[]` - Filter by status (can be multiple)
- `limit` - Max results (default: 50)

**Response**:
```json
{
  "entries": [
    {
      "id": "...",
      "serviceName": "api-gateway",
      "environment": "production",
      "status": "AT_RISK",
      "riskScore": 0.75,
      "source": "METRIC_TREND",
      "logsSnapshot": [...],
      "lastUpdatedAt": "2025-12-04T..."
    }
  ]
}
```

#### POST `/api/orgs/:orgId/watchlist/:id/clear`
Marks a watchlist entry as CLEARED.

**Response**:
```json
{
  "entry": { ... }
}
```

### Frontend Integration

#### Incidents List Page (`/orgs/[orgSlug]/incidents`)

**Watchlist Panel** (Right Sidebar):
- Displays top 3 SLA violations
- Shows risk score with color coding:
  - Red (≥80%): Critical risk
  - Orange (≥50%): Moderate risk
  - Yellow (<50%): Low risk
- Status pills (BREACHED/AT_RISK)
- Log snippets from violations
- Clear button to dismiss entries
- Falls back to critical incidents if no SLA violations

**UI Features**:
- Halloween theme with pumpkin icons 🎃
- Orange accent colors for warnings
- Purple borders and shadows
- Smooth hover transitions

#### Incident Detail Page (`/orgs/[orgSlug]/incidents/[incidentId]`)

**SLA Warning Banner**:
- Appears at top of page when SLA violations exist for the service
- Shows service name, environment, and risk score
- Orange background with warning icon ⚠️
- Automatically fetches watchlist entries matching incident's service/environment

## Integration with Ingestion Pipeline

### Future Implementation

The risk evaluator is designed to integrate with the event ingestion pipeline:

```typescript
// In handleIngestedEvent (future implementation)
async function handleIngestedEvent(connectorId: string, rawPayload: unknown) {
  // 1. Normalize the event
  const normalized = await normalizeEvent(connectorId, rawPayload);
  
  // 2. Evaluate SLA risk
  const riskUpdate = evaluateRiskFromNormalizedEvent(normalized);
  
  // 3. Update watchlist if risk detected
  if (riskUpdate) {
    await upsertWatchEntry(riskUpdate);
  }
  
  // 4. Continue with incident correlation...
  await correlateToIncident(normalized);
}
```

### Normalized Event Structure

```typescript
interface NormalizedEvent {
  id: string;
  orgId: string;
  projectId: string;
  serviceName: string;
  environment: string;
  eventType: string;
  source: string;
  timestamp: Date;
  correlationKey?: string;
  traceId?: string;
  metrics?: {
    errorRate?: number;
    latency?: number;
    throughput?: number;
    availability?: number;
  };
  logs?: Array<{
    level: string;
    message: string;
    timestamp: Date;
  }>;
  metadata: Record<string, unknown>;
}
```

## Testing

### Seed Script

Run `npx tsx scripts/seed-watchlist.ts` to populate sample data:
- api-gateway (AT_RISK, 75% risk)
- checkout-service (BREACHED, 95% risk)
- search-api (AT_RISK, 60% risk)

### Manual Testing

1. **View Watchlist**:
   ```bash
   curl http://localhost:3000/api/orgs/{orgId}/watchlist
   ```

2. **Clear Entry**:
   ```bash
   curl -X POST http://localhost:3000/api/orgs/{orgId}/watchlist/{entryId}/clear
   ```

3. **Filter by Service**:
   ```bash
   curl "http://localhost:3000/api/orgs/{orgId}/watchlist?serviceName=api-gateway&environment=production"
   ```

## Configuration

### Service-Specific Thresholds (Future)

The `getServiceThresholds()` function is a placeholder for future configuration:

```typescript
// Future: Load from database or config
const thresholds = await getServiceThresholds(orgId, serviceName);
```

This allows different services to have custom SLA thresholds based on their requirements.

## Benefits

1. **Proactive Monitoring**: Catch issues before they become incidents
2. **Reduced MTTR**: Faster response with pre-populated context
3. **SLO Compliance**: Track and prevent SLA breaches
4. **Unified View**: Single pane of glass for risks and incidents
5. **Actionable Insights**: Log snippets provide immediate context

## Future Enhancements

1. **Auto-Incident Creation**: Automatically create incidents when BREACHED
2. **Trend Analysis**: Historical risk score tracking
3. **Notification Integration**: Alert on-call when risks detected
4. **Custom Thresholds**: Per-service SLA configuration UI
5. **Correlation with Incidents**: Link watchlist entries to related incidents
6. **Metrics Visualization**: Charts showing risk trends over time

## Files Created/Modified

### New Files:
- `src/modules/connectors/types.ts`
- `src/modules/connectors/risk-evaluator.ts`
- `src/modules/connectors/watchlist.ts`
- `src/app/api/orgs/[orgId]/watchlist/route.ts`
- `src/app/api/orgs/[orgId]/watchlist/[id]/clear/route.ts`
- `scripts/seed-watchlist.ts`

### Modified Files:
- `prisma/schema.prisma` - Added SLAWatchEntry model
- `src/app/orgs/[orgSlug]/incidents/page.tsx` - Added watchlist panel
- `src/app/orgs/[orgSlug]/incidents/[incidentId]/page.tsx` - Added SLA warning banner

## Compliance with Steering Rules

✅ **Modular Architecture**: Follows CIS (Connector & Ingestion Service) boundaries
✅ **Multi-Tenancy**: All queries scoped by orgId
✅ **Halloween Theme**: Orange accents, pumpkin icons, purple shadows
✅ **SRE Principles**: Proactive monitoring, error budget awareness
✅ **Type Safety**: Full TypeScript with Prisma types
✅ **RBAC**: Uses existing identity service for authorization

---

**Status**: ✅ Implementation Complete
**Testing**: ✅ Seed data created, API tested
**Documentation**: ✅ Complete
