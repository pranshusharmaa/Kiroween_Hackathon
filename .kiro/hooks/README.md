# Kiro Agent Hooks 🎃

This directory contains Kiro agent hooks that automate development workflows for Runbook Revenant.

## What are Hooks?

Hooks allow Kiro to automatically trigger agent executions when specific events occur in the IDE. They help maintain code quality, documentation, and test coverage without manual intervention.

## Available Hooks

### 1. Backend Tests Runner (`backend-tests.kiro.hook`)

**Purpose**: Automatically update and run tests when backend module files are saved.

**Triggers on**:
- `src/modules/incidents/**/*.ts`
- `src/modules/connectors/**/*.ts`
- `src/modules/identity/**/*.ts`
- `src/modules/knowledge/**/*.ts`
- `src/modules/intelligence/**/*.ts`

**Excludes**:
- Test files (`*.test.ts`, `*.spec.ts`)

**What it does**:
1. Inspects the diff to understand changes
2. Updates or creates corresponding tests in `src/tests/`
3. Runs relevant tests (or full suite with `npm test`)
4. Summarizes test results and suggests improvements

**Use case**: Ensures test coverage stays up-to-date as you develop backend logic.

### 2. Documentation Sync (`docs-sync.kiro.hook`)

**Purpose**: Automatically update documentation when module or API files change.

**Triggers on**:
- `src/modules/**/*.ts`
- `src/app/api/**/*.ts`
- `prisma/schema.prisma`

**Excludes**:
- Test files (`*.test.ts`, `*.spec.ts`)

**What it does**:
1. Analyzes changes in the saved file
2. Updates `README.md` with new endpoints or features
3. Updates or creates `docs/architecture.md` with architectural changes
4. References specs in `.kiro/specs/` for context
5. Keeps documentation concise and accurate

**Use case**: Keeps documentation in sync with code changes automatically.

## Managing Hooks

### View Hooks
1. Open the Kiro Explorer panel
2. Navigate to "Agent Hooks" section
3. See all available hooks and their status

### Enable/Disable Hooks
- Edit the hook file and set `"enabled": true` or `"enabled": false`
- Or use the Kiro Hook UI from the command palette: `Open Kiro Hook UI`

### Create New Hooks
1. Create a new `.kiro.hook` file in this directory
2. Follow the JSON schema (see examples above)
3. Reload Kiro or restart the IDE

## Hook File Schema

```json
{
  "name": "Hook Name",
  "description": "What this hook does",
  "version": "1.0.0",
  "trigger": {
    "type": "fileSave",
    "patterns": ["glob/pattern/**/*.ts"],
    "excludePatterns": ["**/*.test.ts"]
  },
  "action": {
    "type": "sendMessage",
    "message": "Instructions for Kiro agent..."
  },
  "enabled": true,
  "metadata": {
    "author": "Your Name",
    "tags": ["tag1", "tag2"],
    "category": "category"
  }
}
```

## Trigger Types

- `fileSave` - Triggers when a file matching the pattern is saved
- `agentComplete` - Triggers when an agent execution completes
- `newSession` - Triggers on first message send in a new session
- `manual` - User clicks a button to trigger

## Action Types

- `sendMessage` - Sends a message to the agent
- `executeCommand` - Runs a shell command

## Best Practices

1. **Keep patterns specific**: Avoid overly broad patterns that trigger too often
2. **Use excludePatterns**: Prevent infinite loops (e.g., exclude test files when testing)
3. **Clear instructions**: Make agent messages specific and actionable
4. **Test hooks**: Verify hooks work as expected before enabling permanently
5. **Document changes**: Update this README when adding new hooks

## Troubleshooting

**Hook not triggering?**
- Check that `"enabled": true`
- Verify file patterns match your file paths
- Check Kiro output panel for errors

**Hook triggering too often?**
- Add more specific patterns
- Use excludePatterns to filter out unwanted files

**Agent not following instructions?**
- Make the message more specific
- Break complex tasks into smaller steps
- Reference specific files or patterns

## Examples

### Example: Spell Check Hook
```json
{
  "name": "Spell Check README",
  "trigger": {
    "type": "manual"
  },
  "action": {
    "type": "sendMessage",
    "message": "Please review README.md for spelling and grammar errors, then fix any issues found."
  },
  "enabled": true
}
```

### Example: Translation Update Hook
```json
{
  "name": "Update Translations",
  "trigger": {
    "type": "fileSave",
    "patterns": ["locales/en/**/*.json"]
  },
  "action": {
    "type": "sendMessage",
    "message": "English translation strings were updated. Please update corresponding translations in other language files."
  },
  "enabled": true
}
```

## Contributing

When adding new hooks:
1. Test thoroughly before committing
2. Document the hook in this README
3. Use descriptive names and clear instructions
4. Consider the impact on developer workflow

---

**Note**: Hooks are powerful automation tools. Use them wisely to enhance productivity without creating noise or interruptions.
