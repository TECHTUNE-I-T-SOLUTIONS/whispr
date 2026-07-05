# 68. PROVIDER HEALTH & QUOTA MANAGER

Purpose

Monitor every external dependency to ensure reliability, graceful degradation, and efficient quota usage.

Responsibilities

- Monitor provider availability.
- Monitor provider response times.
- Monitor provider error rates.
- Monitor cache hit rate.
- Monitor API quota usage where available.
- Select alternative providers or cached data when a provider is unavailable or rate-limited.
- Record provider performance metrics for future optimization.

The Provider Health Manager should maintain a status object for every provider.

Example:

status

provider

healthy

averageResponseTime

lastSuccess

lastFailure

cacheHitRate

estimatedQuotaRemaining

Providers with degraded health should automatically fall back to cached data or alternative providers where appropriate.

The user experience should never fail simply because one external provider is temporarily unavailable.

---

# 69. PERFORMANCE FIRST ARCHITECTURE

Performance is a first-class engineering requirement.

Every implementation decision should prioritize:

- Fast initial page loads.
- Low JavaScript bundle size.
- Minimal client-side processing.
- Minimal network requests.
- Efficient rendering.
- High Core Web Vitals.
- Excellent performance on low-end devices and slow mobile networks.

Pages should remain highly responsive even on limited bandwidth.

Performance is a product feature.

---

# 70. NEXT.JS PERFORMANCE GUIDELINES

Prefer Server Components by default.

Only use Client Components when browser interactivity is required.

Avoid unnecessary hydration.

Avoid unnecessary re-renders.

Avoid unnecessary Context Providers.

Avoid unnecessary global state.

Avoid unnecessary component nesting.

Load only the code required for the current route.

Use dynamic imports for heavy client-side components.

Use optimized fonts and images.

Use streaming and Suspense where appropriate.

Use memoization only when profiling demonstrates a measurable benefit.

Avoid premature optimization while ensuring excellent defaults.

---

# 71. DATA FETCHING POLICY

Prefer server-side data fetching for page content.

Use client-side fetching only for:

- Real-time updates.
- User-triggered actions.
- Optimistic UI interactions.
- Live notifications.
- Chat.

Avoid repetitive client-side fetching.

Avoid duplicated requests.

Always reuse cached data whenever possible.

---

# 72. REACT BEST PRACTICES

Do not use useEffect for initial data loading when server-side rendering or server components can provide the data.

Use useEffect only for:

- Browser APIs.
- Event listeners.
- Timers.
- WebSockets.
- Synchronization with external browser state.

Business logic should never depend on useEffect.

Favor pure functions and composable utilities over effect-driven workflows.

Keep components focused on rendering, while services and engines handle application logic.

---

# 73. FUNCTION-FIRST ARCHITECTURE

Application behavior should primarily be implemented through reusable functions and services.

Favor:

Pure functions.

Utility modules.

Shared services.

Composable abstractions.

Avoid duplicating logic across components.

Every reusable workflow should exist as a callable service rather than inline component logic.

---

# 74. AI FUNCTION CALLING

Where supported by the selected language model, use structured function calling (tool calling) instead of relying solely on free-form prompts.

Use function calling for:

- Search.
- Research.
- Fetching provider data.
- Content validation.
- Metadata generation.
- Structured outputs.
- Knowledge retrieval.

Function calling improves:

- Reliability.
- Predictability.
- Token efficiency.
- Error handling.
- Maintainability.

Prompt-only workflows should be reserved for tasks requiring natural language generation.

---

# 75. USER EXPERIENCE PRINCIPLES

The interface should be:

Simple.

Fast.

Elegant.

Professional.

Accessible.

Responsive.

Calm.

Focused.

The goal is not to impress users with visual complexity.

The goal is to remove friction from creation.

Every interaction should feel intentional.

Speed and usability take precedence over unnecessary animations or decorative effects.

---

# 76. FINAL ENGINEERING PRINCIPLE

When choosing between two implementations:

Prefer the one that is:

Simpler.

Faster.

Cheaper.

More maintainable.

More reusable.

More scalable.

Architecture quality should always take precedence over implementation speed.

END OF ENGINEERING GUIDE

# ADDITIONS

# 77. FEATURE FLAG SYSTEM

Every major subsystem should be controlled through feature flags.

Feature flags allow features to be enabled, disabled, tested, or rolled out gradually without modifying application logic.

Feature flags should be checked before initializing optional providers or engines.

Example configuration:

ENABLE_EDITOR_AI=true

ENABLE_RESEARCH_ENGINE=true

ENABLE_RECOMMENDATION_ENGINE=true

ENABLE_TRENDING_ENGINE=true

ENABLE_LEARNING_ENGINE=false

ENABLE_YOUTUBE_PROVIDER=true

ENABLE_REDDIT_PROVIDER=false

ENABLE_GITHUB_PROVIDER=true

ENABLE_WIKIPEDIA_PROVIDER=true

ENABLE_SEARCH_PROVIDER=true

Feature flags should be centralized in the application's configuration layer.

No feature should hardcode its enabled or disabled state.

---

# 78. DATABASE EVOLUTION POLICY

The existing production schema is the foundation of the application.

Do not rename existing tables.

Do not remove existing columns.

Do not break existing relationships.

All new functionality should be introduced by adding new tables, new indexes, or optional columns where necessary.

Database migrations must always be backward-compatible.

---

# 79. NEW TABLES

The following tables may be introduced to support the AI platform.

cached_searches

cached_news

cached_ai

cached_research

cached_trending

knowledge_documents

provider_health

recommendation_profiles

recommendation_scores

user_interests

user_topics

user_search_history

search_analytics

provider_logs

ai_logs

feature_flags

prompt_versions

system_settings

These tables should remain independent of existing business tables wherever practical.

Relationships should be introduced only when necessary.

---

# 80. KNOWLEDGE DOCUMENT STORAGE

Knowledge documents represent normalized information collected from external providers.

Each knowledge document should contain:

id

provider

title

summary

content

category

tags

keywords

source_url

published_at

updated_at

expires_at

language

country

credibility_score

trending_score

hash

created_at

Knowledge should be reusable across users.

Knowledge documents should not duplicate identical information.

---

# 81. CACHE POLICY

Every cache record should support expiration.

Suggested fields:

cache_key

provider

payload

version

created_at

expires_at

last_accessed_at

hit_count

status

The application should always attempt cache retrieval before contacting external providers.

---

# 82. ANALYTICS POLICY

Analytics should be lightweight and event-driven.

Track:

Views

Reads

Likes

Bookmarks

Comments

Shares

Searches

Provider usage

AI usage

Cache hits

Cache misses

Provider latency

LLM latency

Analytics should never block the user experience.

---

# 83. ENGINE MODULARITY

Every engine must remain independently replaceable.

No engine should depend directly on another engine's implementation.

Communication between engines should occur through interfaces or events.

This architecture enables future replacement, scaling, and independent testing of each engine.

END OF ENGINEERING GUIDE

# Rule

# 84. OBSERVABILITY

Every engine, adapter, and provider should emit structured logs.

The purpose is to make debugging and optimization straightforward without relying on scattered console output.

Log:

- Provider requests
- Provider failures
- Cache hits
- Cache misses
- AI requests
- AI latency
- Adapter errors
- Feature flag evaluations
- Knowledge updates

Logs should be structured and categorized by engine.

Sensitive information, API keys, prompts containing user secrets, and personal data must never be written to logs.

The logging system should support future integration with centralized monitoring tools without requiring architectural changes.