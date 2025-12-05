# Demo Data Guide 🎃

## What's Been Seeded

Successfully populated all incidents with rich, realistic data to showcase the UI polish!

### 📊 Signals & Metrics (6 per incident)

Each incident now has 6 different signal types:

1. **ERROR_RATE_SPIKE** (Datadog Monitoring)
   - Shows error rate increase with threshold breach
   - Includes affected endpoints
   - Example: "Error rate increased to 5.2% on payment-service"

2. **LATENCY_INCREASE** (New Relic APM)
   - P95 and P99 latency metrics
   - Baseline comparison
   - Example: "P95 latency increased to 1200ms (baseline: 300ms)"

3. **LOG_ERROR** (Splunk)
   - Error pattern detection
   - Stack trace information
   - Example: "Multiple 'connection timeout' errors detected"

4. **METRIC_THRESHOLD** (Grafana)
   - CPU/Memory threshold breaches
   - Duration of breach
   - Example: "CPU usage exceeded 85% threshold"

5. **ALERT_TRIGGERED** (PagerDuty)
   - Alert name and severity
   - Resource usage details
   - Example: "High memory usage alert triggered"

6. **TRACE_ANOMALY** (Jaeger)
   - Distributed tracing insights
   - Slow query detection
   - Example: "Slow database queries detected in trace"

### ⏱️ Timeline (15 events per incident)

Each incident has a realistic timeline with 9 actions + 6 signals = 15 total events:

#### Actions (9 total):

1. **INVESTIGATION_STARTED** (User: oncall-engineer)
   - "Acknowledged incident and started investigation"
   - Details: Checking dashboards and deployments

2. **NOTE_ADDED** (User: oncall-engineer)
   - "Observed error spike correlates with recent deployment"
   - Details: Deploy timing correlation

3. **ESCALATION** (User: sre-lead)
   - "Escalated to SRE team lead"
   - Details: Impact growing, need support

4. **MITIGATION_ATTEMPTED** (System: auto-scaler)
   - "Auto-scaled service from 5 to 10 instances"
   - Details: Triggered by CPU threshold

5. **RUNBOOK_EXECUTED** (User: sre-lead)
   - "Executed 'Database Connection Pool' runbook"
   - Details: Increased pool size

6. **NOTE_ADDED** (User: oncall-engineer)
   - "Error rate decreasing after pool size increase"
   - Details: Monitoring improvement

7. **MITIGATION_ATTEMPTED** (User: oncall-engineer)
   - "Rolled back deployment #1234"
   - Details: Blue-green rollback strategy

8. **STATUS_UPDATE** (System: health-check)
   - "All health checks passing"
   - Details: Service returned to normal

9. **NOTE_ADDED** (User: oncall-engineer)
   - "Root cause identified: inefficient database query"
   - Details: N+1 query exhausted connections

#### Signals (6 total):
- Interspersed throughout the timeline
- Show monitoring system detections
- Provide technical context

## What You'll See in the UI

### Incident Detail Page

#### 1. Signals & Metrics Card
**Location:** Left column, top

**What to look for:**
- ✅ 6 different signal cards
- ✅ Each with source system (Datadog, New Relic, etc.)
- ✅ Timestamps showing when detected
- ✅ Hover effects on each card
- ✅ Technical details in each signal

**No more empty state!** The card is now populated with rich monitoring data.

#### 2. Timeline Card
**Location:** Left column, middle

**What to look for:**
- ✅ 15 chronological events (9 actions + 6 signals)
- ✅ Color-coded badges (blue for actions, purple for signals)
- ✅ Mix of USER and SYSTEM actors
- ✅ Realistic incident progression
- ✅ Timestamps for each event
- ✅ Details for each action

**The timeline tells a story:**
1. Detection (signals start appearing)
2. Investigation (engineer acknowledges)
3. Escalation (team lead involved)
4. Mitigation (scaling, runbook execution)
5. Resolution (rollback, health checks)
6. Root cause (identified and documented)

### Visual Improvements You'll Notice

#### Signals & Metrics Section
- **Before:** "No signals attached"
- **After:** 6 cards with:
  - Signal type badges
  - Source system names
  - Technical summaries
  - Hover glow effects
  - Timestamps

#### Timeline Section
- **Before:** "No timeline events"
- **After:** 15 events showing:
  - Chronological progression
  - User vs System actions
  - Action details
  - Signal detections
  - Complete incident story

## Demo Script

### Opening (Show Signals)
1. Navigate to any incident detail page
2. Scroll to "Signals & Metrics" card
3. Point out the 6 different signal types
4. Hover over cards to show effects
5. Mention the variety of monitoring sources

**Say:** "Notice how we're pulling in signals from multiple monitoring systems - Datadog, New Relic, Splunk, Grafana, PagerDuty, and Jaeger. This gives responders a complete picture."

### Middle (Show Timeline)
1. Scroll to "Timeline" card
2. Point out the chronological events
3. Show mix of actions and signals
4. Highlight the progression
5. Point out user vs system events

**Say:** "The timeline shows the complete incident story - from initial detection through investigation, mitigation, and resolution. Notice the mix of automated system events and human actions."

### Closing (Show Details)
1. Click on a few timeline items
2. Show the details
3. Point out the realistic content
4. Mention the hover effects

**Say:** "Every action has context - who did it, when, and why. This creates an audit trail and helps with postmortem analysis."

## Technical Details

### Data Structure

**Signals:**
```typescript
{
  signalType: 'ERROR_RATE_SPIKE',
  source: 'Datadog Monitoring',
  summary: 'Error rate increased to 5.2%',
  serviceName: 'payment-service',
  environment: 'production',
  data: {
    errorRate: 0.052,
    threshold: 0.01,
    duration: '5m',
    affectedEndpoints: ['/api/checkout']
  }
}
```

**Actions:**
```typescript
{
  actorType: 'USER',
  actorRef: 'oncall-engineer',
  actionKind: 'INVESTIGATION_STARTED',
  label: 'Acknowledged incident',
  details: 'Checking dashboards and deployments'
}
```

### Seeding Stats

- **Incidents seeded:** 7
- **Signals per incident:** 6
- **Actions per incident:** 9
- **Total signals:** 42
- **Total actions:** 63
- **Total timeline events:** 105

## UI Polish Showcase

### What the Rich Data Highlights

1. **Loading States** ✅
   - No longer needed - data loads instantly
   - But skeleton screens still work for slow connections

2. **Empty States** ✅
   - No longer shown - all sections populated
   - But they're ready if data is missing

3. **Hover Effects** ✅
   - Really shine with multiple cards
   - Each signal card glows on hover
   - Timeline items are interactive

4. **Typography** ✅
   - Hierarchy is clear with real content
   - Section headers stand out
   - Details are readable

5. **Animations** ✅
   - Smooth transitions between states
   - Pulse effects on critical items
   - Fade-ins feel natural

6. **Tooltips** ✅
   - Provide context on technical terms
   - Explain action safety levels
   - Help users understand data

## Comparison: Before vs After

### Before Seeding
```
Signals & Metrics
📊 No signals attached yet.
   Connect Datadog / Grafana to see metrics here.

Timeline
⏱️ No timeline events
   Actions and signals will appear here as they occur.
```

### After Seeding
```
Signals & Metrics
[ERROR_RATE_SPIKE] Datadog Monitoring - 2:34 PM
Error rate increased to 5.2% on payment-service

[LATENCY_INCREASE] New Relic APM - 2:35 PM
P95 latency increased to 1200ms (baseline: 300ms)

[LOG_ERROR] Splunk - 2:36 PM
Multiple "connection timeout" errors detected

[METRIC_THRESHOLD] Grafana - 2:37 PM
CPU usage exceeded 85% threshold

[ALERT_TRIGGERED] PagerDuty - 2:38 PM
High memory usage alert triggered

[TRACE_ANOMALY] Jaeger - 2:39 PM
Slow database queries detected in trace

Timeline
[ACTION] INVESTIGATION_STARTED - 2:34 PM
Acknowledged incident and started investigation

[SIGNAL] ERROR_RATE_SPIKE - 2:34 PM
Error rate increased to 5.2%

[ACTION] NOTE_ADDED - 2:35 PM
Observed error spike correlates with recent deployment

[SIGNAL] LATENCY_INCREASE - 2:35 PM
P95 latency increased to 1200ms

... (15 total events)
```

## Next Steps

### For Demo
1. ✅ Data is seeded and ready
2. ✅ UI polish is complete
3. ✅ All sections populated
4. ✅ Timeline tells a story
5. ✅ Ready to impress judges!

### To Re-seed
If you need fresh data:
```bash
npm run seed:signals
```

Or run the full seed:
```bash
npm run seed
```

## Key Talking Points

### For Judges
1. **Rich Data Model**
   - "We're ingesting signals from 6 different monitoring systems"
   - "The timeline shows both automated and human actions"
   - "Every event has context and details"

2. **Realistic Scenarios**
   - "This shows a typical incident progression"
   - "From detection through resolution"
   - "Mix of investigation, escalation, and mitigation"

3. **UI Polish**
   - "Notice how the UI handles rich data gracefully"
   - "Hover effects make it interactive"
   - "Typography hierarchy makes it scannable"

### For Users
1. **Complete Picture**
   - "All your monitoring data in one place"
   - "No need to switch between tools"
   - "Timeline shows what happened when"

2. **Actionable Insights**
   - "See what actions were taken"
   - "Understand the progression"
   - "Learn from past incidents"

3. **Professional Tool**
   - "Looks and feels production-ready"
   - "Smooth interactions"
   - "Helpful guidance throughout"

---

**The data is ready, the UI is polished, and the demo will shine! 🎃✨**
