RP v9.25.0 — Role-Aware Dashboard + Assignment Identity

Built directly on RP v9.24.1.

READ-ONLY / -10 DASHBOARD
- No plant-wide Critical Gate mission.
- No shift-readiness mission.
- No plant-level corrective-action mission.
- No global Readiness by Shift section.
- Dashboard now focuses only on the signed-in associate:
  My Readiness, Assigned Work, My Open Items, My Next Step, and My Focus.
- Assigned assessments are prioritized in My Next Step.
- Personal next-level progress is shown without implying admin/evaluator authority.
- Dashboard message: "Progress is built one step at a time, [name]."

EAGLE CHAT
- Removed: "I know who is signed in and I’ll keep this conversation tied..."
- "My assignments" now resolves the signed-in employee robustly by employee number
  and, when necessary, exact personnel name.
- "My assignments" cannot inherit another employee from stale conversation context.

ASK EAGLE DASHBOARD CARD
- Replaced generic "Eagle is ready."
- Uses: "Ready when you are, [name]. What can I help you accomplish today?"

ADMIN / EVALUATOR
- Existing operational dashboard remains available to authorized roles.
- Evaluators prioritize evaluations assigned to them.
