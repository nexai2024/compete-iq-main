# Palette's Journal: Critical UX & Accessibility Learnings

## 2024-07-25 - The Peril of Extraneous Files
**Learning:** A well-intentioned UX improvement can be completely undermined by a "dirty" commit. Committing transient files like `dev.log` or out-of-scope dependency changes like `pnpm-lock.yaml` makes a pull request unsafe to merge and impossible to review effectively. The core change, no matter how good, becomes irrelevant.
**Action:** Always double-check the "Files Changed" tab before submitting a PR. Ensure every single file is directly related to the task. If I run `pnpm install` and it generates a new lockfile, I must revert that file before committing my feature change. Add appropriate patterns to `.gitignore` immediately to prevent future mistakes.
