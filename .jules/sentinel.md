## 2025-05-22 - IDOR in Project Updates
**Vulnerability:** Insecure Direct Object Reference (IDOR) in the `POST /api/projects` endpoint. The code updated projects using only the `projectId` from the request body without verifying that the project belonged to the authenticated user.
**Learning:** Even when using a unique identifier like a UUID for primary keys, it is essential to verify ownership if the resource is private. Authenticated status alone is not sufficient; the specific relationship between the user and the resource must be checked.
**Prevention:** Always include the `userId` in the `where` clause of database updates/deletes, or fetch the record first and verify the `userId` before proceeding with modifications.
