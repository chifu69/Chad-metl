RP v9.24.0 — Eagle Natural Language Max

Goal: push Eagle as far as practical without an LLM.

NEW NATURAL LANGUAGE STACK
1. Typo normalization.
2. Editable semantic dictionary / synonyms.
3. Dialogue control (cancel / never mind / stop).
4. Signed-in identity protection.
5. Entity extraction (employee, evaluator, task, subtask).
6. Semantic roles (recipient vs evaluator vs task).
7. Scored intent routing.
8. Conversation context with safeguards against stale-employee leakage.
9. Confidence/ambiguity handling.
10. Permission-controlled workflow routing.
11. Grounded answers from RP data.

NEW ADMINISTRATION FEATURE
Administration > Eagle Language Dictionary
- Add plant terminology, synonyms, abbreviations, and common expressions.
- Dictionary is saved in RP state and included in normal JSON backups.
- Defaults can be restored.

FIXED NATURAL LANGUAGE CASES
- "Who am I?" -> signed-in identity, not last employee context.
- "Approved procedures" -> lists approved Knowledge Center procedures.
- "Who is ready for next level?" -> evaluates all active associates.
- "Cancel assignment" / "Never mind" -> cancels Eagle conversation workflow context.
- "Create new task" -> METL authoring.
- "Create new task for Luis" -> assessment assignment.
- "Assign task to Jose" -> assessment assignment.
- "Assign Luis M03 to Amy" -> associate/task/evaluator semantics.

IMPORTANT
This remains a deterministic local assistant. It is not a generative LLM.
Eagle can only reason over data, vocabulary, workflows, and rules that exist in RP.
