## 2025-02-02 - IDOR in Project Updates
**Vulnerability:** Insecure Direct Object Reference (IDOR) in the project update API.
**Learning:** API routes that handle both creation and updates (like a multi-purpose POST route) can easily overlook ownership checks on the update path when the creation path naturally uses the current user's ID.
**Prevention:** Always verify resource ownership before updates or deletions by fetching the existing record and comparing its owner ID with the authenticated user ID.
