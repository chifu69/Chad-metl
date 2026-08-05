# RP IA v5.0.3 Stability Report

This maintenance release fixes the dashboard export crash and audits the startup/navigation functions that previously caused missing-variable errors.

## Fixed

- Added `exportDashboard()`.
- Added reusable `csv()` and `download()` helpers required by every export and backup button.
- Confirmed these startup/navigation views are defined:
  - Dashboard
  - RP Brain
  - Personnel
  - METL & Subtasks
  - Readiness Matrix
  - Assessment
  - Assessment History
  - Corrective Actions
  - Notifications
  - Audit Trail
  - My Profile
  - Administration
- Updated service-worker and asset cache version to 5.0.3.

## Validation performed

- `node --check app.js` passed.
- Direct click-handler references were scanned for missing named functions.
- The known missing symbols `notificationView`, `auditView`, `exportDashboard`, `csv`, and `download` are all present.

## Deployment

Replace every prior repository file with this release. Do not mix files from older versions. After GitHub Pages finishes deploying, close the installed PWA/Safari tab and reopen it so the new service worker can take control.
