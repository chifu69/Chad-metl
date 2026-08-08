RP v9.24.1 — Eagle Assessment Intent + Greeting Fix

Built directly on RP v9.24.0.

FIXED
- "Add assessment to Luis" now routes to assignment.create, not person.summary.
- Same for "Add assessment for Luis", "Create assessment for Luis",
  "Add evaluation to Luis", and similar wording.
- person.summary no longer steals requests that clearly contain assessment/assignment actions.
- Semantic recipient logic now treats assessment + to/for + person as assignment work.
- Greeting logic now prefers the actual configured user name. Generic "System" is avoided;
  administrator fallback is "System Administrator".

PRESERVED
- Editable Eagle Language Dictionary.
- Identity.self, knowledge.list, readiness.readyCandidates, dialog.cancel.
- Existing assessment, METL, corrective-action, readiness, backup and admin workflows.
