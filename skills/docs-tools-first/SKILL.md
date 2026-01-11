---
name: docs-tools-first
description: Read official documentation using mcp servers: Context7 and Tavily before implementing or wiring code for libraries, frameworks, or integrations. Use this when adding new dependencies, configuring SDKs, or changing how an API is used, writing code etc., to ensure best practices and current guidance are followed.
---

# Docs Tools First

## Purpose

Always consult official documentation before implementation or wiring code. Prefer current best practices and the latest stable guidance, using Context7 for library docs and Tavily for official sites, release notes, and integration guides.

## Workflow

### 1) Identify the target

Clarify the library, framework, API, or integration. If the version or provider is ambiguous, ask the user before proceeding.

### 2) Read docs with Context7 (primary)

Use Context7 to resolve the library ID and query the exact topic needed. Capture recommended patterns, required configuration, and warnings.

- `resolve-library-id` for the package name
- `query-docs` for specific tasks (auth, setup, migration, etc.)
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
- Note the version and doc source when relevant.
- Keep Context7 and Tavily calls focused to stay within tool limits.
