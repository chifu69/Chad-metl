RP v9.9.0 — Multi-Department Foundation + Assessment Search + Mobile Matrix

1. Assessment Session
- Added Department selector.
- Added live associate search by name or employee number.
- Associate list filters immediately instead of requiring long scrolling.
- METL task list follows the selected department.

2. Multi-department architecture
- Added a Departments collection to the state model.
- Existing data is migrated automatically to Extrusion.
- Extrusion remains the initial/default department.
- Administrators can add new departments in Administration.
- Employees and METL tasks can be assigned to departments.
- Assessment sessions, results, and corrective actions carry departmentId.
- Administration and Readiness Matrix include department filters.
- Default department can be selected in Administration.
- This structure is intended to support adding future departments without rebuilding the application.

3. Readiness Matrix
- Replaced the very wide mobile table with responsive associate cards.
- Search remains available.
- Added department filter.
- Each card shows employee number, department, shift, role, assigned level,
  highest fully qualified level, and readiness percentage.
- View readiness details opens the associate profile.

Existing browser/local data is preserved and normalized automatically.
User-facing no-AI/no-IA branding from v9.8.5 is preserved.
