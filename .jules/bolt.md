## 2026-02-01 - Optimize O(N) lookups in render loops
**Learning:** Performing array .find() operations inside nested render loops (e.g., in a table matrix) leads to O(N^2) or worse complexity, which can visibly lag the UI as data grows.
**Action:** Pre-process the array into a Map (or nested object) using useMemo. This reduces lookup time to O(1) per cell, significantly improving rendering performance for large datasets.
