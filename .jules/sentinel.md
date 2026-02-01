## 2025-05-22 - IDOR in Project Updates
**Vulnerability:** The projects API allowed any authenticated user to update any project by providing its UUID, without verifying that the project belonged to the user.
**Learning:** Combining CREATE and UPDATE logic in a single POST handler can lead to overlooking ownership checks for the UPDATE case if only the CREATE case (which naturally associates the resource with the current user) is considered.
**Prevention:** Always verify ownership (e.g., `resource.userId === userId`) before performing updates or deletions in API routes. Use Zod schemas to ensure all incoming data, including IDs, are properly validated.
