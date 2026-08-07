RP v9.8.4 — Corrective Action Search + Source Sync Fix

Corrections:
- Corrective Actions search now normalizes names, spaces, punctuation and case.
- Search uses both the action name and Personnel Master name resolved by Employee Number.
- Search supports associate name, employee number, task, subtask, action ID, status and owner.
- Repository is re-read every time the table redraws, preventing stale rows.
- No stored corrective action is discarded by the repository.
- Dashboard Open Actions and Corrective Actions now use the exact same repository.
- Added a visible “X shown / Y total” diagnostic count above the table.
- Scheduled reassessments continue to appear as Upcoming when no real corrective action
  already represents that same assessment.
- User-facing no-AI/no-IA branding remains unchanged.

Existing local/browser data is preserved.
