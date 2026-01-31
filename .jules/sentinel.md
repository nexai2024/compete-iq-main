## 2025-05-14 - IDOR in Project Updates
**Vulnerability:** Insecure Direct Object Reference (IDOR) in `POST /api/projects`.
**Learning:** The project update logic used `prisma.project.update` with only the `projectId`, failing to verify that the authenticated user actually owned the project. This allowed any authenticated user to modify any project by guessing its UUID.
**Prevention:** Always fetch the resource first to verify ownership, or include the `userId` in the `where` clause if the database schema allows for it (though `findUnique` requires a unique index). Using a separate check ensures we can return a proper 404/403 instead of a generic database error.
