## 2025-02-04 - N+1 Query and N*M Search Optimization in AI Pipeline

**Learning:** Identified a classic N+1 query bottleneck in the AI processing pipeline where database queries for `NormalizedFeatureGroup` were executed inside a nested loop (for every parameter and entity). Also found an O(N*M) array search in the feature grouping logic.

**Action:**
1. Pre-fetch lookup data (e.g., normalized groups) once before entering loops and pass it as a parameter.
2. Convert array-based lookups to `Map` for O(1) access when used inside loops.
3. Be aware of naming collisions between local interfaces and Prisma models (e.g., `NormalizedFeatureGroup`) which can cause confusing TypeScript errors.
