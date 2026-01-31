## 2025-05-15 - Rules of Hooks and Early Returns
**Learning:** Adding hooks like `useMemo` after early returns (e.g., loading or error states) violates React's Rules of Hooks, causing linting errors and potential runtime issues.
**Action:** Always place hooks at the top level of the component, before any conditional logic or early returns. If the hook depends on data that might be null, handle the null check inside the hook's factory function.

## 2025-05-15 - Module-level Initialization and Build Failures
**Learning:** Initializing third-party clients (like OpenAI) at the module level can cause `next build` to fail in environments where required environment variables are missing, even if those modules aren't executed during the build.
**Action:** Consider lazy initialization or handle missing environment variables gracefully to ensure builds remain robust across different environments.
