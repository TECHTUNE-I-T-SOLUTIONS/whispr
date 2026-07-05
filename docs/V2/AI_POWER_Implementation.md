# Whispr AI Platform
## Master Implementation Specification
Version: 2.0
Status: Active
Author: Engineering Team
Last Updated: July 2026

---

# IMPORTANT

This document is the single source of truth for implementing every AI-related feature within Whispr.

Before implementing any feature, every coding agent or engineer MUST read this document completely.

Do not introduce new architectural patterns unless they align with this specification.

Never bypass service layers.

Never expose secrets to the client.

Never allow the frontend to communicate directly with third-party AI or data providers.

Every external integration MUST be abstracted behind an internal provider interface.

---

# 1. PROJECT VISION

Whispr is an AI-first creator platform designed to help users discover ideas, research information, create high-quality content, improve their writing, publish confidently, and continuously grow as creators.

Artificial Intelligence is not a standalone feature within Whispr.

Artificial Intelligence is the operating layer that powers every major workflow across the platform.

Every creator should feel as though they have a personal researcher, editor, teacher, mentor, SEO expert, proofreader, publisher, and creative assistant available throughout the writing process.

AI should enhance creativity rather than replace it.

Generated content should always remain editable by the creator.

Users maintain full ownership and responsibility over published content.

---

# 2. CORE DESIGN PRINCIPLES

The architecture must follow these principles.

## AI-First

Every major feature should be capable of being enhanced by AI.

## Creator-First

AI assists users instead of replacing creative thinking.

## Provider Independent

No business logic should depend directly on any external API.

Providers must always be interchangeable.

## Modular

Every external service lives in its own provider.

## Cache First

Expensive requests should be cached whenever possible.

## Source Driven

Whenever information originates from external sources, references should be preserved.

## Privacy First

Only user activity inside Whispr should be used for personalization.

Browser history must never be accessed or inferred.

---

# 3. HIGH LEVEL ARCHITECTURE

                Web (Next.js)
                      │
                      │
              React Components
                      │
                      │
             Application Services
                      │
                      │
              AI Orchestrator
                      │
      ┌───────────────┼───────────────┐
      │               │               │
Knowledge Engine   Recommendation   Cache
      │               │               │
      └───────────────┼───────────────┘
                      │
             Provider Layer
                      │
 ┌────────────────────────────────────────────┐
 │ Gemini                                     │
 │ Google Search                              │
 │ Google News RSS                            │
 │ Reddit                                     │
 │ GitHub                                     │
 │ Wikipedia                                  │
 │ YouTube                                    │
 └────────────────────────────────────────────┘
                      │
                  Supabase

---

# 4. TECHNOLOGY STACK

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Query
- React Hook Form

Backend

- Next.js Server Components
- Server Actions
- Supabase
- Supabase Storage
- Supabase Authentication

Artificial Intelligence

- Gemini API

Search

The Search Adapter must be provider-independent.

The initial implementation may use structured public data sources such as:

- Google News RSS
- Wikipedia
- Reddit
- GitHub
- YouTube
- Internal Whispr content

The adapter interface must allow future integration of additional search providers without requiring architectural changes.- Google Custom Search JSON API

Knowledge Sources

- Google News RSS
- Wikipedia
- Reddit
- GitHub
- YouTube

Scheduling

- node-cron

Networking

- Axios

Caching

- In-memory cache initially
- Redis (future)

Validation

- Zod

HTML Parsing

- Cheerio

RSS Parsing

- rss-parser

Queues

- BullMQ (future)

---

# 5. REQUIRED PACKAGES

Install the following packages using Yarn.

Core

yarn add axios

yarn add zod

yarn add dotenv

AI

yarn add @google/genai

Google APIs

yarn add googleapis

RSS

yarn add rss-parser

Reddit

yarn add snoowrap

Wikipedia

yarn add wikipedia-api

HTML Parsing

yarn add cheerio

Scheduling

yarn add node-cron

Caching

yarn add ioredis

Queue

yarn add bullmq

Development

yarn add -D @types/node

---

# 6. ENVIRONMENT VARIABLES

The following environment variables are required.

GEMINI_API_KEY=

GOOGLE_API_KEY=

GOOGLE_SEARCH_ENGINE_ID=

YOUTUBE_API_KEY=

REDDIT_CLIENT_ID=

REDDIT_CLIENT_SECRET=

REDDIT_REFRESH_TOKEN=

GITHUB_TOKEN=

SUPABASE_URL=

SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

---

# 7. PROJECT STRUCTURE

src/

    ai/

    providers/

    services/

    knowledge/

    cache/

    prompts/

    jobs/

    types/

    utils/

    lib/

Every folder has one responsibility.

Business logic must never exist inside React components.

React components must only communicate with application services.

Application services communicate with the AI Orchestrator.

The AI Orchestrator communicates with the Knowledge Engine.

The Knowledge Engine communicates with Providers.

Providers communicate with external APIs.

---

# 8. PROVIDER LAYER

Every provider must implement a common structure.

Each provider is responsible only for communicating with its external platform.

Providers must never communicate with each other.

Providers must never call Gemini directly.

Providers should return normalized data structures.

Every provider must gracefully handle:

- timeouts
- invalid responses
- empty responses
- API failures
- rate limits

Every provider must expose a consistent interface.

Example methods:

search()

fetch()

latest()

trending()

details()

Providers should never contain business rules.

---

# 9. PROVIDERS TO IMPLEMENT

Gemini Provider

Purpose

AI reasoning.

Responsibilities

- Chat
- Summaries
- SEO
- Translation
- Editing
- Rewriting
- Embeddings
- Categorization

---

Google Search Provider

Purpose

Search the public web.

Responsibilities

- Official sources
- Documentation
- Blogs
- Government websites
- Research material

---

Google News RSS Provider

Purpose

Latest news.

Responsibilities

- Breaking news
- Technology
- Business
- Sports
- Entertainment
- Country-specific feeds

---

Wikipedia Provider

Purpose

Background information.

Responsibilities

- Definitions
- History
- General knowledge

---

GitHub Provider

Purpose

Developer ecosystem.

Responsibilities

- Trending repositories
- Releases
- Open-source news

---

Reddit Provider

Purpose

Community discussions.

Responsibilities

- Trending discussions
- Popular opinions
- Topic discovery

---

YouTube Provider

Purpose

Video discovery.

Responsibilities

- Latest videos
- Channel updates
- Educational resources

---

# 10. AI ORCHESTRATOR

The AI Orchestrator is the brain of Whispr.

No UI component should call Gemini directly.

Instead, every request flows through the AI Orchestrator.

Responsibilities include:

- determining which providers are needed
- collecting information
- removing duplicates
- ranking sources
- constructing prompts
- invoking Gemini
- validating responses
- attaching citations
- returning a unified result

The orchestrator should minimize external API calls by reusing cached knowledge whenever possible.

---

# 11. KNOWLEDGE ENGINE

The Knowledge Engine aggregates information from all providers into a common internal format.

Responsibilities:

- Normalize provider data.
- Deduplicate similar results.
- Cache frequently requested topics.
- Associate topics with categories and tags.
- Preserve original source URLs.
- Prepare context for the AI Orchestrator.
- Support semantic search in future iterations.

The Knowledge Engine should never generate text itself. Its role is to organize information and prepare structured context for the AI layer.

---

END OF PART 1