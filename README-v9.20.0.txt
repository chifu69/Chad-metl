RP v9.20.0 — Eagle Brain Rebuild

This is a full rebuild of Eagle's orchestration/classification layer, built directly
on the working RP v9.13.1 application.

ARCHITECTURE
User -> Eagle -> Intent + Entities + Conversation Context -> Permission Gate
     -> Engine Plan -> Existing RP workflow / grounded answer.

WHAT WAS REMOVED
- The previous incremental/priority-style classifier in eagle-controller.js.

WHAT REPLACED IT
- Registry-based scored intent classification.
- Separate ACTION parsing (assign/create/start/open/edit/close/cancel/find/explain/list).
- Separate OBJECT parsing (assignment/assessment/task/subtask/personnel/etc.).
- Entity extraction for associates, evaluators, METL tasks, and subtasks.
- Conversation context for follow-up references.
- Role-aware routing to existing RP workflows.
- Intent-specific engine plans using the existing 20-engine registry.

IMPORTANT EXAMPLES
- "Assign task to Jose Esquivel" -> assignment.create
- "Assign M03 to Jose" -> assignment.create
- "Assign Luis M03 to Amy" -> assignment.create with employee/task/evaluator prefill
- "Create new task" -> metl.task.create
- "Create new subtask" -> metl.subtask.create
- "Edit M03" -> metl.task.edit
- "Edit M03-09" -> metl.subtask.edit
- "Start assessment for Luis on M03" -> assessment.start
- "What do I need to advance?" -> development.advancement using signed-in user
- "What do I need to evaluate?" -> assignment.evaluator
- "Who can evaluate M03?" -> evaluator.authority
- "Who can perform M03-09 independently?" -> qualification.people
- "Show C Shift readiness" -> readiness.group
- "Show overdue corrective actions" -> corrective.list
- "Open Backup & Restore" -> system.backup

SAFETY / PERMISSIONS
Eagle does not write directly around RP permission rules. It opens the existing
authorized form/workflow. Read-only users are not offered administrator/evaluator
write actions.

NOTE
RP v9.20.0 is still a deterministic local operational assistant, not a generative LLM.
Cross-device shared data still requires the planned centralized server/database.
