---
name: dali-ui-audit-chrome-devtools
description: Click-driven UI audit workflow for DALI using Chrome DevTools MCP tools, focused on real interaction flows, accessibility, error states, and click-minimization for operational tasks.
---

# DALI UI Audit via Chrome DevTools MCP

Use this skill to run reproducible, interaction-based UI audits instead of static code-only reviews.

## When to use

- UI review requests for admin or portal pages.
- Workflow friction analysis (too many clicks, unclear actions, poor feedback).
- Accessibility and behavior validation in real browser execution.
- Regression checks after UI refactors.

## Required setup sequence

1. Identify target routes and user roles.
2. Define audit scenarios (primary workflows first).
3. Open browser page and navigate to scenario start route.
4. Execute flows with explicit click and input steps.
5. Capture evidence (snapshot, screenshot, console, errors).

## Required tool usage pattern

Primary tools:
- `open_browser_page`
- `navigate_page`
- `read_page`
- `click_element` (required for click-path auditing)
- `type_in_page`
- `screenshot_page`
- `mcp_playwright_browser_console_messages` or equivalent console capture

Optional tools:
- `hover_element`, `drag_element`, `handle_dialog`, `run_playwright_code`

## Audit method

### 1) Workflow execution

For each workflow:
- Start from realistic entry point.
- Count explicit user interactions (clicks/keys).
- Record blocking waits and ambiguous states.
- Validate success path and at least one failure path.

### 2) Interaction checks

- Primary action discoverability within first viewport.
- Keyboard operability for actionable controls.
- Dialog focus management and dismissal behavior.
- Error state clarity and next-step guidance.

### 3) Visual and semantic checks

- Label clarity and control grouping.
- Contrast and focus indicators.
- Consistency of action placement across related pages.

### 4) Technical checks

- Browser console errors/warnings during interactions.
- Broken controls (no-op click, double-submit risk).
- Navigation/history coherence (back behavior, canceled dialog paths).

## Output format for findings

Return findings ordered by severity:
- `Critical`: workflow blocked, data loss risk, or severe accessibility break.
- `High`: major friction on core workflow or confusing unsafe action.
- `Medium`: avoidable friction, inconsistent interaction pattern.
- `Low`: cosmetic or minor clarity issue.

For each finding include:
- Route/page.
- Reproduction steps with click sequence.
- Expected behavior.
- Actual behavior.
- Evidence artifact references (snapshot/screenshot/console excerpt).
- Suggested fix with minimal scope.

## DALI-specific workflow priorities

Audit these first for admin:
- Document tracker: list -> detail -> status transition.
- Document tracker: list/detail -> upload version.
- Document tracker: detail -> publish to archive.

Audit these for portal when relevant:
- SSR page load clarity and form completion flow.
- Error and confirmation messaging for citizen-facing actions.

## External references

- Nielsen usability heuristics:
  - https://www.nngroup.com/articles/ten-usability-heuristics/
- Web interface implementation guidance:
  - https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
