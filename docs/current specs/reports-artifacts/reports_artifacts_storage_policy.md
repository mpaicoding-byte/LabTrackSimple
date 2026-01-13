# Reports + Artifacts Storage Policy

## Bucket
- Bucket ID: `lab-artifacts`
- Private bucket (no public access)
- Object path: `{household_id}/{report_id}/{artifact_id}.{ext}`

## RLS Policy Goals
- Owners can upload objects for their household reports.
- Members can read objects only if the artifact belongs to their linked person.
- Signed URLs are generated via `createSignedUrl` and respect RLS.

## Policy Outline (storage.objects)
- INSERT: allow owners when `bucket_id = 'lab-artifacts'` and `name` matches a `lab_artifacts.object_path` for a report in their household.
- SELECT: allow owners and members when `bucket_id = 'lab-artifacts'` and `name` matches a `lab_artifacts.object_path` they can read via household + person linkage.

## Signed URL Path
- Client calls `supabase.storage.from('lab-artifacts').createSignedUrl(object_path, expiresIn)`.
- `object_path` is the exact `lab_artifacts.object_path` value.
