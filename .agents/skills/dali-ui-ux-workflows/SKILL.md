---
name: dali-ui-ux-workflows
description: Practical DALI UI/UX implementation standards prioritizing operational efficiency, low-click workflows, accessibility, and clear system feedback for admin and portal experiences.
---

# DALI UI/UX Workflows

Use this skill to implement interfaces that are fast for staff and clear for citizens.

## Primary objective

Minimize clicks and cognitive load for high-frequency workflows while preserving accuracy, accessibility, and safety.

## Workflow-first design rules

- Identify top 3 user goals for the screen before coding.
- Place primary actions in predictable high-visibility locations.
- Keep common actions one or two interactions away.
- Move advanced/rare actions behind progressive disclosure.

## Document tracker UX priorities

- Logging a new document must be available directly from list screen.
- Reviewing status and key metadata must be visible without tab hopping.
- Status transitions should be obvious, role-aware, and confirmation-safe.
- Upload and publish flows must show current step and blocking state.

## Feedback rules

- Every mutation gets immediate feedback: pending, success, failure.
- Error messages include clear next step.
- Long operations provide progress or deterministic waiting state.

## Accessibility baseline

- WCAG AA minimum.
- Keyboard-accessible dialogs and action buttons.
- Semantic form labels and ARIA where required.
- Sufficient contrast and visible focus states.

## Click-minimization checklist

- Can user complete primary workflow without navigating away?
- Are repeated filters/actions persisted sensibly?
- Are default values chosen for common cases?
- Are dangerous actions protected with confirmation, not friction everywhere else?

## Anti-patterns

- Hiding primary action below fold or in overflow menus.
- Requiring repeated navigation for related tasks.
- Generic failure toasts without remediation.
- Overloading single views with low-value controls.

## External references

- Nielsen usability heuristics:
  - https://www.nngroup.com/articles/ten-usability-heuristics/
- Web interface implementation guidance:
  - https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
