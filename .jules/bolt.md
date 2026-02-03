## 2025-02-03 - AI Pipeline Batching & Parallelism
**Learning:** Sequential AI calls (OpenAI/Perplexity) are the primary bottleneck in processing pipelines. Batching evaluation criteria (e.g., 10 parameters) into a single call per entity reduces latency by O(N). Additionally, using Map-based lookups for pre-fetched DB records avoids O(N^2) complexity in render/processing loops.
**Action:** Always look for opportunities to batch LLM evaluations and parallelize independent enrichment tasks with Promise.all.
