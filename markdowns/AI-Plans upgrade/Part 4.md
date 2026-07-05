# Part 4 — Enterprise Billing, AI Quotas, Feature Flags & Production Readiness

---

# 23. AI Usage Architecture

## Philosophy

WhisprWords should NEVER charge based on the number of chats.

Instead, every AI provider already charges based on tokens.

Therefore, our billing system should also use tokens.

Instead of:

```

User sent 20 chats.

```

Store:

```

Input Tokens

Output Tokens

Total Tokens

Cost

Provider

Model

Latency

```

This allows us to:

- Support multiple AI providers
- Compare costs
- Calculate profitability
- Detect abuse
- Generate analytics

---

## AI Request Lifecycle

Flutter

↓

Next.js API

↓

QuotaMiddleware

↓

AIService

↓

OpenAI / Gemini

↓

Receive Response

↓

Count Tokens

↓

Save Usage

↓

Return Response

Every AI request MUST be logged.

---

## AI Usage Table (Expanded)

Table

ai_usage_logs

Columns

id UUID PRIMARY KEY

user_id UUID

provider TEXT

model TEXT

feature TEXT

request_tokens BIGINT

response_tokens BIGINT

total_tokens BIGINT

estimated_cost NUMERIC

response_time_ms INTEGER

status TEXT

created_at TIMESTAMP

This becomes your analytics source.

---

# 24. AI Models

Future-proof by introducing an AI model registry.

Table

ai_models

Columns

id UUID

provider

model_name

display_name

input_cost_per_1m_tokens

output_cost_per_1m_tokens

supports_images

supports_voice

supports_streaming

active

This allows switching models without code changes.

Example

OpenAI

GPT-5

Gemini 2.5 Pro

Claude

DeepSeek

Llama

Future providers.

---

# 25. Feature Flags

Feature flags are different from subscriptions.

Subscriptions answer:

"Can the user access this feature?"

Feature Flags answer:

"Is this feature currently enabled globally?"

Table

feature_flags

Columns

id

key

enabled

description

created_at

Examples

AI_IMAGE_GENERATION

false

VOICE_CHAT

false

LIVE_TRANSLATION

false

WORKSPACES

false

When development finishes:

true

No deployment required.

---

# 26. Free Trial Strategy

Every paid plan supports:

7-day free trial.

Conditions

One trial per account.

One trial per Paystack customer.

Trial automatically converts unless cancelled.

Database

trial_used BOOLEAN

trial_started_at

trial_ends_at

Never allow unlimited trials.

---

# 27. Upgrade Flow

AI Starter

↓

User wants AI Pro

↓

Paystack Proration

↓

Webhook

↓

Subscription Updated

↓

Entitlements Rebuilt

↓

Done

No manual calculations.

Paystack handles prorations.

---

# 28. Downgrade Flow

AI Pro

↓

Downgrade

↓

Current billing cycle continues

↓

End of cycle

↓

Plan changes

↓

Entitlements regenerated

---

# 29. Cancel Subscription

User

↓

Clicks Cancel

↓

Backend

↓

Paystack

↓

cancel_at_period_end=true

User keeps Premium until expiration.

Never immediately revoke access.

---

# 30. Failed Payment Recovery

Webhook

invoice.payment_failed

↓

Update Subscription

↓

Status

past_due

↓

Send Email

↓

Notify Flutter

↓

Show Banner

↓

Retry Payment

↓

Recovered?

↓

YES

↓

Restore Active

---

# 31. Paystack Billing Portal

Do NOT build your own billing dashboard initially.

Instead:

Provide

Manage Subscription

↓

Paystack Billing Portal

Users can:

Update Card

Download Invoices

Cancel Subscription

Change Payment Method

Update Billing Details

View Receipts

This saves months of engineering work.

---

# 32. Coupons

Paystack supports:

Coupons

Promotion Codes

Percentage Discounts

Fixed Discounts

Referral Credits

Seasonal Discounts

Student Discounts

No custom implementation required.

---

# 33. Referral System (Future)

Tables

referrals

reward_transactions

Example

Invite Friend

↓

Friend subscribes

↓

Grant

5 AI Credits

or

100,000 Tokens

This integrates naturally with entitlements.

---

# 34. Notification System

Events

Subscription Started

Subscription Renewed

Trial Ending

Payment Failed

Plan Upgraded

Plan Downgraded

Subscription Cancelled

Tokens Running Low

Daily Limit Reached

Each event should create:

Database Notification

Push Notification

Email

In-app Alert

---

# 35. Admin Dashboard

Admin should manage:

Plans

Pricing

Coupons

Features

Feature Flags

Users

Subscriptions

Trials

Revenue

Usage

Analytics

No SQL editing required.

Everything through UI.

---

# 36. Revenue Analytics

Dashboard Cards

Monthly Revenue

Annual Revenue

MRR

ARR

Active Subscribers

Trials

Conversion Rate

Failed Payments

Top Plans

Average Revenue Per User

Average AI Cost/User

Profit Margin

Most Used Features

Most Used AI Models

Game Usage

Retention

---

# 37. Cost Analytics

Every AI request stores estimated cost.

Dashboard

Today's AI Cost

Monthly AI Cost

Cost by Model

Cost by Provider

Cost by Feature

Cost per User

Revenue

↓

Cost

↓

Profit

This helps prevent AI costs from exceeding revenue.

---

# 38. Abuse Detection

Automatically detect:

Too many requests

Multiple accounts

Token farming

Bot activity

Rate limit violations

Impossible usage

Suspicious IP changes

Excessive concurrent sessions

Flag users for review.

---

# 39. Security

Never expose:

Paystack Secret Key

Webhook Secret

OpenAI Keys

Gemini Keys

Supabase Service Role Key

Never trust:

Flutter

Client timestamps

Client subscription status

Client token counts

Everything is verified server-side.

---

# 40. Environment Variables

Development

NEXT_PUBLIC_Paystack_PUBLISHABLE_KEY

Paystack_SECRET_KEY

Paystack_WEBHOOK_SECRET

NEXT_PUBLIC_APP_ENV=development

NEXT_PUBLIC_API_URL

OPENAI_API_KEY

GEMINI_API_KEY

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

Production

Same names.

Different values.

No code changes.

---

# 41. Production Deployment Checklist

Paystack

✓ Live Keys

✓ Webhooks

✓ Billing Portal

✓ Products

✓ Prices

✓ Tax Configuration

Backend

✓ Environment Variables

✓ Cron Jobs

✓ Rate Limiting

✓ Logging

✓ Monitoring

Flutter

✓ Production Publishable Key

✓ Release Mode

Database

✓ Migrations Applied

✓ Indexes

✓ Policies

✓ Backups

---

# 42. Development Roadmap

Phase 1

Database

Paystack

Plans

Entitlements

Flutter Payment Sheet

Phase 2

Subscriptions

Webhooks

AI Quotas

Games

Premium Middleware

Phase 3

Coupons

Billing Portal

Analytics

Feature Flags

Admin Dashboard

Phase 4

Image Generation

Voice AI

Video Generation

Storage

Workspaces

Enterprise Plans

---

# 43. Future Premium Features

Already supported by architecture:

AI Image Generation

AI Voice

AI Video

AI Agents

Resume Builder

Website Builder

Presentation Generator

AI Coding Assistant

Cloud Storage

Shared Projects

Marketplace

Creator Hub

Premium Templates

AI Tutors

Business Accounts

Teams

API Access

Credits

None require database redesign.

Only implementation and entitlement assignment.

---

# 44. Recommended Engineering Principles

- Business logic belongs in Services.
- API Routes remain thin controllers.
- Repositories perform data access only.
- Middleware enforces authentication, entitlements, and quotas.
- Paystack webhooks are the source of truth.
- Never grant access based solely on client-side payment success.
- Prefer feature entitlements over boolean `isPremium` flags.
- Use environment variables to separate development and production.
- Log AI usage, token consumption, and estimated cost for every request.
- Build for extensibility so future premium features require configuration, not schema redesign.

---

# 45. Final Architecture

                    Flutter
                       │
               HTTPS Requests
                       │
          Next.js API Routes (Controllers)
                       │
                 Service Layer
                       │
      ┌─────────┬─────────┬─────────┐
      │         │         │         │
 Billing   AI Service  Games   Entitlements
      │         │         │         │
      └─────────┼─────────┴─────────┘
                │
      Paystack / OpenAI / Gemini
                │
          Paystack Webhooks
                │
             Supabase
                │
      PostgreSQL + Storage

Every feature asks one question:

"Does this user have the required entitlement, and have they exceeded their quota?"

If yes:
→ Continue.

If no:
→ Return a structured response that tells the client why access is denied and which plan would unlock the feature.

---

# End of Version 1.0

This architecture is designed to support millions of users while remaining modular, provider-agnostic, and easy to extend with future premium capabilities.