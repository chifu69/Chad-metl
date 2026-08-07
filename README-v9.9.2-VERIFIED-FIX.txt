RP v9.9.2 — Verified Administration Export Fix

BASE USED
RP-v9.9.1-Assessment-Associate-Search-Fix(1).zip

VERIFIED BEFORE PATCHING
- Assessment Find Associate search exists.
- Search supports tokenized partial/full-name matching.
- Employee-number search remains present.
- Automatic selection when exactly one associate matches remains present.
- Multi-department Assessment behavior remains present.

ONLY FUNCTIONAL FIX ADDED
- Restored exportPersonnel()
- Restored exportTasks()
- Restored exportAssessments()
- All exports include Department.

VERSION/CACHE
- Service-worker cache/version bumped to v9.9.2.

NOT REBUILT OR REPLACED
- Assessment search
- Corrective Actions
- Readiness Matrix
- Department architecture
- Personnel logic
- Existing local/browser data
