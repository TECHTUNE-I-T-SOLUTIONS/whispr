# Part 3 — Backend Service Layer, Next.js API Architecture & Flutter Integration

---

# 13. Backend Philosophy

The Next.js application serves as both:

- Frontend
- Backend API (Backend-for-Frontend)

Business logic MUST NEVER exist inside API routes.

Instead:

API Route

↓

Validation

↓

Authentication

↓

Service Layer

↓

Repositories

↓

Database

API Routes are only transport layers.

---

# 14. Recommended Folder Structure

src/

    app/

        api/

            billing/

            subscriptions/

            payments/

            Paystack/

            webhooks/

    lib/

        Paystack/

        supabase/

        openai/

    services/

        billing/

        ai/

        entitlement/

        subscriptions/

        plans/

        usage/

        Paystack/

        games/

        analytics/

    repositories/

        plan.repository.ts

        subscription.repository.ts

        usage.repository.ts

        entitlement.repository.ts

    middleware/

        auth/

        premium/

        quota/

    utils/

        pricing/

        validation/

        logger/

---

# 15. Service Responsibilities

BillingService

Responsible for

✓ Create subscriptions

✓ Upgrade plans

✓ Cancel plans

✓ Change billing interval

✓ Free trials

✓ Coupons

Never talks directly to Flutter.

Only receives requests from API routes.

---

PaystackService

Responsible for

✓ Paystack Customers

✓ Paystack Prices

✓ Checkout Sessions

✓ Payment Intents

✓ Billing Portal

✓ Payment Methods

✓ Webhooks

This is the ONLY service allowed to import Paystack SDK.

---

SubscriptionService

Responsible for

✓ Active subscription

✓ Expired subscription

✓ Renewal

✓ Grace Period

✓ Restore Purchase

✓ Subscription Status

---

EntitlementService

Most important service.

Application NEVER checks subscriptions.

Instead:

AI Module

↓

EntitlementService

↓

Does user have AI_CHAT?

↓

Yes

↓

Continue

OR

↓

Return Upgrade Required

Games work exactly the same.

---

UsageService

Responsible for

Tracking

Daily usage

Monthly usage

Token usage

Voice usage

Image usage

Research usage

Storage usage

Every AI request passes through UsageService.

---

PlanService

Responsible for

Loading plans

Features

Limits

Pricing

Displaying plans

---

Repository Layer

Repositories ONLY interact with Supabase.

No Paystack logic.

No business logic.

Only CRUD.

---

# 16. API Route Design

Billing

POST

/api/billing/subscribe

POST

/api/billing/change-plan

POST

/api/billing/cancel

POST

/api/billing/resume

GET

/api/billing/plans

GET

/api/billing/subscription

GET

/api/billing/history

---

Paystack

POST

/api/Paystack/create-payment-sheet

POST

/api/Paystack/create-customer

POST

/api/Paystack/webhook

---

Usage

GET

/api/usage

GET

/api/usage/tokens

GET

/api/usage/features

---

Games

GET

/api/games

GET

/api/games/check-access

---

AI

POST

/api/ai/chat

POST

/api/ai/write

POST

/api/ai/rewrite

POST

/api/ai/summarize

POST

/api/ai/translate

Before any AI route executes,

QuotaMiddleware runs first.

---

# 17. Flutter Architecture

Flutter

Presentation Layer

↓

Provider / Riverpod

↓

Repository

↓

Remote Data Source

↓

Next.js API

Flutter NEVER imports Paystack Secret Keys.

Flutter NEVER updates subscriptions.

Flutter NEVER verifies payments.

Flutter simply displays Paystack's PaymentSheet.

---

Recommended folders

lib/

    core/

    services/

    repositories/

    providers/

    models/

    screens/

    widgets/

    billing/

        billing_service.dart

        Paystack_repository.dart

        subscription_provider.dart

        plans_provider.dart

---

# 18. Flutter Payment Flow

User taps

Upgrade

↓

Flutter requests

POST

/api/billing/subscribe

↓

Backend creates Paystack Subscription

↓

Backend returns

Customer ID

Ephemeral Key

Payment Intent / Setup Intent Client Secret

Publishable Key (optional if not bundled)

↓

Flutter initializes Paystack PaymentSheet

↓

Native Payment Sheet appears

↓

User chooses

Card

Apple Pay

Google Pay

Link

Bank Account

or any payment method available in their region

↓

Payment succeeds

↓

Flutter dismisses Payment Sheet

↓

Backend waits for Paystack Webhook

↓

Webhook updates Supabase

↓

Entitlements regenerated

↓

Flutter refreshes profile

↓

Premium unlocked

Never unlock premium immediately after the PaymentSheet reports success. Always wait until the backend confirms the webhook.

---

# 19. Middleware Architecture

Every request passes through middleware.

Request

↓

Authentication

↓

Subscription Check

↓

Entitlement Check

↓

Quota Check

↓

Execute Feature

This creates one universal access-control pipeline.

---

# 20. Entitlement Middleware

Pseudo flow

Authenticate User

↓

Load Entitlements

↓

Feature Required?

↓

No

↓

Continue

↓

Yes

↓

User Has Feature?

↓

Yes

↓

Continue

↓

No

↓

Return

403

FEATURE_LOCKED

The frontend should display the upgrade screen based on this response.

---

# 21. AI Quota Middleware

Every AI endpoint must execute:

Load User

↓

Determine Active Plan

↓

Load Monthly Limits

↓

Load Current Usage

↓

Has Remaining Tokens?

↓

Yes

↓

Continue

↓

No

↓

Return

TOKEN_LIMIT_REACHED

The response should also include:

- current usage
- limit
- reset date
- suggested upgrade plan

This lets Flutter present a rich upgrade experience instead of a generic error.

---

# 22. Coming Soon Features

These features should exist today in the Features table, but remain disabled until implemented:

AI_IMAGE_GENERATION

AI_VIDEO_GENERATION

AI_VOICE

AI_AVATAR

AI_AGENTS

SMART_WORKFLOWS

CLOUD_STORAGE

TEAM_COLLABORATION

MARKETPLACE

No schema changes will be required when these features are released—only implementation and entitlement assignment.

```
Continue in Part 4…
```