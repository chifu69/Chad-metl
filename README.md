# K1 Extrusion METL — v1.0 AI-Ready

## Demo access
- PIN: `2468`
- Select Administrator, Evaluator, Associate, or Leadership.

## What works
- Embedded workbook baseline: 24 personnel, 10 evaluators, 33 METL tasks, 468 subtasks.
- Role-specific navigation and read/write authority.
- Personnel master records.
- Versioned METL task revisions.
- Assessment sessions with GO, NO-GO, NE, and Requires Assistance.
- Critical Gate failures automatically block qualification and create corrective actions.
- Corrective-action closure with audit history.
- Readiness dashboards and explainable AI-readiness recommendations.
- JSON backups, JSON restore, assessment CSV export, and AI-readiness CSV export.
- Offline caching and PWA installation.

## GitHub Pages
Upload the CONTENTS of this folder to the repository root, not the ZIP itself.
In GitHub: Settings → Pages → Deploy from a branch → main / root.

After replacing an older installed version, delete the old Home Screen app or clear the website data once so the new service worker is installed.

## AI-ready design
The current recommendations are generated locally by a transparent rules engine. The data model is normalized and can later connect to:
- Microsoft Entra ID / company SSO
- Dataverse, Azure SQL, PostgreSQL, or an approved company API
- Azure OpenAI or another company-approved AI service
- Power BI or embedded dashboards

No information is transmitted outside the device in this build.

## Production warning
This version is suitable for functional validation and representative-user testing. Official production use requires corporate authentication, server-side authorization, centralized storage, backups, retention rules, and IT security approval.
