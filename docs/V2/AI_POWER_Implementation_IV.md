# 45. CACHING STRATEGY

Caching is mandatory.

Caching exists to reduce:

External API requests.

AI requests.

Latency.

Infrastructure costs.

Do not introduce Redis during the MVP phase.

Use Supabase as the primary cache store.

Create cache tables for:

cached_searches

cached_news

cached_research

cached_ai

cached_trending

Each cache record must contain:

Key

Provider

Serialized Response

Created At

Expires At

Status

The application should always check cache before contacting any provider.

---

# 46. CACHE LIFETIME

Suggested expiration:

Search

24 hours

Wikipedia

30 days

GitHub Releases

6 hours

RSS

30 minutes

Trending

30 minutes

AI Summaries

Permanent unless source changes

Recommendations

Generated dynamically

Never invalidate cache unnecessarily.

---

# 47. CACHE REFRESH POLICY

Never refresh caches on a schedule.

Refresh only when:

Cache expires.

User requests fresh information.

Administrator forces refresh.

Source reports updated content.

This strategy minimizes infrastructure usage.

---

# 48. BACKGROUND PROCESS POLICY

Avoid background jobs during MVP.

Background jobs consume server resources and increase infrastructure costs.

Instead, use lazy evaluation.

Example:

User requests data.

↓

Check cache.

↓

Expired?

↓

Refresh immediately.

↓

Store.

↓

Return response.

Only one refresh should occur for identical requests.

Subsequent users receive cached responses.

---

# 49. EVENT-DRIVEN PROCESSING

Prefer event-driven updates over scheduled jobs.

Examples:

Content published

↓

Update search index.

User bookmarked article

↓

Update recommendation profile.

Article viewed

↓

Increment analytics.

Creator published article

↓

Update creator statistics.

No scheduled processing required.

---

# 50. FREE INFRASTRUCTURE POLICY

The MVP must prioritize free infrastructure.

Current stack:

Supabase

Next.js

Gemini Free Tier

Google Search Free Tier

Google News RSS

Wikipedia

GitHub

Reddit

YouTube

No additional paid infrastructure should be introduced until justified by platform growth.

---

# 51. COST OPTIMIZATION RULES

Never call AI when deterministic logic is sufficient.

Never query providers before checking cache.

Never duplicate provider requests.

Reuse cached AI responses whenever possible.

Cache research packages.

Cache summaries.

Cache search results.

Store normalized provider responses.

Reuse structured knowledge across users.

---

# 52. LLM ENGINE

The LLM Engine is the only component allowed to invoke language models.

Responsibilities:

Select provider.

Build final prompt.

Estimate token usage.

Optimize prompt length.

Retry failed requests.

Validate responses.

Cache AI outputs.

Log usage metrics.

Support future provider expansion.

The remainder of the application communicates only with the LLM Engine.

---

# 53. ADAPTER POLICY

Every external platform must be implemented as an adapter.

Adapters:

Gemini Adapter

Google Search Adapter

Google RSS Adapter

Wikipedia Adapter

GitHub Adapter

Reddit Adapter

YouTube Adapter

Adapters perform communication only.

Business logic belongs to engines.

---

# 54. DEPLOYMENT STRATEGY

The MVP targets:

Next.js (Web)

Supabase (Database, Auth, Storage)

Vercel Hobby (Frontend)

Gemini Free Tier

Google APIs (Free Quotas)

No additional infrastructure is required for initial deployment.

---

# 55. IMPLEMENTATION ORDER

Phase 1

Provider Adapters

LLM Engine

Knowledge Engine

Cache Tables

Search Integration

Gemini Integration

Phase 2

Research Engine

Writing Engine

Recommendation Engine

Publishing Engine

Analytics Engine

Phase 3

Editor AI

Trending

Learning Engine

Notifications

Advanced Search

Semantic Search

Future Phases

Embeddings

Vector Search

Redis

Queues

Workers

Streaming

Offline AI

---

# 56. SUCCESS CRITERIA

The implementation is considered complete when:

Every external provider communicates through an adapter.

Every AI request passes through the LLM Engine.

Every request checks cache before external APIs.

Knowledge is reusable across users.

AI requests are minimized.

Infrastructure costs remain minimal.

The system remains provider-independent.

The architecture supports future scaling without structural redesign.

END OF MASTER IMPLEMENTATION SPECIFICATION