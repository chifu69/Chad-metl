RP v9.10.1 — Assessment Flow Progress + Save Fix

BASE
- RP v9.10.0 Assessment / Permissions / Backup build.

CHANGES
- Adds a sticky progress bar during an assessment.
- Shows X of Y subtasks evaluated.
- Adds Save Assessment near the top.
- Adds Save Assessment again at the bottom.
- Adds a clear Cancel Assessment button.
- Keeps existing submitAssessment() data logic intact.
- Existing guard still prevents saving when every subtask is NOT EVALUATED.

PRESERVED
- v9.10.0 permissions changes
- Eagle signed-in-user context
- Backup work
- Assessment associate search
- Corrective Actions
- Readiness Matrix
- Multi-department support
