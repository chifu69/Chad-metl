RP v9.12.4 — Header Motto Visible Animation Fix

BASE
- RP v9.12.3.

ROOT CAUSE
- Header-level generic styling was still applying pill/capsule backgrounds and truncation to
  the motto text.
- Reduced Motion settings could also make the previous animation appear static.

FIXED
- RUN LIKE NEW / LOOK LIKE NEW now forcibly renders as clean plain text.
- Removed inherited capsule backgrounds, borders, padding and clipping.
- Added a clearly visible but professional glow/scale pulse every few seconds.
- If iOS Reduce Motion is enabled, the text still performs a soft brightness/glow animation.
- Version/cache bumped to v9.12.4.

PRESERVED
- Assigned Assessments workflow
- Dashboard Assigned Work KPI
- Ask Eagle assignment intent
- Assessment workflow
- Permissions/context
- Backup
- Corrective Actions
- Readiness Matrix
- Multi-department support
