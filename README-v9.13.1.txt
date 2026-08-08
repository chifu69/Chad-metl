RP v9.13.1 — Eagle Intent Classification Overhaul

BASE
- Built directly on RP v9.13.0 Eagle Operational Brain.

WHY
The v9.13.0 classifier still grouped some different objects into one intent.
Example:
- "Create new task" and "Create new subtask" both routed to task_create.

WHAT CHANGED
Eagle now parses every request in two stages:
1. ACTION: create, assign, start, open, edit, close, cancel, find, explain, list.
2. OBJECT: task, subtask, assessment, assignment, personnel, corrective action,
   readiness, qualification, evaluator, knowledge, backup, notifications, audit,
   departments, users, profile, dashboard, matrix, enterprise.

Specific objects are resolved before broad categories. Subtask is evaluated before
task, and Assigned Assessment is evaluated before generic Assessment.

NEW DISTINCT INTENTS
- task_create / task_edit / task_open / task_info
- subtask_create / subtask_edit / subtask_open / subtask_info
- person_create / person_edit
- assignment creation vs assignment listing vs assessment session
- existing readiness, corrective-action, qualification, evaluator, knowledge,
  backup and administration intents remain.

EXAMPLES EXPECTED
- "Create new task" -> Create METL task
- "Create new subtask" -> Create subtask
- "Add a subtask to M03" -> Create subtask prefilled to M03
- "Edit M03" -> Edit METL task M03
- "Edit M03-09" -> Edit subtask M03-09
- "Open M03" -> Open METL task
- "Open M03-09" -> Open subtask
- "Assign Luis M03 to Amy" -> Assign Assessment
- "Start assessment for Luis on M03" -> Assessment Session
- "What do I need to advance?" -> signed-in associate development context

DIAGNOSTICS
EagleOrchestrator.parseCommand(text)
EagleOrchestrator.classify(text)

The 20-engine registry and existing RP workflows remain intact.
This is still a deterministic local operational assistant, not a generative LLM.
