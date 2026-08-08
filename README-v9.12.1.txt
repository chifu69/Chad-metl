RP v9.12.1 — Assigned Assessments + Dashboard Motto Visibility Fix

ROOT CAUSE
platform-v9.js loads after app.js and was replacing RP's navigation and dashboard.
The v9.12.0 Assigned Assessments and motto existed in app.js, but the enterprise
platform layer hid/replaced them after startup.

FIXED
- Assigned Assessments is now included in the final visible platform navigation.
- Platform navigation routes Assigned Assessments to the existing assignment workflow.
- Administrator Dashboard now includes an Assign Assessment button.
- RUN LIKE NEW / LOOK LIKE NEW is applied after the platform dashboard loads.
- Navigation footer and page footer identify RP v9.12.1.
- Browser script query versions and service-worker cache bumped to 9.12.1.

PRESERVED
- Existing v9.12.0 Assigned Assessment data/workflow.
- Assessment search and assessment saving.
- Permissions/context work.
- Backup work.
- Corrective Actions fixes.
- Readiness Matrix.
- Multi-department foundation.

PACKAGE CLEANUP
- Old version-specific README text files were removed from this ZIP.
- Main README.md and this current version note remain.
