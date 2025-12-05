# Kiro Agent Hooks Implementation 🎃

## Overview

Implemented two automated Kiro agent hooks to maintain code quality and documentation as the Runbook Revenant codebase evolves.

## Hooks Created

### 1. Backend Tests Runner (`.kiro/hooks/backend-tests.kiro.hook`)

**Purpose**: Automatically maintain test coverage when backend code changes.

**Trigger Configuration**:
```json
{
  "type": "fileSave",
  "patterns": [
    "src/modules/incidents/**/*.ts",
    "src/modules/connectors/**/*.ts",
    "src/modules/identity/**/*.ts",
    "src/modules/knowledge/**/*.ts",
    "src/modules/intelligence/**/*.ts"
  ],
  "excludePatterns": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

**Workflow**:
1. **Detects** when any backend module file is saved
2. **Inspects** the diff to understand what changed
3. **Updates/Creates** corresponding test files in `src/tests/`
4. **Runs** relevant tests or full suite
5. **Reports** results and suggests improvements

**Benefits**:
- Ensures tests stay synchronized with code
- Catches regressions immediately
- Maintains high test coverage
- Reduces manual testing overhead

**Example Scenario**:
```
Developer saves: src/modules/connectors/risk-evaluator.ts
Hook triggers → Kiro agent:
  1. Reads the changes
  2. Updates src/tests/connectors/risk-evaluator.test.ts
  3. Runs: npm test -- risk-evaluator.test.ts
  4. Reports: "✅ All 12 tests passed"
```

### 2. Documentation Sync (`.kiro/hooks/docs-sync.kiro.hook`)

**Purpose**: Keep documentation current with code changes.

**Trigger Configuration**:
```json
{
  "type": "fileSave",
  "patterns": [
    "src/modules/**/*.ts",
    "src/app/api/**/*.ts",
    "prisma/schema.prisma"
  ],
  "excludePatterns": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

**Workflow**:
1. **Detects** when module, API, or schema files are saved
2. **Analyzes** what changed (endpoints, models, flows)
3. **Updates** README.md with new features/endpoints
4. **Updates** docs/architecture.md with architectural changes
5. **References** specs in `.kiro/specs/` for context

**Benefits**:
- Documentation never falls behind code
- Reduces documentation debt
- Maintains consistency with specs
- Improves onboarding experience

**Example Scenario**:
```
Developer saves: src/app/api/orgs/[orgId]/watchlist/route.ts
Hook triggers → Kiro agent:
  1. Detects new API endpoint
  2. Updates README.md API section:
     - GET /api/orgs/:orgId/watchlist
     - Query params, response format
  3. Updates docs/architecture.md:
     - Adds watchlist to CIS module diagram
     - Documents data flow
```

## Hook File Structure

Each hook follows this schema:

```json
{
  "name": "Human-readable name",
  "description": "What this hook does",
  "version": "1.0.0",
  "trigger": {
    "type": "fileSave | agentComplete | newSession | manual",
    "patterns": ["glob/patterns/**/*.ts"],
    "excludePatterns": ["**/*.test.ts"]
  },
  "action": {
    "type": "sendMessage | executeCommand",
    "message": "Instructions for Kiro agent..."
  },
  "enabled": true,
  "metadata": {
    "author": "Team name",
    "tags": ["tag1", "tag2"],
    "category": "category"
  }
}
```

## Usage

### Viewing Hooks
1. Open Kiro Explorer panel
2. Navigate to "Agent Hooks" section
3. See all hooks and their enabled status

### Managing Hooks
- **Enable/Disable**: Edit hook file, set `"enabled": true/false`
- **Modify**: Edit the JSON file directly
- **Test**: Save a matching file and observe agent behavior

### Command Palette
- `Open Kiro Hook UI` - Visual interface for managing hooks

## Integration with Development Workflow

### Before Hooks:
```
Developer workflow:
1. Write code
2. Manually write tests
3. Manually run tests
4. Manually update docs
5. Commit
```

### With Hooks:
```
Developer workflow:
1. Write code
2. Save file → Tests auto-updated and run
3. Save file → Docs auto-updated
4. Review agent changes
5. Commit
```

## Best Practices

### Do's ✅
- Keep trigger patterns specific to avoid noise
- Use excludePatterns to prevent infinite loops
- Write clear, actionable agent instructions
- Test hooks before enabling permanently
- Document new hooks in README

### Don'ts ❌
- Don't use overly broad patterns (e.g., `**/*`)
- Don't trigger on test files when updating tests
- Don't create hooks that conflict with each other
- Don't write vague agent instructions
- Don't enable untested hooks in production

## Advanced Hook Ideas

### Future Enhancements:

**1. Migration Validator**
```json
{
  "trigger": { "patterns": ["prisma/schema.prisma"] },
  "action": "Validate schema changes, generate migration, update types"
}
```

**2. API Contract Validator**
```json
{
  "trigger": { "patterns": ["src/app/api/**/*.ts"] },
  "action": "Ensure API responses match OpenAPI spec"
}
```

**3. Security Audit**
```json
{
  "trigger": { "patterns": ["src/modules/**/*.ts"] },
  "action": "Check for common security issues (SQL injection, XSS, etc.)"
}
```

**4. Performance Monitor**
```json
{
  "trigger": { "type": "agentComplete" },
  "action": "Run performance benchmarks on changed code"
}
```

**5. Changelog Generator**
```json
{
  "trigger": { "type": "manual" },
  "action": "Generate changelog from git commits since last release"
}
```

## Troubleshooting

### Hook Not Triggering
- ✓ Check `"enabled": true`
- ✓ Verify file path matches patterns
- ✓ Check Kiro output panel for errors
- ✓ Restart Kiro IDE

### Hook Triggering Too Often
- ✓ Make patterns more specific
- ✓ Add excludePatterns
- ✓ Consider using manual trigger instead

### Agent Not Following Instructions
- ✓ Make message more specific
- ✓ Break into smaller steps
- ✓ Reference specific files/patterns
- ✓ Test message manually first

## Files Created

```
.kiro/hooks/
├── backend-tests.kiro.hook      # Auto-run tests on code changes
├── docs-sync.kiro.hook          # Auto-update documentation
└── README.md                    # Hook system documentation
```

## Compliance with Steering

✅ **Automation**: Reduces toil, aligns with SRE principles
✅ **Quality**: Maintains test coverage and documentation
✅ **Developer Experience**: Streamlines workflow
✅ **Consistency**: Ensures standards are followed
✅ **Scalability**: Hooks scale with codebase growth

## Metrics to Track

Once hooks are in use, monitor:
- **Test Coverage**: Should increase over time
- **Documentation Freshness**: Time between code change and doc update
- **Developer Satisfaction**: Survey team on hook usefulness
- **False Positives**: How often hooks trigger unnecessarily
- **Time Saved**: Estimate manual work automated

## Next Steps

1. **Enable hooks** in Kiro IDE
2. **Test workflow** by saving a module file
3. **Review agent output** and refine instructions if needed
4. **Gather feedback** from team
5. **Iterate** on hook configurations

---

**Status**: ✅ Implementation Complete
**Files**: 3 files created in `.kiro/hooks/`
**Ready**: Hooks are ready to use immediately
