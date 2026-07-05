# Part 2 — Database Architecture, Paystack Integration & Feature Entitlements

---

# 6. Database Architecture

The billing system MUST NOT directly control application logic.

Instead, every premium feature checks the Entitlement Service.

The hierarchy becomes:

User

↓

Subscription

↓

Plan

↓

Granted Features

↓

Application Access

This makes every new feature plug-and-play.

---

# 7. Database Tables

The following tables should be added to Supabase.

---

## 7.1 Plans

Stores every subscription plan available.

Table

plans

Columns

id UUID PRIMARY KEY

slug TEXT UNIQUE

name TEXT

description TEXT

price_monthly NUMERIC

price_yearly NUMERIC

currency TEXT DEFAULT 'USD'

Paystack_monthly_price_id TEXT

Paystack_yearly_price_id TEXT

trial_days INTEGER DEFAULT 7

active BOOLEAN DEFAULT TRUE

sort_order INTEGER

created_at TIMESTAMP

updated_at TIMESTAMP

---

Example Data

FREE

AI_STARTER

AI_PRO

GAMES_PREMIUM

WHISPR_PREMIUM

---

## 7.2 Features

Every premium capability in WhisprWords.

Table

features

Columns

id UUID PRIMARY KEY

key TEXT UNIQUE

name TEXT

description TEXT

coming_soon BOOLEAN DEFAULT FALSE

created_at TIMESTAMP

---

Example Features

AI_CHAT

AI_WRITER

AI_REWRITE

AI_SUMMARIZER

AI_TRANSLATE

AI_RESEARCH

AI_IMAGE_GENERATION

AI_VIDEO_GENERATION

AI_VOICE

BLOG_ASSISTANT

PREMIUM_GAMES

MULTIPLAYER

LEADERBOARDS

PRIORITY_QUEUE

EARLY_ACCESS

UNLIMITED_HISTORY

ADVANCED_ANALYTICS

DOCUMENT_ANALYSIS

CUSTOM_PROMPTS

TEAM_WORKSPACES

Future additions require NO schema changes.

---

## 7.3 Plan Features

Maps plans to features.

Table

plan_features

Columns

id UUID PRIMARY KEY

plan_id UUID

feature_id UUID

enabled BOOLEAN DEFAULT TRUE

created_at TIMESTAMP

Relationships

plan_id

→ plans.id

feature_id

→ features.id

Example

AI Starter

↓

AI_CHAT

AI_WRITER

BLOG_ASSISTANT

SUMMARIZER

TRANSLATOR

---

Whispr Premium

↓

Everything Enabled

---

## 7.4 User Subscriptions

Stores active subscriptions.

Table

user_subscriptions

Columns

id UUID PRIMARY KEY

user_id UUID

plan_id UUID

provider TEXT

provider_customer_id TEXT

provider_subscription_id TEXT

provider_price_id TEXT

status TEXT

billing_interval TEXT

trial_ends_at TIMESTAMP

started_at TIMESTAMP

current_period_start TIMESTAMP

current_period_end TIMESTAMP

cancel_at_period_end BOOLEAN

cancelled_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

Possible Status

trialing

active

past_due

paused

cancelled

expired

incomplete

---

## 7.5 User Entitlements

Optional cache table.

Instead of recalculating permissions every request.

Table

user_entitlements

Columns

id UUID PRIMARY KEY

user_id UUID

feature_key TEXT

granted BOOLEAN

expires_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

Whenever a subscription changes,

this table is regenerated.

---

## 7.6 AI Usage

Tracks AI consumption.

Table

ai_usage

Columns

id UUID PRIMARY KEY

user_id UUID

month TEXT

tokens_used BIGINT

input_tokens BIGINT

output_tokens BIGINT

chat_count INTEGER

completion_count INTEGER

image_requests INTEGER

voice_minutes INTEGER

research_requests INTEGER

created_at TIMESTAMP

updated_at TIMESTAMP

Never count chats.

Always count tokens.

This future-proofs costs.

---

## 7.7 AI Limits

Defines usage limits.

Table

plan_limits

Columns

id UUID PRIMARY KEY

plan_id UUID

daily_chat_limit INTEGER

monthly_chat_limit INTEGER

daily_token_limit BIGINT

monthly_token_limit BIGINT

daily_image_limit INTEGER

monthly_image_limit INTEGER

voice_minutes INTEGER

storage_mb INTEGER

priority_level INTEGER

created_at TIMESTAMP

Example

Free

Daily Chats

2

Daily Tokens

15,000

Monthly Tokens

450,000

Image

0

Voice

0

---

AI Starter

Daily Chats

Unlimited

Monthly Tokens

750,000

Voice

Coming Soon

Image

Coming Soon

---

Whispr Premium

Monthly Tokens

5,000,000

Highest Priority

---

## 7.8 Games

Modify existing table.

Add

premium_required BOOLEAN

required_feature TEXT

minimum_plan TEXT NULL

Example

Word Search

premium_required

false

Story Quest

premium_required

true

required_feature

PREMIUM_GAMES

---

# 8. Paystack Architecture

Flutter

↓

Backend

↓

Paystack

↓

Webhook

↓

Supabase

Never expose secret keys.

---

# 9. Paystack Environment Variables

Development

Paystack_SECRET_KEY

Paystack_PUBLISHABLE_KEY

Paystack_WEBHOOK_SECRET

Paystack_MONTHLY_PRICE_AI_STARTER

Paystack_YEARLY_PRICE_AI_STARTER

Paystack_MONTHLY_PRICE_AI_PRO

Paystack_YEARLY_PRICE_AI_PRO

Paystack_MONTHLY_PRICE_GAMES

Paystack_YEARLY_PRICE_GAMES

Paystack_MONTHLY_PRICE_PREMIUM

Paystack_YEARLY_PRICE_PREMIUM

Production

Same variables.

Different values.

Switching to production requires NO code changes.

Only .env changes.

---

# 10. Paystack Customer Flow

User

↓

Registers

↓

No Paystack customer yet

↓

Clicks Upgrade

↓

Backend checks

↓

Customer exists?

↓

No

↓

Create Paystack Customer

↓

Save customer ID

↓

Create Subscription

↓

Return Client Secret

↓

Flutter Payment Sheet

↓

Payment Success

↓

Paystack Webhook

↓

Update Database

↓

Grant Features

↓

Done

---

# 11. Paystack Webhooks

Must implement

customer.created

customer.updated

checkout.session.completed

invoice.paid

invoice.payment_failed

customer.subscription.created

customer.subscription.updated

customer.subscription.deleted

payment_intent.succeeded

payment_intent.payment_failed

These webhooks become the SINGLE source of truth.

Never trust Flutter payment success alone.

Only update subscriptions after Paystack confirms them through webhooks.

---

# 12. Backend Folder Structure

src/

modules/

billing/

controllers/

services/

repositories/

dto/

validators/

Paystack/

webhooks/

middleware/

subscriptions/

plans/

features/

usage/

billing.service.ts

Paystack.service.ts

entitlement.service.ts

usage.service.ts

subscription.service.ts

feature.service.ts

webhook.service.ts

Everything billing-related belongs under one cohesive module. No Paystack logic should leak into AI, games, or blog modules.

```
Continue in Part 3…
```