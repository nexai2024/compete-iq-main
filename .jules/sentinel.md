## 2025-02-12 - Insecure Direct Object Reference (IDOR) in Project Updates
**Vulnerability:** The `/api/projects` POST route allowed any authenticated user to update any project by providing its `projectId`, without verifying ownership.
**Learning:** Even when top-level models like `Project` have a `userId` field, individual API endpoints (especially those handling multiple operations like both CREATE and UPDATE in one POST) may miss the crucial ownership check during the update phase.
**Prevention:** Always verify that the resource being updated belongs to the authenticated user by performing a database lookup and comparing `userId` before proceeding with the `update` operation.
