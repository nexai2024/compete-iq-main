## 2026-02-06 - IDOR in Project Updates
**Vulnerability:** The project update route (`POST /api/projects`) accepted a `projectId` from the request body and updated the record without verifying that the authenticated user owned the project.
**Learning:** Even if a field is optional (like `projectId` in a "save" route that handles both create and update), it must be explicitly checked against the `userId` of the current session when present.
**Prevention:** Always scope database updates by `userId` or perform an explicit ownership check before modifying existing records.
