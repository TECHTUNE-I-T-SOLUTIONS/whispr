# 57. MVP OPTIMIZATION POLICY

The objective of the MVP is to maximize user value while minimizing infrastructure costs.

Every engineering decision should prioritize:

- Fewer AI requests
- Fewer external API requests
- Fewer server executions
- Lower bandwidth usage
- Lower database writes
- Reusable knowledge
- Reusable AI outputs

Infrastructure should remain on free tiers for as long as possible.

Performance improvements should prioritize architecture over infrastructure.

---

# 58. ENGINE-FIRST POLICY

Whispr Intelligence is composed of independent engines.

Every feature should first determine whether an existing engine can complete the task before introducing AI.

Priority order:

Rules Engine

↓

Cache Engine

↓

Knowledge Engine

↓

Database

↓

Provider Adapters

↓

LLM Engine

AI should never become the default solution.

Artificial Intelligence is the final layer, not the first layer.

---

# 59. ZERO WASTE AI POLICY

Every AI request should produce reusable value.

If AI generates:

Summary

Outline

SEO

Keywords

Research

Translation

Metadata

Rewrite

The result should be cached immediately.

Future users requesting identical or substantially similar information should reuse existing outputs whenever possible.

Duplicate AI requests should be avoided.

---

# 60. FREE INFRASTRUCTURE POLICY

The MVP must operate entirely on free-tier infrastructure wherever practical.

Current approved infrastructure:

- Next.js
- Vercel Hobby
- Supabase
- Gemini Free Tier
- Google Search Free Tier
- Google News RSS
- Wikipedia
- GitHub
- Reddit
- YouTube

No paid infrastructure should be introduced without measurable business justification.

---

# 61. LAZY REFRESH STRATEGY

Scheduled refreshes are discouraged during the MVP.

Instead:

User requests resource.

↓

Check cache.

↓

Cache valid?

Return immediately.

↓

Cache expired?

Refresh once.

↓

Update cache.

↓

Return updated data.

This ensures expensive operations occur only when users actually need the information.

---

# 62. EVENT-DRIVEN UPDATES

Whenever possible, updates should be triggered by user activity rather than scheduled jobs.

Examples:

User reads article

Update analytics.

User publishes article

Update search index.

User bookmarks article

Update recommendation profile.

User follows creator

Update recommendation graph.

Avoid polling when events can provide the same result.

---

# 63. CACHE DESIGN

The cache is part of the application, not external infrastructure.

Use Supabase tables as the cache layer during the MVP.

Recommended tables:

cached_searches

cached_news

cached_ai

cached_research

cached_trending

Each cache entry should contain:

cache_key

provider

payload

created_at

expires_at

version

status

Avoid generic cache tables when dedicated tables improve indexing and maintenance.

---

# 64. PROVIDER ABSTRACTION

Every external dependency must be replaceable.

Never reference provider SDKs outside their adapter.

Examples:

GoogleSearchAdapter

GeminiAdapter

GitHubAdapter

WikipediaAdapter

RedditAdapter

YouTubeAdapter

RSSAdapter

The remainder of the application communicates only with adapters through shared interfaces.

---

# 65. LLM PROVIDER POLICY

The application must never communicate directly with Gemini.

All language model requests flow through the LLM Engine.

Responsibilities:

Provider selection.

Prompt construction.

Token optimization.

Response validation.

Caching.

Retry logic.

Usage logging.

Future provider switching.

This architecture allows future migration to another model with minimal code changes.

---

# 66. KNOWLEDGE REUSE POLICY

Knowledge collected once should benefit all users.

Provider responses should be normalized, categorized, cached, and reused before new external requests are made.

The Knowledge Engine is the long-term memory of Whispr Intelligence.

---

# 67. IMPLEMENTATION CHECKLIST

The implementation is complete when:

✓ Every provider is isolated behind an adapter.

✓ Every AI request passes through the LLM Engine.

✓ Every request checks cache before external providers.

✓ Every provider response is normalized.

✓ Knowledge is reusable.

✓ AI responses are cached.

✓ Recommendations are deterministic by default.

✓ Event-driven updates replace scheduled jobs wherever possible.

✓ Infrastructure remains compatible with free-tier services.

✓ The architecture remains provider-independent.

END OF MASTER IMPLEMENTATION SPECIFICATION



# MORE

# 84. KNOWLEDGE GRAPH ENGINE

Purpose

The Knowledge Graph Engine transforms isolated knowledge into connected intelligence.

Every piece of content, topic, creator, tag, category, keyword, and external source should become part of a unified graph.

The graph enables:

- Related content discovery.
- Similar creator recommendations.
- Topic clustering.
- Semantic navigation.
- Knowledge reuse.
- AI context retrieval.
- Search enhancement.
- Personalized recommendations.

Relationships should be generated primarily through deterministic analysis.

Examples:

Topic → Topic

Article → Topic

Article → Creator

Creator → Category

Story → Tags

Blog → Keywords

Keyword → Search History

AI should only assist when relationship confidence cannot be established through deterministic methods.

The Knowledge Graph is a long-term asset of the platform and should continuously improve as users create, read, search, and interact with content.

The graph should become the primary source of contextual understanding before invoking any external AI model.