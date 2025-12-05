# 🎃 Runbook Revenant - Demo Video Script

**Duration**: 2-3 minutes  
**Target Audience**: Hackathon judges, SRE teams, developers

---

## Opening (0:00-0:20)

**[Screen: Dark screen with pumpkin icon fading in]**

**Voiceover**:
> "It's 3 AM. Your pager goes off. Production is down. You scramble to find the runbook... but it's buried in a wiki from 2019. Alerts are scattered across Grafana, Datadog, and Slack. And you have no idea where to start."

**[Screen: Chaotic montage of multiple browser tabs, Slack messages, terminal windows]**

> "This is the reality of incident response today."

---

## Problem Statement (0:20-0:40)

**[Screen: Transition to clean Runbook Revenant logo]**

**Voiceover**:
> "Introducing Runbook Revenant—your AI-powered incident copilot that brings dead runbooks back to life."

**[Screen: Show tagline: "Centralize. Guide. Learn."]**

> "We solve three critical problems:"

**[Screen: Animated list appears]**
- ❌ Dead runbooks nobody reads
- ❌ Fragmented incident context
- ❌ Inconsistent postmortems

---

## Demo: Incident Dashboard (0:40-1:10)

**[Screen: Navigate to http://localhost:3000/orgs/demo-org/incidents]**

**Voiceover**:
> "Here's the Runbook Revenant dashboard. Notice the Halloween theme—we built this for Kiroween!"

**[Action: Point to incident list]**

> "All your incidents in one place, with real-time filtering by status and severity."

**[Action: Scroll to right sidebar showing SLA Watchlist]**

> "But here's the magic: our SLA Watchlist. It proactively monitors services approaching thresholds—catching issues before they become incidents."

**[Action: Hover over a watchlist entry showing 95% risk score]**

> "This checkout service is at 95% risk of breaching its SLA. We can see the error rate, log snippets, and take action immediately."

---

## Demo: Incident War Room (1:10-1:50)

**[Screen: Click into a specific incident]**

**Voiceover**:
> "Let's dive into an active incident. This is your war room."

**[Action: Point to timeline on left]**

> "Every signal, action, and status change is captured in an event-sourced timeline. Complete audit trail, no information lost."

**[Action: Scroll to right sidebar showing AI guidance]**

> "And here's where AI takes over. Runbook Revenant analyzes the incident and gives you:"

**[Action: Highlight each section]**
- "Suggested next steps from your runbooks"
- "Diagnostic questions to guide your investigation"
- "Related incidents from your history"

**[Action: Click "Execute" on a suggested action]**

> "Actions are categorized by safety level—safe, risky, or info-only. We prioritize safety over speed."

---

## Demo: Postmortem Generation (1:50-2:20)

**[Screen: Click "Generate Postmortem" button]**

**Voiceover**:
> "Once the incident is resolved, generating a postmortem is one click away."

**[Action: Show postmortem modal appearing with markdown]**

> "Runbook Revenant analyzes the entire timeline and generates a blameless, structured postmortem following SRE best practices."

**[Action: Scroll through postmortem sections]**
- "Summary of what happened"
- "Complete timeline"
- "Root cause analysis"
- "Action items with owners"

**[Action: Click "Create PR" button]**

> "And with one more click, we push it to GitHub as a pull request. Your team reviews, merges, and the knowledge is preserved forever."

**[Screen: Show GitHub PR preview]**

---

## Demo: Kiro Integration (2:20-2:50)

**[Screen: Switch to VS Code / Kiro IDE]**

**Voiceover**:
> "But here's what makes this project special: it was built entirely with Kiro IDE."

**[Action: Open .kiro/steering/ folder]**

> "These steering files define our product vision, technical standards, and SRE principles. They guide every AI interaction."

**[Action: Open .kiro/specs/ folder]**

> "Our specs contain formal requirements and design documents with correctness properties—ensuring we build the right thing."

**[Action: Open .kiro/hooks/ folder]**

> "Agent hooks automatically update tests and documentation when code changes. No manual toil."

**[Action: Open .kiro/settings/mcp.json]**

> "And MCP connectors integrate with GitHub, Jira, and Slack—bringing external tools into our workflow."

**[Screen: Show quick code generation example]**

**Voiceover**:
> "Watch this: 'Add an SLA watchlist feature that evaluates risk from metrics.'"

**[Action: Kiro generates code in real-time]**

> "Kiro reads the steering files, follows the specs, and implements the feature end-to-end. This is vibe coding."

---

## Closing (2:50-3:00)

**[Screen: Return to Runbook Revenant dashboard with pumpkin icon]**

**Voiceover**:
> "Runbook Revenant: bringing your runbooks back from the dead, one incident at a time."

**[Screen: Show key stats]**
- 5 Service Modules
- Event-Sourced Architecture
- Multi-Tenant with RBAC
- Built with Kiro AI

**[Screen: Final tagline]**

> "Ready to respond faster, learn from every incident, and prevent future outages?"

**[Screen: GitHub repo URL and "Try it now" CTA]**

**Voiceover**:
> "Check out the repo and bring your runbooks back to life. Happy Kiroween! 🎃"

**[Screen: Fade to black with pumpkin icon]**

---

## Technical Notes for Recording

### Screen Recording Setup
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 fps
- **Audio**: Clear voiceover, no background music
- **Cursor**: Highlight cursor for visibility

### Demo Data Preparation
1. Seed database with realistic incidents
2. Create SLA watchlist entries with varying risk scores
3. Pre-generate a postmortem for quick demo
4. Have GitHub PR ready to show

### Transitions
- Use smooth fades between sections
- Highlight UI elements with subtle animations
- Keep text overlays minimal and readable

### Pacing
- Speak clearly and not too fast
- Pause briefly between major sections
- Allow time for viewers to read on-screen text

### B-Roll Suggestions
- Code snippets appearing
- Terminal commands running
- GitHub PR being created
- Kiro IDE in action

---

## Alternative: Live Demo Script

If presenting live instead of recording:

### Setup (Before Demo)
1. Open browser to incidents dashboard
2. Open Kiro IDE in second window
3. Have GitHub open in third tab
4. Test all features work

### Talking Points
- **Problem**: "How many of you have been paged at 3 AM?"
- **Solution**: "Let me show you how Runbook Revenant changes that."
- **Dashboard**: "Everything in one place—no more tab switching."
- **Watchlist**: "Proactive monitoring catches issues early."
- **War Room**: "AI guidance from your own runbooks."
- **Postmortem**: "One click to document and share learnings."
- **Kiro**: "And it was all built with AI assistance."

### Backup Plan
- Have screenshots ready if live demo fails
- Pre-record critical sections as fallback
- Have curl commands ready to show API

---

## Key Messages to Emphasize

1. **Problem-Solution Fit**: Clear pain points → clear solutions
2. **AI-Powered**: Not just automation, intelligent guidance
3. **SRE Best Practices**: Blameless, event-sourced, safety-first
4. **Multi-Tenant**: Production-ready architecture
5. **Kiro Showcase**: Built with AI, for AI-native development

---

## Post-Demo Q&A Prep

**Expected Questions**:

Q: "How does it integrate with existing tools?"  
A: "MCP connectors for GitHub, Jira, Slack. Webhook endpoints for Grafana, Datadog."

Q: "What about security?"  
A: "Multi-tenant with strict org isolation, RBAC, JWT auth. Every query scoped by orgId."

Q: "Can it handle high volume?"  
A: "Event sourcing scales horizontally. Async projections planned for v0.2."

Q: "How accurate is the AI guidance?"  
A: "It learns from your runbooks and past incidents. Gets better over time."

Q: "What's the tech stack?"  
A: "Next.js, TypeScript, PostgreSQL, Prisma. Built with Kiro IDE."

---

**Good luck with your demo! 🎃**
