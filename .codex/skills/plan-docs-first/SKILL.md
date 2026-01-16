---
name: plan-docs-first
description: Always orient work in the LabTrackSimple repo by reading `implementation_plan.md` to identify pending tasks and proceed. Use when deciding next steps, interpreting project scope, or validating work against the plan. If plan details or product intent are unclear, consult design docs in `docs/` (notably `docs/product_design_document.md` and `docs/technical_specification.md`) before acting.
---

# Plan Docs First

## Overview

Follow the implementation plan as the single source of truth for task ordering and scope. Use product/design docs only to resolve ambiguity or confirm intended behavior.

## Workflow

### 1) Read the plan first

Open `implementation_plan.md`. Identify pending tasks, dependencies, and any explicit priority cues. Propose the next task to execute and confirm if multiple reasonable choices exist.

### 2) Resolve ambiguity via docs

If plan wording is unclear or you need product intent, read the relevant design docs in `docs/`. Default to:
- `docs/product_design_document.md` for user flows, UX intent, and product goals.
- `docs/technical_specification.md` for architecture, constraints, and implementation details.

Summarize only the parts that affect the pending task. Update the docs after user confiramtion if they need any updates.

### 3) Proceed with the task

Carry out the next task using the plan as the source of truth.

### 4) Ask when inputs are missing

If `implementation_plan.md` or `docs/` are missing or out of date, ask the user which source to trust or whether to update the plan.

Always update the checklist once every item is completed and don't wait for the phase to be completed.
