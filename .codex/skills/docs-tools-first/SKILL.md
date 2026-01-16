---
name: docs-and-specs-first
description: Consult official docs via Context7/Tavily before implementing changes, and apply the repo's spec-generation workflow when asked to create plans/specs. Use for new dependencies, SDK/API wiring, or when producing feature docs.
---

# Docs Tools First

## Purpose

Always consult official documentation before implementation or wiring code. Prefer current best practices and the latest stable guidance, using Context7 for library docs and Tavily for official sites, release notes, and integration guides.

## Workflow

### 1) Identify the target

Clarify the library, framework, API, or integration. If the version or provider is ambiguous, ask the user before proceeding.

### 1.5) Update checklists immediately

If you complete any checklist item (specs, plans, phase checklists), mark it done right away before moving to the next step. Do not batch updates at the end.

### 2) Read docs with Context7 (primary)

Use Context7 to resolve the library ID and query the exact topic needed. Capture recommended patterns, required configuration, and warnings.
- Prefer the newest stable docs unless the user specifies a version

### 3) Validate with Tavily (secondary)

Use Tavily to fetch from official documentation sites only if needed and context7 is not enough or if you want to browse web

### 4) Summarize before coding

Provide a brief summary of the relevant guidance and the intended approach. If docs conflict or are outdated, ask the user how to proceed.

### 5) Implement

Only after docs are read and summarized, implement the minimal code required by the task.

## Guardrails

- Do not implement or wire code before consulting docs.
- Prefer official sources and primary documentation over blogs.
- Keep Context7 and Tavily calls focused to stay within tool limits.
- When reviewing or editing docs, align terminology and paths (schema fields, storage paths, onboarding requirements) across README, specs, and checklists.
- When a checklist item is completed, update the checklist immediately (no batching).

## Document Generation (Repo Convention)

Use this when the user asks for specs, plans, or checklists.

- Create docs in `docs/current specs/(feature-name)` with clear, task-specific filenames.
- For new features, generate this set by default:
  - `*_spec.md` (problem, goals, non-goals, flow, data, UX, validation, edge cases)
  - `*_user_stories_acceptance_criteria.md`
  - `*_checklist.md` (Red/Green/Verify) and very detailed checklist with all options, so user can validate and verify before you implement.
- Keep content short, explicit, and testable; avoid duplicating what already exists.
- If a spec replaces an older one, move the old doc into `docs/archived specs/(feature-name)/`.
- Create multiple feature folders if the implementation is big.
- Mark checklist items as completed immediately after each item is done; do not wait for the whole phase to finish.
- Add a "Comments" section at the bottom of each checklist to capture not-run items, missing dependencies, approvals needed, or user follow-ups required.
