## 2026-02-05 - Map-based lookup optimization in React
**Learning:** Using `.find()` on an array inside a nested render loop leads to (N^2)$ complexity, which degrades significantly as the number of entities and parameters grows. Converting the data to a `Map` within `useMemo` reduces this to (N)$.
**Action:** Always check for `.find()` or `.filter()` calls inside `.map()` in React components and consider memoized Map-based lookups.
