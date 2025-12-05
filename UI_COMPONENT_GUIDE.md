# UI Component Guide - Runbook Revenant 🎃

Quick reference for using the new UI components in the Runbook Revenant application.

## Import Components

```tsx
import { Card } from '@/components/ui/Card';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { DataPathBadge } from '@/components/ui/DataPathBadge';

// Or import all at once:
import { Card, PrimaryButton, GhostButton, StatusChip, SeverityChip, DataPathBadge } from '@/components/ui';
```

## Card

Standard container for content sections.

```tsx
<Card>
  <h2 className="text-sm font-medium text-zinc-200 mb-3">Section Title</h2>
  <p className="text-sm text-zinc-400">Content goes here</p>
</Card>
```

**Props:**
- `children`: ReactNode (required)
- `className`: string (optional) - additional classes

**Default Styles:**
- Rounded corners (2xl)
- Glassy background with backdrop blur
- White border with 10% opacity
- Shadow with black/40 opacity
- Padding: 4 (mobile) / 5 (desktop)

## Buttons

### PrimaryButton

Main call-to-action button with orange accent.

```tsx
<PrimaryButton onClick={handleClick} disabled={loading}>
  Create Postmortem PR
</PrimaryButton>
```

**Props:**
- All standard button HTML attributes
- `children`: ReactNode (required)
- `className`: string (optional)
- `disabled`: boolean (optional)

**Use Cases:**
- Primary actions (Create, Submit, Confirm)
- Destructive actions that need attention
- Main CTAs on a page

### GhostButton

Secondary button with glassy appearance.

```tsx
<GhostButton onClick={handleGenerate}>
  Generate Postmortem
</GhostButton>
```

**Props:**
- Same as PrimaryButton

**Use Cases:**
- Secondary actions (Cancel, Back, View)
- Non-destructive operations
- Multiple actions in a group

## StatusChip

Displays incident status with color coding.

```tsx
<StatusChip status="OPEN" />
<StatusChip status="INVESTIGATING" />
<StatusChip status="RESOLVED" />
```

**Props:**
- `status`: string (required) - incident status
- `className`: string (optional)

**Status Colors:**
- `OPEN`, `INVESTIGATING`: Red
- `MITIGATED`: Orange
- `RESOLVED`, `CLOSED`: Emerald
- `CANCELLED`: Gray
- Default: Gray

**Styles:**
- Rounded-full pill shape
- Small text (xs)
- Border with matching color
- Semi-transparent background

## SeverityChip

Displays incident severity level.

```tsx
<SeverityChip severity="SEV1" />
<SeverityChip severity="SEV2" />
<SeverityChip severity="CRITICAL" />
```

**Props:**
- `severity`: string (required) - severity level
- `className`: string (optional)

**Severity Colors:**
- `SEV1`, `CRITICAL`: Red
- `SEV2`, `HIGH`: Orange
- `SEV3`, `MEDIUM`: Yellow
- `SEV4`, `LOW`: Emerald
- Default: Gray

**Styles:**
- Same as StatusChip
- Distinguishes severity from status

## DataPathBadge

Displays data path flow with business context.

```tsx
// With full flow data
<DataPathBadge 
  flow={{
    dataPathKey: "abc123...",
    route: "/api/orders",
    method: "POST",
    businessType: "order",
    businessKey: "ord_12345",
    eventCount: 42,
    lastSeenAt: "2024-01-01T00:00:00Z"
  }}
/>

// With just the key
<DataPathBadge dataPathKey="abc123..." />
```

**Props:**
- `flow`: DataPathFlow (optional) - full flow object
- `dataPathKey`: string (optional) - just the key
- `className`: string (optional)

**Flow Object:**
```tsx
interface DataPathFlow {
  dataPathKey: string;
  route?: string;
  method?: string;
  businessType?: string;
  businessKey?: string;
  eventCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}
```

**Label Format:**

The badge intelligently formats based on available data:

1. **Full context:** `POST /api/orders · order=ord_12345`
2. **Route + method:** `GET /users/profile`
3. **Business key only:** `customer=cust_67890`
4. **Fallback:** `Path #abc12345`

**Styles:**
- Purple accent (distinguishes from status/severity)
- Very small text (11px)
- Rounded-full pill
- Tooltip shows full dataPathKey

## Common Patterns

### Incident Row

```tsx
<div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
  <div className="flex items-center gap-2 mb-2">
    <SeverityChip severity={incident.severity} />
    <StatusChip status={incident.status} />
    <span className="text-xs text-zinc-500">{incident.serviceName}</span>
  </div>
  <h3 className="text-sm font-medium text-zinc-50 mb-1">
    {incident.title}
  </h3>
  {incident.dataPathKeys?.map(key => (
    <DataPathBadge key={key} dataPathKey={key} />
  ))}
</div>
```

### Card with Header

```tsx
<Card>
  <h2 className="text-sm font-medium text-zinc-200 mb-3">
    Card Title
  </h2>
  <p className="text-xs text-zinc-500 mb-4">
    Subtitle or description
  </p>
  {/* Content */}
</Card>
```

### Action Buttons Group

```tsx
<div className="flex gap-2">
  <GhostButton onClick={handleSecondary}>
    Secondary Action
  </GhostButton>
  <PrimaryButton onClick={handlePrimary}>
    Primary Action
  </PrimaryButton>
</div>
```

### Watchlist Entry

```tsx
<div className="p-3 rounded-lg bg-white/5 border border-white/10">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <StatusChip status={entry.status} />
      <span className="text-xs text-orange-400">
        {Math.round(entry.riskScore * 100)}%
      </span>
    </div>
    <button className="text-xs text-zinc-500 hover:text-zinc-400">
      ✕
    </button>
  </div>
  <div className="text-xs text-zinc-300 mb-1">
    {entry.serviceName} · {entry.environment}
  </div>
  {entry.dataPathKey && (
    <DataPathBadge dataPathKey={entry.dataPathKey} />
  )}
</div>
```

### Data Path Flow Card

```tsx
<Card>
  <h2 className="text-sm font-medium text-zinc-200 mb-3">
    Data Path Flows
  </h2>
  <div className="space-y-2">
    {flows.map(flow => (
      <div key={flow.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
        <DataPathBadge flow={flow} />
        <div className="text-xs text-zinc-500 mt-1">
          {flow.eventCount} events · Last seen {getRelativeTime(flow.lastSeenAt)}
        </div>
      </div>
    ))}
  </div>
</Card>
```

## Color Reference

### Background Colors

```tsx
// Root
className="bg-[#050712]"

// Cards/Surfaces
className="bg-[#0b0f1a]/90"

// Hover states
className="bg-white/5 hover:bg-white/10"

// Active states
className="bg-white/10"
```

### Text Colors

```tsx
// Primary text
className="text-zinc-50"

// Secondary text
className="text-zinc-400"

// Muted text
className="text-zinc-500"

// Very muted
className="text-zinc-600"
```

### Accent Colors

```tsx
// Orange (primary accent)
className="bg-orange-500 text-black"
className="text-orange-400"
className="border-orange-500/40"

// Status colors
className="text-red-400"      // Critical
className="text-orange-400"   // Warning
className="text-emerald-400"  // Success
className="text-purple-400"   // Info
```

### Border Colors

```tsx
// Default border
className="border border-white/10"

// Hover border
className="hover:border-orange-500/40"

// Status borders
className="border-red-500/40"
className="border-orange-500/40"
className="border-emerald-500/40"
```

## Typography Scale

```tsx
// Page title
className="text-lg font-semibold tracking-tight text-zinc-50"

// Section title
className="text-sm font-medium text-zinc-200"

// Body text
className="text-sm text-zinc-400"

// Small text
className="text-xs text-zinc-500"

// Tiny text (badges)
className="text-[11px] font-medium"
```

## Spacing Scale

```tsx
// Card padding
className="p-4 md:p-5"

// Section gaps
className="space-y-4"
className="space-y-6"

// Inline gaps
className="gap-2"
className="gap-3"
className="gap-4"
```

## Responsive Patterns

### 2-Column Layout

```tsx
<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
  <div>{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

### 2-Column Equal

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <div>{/* Left */}</div>
  <div>{/* Right */}</div>
</div>
```

### Flex Wrap

```tsx
<div className="flex items-center gap-2 flex-wrap">
  {/* Items that wrap on small screens */}
</div>
```

## Best Practices

### DO ✅

- Use `Card` for all major content sections
- Use `PrimaryButton` for main CTAs
- Use `GhostButton` for secondary actions
- Use chips for status/severity consistently
- Use `DataPathBadge` to show business context
- Keep text hierarchy consistent
- Use relative time helpers for timestamps

### DON'T ❌

- Don't use raw divs for cards
- Don't mix button styles
- Don't use inconsistent colors
- Don't create custom badge styles
- Don't use absolute colors (use Tailwind utilities)
- Don't skip the Card wrapper for sections

## Accessibility

All components include:
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus visible states
- High contrast colors
- Readable font sizes

## Performance

Components are optimized for:
- Fast rendering (minimal DOM)
- Small bundle size
- No unnecessary re-renders
- Efficient CSS (Tailwind utilities)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (backdrop-filter works)
- Mobile browsers: ✅ Responsive design

---

**Questions?** Check the implementation in `src/components/ui/` or refer to the usage in `src/app/orgs/[orgSlug]/incidents/`.

🎃 Happy coding!
