# RP IA v4.3 — Employee Lifecycle & Automatic Accounts

## New in this version
- Adding a new employee automatically creates a read-only login account.
- Username defaults to the employee number.
- Temporary password defaults to `RP` + employee number.
- First login requires a password change.
- A success screen shows credentials and applicable task/subtask counts.
- Employment status options: Active, Leave of Absence, Inactive, and Terminated.
- Non-active employment statuses automatically block login while preserving history.
- Administration can search and filter all employment statuses.
- Administrators can add a new employee directly from User Management.

## Important pilot limitation
This GitHub Pages PWA stores users and data locally in each browser/device. Accounts created on one device are not automatically synchronized to other devices. A shared production deployment requires a central approved database and authentication service.
