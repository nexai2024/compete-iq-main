## 2024-07-26 - Implementing a Content-Security-Policy to Mitigate XSS

**Vulnerability:** The application was missing a Content-Security-Policy (CSP) and other security headers, leaving it more susceptible to common web vulnerabilities like Cross-Site Scripting (XSS) and clickjacking.

**Learning:** Implementing security headers is a crucial defense-in-depth measure. A properly configured CSP can significantly reduce the risk of XSS attacks by restricting the sources from which scripts, styles, and other resources can be loaded. It's important to tailor the policy to the application's needs, such as allowing scripts from an authentication provider like Clerk. Furthermore, conditionally applying stricter rules for production versus development (e.g., removing `'unsafe-eval'`) is a best practice for maintaining both security and developer experience.

**Prevention:** All new web applications should be configured with a baseline set of security headers from the start. The `next.config.ts` file in Next.js is the appropriate place to implement this. The policy should be as strict as possible while still allowing the application to function, and it should be reviewed periodically as the application evolves.
