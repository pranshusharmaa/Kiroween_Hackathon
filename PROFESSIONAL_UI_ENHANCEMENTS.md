# Professional UI Enhancements 🎨

## Overview

Enhanced the Runbook Revenant UI with professional dashboards, charts, AI-powered similarity matching, and improved navigation.

## Key Enhancements

### 1. Clickable Logo Navigation ✅

**File:** `src/app/orgs/[orgSlug]/layout.tsx`

- Logo now clickable and returns to incidents home
- Smooth hover transition
- Maintains Halloween theme

```tsx
<button onClick={handleLogoClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
  <span className="text-2xl">🎃</span>
  <div>Runbook Revenant</div>
</button>
```

### 2. Dashboard with Statistics & Charts 📊

**Files:**
- `src/components/ui/MiniChart.tsx` - Chart components
- `src/app/api/orgs/[orgId]/dashboard/route.ts` - Dashboard API
- `src/app/orgs/[orgSlug]/incidents/page.tsx` - Dashboard integration

**Features:**
- **4 Key Metrics Cards:**
  - Open Incidents (with 7-day trend chart)
  - Critical Incidents (with severity trend)
  - MTTR (Mean Time To Resolution)
  - Data Paths (total flows and events)

- **Mini Sparkline Charts:**
  - SVG-based for performance
  - Color-coded by metric type
  - 7-day trend visualization

- **Real-time Statistics:**
  - Incidents in last 24h
  - Incidents in last 7 days
  - Breakdown by status and severity
  - Watchlist summary
  - Data path analytics

**API Response:**
```json
{
  "overview": {
    "totalIncidents": 10,
    "openIncidents": 4,
    "criticalIncidents": 1,
    "incidents24h": 2,
    "incidents7d": 5,
    "avgMTTR": "3.5"
  },
  "trends": {
    "incidentTrend": [1, 2, 1, 3, 2, 1, 2]
  },
  "breakdown": {
    "byStatus": [...],
    "bySeverity": [...]
  }
}
```

### 3. AI-Powered Similar Incidents (Cosine Similarity) 🤖

**Files:**
- `src/modules/intelligence/similarity.ts` - Similarity algorithm
- `src/app/api/orgs/[orgId]/incidents/[incidentId]/similar/route.ts` - Similar incidents API
- `src/app/orgs/[orgSlug]/incidents/[incidentId]/page.tsx` - UI integration

**Algorithm:**
- **Cosine Similarity** implementation
- **TF-IDF-like** approach for text analysis
- **Features extracted:**
  - Incident title
  - Service name
  - Severity
  - Status
  - Description (if available)

**How It Works:**

1. **Tokenization:**
   ```typescript
   function tokenize(text: string): string[] {
     return text
       .toLowerCase()
       .replace(/[^\w\s]/g, ' ')
       .split(/\s+/)
       .filter(word => word.length > 2);
   }
   ```

2. **Term Frequency:**
   ```typescript
   function termFrequency(tokens: string[]): Map<string, number> {
     const freq = new Map<string, number>();
     for (const token of tokens) {
       freq.set(token, (freq.get(token) || 0) + 1);
     }
     return freq;
   }
   ```

3. **Cosine Similarity:**
   ```typescript
   similarity = dotProduct / (magnitude1 * magnitude2)
   ```

4. **Scoring:**
   - 0-100% similarity score
   - Threshold: 20% minimum
   - Top 10 results returned

**UI Display:**
- Card showing similar incidents
- Similarity percentage badge
- Quick navigation to similar incidents
- Color-coded severity/status chips

### 4. Enhanced Dashboard Components

**StatCard Component:**
```tsx
<StatCard
  title="Open Incidents"
  value={42}
  change="5 in 24h"
  trend="up"
  chart={[1, 2, 1, 3, 2, 1, 2]}
  chartColor="orange"
/>
```

**Features:**
- Compact metric display
- Trend indicators (↑ ↓ →)
- Inline sparkline charts
- Color-coded by metric type

**Chart Colors:**
- Red: Critical/errors
- Orange: Warnings/incidents
- Emerald: Success/resolved
- Blue: Info/metrics

### 5. Professional Layout Improvements

**Grid System:**
```tsx
// Dashboard stats
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* 4 stat cards */}
</div>

// Main content
<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
  {/* Incidents list + Sidebar */}
</div>
```

**Responsive Design:**
- Mobile: 2 columns for stats
- Tablet: 4 columns for stats
- Desktop: Optimized spacing

### 6. Visual Enhancements

**Color Palette:**
- Root: `#050712` (deep space)
- Cards: `#0b0f1a/90` (glassy)
- Accent: Orange (`#f97316`)
- Charts: Color-coded by type

**Typography:**
- Stat values: `text-2xl font-semibold`
- Stat labels: `text-xs text-zinc-500`
- Consistent hierarchy

**Animations:**
- Smooth hover transitions
- Card hover effects
- Button state changes

## API Endpoints

### Dashboard API
```
GET /api/orgs/:orgId/dashboard
```

**Returns:**
- Overview statistics
- Trend data (7 days)
- Breakdown by status/severity
- Watchlist summary
- Data path analytics

### Similar Incidents API
```
GET /api/orgs/:orgId/incidents/:incidentId/similar
```

**Returns:**
- Target incident info
- Similar incidents (top 10)
- Similarity scores (0-100%)
- Full incident metadata

## Usage Examples

### Dashboard Stats
```tsx
// Automatically fetched and displayed
const dashboard = await fetch(`/api/orgs/${orgId}/dashboard`);

// Displays:
// - Open Incidents: 4 (↑ 2 in 24h)
// - Critical: 1 (with trend chart)
// - MTTR: 3.5h (avg resolution)
// - Data Paths: 11 (45 events)
```

### Similar Incidents
```tsx
// Automatically fetched for each incident
const similar = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/similar`);

// Displays:
// - Payment Processing Failure (85% match)
// - Database Connection Issues (72% match)
// - API Gateway Timeout (65% match)
```

## Performance Optimizations

### Chart Rendering
- SVG-based (no canvas overhead)
- Minimal DOM nodes
- CSS-only animations
- Responsive scaling

### API Efficiency
- Parallel fetching with `Promise.all()`
- Graceful degradation (optional features)
- Caching-friendly responses
- Efficient database queries

### Similarity Matching
- In-memory computation
- Efficient tokenization
- Map-based frequency counting
- Early termination for low scores

## Benefits

### For Users
✅ **At-a-glance metrics** - See system health immediately  
✅ **Trend visualization** - Understand patterns over time  
✅ **Quick navigation** - Clickable logo returns home  
✅ **Similar incidents** - Learn from past issues  
✅ **Professional appearance** - Modern, polished UI  

### For SREs
✅ **MTTR tracking** - Monitor resolution efficiency  
✅ **Pattern recognition** - Find similar incidents automatically  
✅ **Data-driven decisions** - Charts and statistics  
✅ **Faster triage** - Similar incidents suggest solutions  

### For Operations
✅ **Proactive monitoring** - Dashboard shows trends  
✅ **Knowledge reuse** - Similar incidents link to solutions  
✅ **Better reporting** - Visual metrics for stakeholders  
✅ **Reduced MTTR** - Learn from similar past incidents  

## Technical Details

### Cosine Similarity Math

**Formula:**
```
similarity = (A · B) / (||A|| × ||B||)

Where:
- A · B = dot product of vectors
- ||A|| = magnitude of vector A
- ||B|| = magnitude of vector B
```

**Example:**
```
Incident 1: "Payment gateway timeout error"
Incident 2: "Payment processing timeout issue"

Tokens 1: [payment, gateway, timeout, error]
Tokens 2: [payment, processing, timeout, issue]

Common terms: payment, timeout
Similarity: ~65%
```

### Chart Data Structure

**7-Day Trend:**
```typescript
incidentTrend: [
  1,  // 6 days ago
  2,  // 5 days ago
  1,  // 4 days ago
  3,  // 3 days ago
  2,  // 2 days ago
  1,  // yesterday
  2   // today
]
```

## Future Enhancements

### Potential Additions

1. **Advanced Charts:**
   - Bar charts for severity distribution
   - Pie charts for status breakdown
   - Heatmaps for incident patterns

2. **ML Enhancements:**
   - FAISS integration for vector search
   - Embeddings-based similarity
   - Anomaly detection

3. **Interactive Features:**
   - Drill-down charts
   - Date range selection
   - Export to PDF/CSV

4. **Real-time Updates:**
   - WebSocket integration
   - Live dashboard updates
   - Push notifications

## Testing

### Manual Testing

1. **Dashboard:**
   - Visit `/orgs/demo-org/incidents`
   - Verify 4 stat cards appear
   - Check charts render correctly
   - Confirm data updates

2. **Similar Incidents:**
   - Click any incident
   - Scroll to "Similar Incidents" card
   - Verify similarity scores
   - Test navigation links

3. **Logo Navigation:**
   - Click logo from any page
   - Verify returns to incidents list
   - Check hover effect works

### API Testing

```bash
# Dashboard
curl http://localhost:3000/api/orgs/{orgId}/dashboard

# Similar incidents
curl http://localhost:3000/api/orgs/{orgId}/incidents/{incidentId}/similar
```

## Summary

The UI now features:
- ✅ Professional dashboard with real-time metrics
- ✅ Mini sparkline charts for trend visualization
- ✅ AI-powered similar incident matching (cosine similarity)
- ✅ Clickable logo for easy navigation
- ✅ Responsive grid layouts
- ✅ Consistent professional styling
- ✅ Performance-optimized rendering

The application now looks and feels like a professional SRE platform with data-driven insights and intelligent incident correlation! 🎃
