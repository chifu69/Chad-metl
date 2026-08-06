# RP IA v9.4 — Search & Profile Navigation Hard Fix

- Personnel search now runs directly against the complete Personnel Master on every keystroke.
- Exact and partial employee-number matches are normalized as digits.
- Name, role, shift, status, level, line, supervisor, and position ID are searchable.
- Eagle AI result buttons are rebound every time the floating conversation panel renders.
- Open employee profile resolves by employee number, position ID, or exact name and opens the specific profile.
- All frontend assets are cache-busted to v9.5.0.

## v9.4 focused reliability fix
- Personnel search now refreshes directly from the full Personnel Master and includes an iOS-safe value watcher.
- Existing failed Critical Gate assessment records are reconciled into visible corrective actions when a prior version did not create them.
- No dashboard layout or architecture changes were made in this maintenance release.
