# K1 Extrusion METL Competency PWA — Pilot 0.1

This is a working offline-capable PWA pilot generated from `K1_Extrusion_METL_Competency_Workboard_Compatible.xlsx`.

## Imported baseline
- 24 populated personnel records
- 10 approved evaluator records
- 33 METL tasks
- 468 supporting subtasks
- Existing assessment-session baseline rows

## Pilot functions
- Role-based screens for Administrator, Approved Evaluator, Associate, and Leadership viewer
- Personnel roster and filters
- Searchable METL task library
- Task details with standards and Critical Gates
- Controlled task revision workflow; old revisions are retained as Superseded
- Evaluator-level enforcement (-10 through -40)
- Assessment entry by applicable subtask
- Automatic Critical Gate qualification block
- Automatic corrective-action creation for NO-GO
- Corrective-action closure with audit event
- Local audit trail
- Offline caching and installable PWA manifest
- Full JSON export

## Run locally
A PWA must be served over HTTP/HTTPS, not opened directly as a file.

Windows:
```
python -m http.server 8080
```
Then open `http://localhost:8080` from inside this folder.

Demo PIN: `2468`

## Security limitation
This ZIP is a functional pilot, not a production-secure deployment. The role selector and PIN demonstrate workflows only. Production should replace them with company Microsoft Entra ID login and server-side authorization.

Recommended production backend:
- Microsoft Entra ID authentication
- Azure App Service or approved internal web hosting
- Dataverse, Azure SQL, or another company-approved relational database
- Azure Blob Storage or SharePoint for evidence attachments
- Server-side audit and evaluator-authorization checks
- Scheduled backups and retention policy

Do not use local browser storage as the official competency record.
