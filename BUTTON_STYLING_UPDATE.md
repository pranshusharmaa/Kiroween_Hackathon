# Button Styling Update 🎨

## Changes Made

### 1. Generate Postmortem Button
**Changed:** "Generate Postmortem" → **"Postmortem"**

**Reasoning:**
- Shorter, cleaner text
- Matches professional UI standards
- Reduces visual clutter
- Action is implied by button context

### 2. Create PR Button Styling
**Updated:** Consistent GhostButton styling

**Before:**
```tsx
<button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded...">
  {loading ? 'Creating PR…' : 'Create PR'}
</button>
```

**After:**
```tsx
<GhostButton onClick={handleClick} disabled={loading} className="w-full">
  {loading ? 'Creating...' : 'Create PR'}
</GhostButton>
```

### 3. Visual Consistency

**Both buttons now:**
- Use `GhostButton` component
- Have consistent rounded-full shape
- Share same hover states
- Match the design system
- Have proper disabled states

**Button Layout:**
```tsx
<div className="flex flex-col gap-2">
  <GhostButton>Postmortem</GhostButton>
  <GhostButton>Create PR</GhostButton>
</div>
```

### 4. Success Message Styling

**Updated success message:**
- Changed from `green-500` to `emerald-500` (matches design system)
- Consistent rounded corners
- Better color harmony

**Before:**
```tsx
<div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
```

**After:**
```tsx
<div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
```

## Visual Result

### Button Stack
```
┌─────────────────────┐
│    Postmortem       │  ← GhostButton (glassy)
└─────────────────────┘
┌─────────────────────┐
│    Create PR        │  ← GhostButton (glassy)
└─────────────────────┘
```

### On Hover
```
┌─────────────────────┐
│    Postmortem       │  ← Slightly brighter
└─────────────────────┘
```

### Loading State
```
┌─────────────────────┐
│   Generating...     │  ← Disabled, dimmed
└─────────────────────┘
```

### Success State
```
┌─────────────────────┐
│    Create PR        │
└─────────────────────┘
┌─────────────────────────────────┐
│ ✓ PR created successfully!      │
│ https://github.com/...          │
└─────────────────────────────────┘
```

## Benefits

✅ **Consistency** - Both buttons use same component  
✅ **Cleaner** - Shorter button text  
✅ **Professional** - Matches design system  
✅ **Accessible** - Proper disabled states  
✅ **Responsive** - Full width in container  

## Files Modified

1. `src/app/orgs/[orgSlug]/incidents/[incidentId]/page.tsx`
   - Changed button text: "Generate Postmortem" → "Postmortem"

2. `src/components/CreatePostmortemPRButton.tsx`
   - Imported `GhostButton` component
   - Replaced custom button with `GhostButton`
   - Updated loading text: "Creating PR…" → "Creating..."
   - Updated success message colors to emerald

## Testing

To verify the changes:

1. Navigate to any incident detail page
2. Check that both buttons have the same styling
3. Click "Postmortem" - should show "Generating..."
4. Click "Create PR" - should show "Creating..."
5. Verify success message appears with emerald colors

## Design System Compliance

Both buttons now follow the design system:
- Component: `GhostButton`
- Shape: `rounded-full`
- Background: `bg-white/5 hover:bg-white/10`
- Text: `text-zinc-200`
- Border: `border border-white/10`
- Disabled: `disabled:opacity-60`

Perfect consistency! 🎃
