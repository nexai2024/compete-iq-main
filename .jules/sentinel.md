## 2025-02-12 - Next.js Security Hardening with Headers
**Vulnerability:** Missing standard security headers (CSP, HSTS, X-Frame-Options, etc.) which leaves the application vulnerable to clickjacking, XSS, and other common web attacks.
**Learning:** Next.js applications by default have empty configuration for security headers. A tailored Content Security Policy (CSP) must account for external services like Clerk and AI APIs (OpenAI, Perplexity).
**Prevention:** Always implement a robust `headers` configuration in `next.config.ts` during the initial setup of a Next.js project.
