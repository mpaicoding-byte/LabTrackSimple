#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN is required." >&2
  exit 1
fi

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "SUPABASE_PROJECT_REF is required." >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "SUPABASE_DB_PASSWORD is required." >&2
  exit 1
fi

SECRETS_FILE="${SECRETS_FILE:-.env.supabase}"

npx supabase@latest link --project-ref "${SUPABASE_PROJECT_REF}" --password "${SUPABASE_DB_PASSWORD}"
npx supabase@latest db push --dry-run
npx supabase@latest db push

if [[ -f "${SECRETS_FILE}" ]]; then
  npx supabase@latest secrets set --env-file "${SECRETS_FILE}" --project-ref "${SUPABASE_PROJECT_REF}"
else
  echo "Secrets file ${SECRETS_FILE} not found; skipping secrets push." >&2
fi
