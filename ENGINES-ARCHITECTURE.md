# RP IA v6.0 Engine Architecture

This release introduces seven local-first, server-ready engines:

1. **RP Brain** — recommendations and conversational routing.
2. **Workflow Engine** — workflow records and corrective-action generation hooks.
3. **Rules Engine** — authority, qualification blockers, and data-quality validation.
4. **Knowledge Engine** — approved procedures/training articles with searchable metadata.
5. **Predictive Engine** — readiness risk, shift summaries, and data-confidence calculations.
6. **Search Engine** — unified normalized search across Personnel Master, METL, subtasks, actions, and knowledge.
7. **Audit Engine** — centralized immutable-style event creation.

## Enterprise integration
Each engine is exposed as a global service and operates on the shared state object. A server implementation can preserve the same contracts while moving execution and authorization to the backend.

## Important safety rule
Knowledge answers must be approved before operational use. Draft articles are never returned as approved instructions.
