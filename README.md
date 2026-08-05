# RP IA v5.0.2 — Stable Startup Views Fix

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


## v5.0.1 fix
- Restored the missing Notifications view.
- Added guarded navigation so a secondary view error cannot disable Sign In or the whole app.
- Updated the service-worker cache version.


## v5.0.2 fix
- Added the missing Audit Trail view.
- Verified every startup navigation view has a defined handler.
- Updated asset and service-worker cache versions to 5.0.2.
