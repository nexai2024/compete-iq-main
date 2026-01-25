# Sentinel's Journal

This journal contains CRITICAL security learnings specific to the CompeteIQ codebase.
Entries are only added for significant, non-obvious security discoveries.

## 2024-08-16 - SSRF via Client-Side Token in GitHub Import
**Vulnerability:** A Server-Side Request Forgery (SSRF) vulnerability was identified in the `POST /api/github/import` endpoint. The endpoint accepted a `githubToken` directly from the client and used it in a `fetch` request on the server to call the GitHub API.

**Learning:** This is a critical security flaw because it allows an attacker to make the server issue requests using credentials they control. While the immediate risk was limited to the GitHub API, this pattern could be exploited to access internal network resources or other services if the target URL were not hardcoded. The root cause was trusting client-provided data for server-side requests.

**Prevention:** To prevent this class of vulnerability, the server must never use credentials or tokens provided by the client to make outbound requests. All external API calls from the server should be authenticated using server-managed credentials, which should be stored securely in environment variables (e.g., `process.env.GITHUB_ACCESS_TOKEN`).
