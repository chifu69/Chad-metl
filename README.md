# RP IA v5.0 — Enterprise-Ready Pilot

## Local pilot access
- Username: `Administrator`
- Temporary password: `Admin123`

The first login requires a password change.

## Server configuration
Use **IT / Server Setup** on the login screen or the server icon after an administrator signs in.

IT can select:
- Local / Test / Production environment
- Local device or Company Server storage
- API address
- Local, company, or Microsoft Entra ID authentication mode
- File storage and backup addresses
- Microsoft tenant and client IDs

The **Test Connection** button calls `GET /health`. The **Migrate local pilot data** button sends the local records to `POST /migration/import`.

See `ENTERPRISE-API-SPEC.md` for the server contract.

## Important
This package prepares the PWA for company infrastructure, but the company must still provide the API, database, HTTPS certificate, authentication, permissions, backup, and retention controls. In Local mode, records remain specific to the browser/device.
