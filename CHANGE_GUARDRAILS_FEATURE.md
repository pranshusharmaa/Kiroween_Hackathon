# Change Guardrails Feature

## Overview

The Change Guardrails feature automatically checks performance metrics when deployments occur and surfaces the results in the incident "What Changed?" panel. This helps SRE teams quickly identify if a recent deployment caused or contributed to an incident.

## Implementation

### 1. Database Schema (`prisma/schema.prisma`)

Added two new models:

#### DeploymentEvent
Tracks deployment and change events:
- `orgId`, `projectId`, `serviceName`, `environment`
- `changeType`: DEPLOY, CONFIG_CHANGE, ROLLBACK, SCALE
- `source`: GITHUB, GITLAB, JENKINS, MANUAL
- `externalId`: External deployment ID from CI/CD
- `title`, `author`, `deployedAt`
- `incidentId`: Optional link to incident

#### ChangeGuardrailCheck
Stores performance check results:
- `deploymentId`: Links to deployment
- `status`: PASS, WARN, FAIL
- `reason`: Explanation of the result
- Baseline and new time windows
- Baseline and new P95 latency and error rate
- Delta percentages for both metrics

### 2. Metrics Adapter (`src/modules/metrics/metrics-adapter.ts`)

Provides an abstraction layer for fetching metrics from observability providers:

- **Interface**: `MetricsProvider` with `getMetricSummaryForServiceWindow()`
- **Returns**: `{ p95LatencyMs, errorRate }`
- **Current Implementation**: Simulated metrics for demo
- **Future**: Ready to integrate with Prometheus, Datadog, CloudWatch, etc.

### 3. Change Guardrails Module (`src/modules/metrics/change-guardrails.ts`)

Core logic for running guardrail checks:

#### `runGuardrailCheckForDeployment(orgId, deploymentId)`
1. Defines baseline window (30 min before deployment)
2. Defines new window (15 min after deployment)
3. Fetches metric summaries for both windows
4. Computes deltas and classifies as PASS/WARN/FAIL
5. Stores ChangeGuardrailCheck record

#### Thresholds
- **Latency**: WARN at +20%, FAIL at +50%
- **Error Rate**: WARN at +50%, FAIL at +100%
- **Absolute Error Rate**: WARN at 5%, FAIL at 10%

#### Other Functions
- `getGuardrailChecksForDeployment()`: Fetch existing checks
- `getDeploymentsForIncident()`: Get deployments linked to an incident

### 4. API Routes

#### POST `/api/orgs/[orgId]/deployments/[deploymentId]/guardrail-check`
Runs a new guardrail check for a deployment

#### GET `/api/orgs/[orgId]/deployments/[deploymentId]/guardrail-check`
Fetches existing guardrail checks for a deployment

#### GET `/api/orgs/[orgId]/incidents/[incidentId]/deployments`
Gets deployments related to an incident with their guardrail checks

### 5. UI Components

#### GuardrailBadge (`src/components/ui/GuardrailBadge.tsx`)
Displays status badge with color coding:
- **PASS**: Green (✓)
- **WARN**: Amber (⚠)
- **FAIL**: Red (✗)

#### Updated Incident Detail Page
The "What Changed?" section now:
- Fetches real deployment data from the API
- Displays guardrail status badges
- Shows before/after metrics:
  - P95 latency with delta percentage
  - Error rate with delta percentage
- Color-codes metrics based on severity
- Shows guardrail check reason for WARN/FAIL

### 6. Seeding Script (`scripts/seed-deployments.ts`)

Creates sample deployment data:
- Links deployments to existing incidents
- Runs guardrail checks automatically
- Creates realistic deployment scenarios

## Usage

### Running the Seeder

```bash
npx tsx scripts/seed-deployments.ts
```

This will:
1. Create 1-2 deployments per incident
2. Create 3 additional standalone deployments
3. Run guardrail checks for all deployments
4. Display results in console

### Viewing in UI

1. Navigate to any incident detail page
2. Scroll to the "What Changed?" section
3. See deployments with guardrail status badges
4. View before/after metrics for each deployment

## Architecture Alignment

This feature follows the Runbook Revenant architecture:

- **Module Boundaries**: Metrics module is separate from incidents
- **Event Sourcing**: Deployments are events that can be linked to incidents
- **Observability Integration**: Metrics adapter ready for real providers
- **Multi-tenancy**: All data is org-scoped
- **Halloween Theme**: UI uses consistent dark theme with color coding

## Future Enhancements

1. **Real Metrics Integration**: Connect to Prometheus, Datadog, CloudWatch
2. **Automatic Deployment Detection**: Webhook listeners for CI/CD systems
3. **Automatic Incident Linking**: Correlate deployments to incidents by time/service
4. **Configurable Thresholds**: Per-service or per-org guardrail thresholds
5. **Rollback Recommendations**: Suggest rollback when guardrails fail
6. **Historical Trends**: Track guardrail pass/fail rates over time
7. **Slack Notifications**: Alert teams when guardrails fail

## Testing

To test the feature:

1. Ensure database is running and seeded with incidents
2. Run the deployment seeder: `npx tsx scripts/seed-deployments.ts`
3. Visit an incident detail page
4. Verify the "What Changed?" section shows deployments with guardrail checks
5. Check that metrics are displayed with proper color coding

## Database Migration

After adding the new models, run:

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
```

## Notes

- Guardrail checks use simulated metrics for demo purposes
- The metrics adapter is designed to be swapped with real providers
- All timestamps and windows are configurable via constants
- The feature integrates seamlessly with existing incident workflows
