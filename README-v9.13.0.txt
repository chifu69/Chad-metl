RP v9.13.0 — Eagle Operational Brain

Built directly on RP v9.12.4.

Eagle is now the central orchestration layer for RP. It interprets the user's request,
uses the signed-in user's context, checks role/authority, consults the relevant RP
engines, and routes to existing application workflows instead of behaving mainly
like keyword search.

Key supported requests include:
- Assign Luis M03 to Amy / Create new assignment
- Show my assigned assessments / What do I need to evaluate?
- Start an assessment for Luis on M03
- What do I need to advance? / What am I missing?
- Show Luis readiness / Show C Shift readiness
- Show overdue corrective actions / Show my corrective actions
- Show Critical Gate issues
- Who can evaluate M03?
- Who can perform M03-09 independently?
- Explain M03 / show a subtask standard
- Open an approved procedure
- Open Personnel, Readiness Matrix, Notifications, Audit, Profile
- Open Backup & Restore / Administration / Enterprise (permission controlled)
- Add a new employee or METL task when authorized

The 20 engine registry remains intact. Eagle now maps operational intents to the
relevant engine groups and exposes EagleOrchestrator.engineCoverage() for diagnostics.

This remains a deterministic/local operational assistant, not a generative LLM.
Cross-device shared data still requires the planned central server/database.
