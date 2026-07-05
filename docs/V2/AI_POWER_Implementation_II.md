# 12. AI EXECUTION PHILOSOPHY

Artificial Intelligence is an expensive resource.

The platform must always attempt to solve problems using deterministic logic before invoking AI.

Every request should follow this order:

Rule Engine

↓

Knowledge Engine

↓

Cache

↓

Database

↓

Provider Layer

↓

Artificial Intelligence

AI should only be invoked when reasoning, creativity, rewriting, summarization, explanation, translation, or contextual understanding is required.

Never invoke AI for operations that can be completed with traditional programming.

Examples:

Generate Slug
Use deterministic logic.

Estimate Reading Time
Use word count.

Category Detection
Use predefined taxonomy.

Trending Score
Use ranking algorithm.

Sorting
Use database queries.

Filtering
Use SQL.

Recommendation
Use recommendation engine first.

Only invoke AI when deterministic methods cannot produce acceptable results.

---

# 13. REQUEST PIPELINE

Every AI request follows this pipeline.

Client

↓

Application Service

↓

AI Orchestrator

↓

Cache Check

↓

Knowledge Engine

↓

Provider Layer (if necessary)

↓

Knowledge Normalization

↓

Prompt Builder

↓

Gemini

↓

Post Processing

↓

Response

No component may bypass this flow.

---

# 14. PROMPT MANAGEMENT

Prompts are application assets.

Prompts must never be hardcoded inside business logic.

Create:

src/ai/prompts/

Each prompt exists as its own module.

Example structure:

research.prompt.ts

rewrite.prompt.ts

summary.prompt.ts

editor.prompt.ts

story.prompt.ts

poem.prompt.ts

teacher.prompt.ts

student.prompt.ts

seo.prompt.ts

translate.prompt.ts

recommendation.prompt.ts

headline.prompt.ts

Prompt modules export builder functions.

Prompt builders receive structured data and return optimized prompts.

Never concatenate raw strings inside services.

Prompt templates should be reusable.

Prompt templates should contain no application logic.

---

# 15. AI ORCHESTRATOR RESPONSIBILITIES

The AI Orchestrator is responsible for coordinating every AI workflow.

Responsibilities:

Determine whether AI is required.

Determine which providers should be queried.

Collect provider responses.

Normalize provider responses.

Remove duplicate information.

Rank sources.

Build prompts.

Invoke Gemini.

Validate responses.

Attach citations.

Return structured data.

The AI Orchestrator should never communicate directly with React components.

---

# 16. KNOWLEDGE ENGINE

Purpose:

Maintain a continuously updated knowledge layer independent of AI.

Responsibilities:

Normalize provider responses.

Assign categories.

Assign tags.

Generate keyword indexes.

Store source URLs.

Store timestamps.

Store summaries.

Maintain freshness metadata.

Support semantic search in future versions.

Knowledge should always be cached before AI receives it.

---

# 17. KNOWLEDGE DOCUMENT MODEL

Every collected item should follow a common structure.

id

title

description

content

summary

category

tags

language

author

publishedAt

updatedAt

provider

sourceUrl

imageUrl

videoUrl

thumbnailUrl

keywords

country

region

topic

credibilityScore

trendingScore

createdAt

---

# 18. RESEARCH PIPELINE

Research requests follow this order.

Receive topic.

↓

Search cache.

↓

Search database.

↓

Query providers.

↓

Normalize.

↓

Deduplicate.

↓

Rank.

↓

Generate context.

↓

Invoke Gemini.

↓

Return research package.

Research package contains:

Summary

Key facts

Sources

References

Suggested titles

Suggested outline

Suggested keywords

Suggested tags

Suggested questions

Related topics

---

# 19. SOURCE RANKING

Every source receives a confidence score.

Government

Academic

Official Documentation

Recognized News

Wikipedia

Community Discussion

Unknown Sources

Lower quality sources should never override higher quality sources.

---

# 20. CONTENT ENRICHMENT

Before invoking AI:

Extract keywords.

Generate slug.

Estimate reading time.

Assign categories.

Generate tags.

Detect language.

Determine region.

Determine topic.

Determine freshness.

Only missing information should be requested from AI.

---

# 21. TRENDING ENGINE

The Trending Engine operates independently of AI.

Sources:

Google Trends

Google News RSS

GitHub

Reddit

YouTube

Internal Search Analytics

Internal Reading Analytics

Internal Publishing Analytics

Ranking factors:

Freshness

Search Frequency

User Interest

Growth Rate

Engagement

Topic Diversity

Trending data should be refreshed automatically by scheduled jobs.

AI is never responsible for determining trending topics.

---

# 22. RECOMMENDATION ENGINE

Recommendations should prioritize deterministic logic.

Signals include:

Topics followed.

Topics searched.

Topics read.

Bookmarks.

Likes.

Comments.

Published content.

Recently viewed content.

Preferred language.

Preferred region.

Only after deterministic recommendations fail should AI generate exploratory recommendations.

---

# 23. AI MEMORY

AI Memory stores contextual preferences rather than conversations.

Examples:

Preferred writing tone.

Preferred categories.

Writing style.

Frequently used keywords.

Favorite topics.

Publishing frequency.

Reading preferences.

Bookmarks.

Following list.

Conversation history should not be relied upon for personalization.

Structured memory is preferred.

---

# 24. PROMPT OPTIMIZATION RULES

Prompts should:

Remain concise.

Avoid redundant instructions.

Contain structured context.

Use normalized provider data.

Avoid duplicated provider responses.

Never expose implementation details.

Never expose API keys.

Never include hidden system instructions.

---

# 25. AI RESPONSE FORMAT

Every AI response should follow a predictable structure.

Title

Summary

Main Content

References

Suggested Follow-up Actions

Metadata

Responses should be machine-readable where appropriate to simplify rendering and caching.

END OF PART 2