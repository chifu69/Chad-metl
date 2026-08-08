RP v9.21.0 — Eagle Semantic Role Brain

Built directly on RP v9.20.0.

MAJOR CHANGE
Eagle now understands semantic roles in addition to action/object intent:
- Actor: who is asking/performing the action
- Recipient: who the work is for
- Evaluator: who will conduct an evaluation
- Task/Subtask: what competency work is involved
- Due date: today/tomorrow/this week/next week or ISO date

WHY THIS MATTERS
"Create new task" means METL authoring.
"Create new task for Luis" means assign training/assessment work to Luis.
"Assign Luis M03 to Amy" resolves Luis as recipient, M03 as task, Amy as evaluator.

AMBIGUITY SAFETY
If Eagle's top two workflow families are too close, it asks for clarification instead
of confidently opening the wrong form.

DIAGNOSTICS
EagleOrchestrator.runSelfTest()
EagleOrchestrator.parse(text)
EagleOrchestrator.classifyText(text)

The built-in self-test includes 60 natural-language workflow cases.
All 20 engine definitions remain registered and Eagle still routes through existing
permission-controlled RP workflows.

This remains a deterministic local operational assistant, not a generative LLM.
