# Data Flow Map Feature 🗺️

## Overview

Added a visual Data Flow Map that shows which services a request passed through during an incident, highlighting error-prone services with a "HOT" badge and red glow effect.

## What Was Added

### 1. ✅ Service Graph Module
**File:** `src/modules/incidents/service-graph.ts`

**Types:**
- `ServiceGraphNode` - Represents a service with error metrics
- `ServiceGraphEdge` - Represents a call between two services
- `ServiceGraph` - Complete graph with nodes, edges, and metadata

**Functions:**
- `buildServiceGraphForIncident()` - Builds the service graph from signals
- `getTopErrorServices()` - Returns services with highest error rates
- `getCriticalPaths()` - Returns edges with highest error rates

**Algorithm:**
1. Load all signals for the incident
2. Group signals by traceId or correlationKey
3. Sort each group chronologically
4. Build nodes (services) with event counts and error counts
5. Build edges (service-to-service calls) from sequential events
6. Calculate error ratios for nodes and edges

### 2. ✅ Service Graph API
**File:** `src/app/api/orgs/[orgId]/incidents/[incidentId]/service-graph/route.ts`

**Endpoint:** `GET /api/orgs/:orgId/incidents/:incidentId/service-graph`

**Features:**
- RBAC enforcement
- Returns complete service graph
- Includes metadata (total traces, events, error rate)

**Response:**
```json
{
  "graph": {
    "nodes": [
      {
        "id": "payment-service-production",
        "serviceName": "payment-service",
        "environment": "production",
        "totalEvents": 45,
        "errorEvents": 18,
        "errorRatio": 0.4
      }
    ],
    "edges": [
      {
        "id": "api-gateway-production->payment-service-production",
        "from": "api-gateway-production",
        "to": "payment-service-production",
        "count": 23,
        "errorCount": 12
      }
    ],
    "metadata": {
      "totalTraces": 15,
      "totalEvents": 89,
      "errorRate": 0.35
    }
  }
}
```

### 3. ✅ DataFlowMap React Component
**File:** `src/components/DataFlowMap.tsx`

**Features:**
- Fetches service graph from API
- Displays service nodes as pill-shaped badges
- "HOT" badge for services with >30% error rate and >2 errors
- Red glow animation on hot services
- Request flow visualization
- Error counts and ratios
- Overall error rate display
- Loading and empty states
- Consistent Halloween theme styling

**Visual Design:**
- Premium card with shadow and glow
- Pill-shaped service nodes
- Color-coded by error severity
- Animated pulse on hot services
- Clean, scannable layout

### 4. ✅ Integration with Incident Detail Page
**Location:** Right column, top (above Data Paths)

**Placement:**
- Most prominent position in right column
- Always visible (not conditional)
- Loads automatically when page loads

## Visual Design

### Service Nodes

**Normal Service:**
```
┌─────────────────────────────┐
│ payment-service · production│
│ 45 events                   │
└─────────────────────────────┘
```

**Hot Service (High Errors):**
```
┌─────────────────────────────────┐
│ payment-service · production HOT│ ← Red glow + pulse
│ 45 events · 18 errors           │
└─────────────────────────────────┘
```

### Request Flows

**Normal Flow:**
```
api-gateway → payment-service
23 calls
```

**Error Flow:**
```
api-gateway → payment-service
23 calls · 12 errors  ← Orange highlight
```

### Complete Card

```
┌─────────────────────────────────────────┐
│ DATA FLOW MAP              15 traces    │
├─────────────────────────────────────────┤
│ Services                                 │
│ ┌──────────────────┐ ┌────────────────┐│
│ │ api-gateway      │ │ payment-service││
│ │ · production     │ │ · production   ││
│ │ 34 events        │ │ 45 events HOT  ││ ← Red glow
│ └──────────────────┘ └────────────────┘│
│                                          │
│ Request Flows                            │
│ ┌────────────────────────────────────┐  │
│ │ api-gateway → payment-service      │  │
│ │ 23 calls · 12 errors               │  │
│ └────────────────────────────────────┘  │
│ ┌────────────────────────────────────┐  │
│ │ payment-service → database         │  │
│ │ 18 calls · 6 errors                │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Overall Error Rate            35%       │
└─────────────────────────────────────────┘
```

## How It Works

### Data Collection

1. **Signals are the source:**
   - All signals attached to the incident
   - Each signal has: serviceName, environment, signalType, timestamp
   - Signals are grouped by traceId or correlationKey

2. **Trace reconstruction:**
   - Events in the same trace are sorted chronologically
   - Sequential events create edges (service A → service B)
   - Each service becomes a node

3. **Error detection:**
   - Signals with ERROR, ALERT, or CRITICAL in type are errors
   - Error counts accumulated per node and edge
   - Error ratios calculated

### Hot Service Detection

A service is marked as "HOT" when:
- Error ratio > 30% (more than 30% of events are errors)
- AND error count > 2 (at least 3 errors)

**Visual effects:**
- Red background glow
- Pulsing animation
- "HOT" badge
- Red error count

### Edge Visualization

Edges show the flow of requests:
- **From → To** format
- Call count (total requests)
- Error count (failed requests)
- Orange highlight if errors present

## Benefits

### For Responders

1. **Quick Service Identification**
   - Instantly see which services are involved
   - Identify error-prone services at a glance
   - Understand request flow

2. **Root Cause Analysis**
   - See where errors originate
   - Trace error propagation
   - Identify bottlenecks

3. **Impact Assessment**
   - Understand scope of incident
   - See affected services
   - Measure error rates

### For Teams

1. **Service Health Visibility**
   - Monitor service reliability
   - Identify problematic services
   - Track error patterns

2. **Architecture Understanding**
   - Visualize service dependencies
   - See actual request flows
   - Understand system behavior

3. **Incident Documentation**
   - Automatic service graph capture
   - Visual incident records
   - Historical analysis

## Demo Script

### Setup (5 seconds)
1. Navigate to any incident detail page
2. Scroll to right column

### Show Data Flow Map (30 seconds)
1. Point out the "Data Flow Map" card at top of right column
2. Show service nodes:
   - "Notice the services involved in this incident"
   - Point out the "HOT" badge on error-prone services
   - "The red glow indicates high error rates"

3. Show request flows:
   - "These arrows show how requests flowed between services"
   - Point out error counts
   - "We can see 12 out of 23 calls failed here"

4. Show overall error rate:
   - "The overall error rate for this incident was 35%"

### Talking Points
- "The Data Flow Map visualizes the service topology during the incident"
- "Hot services with high error rates are highlighted automatically"
- "You can see exactly which service-to-service calls failed"
- "This helps identify the root cause and scope of impact"
- "It's like having a real-time architecture diagram with error overlay"

## Technical Details

### Performance

**Optimizations:**
- Limits to 1000 signals per incident
- Efficient grouping by trace/correlation key
- Single database query for signals
- Client-side rendering with React

**Scalability:**
- Works with any number of services
- Handles multiple traces
- Supports loops (service calling itself)
- Graceful degradation with large datasets

### Data Sources

**Primary:** IncidentSignal table
- All signals attached to incident
- Contains serviceName, environment, signalType
- Has traceId and correlationKey for grouping
- Timestamped for chronological ordering

**Future:** Could be extended to:
- IngestedEvent table (when available)
- Distributed traces from APM
- Log aggregation data
- Metrics time series

### Algorithm Complexity

- **Time:** O(n log n) where n = number of signals
  - Sorting signals: O(n log n)
  - Grouping by trace: O(n)
  - Building graph: O(n)

- **Space:** O(n + m) where m = number of edges
  - Nodes: O(services)
  - Edges: O(service pairs)
  - Typically m << n

## Files Created/Modified

### New Files
- `src/modules/incidents/service-graph.ts` - Graph building logic
- `src/app/api/orgs/[orgId]/incidents/[incidentId]/service-graph/route.ts` - API endpoint
- `src/components/DataFlowMap.tsx` - React component
- `DATA_FLOW_MAP_FEATURE.md` - This documentation

### Modified Files
- `src/app/orgs/[orgSlug]/incidents/[incidentId]/page.tsx` - Added DataFlowMap component

## Testing Checklist

### Functional Testing
- ✅ API endpoint returns graph data
- ✅ Graph builds correctly from signals
- ✅ Nodes show correct event counts
- ✅ Edges show correct call counts
- ✅ Error ratios calculated correctly
- ✅ Hot services identified correctly
- ✅ Component renders without errors
- ✅ Loading state displays
- ✅ Empty state displays when no data
- ✅ Error state displays on API failure

### UI Testing
- ✅ Card styling consistent with theme
- ✅ Service nodes are pill-shaped
- ✅ Hot badge appears on high-error services
- ✅ Red glow effect works
- ✅ Pulse animation smooth
- ✅ Request flows are readable
- ✅ Error counts highlighted
- ✅ Overall error rate displays
- ✅ Responsive layout
- ✅ Hover effects work

### Integration Testing
- ✅ Fetches data on page load
- ✅ RBAC enforced
- ✅ Works with existing signals
- ✅ Handles missing data gracefully
- ✅ Updates when incident changes

## Build Status

- ✅ TypeScript compilation successful
- ✅ No errors or warnings
- ✅ Production build passes
- ✅ New API route generated

## Future Enhancements

### Potential Additions

1. **Interactive Graph**
   - Click nodes to filter
   - Hover for details
   - Zoom and pan
   - Export as image

2. **Advanced Visualization**
   - D3.js force-directed graph
   - Sankey diagram for flows
   - Timeline animation
   - 3D visualization

3. **More Metrics**
   - Latency per service
   - Throughput rates
   - Resource usage
   - SLO compliance

4. **Filtering**
   - Show only error paths
   - Filter by service
   - Filter by time range
   - Filter by trace

5. **Comparison**
   - Compare to baseline
   - Compare to similar incidents
   - Show anomalies
   - Highlight changes

6. **Export**
   - Download as PNG
   - Export to PDF
   - Share link
   - Embed in postmortem

## Conclusion

The Data Flow Map feature provides powerful visual insights into incident impact and service health. It helps responders quickly identify problematic services and understand request flows, leading to faster incident resolution.

**Key Achievements:**
- ✅ Visual service topology
- ✅ Automatic error detection
- ✅ Hot service highlighting
- ✅ Request flow visualization
- ✅ Consistent UI design
- ✅ Production-ready code
- ✅ Demo-ready feature

**The feature is fully functional and ready to impress! 🗺️✨**
