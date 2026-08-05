# RP IA v6.1 — Core Compliance Implementation

This release begins the high-priority acceptance work requested for the Extrusion competency system.

## Implemented in this release

- Central Personnel Master resolver used by the Readiness Matrix.
- Matrix search by full or partial employee number, name, shift, role, and assigned level.
- Employee number displayed directly in Matrix results.
- Cumulative qualification calculation for -10, -20, -30, and -40.
- Highest Fully Qualified Level calculation.
- Assessment validation against evaluator authority.
- Required-evidence enforcement before a GO result.
- Sr. Lead verification enforcement when a subtask requires it.
- Critical Gate failures block qualification.
- Controlled assessment snapshots preserve the employee, task, subtask, standard, and revision used at the time of assessment.
- Signed and timestamped assessment records.
- Mandatory corrective-action workflows generated for NO-GO, Suspended, and Requires Assistance results.
- Corrective-action closure requires a GO reassessment and appropriate evaluator authority.
- Critical Gate closure requires authorized verification.
- Audit records now include sequence and device metadata.
- Enterprise Search expanded to assessment sessions and assessment results.

## Still pending

- Server-enforced permissions and corporate authentication.
- Formal electronic signature compliant with company policy.
- Configurable workflow designer and approval routing.
- Centralized file/evidence storage.
- Scheduled server backups and disaster recovery.
- Complete notification delivery through email or Teams.
- Full Knowledge Engine document ingestion and semantic search.
- Predictive models validated against sufficient historical data.
- Automated browser and user-acceptance testing across representative roles.
