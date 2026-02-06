## 2026-02-06 - Map-based Table Optimization
**Learning:** In table-heavy components where each cell performs an O(N) lookup (e.g., `Array.find`), the total rendering complexity becomes O(Cells * Lookups), which can lead to noticeable lag as data grows. Converting the lookup array to a Map within `useMemo` reduces this to O(Cells + Lookups).
**Action:** Always check for `.find()` or `.filter()` calls inside nested loops or `.map()` calls in JSX. If the source data is static during the render, memoize a Map for O(1) access.
