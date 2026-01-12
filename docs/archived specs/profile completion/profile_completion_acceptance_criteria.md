# Acceptance Criteria — Profile Completion (DOB + Gender)

## Gate Behavior
- AC1: On first authenticated load, if the current user's linked person is missing `date_of_birth` or `gender`, the user is redirected to the completion screen.
- AC2: If both fields are present, the user is not gated and can access the app normally.
- AC3: The gate remains in place until the profile is successfully saved.

## Form Validation
- AC4: DOB is required and must be a past date.
- AC5: Gender is required and must be one of `female` or `male`.
- AC6: The submit action is disabled until the form is valid.

## Save Behavior
- AC7: Submitting the form updates the user's linked `people` row.
- AC8: After successful save, the user is routed back to the main app (e.g., dashboard).
- AC9: If the save fails, an error message is displayed and the user stays on the completion screen.

## Permissions
- AC10: A user can only update their own linked person record.
- AC11: Owners can still edit other people via the People management UI.

## Testing
- AC12: Component tests cover validation errors and success.
- AC13: At least one E2E flow covers signup/login -> completion -> app access.
- AC14: UI behavior is verified via Chrome DevTools MCP.
