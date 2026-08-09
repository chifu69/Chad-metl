RP v9.25.1 — Eagle Direct Module Intents

Built directly on RP v9.25.0.

FIX
Eagle now treats direct module names as high-confidence navigation intents.

Examples:
- Assessments / Evaluations -> Assessments
- Assignments / Assigned Work -> Assigned Assessments
- Personnel / Employees -> Personnel
- METL / Tasks / Subtasks -> METL & Subtasks
- Corrective Actions -> Corrective Actions
- Readiness Matrix -> Readiness Matrix
- Notifications -> Notifications
- Audit Trail -> Audit Trail
- Backup -> Backup & Restore

This corrects the issue where typing "Assessments" was recognized as a concept
but fell through because no generic assessment module intent existed.

No Dashboard logic or role permissions were changed in this update.
